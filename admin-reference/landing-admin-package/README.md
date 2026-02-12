# Landing Admin CMS - Integration Package

## Описание
Полноценная CMS для управления лендингом:
- Блог/статьи с Telegraph-подобным редактором
- Кастомные HTML-страницы
- Управление лидами
- Inline-редактирование контента на странице
- Загрузка медиа-файлов

---

## Структура пакета

```
landing-admin-package/
├── app/
│   ├── [locale]/
│   │   ├── adminlend/           # Админ-панель лендинга
│   │   │   ├── layout.tsx       # Layout админки
│   │   │   ├── page.tsx         # Dashboard админки
│   │   │   ├── blog/            # Управление статьями
│   │   │   ├── pages/           # Кастомные страницы
│   │   │   ├── leads/           # Управление лидами
│   │   │   ├── content/         # Редактирование контента
│   │   │   └── metrica/         # Аналитика
│   │   └── (marketing)/
│   │       └── [slug]/page.tsx  # Динамические страницы
│   └── api/
│       └── upload/route.ts      # Загрузка файлов
│
├── actions/
│   ├── article.ts               # CRUD статей
│   ├── page.ts                  # CRUD страниц
│   ├── lead.ts                  # Управление лидами
│   └── subscriber.ts            # Подписчики
│
├── components/
│   ├── editor/
│   │   ├── telegraph-editor.tsx # Редактор статей
│   │   └── advanced-editor.tsx  # Расширенный редактор
│   ├── roistat/
│   │   ├── header.tsx           # Header лендинга
│   │   └── footer.tsx           # Footer лендинга
│   ├── edit-mode-toggle.tsx     # Переключатель режима редактирования
│   ├── edit-mode-toggle-client.tsx
│   └── editable-text.tsx        # Inline-редактируемый текст
│
└── prisma/
    └── models.prisma            # Модели для добавления в schema.prisma
```

---

## Инструкция по интеграции

### 1. Скопировать файлы
```bash
# Распаковать архив в корень проекта
unzip landing-admin-package.zip -d /path/to/your/project/

# Или скопировать вручную папки:
# - app/[locale]/adminlend/ → ваш проект
# - app/api/upload/ → ваш проект  
# - actions/*.ts → ваш проект
# - components/editor/ → ваш проект
# - components/roistat/ → ваш проект
# - components/edit-mode-*.tsx, editable-text.tsx → ваш проект
```

### 2. Добавить модели в Prisma
Скопировать содержимое `prisma/models.prisma` в ваш `prisma/schema.prisma`

### 3. Применить миграцию
```bash
npx prisma migrate dev --name add_landing_admin
npx prisma generate
```

### 4. Создать папку для загрузок
```bash
mkdir -p public/uploads
```

### 5. Настроить Nginx (для production)
```nginx
location /uploads/ {
    alias /var/www/your-project/public/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 6. Проверить зависимости
Убедиться что установлены:
```bash
npm install sonner uuid lucide-react
```

Также нужны shadcn/ui компоненты:
- Button, Input, Textarea, Label, Switch
- Tabs, TabsList, TabsTrigger, TabsContent
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow
- Badge, AlertDialog, Select, Card, DropdownMenu

### 7. Добавить роут в навигацию
В layout или header добавить ссылку на `/adminlend` для админов.

---

## Доступ к админке
После интеграции админка доступна по адресу:
- `/ru/adminlend` (если i18n с русским по умолчанию)
- `/adminlend` (если без i18n)

Требуется авторизация с ролью ADMIN (проверяется в layout.tsx).

---

## Важные замечания

1. **Роль ADMIN** - убедитесь что в вашей модели User есть поле role с enum UserRole (ADMIN, USER)

2. **Auth.js / NextAuth** - админка использует `auth()` из `@/auth` для проверки сессии

3. **i18n** - роуты используют `[locale]` сегмент. Если у вас нет i18n, нужно убрать этот уровень из путей

4. **Prisma Client** - импортируется как `import { prisma } from "@/lib/db"`

5. **Contentlayer** - файл `[slug]/page.tsx` объединяет страницы из БД и MDX файлы через contentlayer. Если у вас нет contentlayer, уберите эту часть кода.
