# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/assignment-service/package.json services/assignment-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=assignment-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/assignment-service/node_modules /app/services/assignment-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/assignment-service /app/services/assignment-service
WORKDIR /app/services/assignment-service
EXPOSE 3005
CMD ["node", "src/index.js"]
