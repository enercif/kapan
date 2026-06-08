FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN mkdir -p .data
RUN npm ci
COPY . .
ARG DATABASE_URL
ARG ENCRYPTION_KEY
RUN npm run db:migrate
RUN npm run build
RUN npm prune --production

FROM node:22-debian-slim
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/.data .data/
COPY package.json .
RUN npx playwright install chromium --with-deps
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]