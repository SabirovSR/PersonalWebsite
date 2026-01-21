# =============================================
# Dockerfile для FastAPI бекенда
# Многоступенчатая сборка для минимального размера образа
# =============================================

# ---------------------
# Этап сборки (builder)
# ---------------------
FROM python:3.12-slim AS builder

WORKDIR /app

# Устанавливаем зависимости для компиляции Python-пакетов
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Создаём wheel-пакеты из requirements.txt
# Это ускоряет установку на следующем этапе
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# ---------------------
# Этап выполнения (runtime)
# ---------------------
FROM python:3.12-slim

WORKDIR /app

# Создаём непривилегированного пользователя для безопасности
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Устанавливаем только необходимые runtime-зависимости
# libpq5 нужен для работы с PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Копируем и устанавливаем wheel-пакеты из этапа сборки
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

# Копируем код приложения с правильными правами
COPY --chown=appuser:appuser app/ ./app/

# Переключаемся на непривилегированного пользователя
USER appuser

# Открываем порт API
EXPOSE 8000

# Проверка здоровья контейнера
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/api/health')" || exit 1

# Команда по умолчанию - запуск API сервера
# Для worker'а команда переопределяется в docker-compose
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
