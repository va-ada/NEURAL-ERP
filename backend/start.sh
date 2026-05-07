#!/bin/bash
# Neural ERP — one-command backend startup.
# Starts Docker, runs migrations, launches all microservices, and
# (optionally) opens a Cloudflare tunnel + redeploys Netlify.
#
# Flags:
#   --force-kill-ports   skip the interactive confirmation before killing
#                        processes on ports 3000-3013
#   --no-tunnel          skip Cloudflare tunnel + Netlify redeploy
#   --no-deploy          start the tunnel but skip the Netlify redeploy

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

FORCE_KILL=false
START_TUNNEL=true
REDEPLOY=true
for arg in "$@"; do
    case "$arg" in
        --force-kill-ports) FORCE_KILL=true ;;
        --no-tunnel)        START_TUNNEL=false; REDEPLOY=false ;;
        --no-deploy)        REDEPLOY=false ;;
        *) ;;
    esac
done

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}━━━ Neural ERP Backend Startup ━━━${NC}"

# 0. Load .env (shared defaults) and .env.local (overrides)
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a; source "$SCRIPT_DIR/.env"; set +a
    echo -e "${GREEN}  ✔ .env loaded${NC}"
fi
if [ -f "$SCRIPT_DIR/.env.local" ]; then
    set -a; source "$SCRIPT_DIR/.env.local"; set +a
    echo -e "${GREEN}  ✔ .env.local loaded (overrides)${NC}"
fi

# 1. Docker
echo -e "${YELLOW}[1/6] Starting Docker containers...${NC}"
docker compose up -d 2>&1 | grep -v "is obsolete" || true
echo -e "${GREEN}  ✔ Postgres, MongoDB, Redis running${NC}"

# 2. Prisma
echo -e "${YELLOW}[2/6] Running Prisma generate + migrate...${NC}"
npm run db:generate 2>&1 | tail -1
npx prisma migrate deploy --schema=./database/prisma/schema.prisma 2>&1 | tail -3
echo -e "${GREEN}  ✔ Database schema up to date${NC}"

# 3. Clear stale processes on our service ports — with a safety guard.
echo -e "${YELLOW}[3/6] Checking ports 3000-3013...${NC}"
BUSY_PORTS=()
for port in $(seq 3000 3013); do
    if lsof -ti ":$port" >/dev/null 2>&1; then
        BUSY_PORTS+=("$port")
    fi
done

if [ ${#BUSY_PORTS[@]} -gt 0 ]; then
    echo -e "${RED}  ! Busy: ${BUSY_PORTS[*]}${NC}"
    if [ "$FORCE_KILL" = "true" ]; then
        CONFIRM=y
    else
        read -r -p "  Kill processes on these ports? (y/N) " CONFIRM
    fi
    if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
        for port in "${BUSY_PORTS[@]}"; do
            pid=$(lsof -ti ":$port" 2>/dev/null || true)
            [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
        done
        sleep 1
        echo -e "${GREEN}  ✔ Ports cleared${NC}"
    else
        echo -e "${RED}  ✗ Aborting. Free the ports manually or re-run with --force-kill-ports.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}  ✔ All ports free${NC}"
fi

# 4. Start microservices
echo -e "${YELLOW}[4/6] Starting microservices...${NC}"
npm run dev &
DEV_PID=$!
sleep 5
echo -e "${GREEN}  ✔ All services starting (PID: $DEV_PID)${NC}"

# 5. Cloudflare tunnel + Netlify redeploy — optional
TUNNEL_URL=""
TUNNEL_PID=""
if [ "$START_TUNNEL" = "true" ]; then
    echo -e "${YELLOW}[5/6] Starting Cloudflare tunnel...${NC}"
    TUNNEL_LOG=$(mktemp)
    cloudflared tunnel --url http://localhost:3000 2>"$TUNNEL_LOG" &
    TUNNEL_PID=$!

    for i in $(seq 1 30); do
        TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
        [ -n "$TUNNEL_URL" ] && break
        sleep 1
    done

    if [ -z "$TUNNEL_URL" ]; then
        echo -e "${YELLOW}  ⚠ Could not detect tunnel URL. Check cloudflared manually.${NC}"
    else
        echo -e "${GREEN}  ✔ Tunnel: $TUNNEL_URL${NC}"
        if [ "$REDEPLOY" = "true" ]; then
            echo -e "${YELLOW}  Updating Netlify...${NC}"
            (
                cd "$SCRIPT_DIR/../web"
                npx netlify-cli env:set VITE_API_URL "$TUNNEL_URL" 2>/dev/null
                VITE_API_URL="$TUNNEL_URL" npx vite build 2>/dev/null
                npx netlify-cli deploy --prod --dir=dist 2>/dev/null
                echo -e "${GREEN}  ✔ Netlify deployed with new tunnel URL${NC}"
            ) &
        fi
    fi
else
    echo -e "${CYAN}[5/6] Tunnel skipped (--no-tunnel)${NC}"
fi

LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "unknown")
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Backend ready!${NC}"
echo -e "  API Gateway:  http://localhost:3000"
echo -e "  Tunnel:       ${TUNNEL_URL:-n/a}"
echo -e "  Local IP:     $LOCAL_IP (mobile app auto-detects)"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Press Ctrl+C to stop everything"
echo ""

cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    [ -n "$TUNNEL_PID" ] && kill $TUNNEL_PID 2>/dev/null || true
    [ -n "$DEV_PID" ] && kill $DEV_PID 2>/dev/null || true
    pkill -f "nodemon src/index.js" 2>/dev/null || true
    [ -n "$TUNNEL_LOG" ] && rm -f "$TUNNEL_LOG"
    echo -e "${GREEN}Done.${NC}"
}
trap cleanup EXIT INT TERM

wait $DEV_PID
