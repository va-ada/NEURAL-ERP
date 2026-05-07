# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/career-service/package.json services/career-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=career-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/career-service/node_modules /app/services/career-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/career-service /app/services/career-service
WORKDIR /app/services/career-service
EXPOSE 3007
CMD ["node", "src/index.js"]
