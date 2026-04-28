FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/front/package.json ./apps/front/
RUN pnpm install --frozen-lockfile

# ---- dev ----
FROM deps AS dev
WORKDIR /app/apps/front
CMD ["pnpm", "dev", "--host"]

# ---- build ----
FROM deps AS build
WORKDIR /app
COPY apps/front ./apps/front
RUN pnpm --filter front build

FROM nginx:alpine AS prod
COPY --from=build /app/apps/front/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
