FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/schemas/package.json  ./packages/schemas/
COPY packages/utils/package.json    ./packages/utils/
COPY apps/api/package.json          ./apps/api/
COPY apps/api/tsconfig.json         ./apps/api/
RUN pnpm install --frozen-lockfile

# ---- dev ----
FROM deps AS dev
WORKDIR /app/apps/api
CMD ["pnpm", "start:dev"]

# ---- build ----
FROM deps AS build
WORKDIR /app
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter @mailscope/api build
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
