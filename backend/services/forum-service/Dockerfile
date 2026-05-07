# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/forum-service/package.json services/forum-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=forum-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/forum-service/node_modules /app/services/forum-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/forum-service /app/services/forum-service
WORKDIR /app/services/forum-service
EXPOSE 3011
CMD ["node", "src/index.js"]
