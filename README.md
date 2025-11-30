# MaxDate - Сервис знакомств

Современный веб-сервис знакомств, разработанный командой 1 (М3405).

## Технологии

### Backend
- Node.js 20+
- NestJS
- TypeScript
- TypeORM + PostgreSQL
- JWT аутентификация
- Nodemailer

### Frontend
- HTML5
- CSS3 (современный дизайн с градиентами)
- Vanilla JavaScript

### Инфраструктура
- Docker + Docker Compose
- Nginx (reverse proxy)
- MailHog (для тестирования email)

## Быстрый старт

### Требования
- Docker и Docker Compose
- Node.js 20+ (для локальной разработки)

### Запуск через Docker

```bash
# Клонировать репозиторий
cd max_date

# Запустить все сервисы
docker-compose up -d

# Проверить логи
docker-compose logs -f
```

После запуска:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- MailHog (просмотр писем): http://localhost:8025

### Локальная разработка

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend запускается через nginx или можно использовать live-server
cd frontend
npx live-server
```

## Функциональность (MVP)

### Реализовано:
- Регистрация через email с подтверждением
- Валидация пароля (кириллица, цифры)
- Создание и редактирование профиля
- Загрузка до 5 фотографий
- Лента анкет с фильтрами
- Система лайков/дизлайков
- Взаимные лайки (матчи)
- Настройки приватности
- Смена пароля
- Деактивация аккаунта

### Ограничения MVP:
- Только веб-версия
- Без чата (переадресация в MAX/VK)
- Без геолокации
- Только русская локализация

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/confirm-email` - Подтверждение email
- `POST /api/auth/request-reset` - Запрос сброса пароля
- `POST /api/auth/reset-password` - Сброс пароля
- `POST /api/auth/change-password` - Смена пароля (авторизация)

### Пользователи
- `GET /api/users/me` - Текущий пользователь
- `DELETE /api/users/me` - Удаление аккаунта
- `DELETE /api/users/me/deactivate` - Деактивация

### Профили
- `GET /api/profiles/me` - Мой профиль
- `POST /api/profiles` - Создание профиля
- `PUT /api/profiles` - Обновление профиля
- `GET /api/profiles/:id` - Просмотр профиля
- `POST /api/profiles/photos` - Загрузка фото
- `DELETE /api/profiles/photos/:id` - Удаление фото
- `PUT /api/profiles/photos/:id/main` - Установка главного фото

### Города
- `GET /api/cities` - Список городов
- `GET /api/cities?q=query` - Поиск городов

### Лайки и матчи
- `GET /api/likes/feed` - Лента анкет
- `POST /api/likes/like/:userId` - Лайк
- `POST /api/likes/dislike/:userId` - Дизлайк
- `GET /api/likes/matches` - Взаимные лайки
- `POST /api/likes/matches/:id/view` - Отметить просмотренным
- `GET /api/likes/matches/unviewed-count` - Счётчик непросмотренных

## Структура проекта

```
max_date/
├── backend/
│   ├── src/
│   │   ├── auth/           # Аутентификация
│   │   ├── users/          # Пользователи
│   │   ├── profiles/       # Профили и фото
│   │   ├── likes/          # Лайки и матчи
│   │   ├── cities/         # Справочник городов
│   │   └── mail/           # Email сервис
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── css/
│   ├── js/
│   ├── img/
│   └── *.html
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Тестирование

```bash
cd backend
npm run test
npm run test:cov  # с покрытием
```

## Команда разработки

- Аналитик: Пименова Полина
- Разработчик: Зырянова Мария
- Разработчик: Улитина Анна
- Тестировщик: Таратенко Юлия

## Лицензия

MIT

