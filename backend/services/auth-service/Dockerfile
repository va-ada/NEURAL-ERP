# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/auth-service/package.json services/auth-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=auth-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/auth-service/node_modules /app/services/auth-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/auth-service /app/services/auth-service
WORKDIR /app/services/auth-service
EXPOSE 3001
CMD ["node", "src/index.js"]
