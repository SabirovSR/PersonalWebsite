# Деплой PersonalWebsite в HomeLab

Адрес: https://website.lab.sabirov.tech. Панель: https://dokploy.lab.sabirov.tech.

## Настройки сервиса

- Project: PersonalWebsite; environment: production; service: website.
- Type: **Docker Compose**, не Stack.
- Source: GitHub → SabirovSR/PersonalWebsite.
- Branch: main.
- Compose Path: `./compose.dokploy.yml`.
- Autodeploy: On; Trigger Type: On Push.
- В GitHub Settings → Webhooks настроен отдельный push-webhook этого сервиса. Его адрес содержит токен: не публикуйте его в README или логах.
- Domain и маршруты уже заданы Traefik labels в Compose. Не добавляйте дублирующие Domains в UI.

В Environment задайте значения по `.env.dokploy.example`. POSTGRES_PASSWORD и REDIS_PASSWORD должны быть разными случайными hex-строками: например, `python -c "import secrets; print(secrets.token_hex(32))"`. Пароль PostgreSQL используется в URL, поэтому hex исключает проблемы экранирования. Переменные в UI сохраняются в приватном `.env` на сервере. Не коммитьте этот файл.

PUBLIC_API_KEY встроен в JavaScript браузера: это маркер формы, не секрет и не механизм аутентификации. Ограничение частоты запросов выполняет Redis.

Telegram опционален. Без токена заявки сохраняются в PostgreSQL; уведомления не отправляются. Для включения добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_OWNER_ID в Environment и выполните Deploy. Старый экземпляр бота должен быть остановлен перед включением polling на новом сервере.

## Что разворачивается

Next.js, FastAPI, worker, PostgreSQL 16, Redis 7 и один Kafka KRaft broker. Все зависимости принадлежат проекту. Старые сети edge/messaging и кластеры C:\infra не требуются. Данные сохраняются в именованных томах Compose. Порты базы, Redis и Kafka на хост не публикуются.

Frontend и API используют один домен. `/api/*`, включая WebSocket, идёт прямо в backend. Остальные пути — в Next.js. TLS завершается на Caddy VDS; внутри Dokploy используется `web`/HTTP без tls.certresolver. Не включайте HTTPS внутри Dokploy для этих маршрутов.

## Изменения и обновления

1. Изменить код, проверить сборку и нужные тесты.
2. Закоммитить и отправить изменения в main.
3. В Dokploy → Deployments проверить новый запуск и логи сборки.
4. Проверить `/ru`, `/en`, `/ru/business`, `/api/health/ready` и форму.

`On Push` разворачивает сразу после push и **не ждёт успешного GitHub Actions**. Для строгого CI-gate используйте защищённый main и PR с обязательными проверками либо отдельный deployment webhook после CI.

Workflow `HomeLab deployment checks` проверяет Compose, обе Docker-сборки и сохранение заявок без Telegram. Старые Frontend CI/Backend CI сохранены: у них есть отдельный технический долг (устаревшие тесты компонентов, запуск Playwright из Jest и отсутствующий backend/requirements-dev.txt). Их результаты нельзя считать зелёными только потому, что деплой успешен.

Первая сборка дольше последующих: сервер скачивает базовые образы и зависимости. NEXT_PUBLIC_* и SITE_URL учитываются при сборке; после их изменения нужен новый Deploy со сборкой.

## Проверка и откат

```powershell
curl.exe https://website.lab.sabirov.tech/api/health/ready
ssh homelab
```

Для отката кода используйте `git revert <commit>` и push, затем проверьте новый deployment. Не используйте `docker compose down -v`: это удалит данные. Изменение пароля POSTGRES_PASSWORD в UI не меняет пароль существующего PostgreSQL; для ротации нужна отдельная SQL-операция.

Перед изменениями схемы БД делайте pg_dump и проверяйте восстановление. Постоянный Docker volume — не резервная копия. Полная стратегия внешних бэкапов в рамках этой миграции не настроена.

Исходный `docker-compose.yml` оставлен для старой инфраструктуры. В HomeLab используется только `compose.dokploy.yml`.
