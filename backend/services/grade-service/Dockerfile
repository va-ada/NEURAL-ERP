# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/grade-service/package.json services/grade-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=grade-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/grade-service/node_modules /app/services/grade-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/grade-service /app/services/grade-service
WORKDIR /app/services/grade-service
EXPOSE 3006
CMD ["node", "src/index.js"]
