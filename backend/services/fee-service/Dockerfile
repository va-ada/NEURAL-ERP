# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/fee-service/package.json services/fee-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=fee-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/fee-service/node_modules /app/services/fee-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/fee-service /app/services/fee-service
WORKDIR /app/services/fee-service
EXPOSE 3009
CMD ["node", "src/index.js"]
