FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# Install Python 3 + holehe in an isolated venv
RUN apk add --no-cache python3 py3-pip py3-setuptools && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir holehe

ENV PYTHON_PATH=/opt/venv/bin/python3

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/tsconfig/package.json     ./packages/tsconfig/
COPY packages/schemas/package.json      ./packages/schemas/
COPY packages/utils/package.json        ./packages/utils/
COPY apps/osint-service/package.json    ./apps/osint-service/
COPY apps/osint-service/tsconfig.json   ./apps/osint-service/
# Copy the Python runner so it's available in dev even without a volume mount
COPY apps/osint-service/scripts        ./apps/osint-service/scripts
RUN pnpm install --frozen-lockfile

# ---- dev ----
FROM deps AS dev
WORKDIR /app/apps/osint-service
CMD ["pnpm", "start:dev"]

# ---- build ----
FROM deps AS build
WORKDIR /app
COPY packages ./packages
COPY apps/osint-service ./apps/osint-service
RUN pnpm --filter @mailscope/osint-service build
WORKDIR /app/apps/osint-service
CMD ["node", "dist/main.js"]
