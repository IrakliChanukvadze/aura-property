# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci

FROM dependencies AS build
# Explicit source allowlist: production credentials, database dumps and local uploads
# are never sent into an image layer, even if a future ignore pattern regresses.
COPY apps/api/src apps/api/src
COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY apps/web apps/web
COPY apps/admin apps/admin
COPY packages/database/prisma packages/database/prisma
COPY scripts/env.mjs scripts/env.mjs
ARG NEXT_PUBLIC_API_URL=https://api.auraproperty.ge/api
ARG NEXT_PUBLIC_SITE_URL=https://auraproperty.ge
ARG VITE_API_URL=https://api.auraproperty.ge/api
ARG VITE_PUBLIC_URL=https://auraproperty.ge
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL VITE_API_URL=$VITE_API_URL VITE_PUBLIC_URL=$VITE_PUBLIC_URL NEXT_TELEMETRY_DISABLED=1
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run db:generate \
 && npm run build -w @aura/api \
 && npm run build -w @aura/admin \
 && npm run build -w @aura/web

FROM build AS production-dependencies
RUN npm prune --omit=dev --ignore-scripts

FROM node:24-bookworm-slim AS node-runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM node-runtime AS api
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
ENV HOST=0.0.0.0 PORT=4000
USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]

# Operations image contains Prisma CLI for migrations and approved content import.
# It is never exposed as a service and must not run the development seed.
FROM build AS migrate
COPY --chown=node:node scripts/public-content.mjs scripts/public-content.mjs
ENV NODE_ENV=production
USER node
CMD ["npm", "run", "deploy", "-w", "@aura/database"]

FROM node-runtime AS web
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
ENV HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

FROM nginx:stable-alpine AS admin
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
COPY infra/admin.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
