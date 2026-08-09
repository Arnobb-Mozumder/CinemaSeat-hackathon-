# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production || npm install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
