# ---------- Builder ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN mkdir -p .data
RUN corepack enable && corepack prepare pnpm@11 --activate
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm prune --production

# ---------- Runtime ----------
FROM node:22-bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    x11vnc \
    novnc \
    websockify \
    python3 \
    python3-pip \
    python3-venv \
    git \
    libgtk-3-0 \
    libdbus-glib-1-2 \
    libxt6 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    libasound2 \
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig \
    libpci3 \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install git+https://github.com/feder-cr/invisible_playwright.git --break-system-packages
RUN python3 -m invisible_playwright fetch

RUN mkdir -p .data

COPY start.sh .
RUN chmod +x start.sh
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/drizzle drizzle/
COPY package.json .
ENV DISPLAY=:99
EXPOSE 3000 6080
CMD ["./start.sh"]