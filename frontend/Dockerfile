# =============================================
# Dockerfile для Next.js фронтенда
# Многоступенчатая сборка с standalone выводом
# =============================================

# ---------------------
# Этап сборки (builder)
# ---------------------
FROM node:20-alpine AS builder

WORKDIR /app

# API ключ передаётся как аргумент сборки
# NEXT_PUBLIC_* переменные должны быть доступны во время сборки
ARG NEXT_PUBLIC_API_KEY=dev-api-key
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY

# Устанавливаем зависимости
# npm ci гарантирует воспроизводимость сборки из package-lock.json
COPY package.json package-lock.json ./
RUN npm ci

# Копируем исходный код
COPY . .

# Отключаем телеметрию Next.js и собираем продакшен-версию
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------------------
# Этап выполнения (runner)
# ---------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Устанавливаем переменные окружения для продакшена
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаём непривилегированного пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем только необходимые файлы из standalone сборки
# Это значительно уменьшает размер итогового образа
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Переключаемся на непривилегированного пользователя
USER nextjs

# Открываем порт приложения
EXPOSE 3000

# Настройки сервера
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Проверка здоровья контейнера (используем 127.0.0.1 вместо localhost для IPv4)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1

# Запускаем standalone сервер Next.js
CMD ["node", "server.js"]
