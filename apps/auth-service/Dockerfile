FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/tsconfig/package.json    ./packages/tsconfig/
COPY packages/schemas/package.json     ./packages/schemas/
COPY packages/utils/package.json       ./packages/utils/
COPY apps/auth-service/package.json    ./apps/auth-service/
COPY apps/auth-service/tsconfig.json   ./apps/auth-service/
RUN pnpm install --frozen-lockfile

# ---- dev ----
FROM deps AS dev
WORKDIR /app/apps/auth-service
CMD ["pnpm", "start:dev"]

# ---- build ----
FROM deps AS build
WORKDIR /app
COPY packages ./packages
COPY apps/auth-service ./apps/auth-service
RUN pnpm --filter @mailscope/auth-service build
WORKDIR /app/apps/auth-service
CMD ["node", "dist/main.js"]
