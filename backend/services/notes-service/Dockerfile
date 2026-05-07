# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/notes-service/package.json services/notes-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=notes-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/notes-service/node_modules /app/services/notes-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/notes-service /app/services/notes-service
WORKDIR /app/services/notes-service
EXPOSE 3008
CMD ["node", "src/index.js"]
