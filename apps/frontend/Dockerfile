FROM node:20-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json turbo.json ./
COPY packages ./packages
COPY apps/frontend/package.json ./apps/frontend/
RUN npm ci

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages ./packages
COPY package.json package-lock.json turbo.json ./
COPY apps/frontend ./apps/frontend
RUN npx turbo run build --filter=frontend...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs

EXPOSE 3001
CMD ["node", "apps/frontend/server.js"]
