FROM node:22-alpine AS build
LABEL authors="mariokreitz"

WORKDIR /workspace

ENV NODE_ENV=development

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx nx build web --configuration=production


FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 app \
    && adduser --system --uid 1001 --ingroup app app

COPY --from=build /workspace/package.json /workspace/package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --from=build /workspace/dist/apps/web ./dist/apps/web

USER app

EXPOSE 4000

CMD ["node", "dist/apps/web/server/server.mjs"]