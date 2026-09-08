# Railway deployment entrypoint for the realtime service
FROM node:24-bookworm-slim
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile && pnpm --filter @tolk-og-laer/contracts build && pnpm --filter @tolk-og-laer/realtime build
EXPOSE 8080
CMD ["pnpm", "--filter", "@tolk-og-laer/realtime", "start"]
