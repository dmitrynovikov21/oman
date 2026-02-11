# ExpertOS Landing Page

Лендинг страница для платформы ExpertOS.

## Структура проекта

```
oman-land/
├── app/                    # Next.js App (только лендинг)
│   ├── page.tsx            # Главная страница
│   └── layout.tsx          # Корневой layout
├── components/             # React компоненты
├── .context/               # Документация проекта
│   └── ARCHITECTURE.md     # Полная архитектура
├── .backend/               # [ARCHIVED] Python FastAPI
├── .dashboard/             # [ARCHIVED] Личный кабинет
├── .auth/                  # [ARCHIVED] Авторизация
└── .api/                   # [ARCHIVED] API Routes
```

## Запуск

```bash
npm install
npm run dev
```

## Архивированные модули

Следующие модули перенесены в скрытые папки и не участвуют в сборке:

- **`.backend/`** — FastAPI OCR сервис (PaddleOCR, EasyOCR, Tesseract)
- **`.dashboard/`** — Личный кабинет эксперта
- **`.auth/`** — Страницы авторизации (login, register)
- **`.api/`** — API endpoints (cases, documents, calculations)

Для восстановления переместите содержимое обратно:
```bash
mv .backend backend
mv .dashboard app/(protected)
mv .auth app/(auth)
mv .api app/api
```
