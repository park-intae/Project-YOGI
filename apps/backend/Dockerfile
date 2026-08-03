FROM node:20-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json turbo.json ./
COPY packages ./packages
COPY apps/backend/package.json ./apps/backend/
RUN npm ci

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages ./packages
COPY package.json package-lock.json turbo.json ./
COPY apps/backend ./apps/backend
WORKDIR /app/apps/backend
RUN npx prisma generate
WORKDIR /app
RUN npx turbo run build --filter=backend...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 3002
CMD ["node", "apps/backend/dist/src/main.js"]
