# sabirov.tech

## HomeLab / Dokploy

Новый деплой: **https://website.lab.sabirov.tech**. Используется `compose.dokploy.yml`, источник GitHub, автоматическое развёртывание после push в `main`.

Инструкция: [docs/DOKPLOY.md](docs/DOKPLOY.md). Переменные: [.env.dokploy.example](.env.dokploy.example). Ниже сохранено описание прежней инфраструктуры; для HomeLab внешние Kafka/Redis Sentinel и сети edge/messaging не нужны.

> Личный сайт-портфолио с системой обратной связи и Telegram-уведомлениями

[![Website](https://img.shields.io/badge/Website-sabirov.tech-00ff88?style=for-the-badge)](https://sabirov.tech)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

### CI/CD Status
[![Frontend CI](https://github.com/SabirovSR/PersonalWebsite/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/SabirovSR/PersonalWebsite/actions/workflows/frontend-ci.yml)
[![Backend CI](https://github.com/SabirovSR/PersonalWebsite/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/SabirovSR/PersonalWebsite/actions/workflows/backend-ci.yml)
[![codecov](https://codecov.io/gh/SabirovSR/PersonalWebsite/branch/main/graph/badge.svg)](https://codecov.io/gh/SabirovSR/PersonalWebsite)

### Docker Images
[![Docker Backend](https://img.shields.io/docker/v/savik175/sabirov-backend?label=backend&logo=docker&style=for-the-badge)](https://hub.docker.com/r/savik175/sabirov-backend)
[![Docker Frontend](https://img.shields.io/docker/v/savik175/sabirov-frontend?label=frontend&logo=docker&style=for-the-badge)](https://hub.docker.com/r/savik175/sabirov-frontend)

## Tech Stack

### Frontend
![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy_2-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=flat-square&logo=pydantic&logoColor=white)

### Infrastructure
![Kafka](https://img.shields.io/badge/Kafka_KRaft-231F20?style=flat-square&logo=apache-kafka&logoColor=white)
![Redis](https://img.shields.io/badge/Redis_Sentinel-DC382D?style=flat-square&logo=redis&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Traefik](https://img.shields.io/badge/Traefik-24A1C1?style=flat-square&logo=traefik&logoColor=white)

### Libraries & Tools
![aiokafka](https://img.shields.io/badge/aiokafka-0.10-orange?style=flat-square)
![aiogram](https://img.shields.io/badge/aiogram_3-2CA5E0?style=flat-square&logo=telegram&logoColor=white)
![next-intl](https://img.shields.io/badge/next--intl-3.22-blueviolet?style=flat-square)
![react-parallax-tilt](https://img.shields.io/badge/react--parallax--tilt-1.7-pink?style=flat-square)

## Архитектура

```
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│                 │      │                 │     │                 │
│   Next.js       │────▶│   FastAPI       │────▶│   Kafka         │
│   Frontend      │      │   Backend       │     │   (shared)      │
│                 │      │                 │     │                 │
└─────────────────┘      └─────────────────┘     └────────┬────────┘
                                │                         │
                                ▼                         ▼
                         ┌─────────────────┐     ┌─────────────────┐
                         │                 │     │                 │
                         │   Redis         │     │   Worker        │
                         │   (rate limit)  │     │   (consumer)    │
                         │                 │     │                 │
                         └─────────────────┘     └────────┬────────┘
                                                          │
                                ┌─────────────────────────┼─────────────────────────┐
                                │                         │                         │
                                ▼                         ▼                         ▼
                         ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
                         │                 │     │                 │     │                 │
                         │   PostgreSQL    │     │   Telegram Bot  │     │   Email         │
                         │   (storage)     │     │   (webhooks)    │     │   (optional)    │
                         │                 │     │                 │     │                 │
                         └─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Технологии

### Frontend
- **Next.js 14** - React framework с App Router
- **TypeScript** - типизация
- **Tailwind CSS** - стили
- **Framer Motion 11** - продвинутые анимации (scroll-based, parallax, stagger)
- **next-intl** - полная интернационализация (русский/английский)
  - Динамические переводы всех компонентов через `useTranslations`
  - Автоматический роутинг по языкам (`/ru`, `/en`)
  - SEO-оптимизированные мета-теги для каждого языка
- **react-parallax-tilt** - 3D card эффекты
- **react-intersection-observer** - scroll-triggered анимации

### Backend
- **FastAPI** - async Python web framework
- **aiokafka** - Kafka producer/consumer
- **aiogram 3** - Telegram Bot API
- **SQLAlchemy 2** - async ORM
- **Redis** - rate limiting

### Infrastructure
- **Kafka KRaft** - 3-node cluster (гарантированная доставка, high availability)
- **PostgreSQL** - хранение заявок
- **Redis Sentinel** - кэширование, rate limiting и high availability
- **Docker** - контейнеризация
- **Traefik** - reverse proxy с Let's Encrypt (self-hosted)

## Новые возможности ✨

### Frontend UX Improvements
- **🎨 Продвинутые анимации**: Scroll-triggered анимации с Framer Motion, parallax эффекты, плавные transitions с сохранением glassmorphism
- **🌌 Floating Particles**: Интерактивная Canvas-анимация с физикой частиц, damping и velocity capping
- **💎 Glassmorphism Design**: Современный liquid glass эффект для всех карточек с backdrop blur, тонкими borders и inner shadows
- **💳 3D Card Tilt**: React-parallax-tilt эффекты с glare, оптимизированные для desktop (отключены на mobile)
- **🌍 Полная локализация (i18n)**: Поддержка русского/английского с next-intl - переведены все компоненты, карточки, формы, SEO-теги
- **⌨️ Interactive Terminal**: Терминал с командами, typing эффектом, историей и keyboard shortcut (Ctrl+`)

### Backend & Infrastructure
- **☁️ Внешний Kafka**: Миграция на shared Kafka KRaft кластер (3 brokers, replication factor 3)
- **🔔 Telegram Webhooks**: Переход с polling на webhooks для мгновенных уведомлений
- **🔒 Traefik Integration**: Полная интеграция с Traefik для HTTPS и routing

### Performance & SEO
- **⚡ Code Splitting**: Dynamic imports для компонентов ниже fold
- **🖼️ Image Optimization**: WebP/AVIF форматы, lazy loading, blur placeholders
- **📊 SEO Enhancement**: Полные metadata, Open Graph, Twitter Cards, JSON-LD structured data
- **🗺️ Dynamic Sitemap**: Автоматическая генерация sitemap для всех языков
- **🤖 Robots.txt**: Правильная конфигурация для поисковых систем

### Design & Accessibility
- **🎨 Glassmorphism UI**: Консистентный liquid glass дизайн для карточек с оптимизированной прозрачностью
- **🌓 Dark/Light Themes**: Полная поддержка тёмной и светлой тем с адаптивными цветами
- **📱 Mobile-First**: Адаптивный дизайн с оптимизацией touch targets (44px+)
- **♿ Accessibility**: WCAG-совместимые contrast ratios, keyboard navigation

## Структура проекта

```
PersonalWebsite/
├── .github/
│   ├── workflows/
│   │   ├── frontend-ci.yml      # Frontend CI/CD pipeline
│   │   └── backend-ci.yml       # Backend CI/CD pipeline
│   └── dependabot.yml           # Dependency updates
│
├── frontend/                    # Next.js приложение
│   ├── src/
│   │   ├── app/                 # App Router (pages, layout)
│   │   ├── components/          # React компоненты
│   │   └── hooks/               # Custom hooks
│   ├── __tests__/               # Unit & integration тесты
│   │   ├── components/          # Component tests (Jest + RTL)
│   │   ├── hooks/               # Hook tests
│   │   └── integration/         # Integration tests
│   ├── e2e/                     # E2E тесты (Playwright)
│   ├── public/                  # Static files
│   ├── jest.config.js           # Jest configuration
│   ├── playwright.config.ts     # Playwright configuration
│   ├── package.json
│   └── Dockerfile
│
├── backend/                     # FastAPI приложение
│   ├── app/
│   │   ├── api/                 # REST endpoints
│   │   ├── database/            # SQLAlchemy models & service
│   │   ├── kafka/               # Kafka consumer
│   │   ├── models/              # Pydantic models
│   │   ├── services/            # Business logic
│   │   ├── telegram/            # Telegram bot
│   │   ├── config.py            # Settings
│   │   ├── main.py              # FastAPI app
│   │   └── worker.py            # Kafka worker entry
│   ├── tests/                   # Тесты (pytest)
│   │   ├── unit/                # Unit тесты
│   │   ├── integration/         # Integration тесты
│   │   ├── fixtures/            # Test fixtures
│   │   └── conftest.py          # Pytest configuration
│   ├── pytest.ini               # Pytest settings
│   ├── mypy.ini                 # Type checking
│   ├── pyproject.toml           # Ruff/Black configuration
│   ├── requirements.txt
│   ├── requirements-dev.txt     # Dev dependencies
│   └── Dockerfile
│
├── www/                         # Legacy static site (архив)
│
├── docker-compose.yml           # Local development
├── docker-compose.prod.yml      # Production
└── README.md
```

## Тестирование 🧪

Проект имеет комплексное покрытие тестами для обеспечения качества кода и стабильности.

### Frontend Tests

**Unit тесты** с Jest + React Testing Library:
```bash
cd frontend
npm test                   # Запустить тесты
npm run test:watch         # Watch mode
npm run test:coverage      # С coverage
```

**E2E тесты** с Playwright:
```bash
cd frontend
npm run test:e2e           # Headless mode
npm run test:e2e:ui        # UI mode
```

**Coverage**: Компоненты, хуки, интеграционные сценарии
- Contact form (валидация, отправка, обработка ошибок)
- Navigation (desktop/mobile, theme toggle)
- Hero section (анимации, типизация)
- Custom hooks (useInView)

### Backend Tests

**Unit тесты** с pytest:
```bash
cd backend
pytest                     # Запустить все тесты
pytest tests/unit/         # Только unit тесты
pytest --cov               # С coverage
pytest -v                  # Verbose mode
```

**Покрытие**:
- ✅ API endpoints (contact, health, telegram)
- ✅ Rate limiter (Redis-based)
- ✅ Kafka producer
- ✅ Telegram bot (notifications, commands)
- ✅ Integration tests (полный flow)

**Code Quality Tools**:
```bash
cd backend
ruff check app/            # Linting
black --check app/         # Formatting check
mypy app/                  # Type checking
bandit -r app/             # Security scan
```

### CI/CD Pipeline

GitHub Actions автоматически запускают:

**Frontend CI**:
- ESLint + TypeScript проверки
- Unit тесты с coverage
- E2E тесты на Chromium/Firefox/Mobile Safari
- Production build
- Upload к Codecov

**Backend CI**:
- Ruff linting + Black formatting
- mypy type checking
- Bandit security scanning
- pytest с PostgreSQL + Redis services
- Coverage upload к Codecov

**Dependabot**: Автоматические PR для обновления зависимостей (npm, pip, GitHub Actions)

## Быстрый старт

### Требования

- Docker & Docker Compose
- Внешний Kafka KRaft кластер в сети `messaging`
- Внешний Redis Sentinel кластер в сети `messaging`
- (Опционально) Node.js 20+ и Python 3.12+ для локальной разработки без Docker

### 1. Клонирование

```bash
git clone https://github.com/SabirovSR/PersonalWebsite.git
cd PersonalWebsite
```

### 2. Подготовка инфраструктуры

Убедитесь, что внешняя инфраструктура запущена:

```bash
# Проверьте Docker networks
docker network ls | grep messaging
docker network ls | grep edge

# Запустите Kafka KRaft + Redis Sentinel (если не запущены)
cd c:\infra\messaging
docker-compose up -d

# Проверьте статус
docker ps | grep -E "kafka-controller|redis"
```

### 3. Настройка переменных окружения

Создайте `.env` файл:

```bash
cp .env.example .env
```

Заполните обязательные переменные:

```env
# Environment
ENVIRONMENT=development
DEBUG=true

# Security
PUBLIC_API_KEY=your-secure-random-api-key

# CORS
CORS_ORIGINS=https://sabirov.tech,https://web.sabirov.tech,http://localhost:3000

# Redis Sentinel
REDIS_PASSWORD=redis_secure_password

# Database
POSTGRES_PASSWORD=secure-postgres-password

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_OWNER_ID=123456789
TELEGRAM_WEBHOOK_SECRET=random-secret-string
TELEGRAM_WEBHOOK_URL=https://api.sabirov.tech
```

Генерация секретов:
```bash
# API Key и Webhook Secret
openssl rand -base64 32
```

### 4. Запуск приложения

```bash
# Сборка и запуск всех сервисов
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f backend worker
```

### 5. Проверка работоспособности

```bash
# Health checks
curl http://localhost:8000/api/health
curl http://localhost:8000/api/health/ready
curl http://localhost:8000/api/health/live

# API Docs (только если DEBUG=true)
open http://localhost:8000/docs

# Frontend
open http://localhost:3000/ru
open http://localhost:3000/en
```

Сервисы будут доступны:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs (только в dev режиме)

## API

### POST /api/public/contact

Отправка формы обратной связи.

**Headers:**
```
Content-Type: application/json
api-key: {PUBLIC_API_KEY}
```

**Body:**
```json
{
  "name": "Иван Иванов",
  "message": "Привет! Хочу обсудить проект...",
  "channels": ["email", "telegram"],
  "contacts": {
    "email": "ivan@example.com",
    "telegram": "@ivan_ivanov"
  }
}
```

**Response:**
```json
{
  "status": "queued",
  "message": "Your message has been received. We will contact you soon!",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Доступные каналы связи

| Channel   | Description      |
|-----------|------------------|
| telegram  | Telegram @username |
| vk        | VK               |
| max       | MAX              |
| email     | Email адрес      |
| phone     | Телефон          |
| website   | Личный сайт      |

## Telegram бот

Бот отправляет уведомления только владельцу (по `TELEGRAM_OWNER_ID`).

### Формат уведомления

```
📬 Новая заявка с сайта!

👤 Имя: Иван Иванов

📝 Сообщение:
Привет! Хочу обсудить проект...

📞 Способы связи:
• 📧 Email: ivan@example.com
• 💬 Telegram: @ivan_ivanov

🕐 17.01.2026 14:32
🌍 IP: 1.2.3.4
```

### Команды бота

- `/start` - Приветствие
- `/status` - Проверка статуса

## Kafka

### Рекомендация по использованию

**Один общий кластер Kafka для всех сервисов** - это оптимальный подход:

- Kafka хорошо изолирует нагрузку через topics/partitions
- Экономия ресурсов (Kafka требует минимум 3 брокера для HA)
- Проще администрировать один кластер
- Разделение по топикам для разных сервисов

### Топики

| Topic                      | Description                |
|----------------------------|----------------------------|
| sabirov-contact-requests   | Заявки с сайта             |
| sabirov-contact-dlq        | Dead Letter Queue          |

## Локализация (i18n) 🌍

Проект полностью поддерживает двуязычность (русский/английский) с использованием **next-intl**.

### Поддерживаемые языки

- 🇷🇺 **Русский** (`/ru`) - основной язык
- 🇬🇧 **Английский** (`/en`) - английская версия

### Архитектура локализации

```
frontend/
├── messages/
│   ├── en.json          # Английские переводы
│   └── ru.json          # Русские переводы
├── src/
│   ├── i18n.ts          # Конфигурация next-intl
│   └── middleware.ts    # Автоматический роутинг по языкам
```

### Что локализовано

Переведены **все** компоненты и контент сайта:

- ✅ **Навигация** - меню, переключение языка
- ✅ **Hero секция** - приветствие, описание, CTA кнопки
- ✅ **About секция** - статистика, терминал, описания
- ✅ **Skills** - категории навыков, описания
- ✅ **Experience** - карточки опыта работы (должности, компании, описания)
- ✅ **Projects** - карточки проектов (названия, подробные описания)
- ✅ **Contact форма** - лейблы, плейсхолдеры, validation сообщения, успешные/ошибочные состояния
- ✅ **Footer** - копирайт
- ✅ **SEO** - мета-теги, Open Graph, JSON-LD для каждого языка

### Использование в компонентах

```tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('about');
  
  // Простые строки
  const title = t('title');  // "Кто я такой?" / "Who am I?"
  
  // Массивы и объекты
  const stats = t.raw('stats') as Array<{ number: string; label: string }>;
  
  return (
    <section>
      <h2>{t('title')}</h2>
      {stats.map(stat => (
        <div key={stat.label}>
          {stat.number} {stat.label}
        </div>
      ))}
    </section>
  );
}
```

### Структура файлов переводов

```json
{
  "nav": {
    "about": "About",
    "skills": "Skills"
  },
  "about": {
    "title": "Who am I?",
    "stats": [
      { "number": "3+", "label": "Years of experience" }
    ]
  },
  "experience": {
    "jobs": [
      {
        "title": "Developer",
        "company": "GNIVC",
        "description": "Development and maintenance...",
        "tech": ["C#", ".NET"]
      }
    ]
  }
}
```

### SEO для разных языков

- **Автоматический роутинг**: `/ru/`, `/en/`
- **Мета-теги**: `<html lang="ru">` / `<html lang="en">`
- **hreflang теги**: автоматические alternate links
- **Sitemap**: динамическая генерация для обоих языков
- **Open Graph**: локализованные og:title, og:description
- **JSON-LD**: structured data на каждом языке

### Особенности реализации

- **`.raw()` метод** - для получения сложных структур (массивы, объекты)
- **Type-safe** - TypeScript типизация для всех переводов
- **Server Components** - поддержка Server Components в Next.js 14
- **Fallback** - автоматический fallback на русский при отсутствии перевода
- **URL-based** - язык определяется из URL пути

## Разработка

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# API server
uvicorn app.main:app --reload

# Worker (в другом терминале)
python -m app.worker
```

## Переменные окружения

| Variable                  | Description                                            | Required | Default                                    |
|---------------------------|--------------------------------------------------------|----------|--------------------------------------------|
| PUBLIC_API_KEY            | API ключ для публичной формы                           | Yes      | -                                          |
| KAFKA_BOOTSTRAP_SERVERS   | Адреса Kafka brokers (KRaft cluster)                   | Yes      | kafka-controller-1:9092,kafka-controller-2:9092,kafka-controller-3:9092 |
| KAFKA_TOPIC               | Топик для заявок                                       | No       | sabirov-contact-requests                   |
| KAFKA_DLQ_TOPIC           | Dead Letter Queue топик                                | No       | sabirov-contact-dlq                        |
| KAFKA_CONSUMER_GROUP      | Consumer group ID                                      | No       | contact-processor                          |
| POSTGRES_URL              | PostgreSQL connection string                           | Yes      | -                                          |
| REDIS_URL                 | Redis connection string                                | Yes      | -                                          |
| TELEGRAM_BOT_TOKEN        | Токен Telegram бота                                    | Yes      | -                                          |
| TELEGRAM_OWNER_ID         | Твой Telegram ID                                       | Yes      | -                                          |
| TELEGRAM_WEBHOOK_SECRET   | Секрет для webhook URL                                 | Yes      | -                                          |
| TELEGRAM_WEBHOOK_URL      | Базовый URL для webhook (https://api.sabirov.tech)     | Yes      | -                                          |

## Лицензия

MIT License - используй как хочешь!

## Автор

**Сабиров Савелий Русланович**

- Website: [sabirov.tech](https://sabirov.tech)
- Email: contact@sabirov.tech
- Telegram: [@savik175](https://t.me/savik175)
- GitHub: [@SabirovSR](https://github.com/SabirovSR)
