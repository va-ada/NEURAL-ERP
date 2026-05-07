# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/notification-service/package.json services/notification-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=notification-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/notification-service/node_modules /app/services/notification-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/notification-service /app/services/notification-service
WORKDIR /app/services/notification-service
EXPOSE 3012
CMD ["node", "src/index.js"]
