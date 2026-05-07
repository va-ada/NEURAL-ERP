# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/academic-service/package.json services/academic-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=academic-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/academic-service/node_modules /app/services/academic-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/academic-service /app/services/academic-service
WORKDIR /app/services/academic-service
EXPOSE 3002
CMD ["node", "src/index.js"]
