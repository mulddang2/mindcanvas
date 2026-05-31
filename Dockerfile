# MindCanvas 로컬 시연용 이미지 — next 프로덕션 서버 + yjs WebSocket 서버를 같은 이미지로 띄운다.
# docker-compose.yml에서 next/yjs 두 서비스가 같은 이미지를 사용하고 command만 다르게 둔다.
FROM node:22-alpine AS base
# corepack의 자동 latest pnpm 다운로드를 피하고 pnpm 10을 명시적으로 활성 (lockfile·local과 호환).
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
ARG NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=dummy-publishable-key
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next.config.ts ./next.config.ts
EXPOSE 3000 1234
CMD ["pnpm", "start"]
