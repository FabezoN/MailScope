FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/utils/package.json ./packages/utils/
COPY apps/job-runner/package.json ./apps/job-runner/
COPY apps/job-runner/tsconfig.json ./apps/job-runner/
RUN pnpm install --frozen-lockfile

# ---- dev ----
FROM deps AS dev
WORKDIR /app/apps/job-runner
CMD ["pnpm", "dev"]

# ---- build ----
FROM deps AS build
WORKDIR /app
COPY packages ./packages
COPY apps/job-runner ./apps/job-runner
RUN pnpm --filter @mailscope/job-runner build
WORKDIR /app/apps/job-runner
CMD ["node", "dist/main.js"]
