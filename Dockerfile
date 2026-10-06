FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG VITE_API_URL
ARG VITE_PUBLIC_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL VITE_API_URL=$VITE_API_URL VITE_PUBLIC_URL=$VITE_PUBLIC_URL
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run db:generate && npm run build

FROM build AS api
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4000
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]

FROM build AS web
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@aura/web"]

FROM nginx:stable-alpine AS admin
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
COPY infra/admin.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
