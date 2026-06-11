FROM mcr.microsoft.com/playwright:v1.60.0-noble AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN mkdir -p .data
RUN corepack enable && corepack prepare pnpm@11 --activate
RUN pnpm install --frozen-lockfile
COPY . .
ARG DATABASE_URL
ARG ENCRYPTION_KEY
RUN pnpm db:migrate
RUN pnpm build
RUN pnpm prune --production

FROM mcr.microsoft.com/playwright:v1.60.0-noble
WORKDIR /app
RUN apt-get update && apt-get install -y \
    x11vnc \
    novnc \
    websockify \
    && rm -rf /var/lib/apt/lists/*

COPY start.sh .
RUN chmod +x start.sh
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/.data .data/
COPY package.json .
RUN npx playwright install chromium
EXPOSE 3000 6080
CMD ["./start.sh"]