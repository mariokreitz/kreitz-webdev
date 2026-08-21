ARG NODE_IMAGE=node:26-slim

FROM ${NODE_IMAGE} AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts --no-audit --no-fund

FROM ${NODE_IMAGE} AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

RUN npx prisma generate --config apps/api/prisma.config.ts \
  && npx nx build api --configuration=production

FROM ${NODE_IMAGE} AS prod-deps

WORKDIR /app

COPY --from=build /app/dist/apps/api/package.json /app/dist/apps/api/package-lock.json ./

RUN npm ci --omit=dev --no-audit --no-fund --legacy-peer-deps

FROM ${NODE_IMAGE} AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist/apps/api ./
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.API_PORT||3000)+'/api/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "main.js"]
