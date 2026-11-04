FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate
RUN npm prune --production

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressuser

COPY --from=builder --chown=expressuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=expressuser:nodejs /app/package*.json ./

COPY --chown=expressuser:nodejs server.js ./
COPY --chown=expressuser:nodejs src ./src

USER expressuser

EXPOSE 5000

CMD ["node", "server.js"]
