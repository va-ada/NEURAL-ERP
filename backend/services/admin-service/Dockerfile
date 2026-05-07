# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/admin-service/package.json services/admin-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=admin-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/admin-service/node_modules /app/services/admin-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/admin-service /app/services/admin-service
WORKDIR /app/services/admin-service
EXPOSE 3013
CMD ["node", "src/index.js"]
