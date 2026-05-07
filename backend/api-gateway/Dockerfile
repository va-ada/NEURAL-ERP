# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY api-gateway/package.json api-gateway/
COPY shared shared
COPY database database
RUN npm ci --workspace=api-gateway --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/api-gateway/node_modules /app/api-gateway/node_modules
COPY shared /app/shared
COPY database /app/database
COPY api-gateway /app/api-gateway
WORKDIR /app/api-gateway
EXPOSE 3000
CMD ["node", "src/index.js"]
