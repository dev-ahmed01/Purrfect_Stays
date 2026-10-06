FROM node:20.19.0-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter @purrfect/contracts build \
    && pnpm --filter @purrfect/database build \
    && pnpm --filter @purrfect/api build

FROM node:20.19.0-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app
COPY --from=builder --chown=node:node /app /app

USER node
EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
