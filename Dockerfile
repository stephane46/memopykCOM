# Stage 1: build
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# 1) Install everything (including devDeps)
COPY package*.json ./
RUN npm ci

# 2) Copy source and build
COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:18-alpine
WORKDIR /usr/src/app

# Install curl for health checks
RUN apk add --no-cache curl

# 3) Install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# 4) Pull in the built output
COPY --from=builder /usr/src/app/dist ./dist

# 5) Expose & run
ENV PORT=3000
EXPOSE 3000

# Health check for Coolify
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Make sure your Express listens on 0.0.0.0:
#   app.listen(process.env.PORT, '0.0.0.0')
CMD ["node", "dist/index.js"]