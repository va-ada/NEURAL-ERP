# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/attendance-service/package.json services/attendance-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=attendance-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/attendance-service/node_modules /app/services/attendance-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/attendance-service /app/services/attendance-service
WORKDIR /app/services/attendance-service
EXPOSE 3003
CMD ["node", "src/index.js"]
