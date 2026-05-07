# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/library-service/package.json services/library-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=library-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/library-service/node_modules /app/services/library-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/library-service /app/services/library-service
WORKDIR /app/services/library-service
EXPOSE 3010
CMD ["node", "src/index.js"]
