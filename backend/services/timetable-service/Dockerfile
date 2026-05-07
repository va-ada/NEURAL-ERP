# syntax=docker/dockerfile:1.7
# Build context: backend/
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/timetable-service/package.json services/timetable-service/
COPY shared shared
COPY database database
RUN npm ci --workspace=timetable-service --include-workspace-root

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/services/timetable-service/node_modules /app/services/timetable-service/node_modules
COPY shared /app/shared
COPY database /app/database
COPY services/timetable-service /app/services/timetable-service
WORKDIR /app/services/timetable-service
EXPOSE 3004
CMD ["node", "src/index.js"]
