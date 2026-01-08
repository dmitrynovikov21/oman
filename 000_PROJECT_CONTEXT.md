MODULE 1: AUTHENTICATION & TENANCY SPECIFICATION
1. ОБЩЕЕ ОПИСАНИЕ (OVERVIEW)
Этот модуль отвечает за Идентификацию (кто ты?), Аутентификацию (вход в систему) и Мульти-тенанси (изоляция данных).
Это "Проходная" системы ExpertOS. Ни один запрос к бизнес-данным не проходит мимо этого модуля.
Ключевой принцип: Organization Isolation. Пользователь всегда принадлежит одной Организации. Все запросы к БД автоматически фильтруются по organization_id.
2. СТЕК ТЕХНОЛОГИЙ (TECH STACK)
Backend: FastAPI (Python).
Database: PostgreSQL (SQLAlchemy + Alembic).
Auth Lib: python-jose (JWT), passlib (bcrypt hashing).
Validation: Pydantic v2.
3. МОДЕЛЬ ДАННЫХ (DATABASE SCHEMA)
Мы используем реляционную схему.
3.1. Таблицы (SQL Logic)
1. organizations (Tenants)
id (UUID, PK): Уникальный ID фирмы.
name (String): Название (например, "Al-Adl Experts").
plan (Enum): FREE_TRIAL, PRO, ENTERPRISE.
created_at (Timestamp).
settings (JSONB): Глобальные настройки фирмы (логотип, дефолтная валюта, правила инкремента).
2. users (System Users)
id (UUID, PK).
email (String, Unique, Index).
hashed_password (String).
full_name (String).
role (Enum):
SUPER_ADMIN (Владелец ExpertOS).
ORG_ADMIN (Владелец фирмы).
EXPERT (Сотрудник).
organization_id (UUID, FK -> organizations.id): Критическое поле. Привязывает юзера к теннанту.
is_active (Boolean): Для блокировки уволенных.
3. invitations (Приглашения)
id (UUID).
email (String).
organization_id (UUID, FK).
role (Enum).
token (String, Unique): Ссылка для вступления.
expires_at (Timestamp).

3.2. Диаграмма связей (Mermaid)
Фрагмент кода
erDiagram
    ORGANIZATION ||--|{ USER : has
    ORGANIZATION ||--|{ INVITATION : issues
    ORGANIZATION {
        uuid id PK
        string name
        enum plan
    }
    USER {
        uuid id PK
        uuid organization_id FK
        string email
        enum role
    }


4. БИЗНЕС-ЛОГИКА (BUSINESS LOGIC)
4.1. Сценарий: Регистрация (Self-Service Registration)
Пользователь заходит на /register.
Вводит: Email, Password, Company Name.
Система:
Создает новую запись в organizations (Plan = FREE_TRIAL).
Создает запись в users с ролью ORG_ADMIN.
Выдает Access Token.
4.2. Сценарий: Приглашение сотрудника (Invite Flow)
ORG_ADMIN вводит email коллеги (например, junior@firm.com).
Система создает запись в invitations и генерирует ссылку.
Коллега переходит по ссылке -> Вводит Имя и Пароль -> Становится EXPERT в этой organization_id.
4.3. Middleware: Изоляция (Tenancy Enforcement)
Строгое правило для Backend:
Каждый API-запрос (кроме /auth/...) должен проходить через зависимость get_current_user.
При любом запросе к таблицам cases, documents, clients нужно автоматически добавлять фильтр:
WHERE organization_id = current_user.organization_id.
5. API ENDPOINTS (CONTRACT)
Auth Controller (/api/v1/auth)
POST /register
Input: {email, password, company_name}
Output: {access_token, token_type}
POST /login (OAuth2PasswordRequestForm)
Input: {username (email), password}
Output: {access_token}
POST /refresh
Обновление токена.
Organization Controller (/api/v1/org)
GET /me
Получить данные своей фирмы (настройки, лимиты).
POST /invite (Только ORG_ADMIN)
Input: {email, role}
Output: {invite_link}
Users Controller (/api/v1/users)
GET /me
Данные текущего юзера.
6. SECURITY CHECKLIST (ДЛЯ РАЗРАБОТЧИКА)
[ ] Пароли хешируются через bcrypt или argon2.
[ ] Access Token живет короткое время (напр. 30 минут), Refresh Token — долго (7 дней).
[ ] CORS настроен строго на домен фронтенда.
[ ] В users уникальность email проверяется глобально.




Принято. Я перевел утвержденную нами логику "Умного конвейера" (Smart Pipeline) в формат технической спецификации для разработчика.
Это Модуль 3, и он описывает процесс превращения "сырого файла" в "структурированные переменные" с учетом строгой приватности.
Сохрани этот блок как 03_INTAKE_OCR_SPEC.md.

VOLUME 1.1: FOUNDATION & DATABASE ARCHITECTURE
1. ВВЕДЕНИЕ И СТЕК (TECH STACK)
Product: ExpertOS (SaaS for Judicial Experts).
Architecture: Monolithic Modular (FastAPI) with strict Layered Architecture.
Deploy: On-Premise (Client Server) or Local Cloud (Oman).
Core Stack:
Language: Python 3.11+
Framework: FastAPI (Async)
Database: PostgreSQL 16 (с расширением pgvector для будущего RAG).
ORM: SQLAlchemy 2.0 (Async) + Alembic (Migrations).
Auth: JWT + OAuth2 (Role Based Access Control).
Task Queue: Redis + Celery (для OCR и тяжелых расчетов).
2. МУЛЬТИ-ТЕНАНСИ (MULTI-TENANCY STRATEGY)
Мы используем стратегию "Row-Level Security" (Shared Database, Shared Schema).
Все данные всех фирм лежат в одной БД.
Каждая таблица имеет колонку organization_id.
Middleware на уровне API автоматически фильтрует все запросы: WHERE organization_id = current_user.org_id.
Исключение: Таблицы справочников (System Settings).
3. СХЕМА БАЗЫ ДАННЫХ (ERD - ENTITY RELATIONSHIP DIAGRAM)
3.1. Уровень Доступа (Access Layer)
organizations (Теннанты)
id (UUID, PK): Уникальный ID фирмы.
name (String): Название (напр. "Al-Adl Experts").
settings (JSONB):
increment_base: "GROSS" | "BASIC" (из HR Manual).
eosb_rule: "FIXED_30" (Новый закон).
work_days_per_month: 30 (default).
created_at (Timestamp).
users (Пользователи)
id (UUID, PK).
organization_id (UUID, FK) -> organizations.id.
email (String, Index).
hashed_password (String).
role (Enum): ORG_ADMIN, EXPERT, REVIEWER.
is_active (Bool).
3.2. Уровень Дела (Case Core)
cases (Дела)
id (UUID, PK).
organization_id (FK).
case_number (String): "1409/2024" (Парсится из PDF).
court_name (String): "Primary Court Duqm".
status (Enum): DRAFT, ACTIVE, WAITING_INFO, REVIEW, CLOSED.
case_type (Enum): LABOR, COMMERCIAL (пока только Labor).
assigned_expert_id (FK) -> users.id.
folder_path (String): Путь к файлам на диске (/data/org_1/case_123/).
parties (Стороны)
id (UUID, PK).
case_id (FK).
role (Enum): PLAINTIFF (Истец), DEFENDANT (Ответчик).
name_ar (String): "Saif Al-Ismaili".
name_en (String): "Saif Al-Ismaili".
nationality (Enum): OMANI, EXPAT (Критично для пенсии!).
representative (String): Имя адвоката (Dr. Wasila).
3.3. Уровень Зарплатной Истории (Payroll Engine)
Здесь хранится "Призрачный таймлайн", который мы нашли в отчетах.
salary_components (Компоненты ЗП)
id (UUID).
case_id (FK).
name (String): "Basic", "Housing", "Transport", "Duqm Allowance".
amount (Decimal): Базовая сумма.
is_gross_part (Bool): Входит ли в Gross? (Для расчета инкремента).
time_slices (Временные отрезки)
Позволяет менять условия во времени (как плавающая надбавка за Дукм).
id (UUID).
case_id (FK).
start_date (Date).
end_date (Date, Nullable).
rule_type (Enum): ALLOWANCE_CHANGE, GRADE_CHANGE, INCREMENT_FREEZE.
value (JSONB): {"allowance_rate": 0.105} (10.5%).
comparators (Свидетели дискриминации)
id (UUID).
case_id (FK).
name (String): "Maqdad Al-Hooti".
position (String).
hiring_date (Date).
current_gross_salary (Decimal).
years_experience (Float).
3.4. Уровень Контента (Content Layer)
documents (Файловый реестр)
id (UUID).
case_id (FK).
file_name (String).
file_type (Enum): COURT_MANDATE, CONTRACT, PAYSLIP, JD, EVIDENCE.
processed_status (Enum): PENDING, OCR_DONE, FAILED.
tokens_map (JSONB): Зашифрованный маппинг [PLAINTIFF_1] -> Ahmed (Для Privacy).
meeting_minutes (Протоколы)
id (UUID).
case_id (FK).
meeting_date (Date).
audio_path (String).
transcript_json (JSONB): Полный текст с разбивкой по спикерам.
summary_text (Text): Сгенерированный протокол.
is_signed (Bool).
4. БИЗНЕС-ПРАВИЛА (BUSINESS RULES FOR DB)
Unique Constraint: Пара (court_name, case_number, organization_id) должна быть уникальной. Нельзя создать дубль дела.
Delete Cascade: При удалении case, удаляются все parties, documents, calculations. Файлы с диска переносятся в архив.
Currency: Все финансовые поля хранятся в Decimal(14, 3) (3 знака после запятой для Оманского Риала/Байс).

MODULE 3: INTELLIGENT INTAKE & OCR PIPELINE
1. ОБЩЕЕ ОПИСАНИЕ (OVERVIEW)
Этот модуль реализует ETL-пайплайн (Extract, Transform, Load) для обработки входящих документов.
Система принимает на вход "кучу файлов" (Loose Attachments) любого формата, локально извлекает текст и таблицы, обезличивает данные, классифицирует их через Cloud AI и сохраняет как Структурированные Переменные Дела (Case Variables).
Ключевая цель: Автоматически заполнить поля дела (Start Date, Basic Salary, Job Title), чтобы эксперту не пришлось вбивать их вручную.
2. СТЕК ТЕХНОЛОГИЙ (TECH STACK)
File Handling: python-magic (валидация типов), pdf2image (рендеринг PDF в картинки).
OCR Engine: PaddleOCR (v2.7+).
Обоснование: Лучший Open-Source движок для арабского языка и сложных табличных структур111.
+1
Local NLP: GLiNER (Generalist Model for NER) или Spacy + Microsoft Presidio.
Cloud AI: Google Gemini 1.5 Pro (режим JSON Output).
Queue: Celery + Redis (обработка происходит асинхронно в фоне).
3. АРХИТЕКТУРА ПРОЦЕССА (THE PIPELINE)
Фрагмент кода
graph TD
    A[User Uploads File] -->|Raw PDF/IMG| B(Local Pre-processing)
    B -->|Clean Images| C{PaddleOCR Local}
    C -->|Raw Text + Tables| D[Local NER & Masking]
    D -->|Anonymized Text| E[Cloud AI 'Gemini']
    E -->|Structured JSON with Tokens| F[Local Rehydration]
    F -->|Real Names Restored| G[DB: Case Variables]


4. ДЕТАЛИЗАЦИЯ ШАГОВ (STEP-BY-STEP LOGIC)
ЭТАП 1: EXTRACT (Локальное извлечение)
Задача: Вытащить весь контент, сохранив структуру, не отправляя ничего в интернет.
Ingestion: Пользователь загружает файл (PDF/JPG). Система проверяет Magic Bytes (защита от вирусов).
Splitting: Если это многостраничный PDF, он разбивается на отдельные страницы-изображения.
PaddleOCR: Запускается распознавание2.
Важно: PaddleOCR возвращает не просто текст, а блоки с координатами. Мы сохраняем структуру таблиц (строки/колонки).
Результат: "Грязный" текстовый слой (Raw Text Layer).
ЭТАП 2: TRANSFORM - PRIVACY (Локальная маскировка)
Задача: Подготовить данные для Cloud AI, скрыв PII3333.
+1
NER Scan: Локальная модель ищет в тексте:
Имена (PERSON)
Компании (ORG)
ID/Телефоны (REGEX)
Token Replacement: Замена найденного на семантические токены.
Ahmed Al-Balushi -> [PLAINTIFF_1]
Tatweer Co. -> [DEFENDANT_COMPANY_1]
Mapping Storage: Сохранение словаря { "[PLAINTIFF_1]": "Ahmed Al-Balushi" } во временный кэш обработки.
ЭТАП 3: TRANSFORM - CLOUD INTELLIGENCE (Анализ)
Задача: Понять смысл документа и извлечь факты.
Request: Отправляем обезличенный текст в Gemini.
System Prompt:
"Ты — юридический ассистент. Проанализируй этот текст.
Определи тип документа (CONTRACT, PAYSLIP, COURT_RULING, ID_CARD).
Извлеки ключевые факты в JSON. Если видишь таблицу зарплат, верни массив объектов.
Игнорируй токены типа [PLAINTIFF_1], считай их именами собственных."
Response: Gemini возвращает чистый JSON:
JSON
{
  "doc_type": "CONTRACT",
  "extracted_data": {
    "employee_name": "[PLAINTIFF_1]",
    "start_date": "2019-04-17",
    "basic_salary": 1100,
    "job_title": "Head of Technical Support"
  }
}




ЭТАП 4: LOAD (Регидратация и Сохранение)
Задача: Вернуть реальные имена и записать в базу данных для использования в отчетах.
Unmasking: Бэкенд проходит по JSON-ответу и меняет [PLAINTIFF_1] обратно на Ahmed Al-Balushi4.
Variable Storage: Данные сохраняются не как "текст файла", а как сущности в таблицу case_variables.
Теперь, когда мы будем генерировать отчет, переменная {{ start_date }} уже лежит в базе.
5. МОДЕЛЬ ДАННЫХ (DATABASE SCHEMA)
Таблица documents (Файловый реестр)
id (UUID, PK)
case_id (FK)
file_path (String): Путь к файлу на диске (MinIO/Local FS)5.
doc_type (Enum): UNKNOWN -> CONTRACT (обновляется после AI анализа).
status (Enum): PROCESSING -> READY.
Таблица case_variables (Извлеченные знания)
Это "мозг" дела. Сюда складываются факты из всех документов.
id (UUID, PK)
case_id (FK)
source_doc_id (FK): Ссылка на документ, откуда взяли цифру.
key (String): Например, salary_basic_2019.
value (JSONB): 1100 (число) или "Ahmed" (строка).
confidence (Float): Уверенность ИИ (0.0 - 1.0).
6. API ENDPOINTS
POST /api/v1/cases/{id}/documents
Input: Multipart/Form-Data (Files[]).
Action: Запускает Async Task для каждого файла.
GET /api/v1/cases/{id}/variables
Output: Список всех извлеченных данных для предзаполнения полей в UI (чтобы эксперт мог проверить: "ИИ нашел зарплату 1100, это верно?").
7. КОНТРОЛЬ КАЧЕСТВА (FALLBACK)
Если качество скана слишком низкое (OCR Confidence < 60%):
Система помечает документ флагом NEEDS_REVIEW.
В UI эксперту показывается этот документ с пометкой: "Не удалось автоматически извлечь данные. Пожалуйста, введите ключевые цифры вручную".
Мы не отправляем совсем "битые" данные в ИИ, чтобы избежать галлюцинаций.



Это "Сердце безопасности" ExpertOS. Здесь мы описываем, как именно работает концепция Hybrid Privacy, маскировка компаний и судей, и как система понимает структуру документа до отправки в облако.

MODULE 2: PRIVACY & LOCAL AI SPECIFICATION
1. ОБЩЕЕ ОПИСАНИЕ (OVERVIEW)
Этот модуль реализует концепцию "Zero Trust to Cloud".
Его задача — превратить "Грязный, чувствительный документ" в "Структурированный, обезличенный набор данных", безопасный для отправки в LLM (Gemini).
Модуль работает строго On-Premise (на сервере клиента/нашем сервере в Омане). Никакие данные не покидают периметр до завершения этапа маскировки.
2. СТЕК ТЕХНОЛОГИЙ (TECH STACK)
Мы оптимизируем стек под CPU (Cost-efficiency), используя ONNX Runtime.
2.1. Core Engines
OCR (Текст): PaddleOCR (v2.7+).
Config: Модель PP-OCRv4 (Arabic/English).
Hardware: CPU mode (MKL-DNN enabled).
Visual Analysis (Разметка): YOLOv8-Nano (Ultralytics).
Task: Object Detection (Tables, Signatures, Stamps).
NER (Сущности): GLiNER (Generalist Model for Named Entity Recognition).
Why: Лучше работает с нестандартными сущностями ("Omani Company"), чем стандартный Spacy.
Fallback: Microsoft Presidio (Regex-паттерны для ID и телефонов).
Classification: FastText (Facebook).
Task: Быстрое определение типа документа по первым 500 токенам.
2.2. Utilities
Image Proc: OpenCV (cv2), pdf2image.
Data: Pydantic (валидация), SQLAlchemy (хранение токенов).
3. АРХИТЕКТУРА ПАЙПЛАЙНА (THE PIPELINE)
Фрагмент кода
flowchart TD
    In[Input File] --> Pre[Pre-processing & Cleanup]
    Pre --> YOLO{YOLOv8 Analysis}
    YOLO -- "Found Table" --> TableOCR[Table Structure Recognition]
    YOLO -- "Found Text" --> TextOCR[General OCR]
    TableOCR & TextOCR --> RawText[Raw Text + BBoxes]
    RawText --> Class[FastText Classification]
    RawText --> NER[GLiNER + Regex Masking]
    NER --> Tokens{Token Map Storage}
    NER --> Out[Anonymized Safe Text]


4. БИЗНЕС-ЛОГИКА (DETAILED LOGIC)
4.1. Этап 1: Visual Pre-Analysis (YOLOv8)
Прежде чем читать текст, мы смотрим на структуру страницы.
Model: YOLOv8n (trained on DocLayNet or similar).
Classes: TABLE, SIGNATURE, HEADER, FOOTER.
Logic:
Если обнаружен класс TABLE: Вырезаем (Crop) область и отправляем в специализированный Table OCR pipeline (чтобы сохранить строки/столбцы).
Если обнаружен HEADER/FOOTER: Игнорируем этот текст при анализе (шум).
4.2. Этап 2: OCR & Confidence Check (Manual Fallback)
Engine: PaddleOCR.
Logic:
Извлекаем текст и координаты (Bounding Boxes).
Quality Gate: Считаем средний confidence score (уверенность модели) по странице.
Rule:
Score > 0.8: Автоматическая обработка.
Score < 0.6: Помечаем флагом NEEDS_MANUAL_REVIEW. В UI эксперт увидит предупреждение: "Скан нечеткий. Проверьте данные вручную".
4.3. Этап 3: Semantic Masking (Анонимизация)
Мы заменяем реальные данные на Типизированные Токены.
Сущности для маскировки (Entities):
Сущность
Метод детекции
Пример токена
PERSON
GLiNER
[PLAINTIFF_1], [DEFENDANT_1]
ORG (Компании)
GLiNER + Suffix List
[COMPANY_A], [BANK_1]
JUDGE (Судьи)
Regex (فضيلة الشيخ...)
[JUDGE_1]
ID_NUM (Civil ID)
Regex (\d{8,12})
[ID_CARD_1]
PHONE
Presidio
[PHONE_1]
MONEY
Не маскируем
Оставляем (нужно для расчетов)
DATES
Не маскируем
Оставляем (нужно для таймлайна)

Алгоритм маскировки:
Прогон Regex (самый быстрый): Телефоны, ID, Email.
Прогон GLiNER (умный): Имена, Компании.
Context Check: Если модель сомневается ("Apple" — это фрукт или компания?), проверяем классификацию документа. В документе типа LEGAL приоритет у Компаний.
Consistency: Если "Ahmed" на стр. 1 стал [PLAINTIFF_1], то "Ahmed" на стр. 50 тоже должен стать [PLAINTIFF_1] (в рамках одной сессии обработки).
4.4. Этап 4: Регидратация (Rehydration)
Восстановление данных после ответа ИИ.
Input: Текст от Gemini с токенами ("[PLAINTIFF_1] is entitled to...").
Logic:
Загружаем token_map из БД.
str.replace("[PLAINTIFF_1]", "Ahmed").
Возвращаем чистый текст.
5. МОДЕЛЬ ДАННЫХ (DATABASE)
Нам нужно хранить "Словарь" для каждого файла/дела.
Таблица privacy_maps
id (UUID, PK)
case_id (UUID, FK): Ссылка на дело.
document_id (UUID, FK, Nullable): Ссылка на конкретный файл (если маппинг локальный).
map_data (JSONB): Зашифрованное поле.
JSON
{
  "entities": {
    "[PLAINTIFF_1]": {"value": "Saif Al-Ismaili", "type": "PERSON"},
    "[COMPANY_A]": {"value": "Tatweer SEZ", "type": "ORG"},
    "[ID_CARD_1]": {"value": "12345678", "type": "ID"}
  },
  "context": "LABOR_DISPUTE"
}




encryption_key_id (String): ID ключа KMS (для ротации ключей).
6. API INTERFACE (INTERNAL)
Модуль предоставляет методы для других сервисов (Intake, Reporting).
POST /privacy/scan_and_mask
Body: { file_bytes: bytes, options: { ocr: true, fast: false } }
Returns:
JSON
{
  "clean_text": "Text with [TOKENS]",
  "tokens_id": "uuid-of-map",
  "doc_class": "CONTRACT",
  "quality_score": 0.85
}




POST /privacy/restore
Body: { text: "Text with [TOKENS]", tokens_id: "uuid" }
Returns: { original_text: "Text with Real Names" }
7. БЕЗОПАСНОСТЬ И ИСКЛЮЧЕНИЯ (WHITELIST)
Критически важно не замаскировать юридические термины.
Global Whitelist (Игнорировать при маскировке):
"Plaintiff" (Истец), "Defendant" (Ответчик).
"Court" (Суд — как институт, а не название).
"Muscat", "Oman", "Sohar" (Города — нужны для контекста надбавок).
"Ministry of Labor" (Гос. органы — публичные данные).


Принято. Я изучил скриншоты файла Case Registrar.
Это меняет подход к проектированию БД. Это не просто "список дел", это Мастер-данные (Master Data) всей судебной системы Омана.
📊 АНАЛИЗ СКРИНШОТОВ (ЧТО Я ВИЖУ)
Скриншот 1 (Dashboard):
Это KPI Дашборд, который мы должны воссоздать в ExpertOS.
Ключевые метрики: Total Cases (289), Closed (239), Active (50).
Финансы: Total Fees Due (49,675.00 OMR). Это подтверждает, что система должна суммировать гонорары по всем делам.
Скриншот 2 (Courts List):
Это Справочник Судов (Lookup Table).
Я вижу строгую иерархию:
Governorate (Мухафаза): Muscat, Al Batinah South, Al Batinah North.
Court Type: Primary (Ибтидайя), Appeal (Исти'наф), Supreme (Улья).
Court Name: Конкретное название (например, "Al Seeb Primary Court").
Вывод для Архитектора: Мы не можем позволить пользователю вбивать название суда вручную (опечатки убьют статистику). Мы должны загрузить этот список в БД и использовать Fuzzy Matching (нечеткий поиск), чтобы привязать OCR-текст к конкретному ID суда.

🚀 ГОТОВНОСТЬ К ТОМУ 2 (INTAKE & OCR)


📘 VOLUME 2: INTELLIGENT INTAKE & OCR PIPELINE
1. ВВЕДЕНИЕ (OVERVIEW)
Этот модуль — "Входные ворота" ExpertOS.
Его задача: принять неструктурированный поток файлов ("Loose Attachments"), распознать их (OCR), классифицировать и извлечь метаданные для создания карточки дела, не передавая чувствительные данные в облако.
Принцип: Local-First Processing. Файл покидает сервер только в виде обезличенных токенов.
2. СТЕК ТЕХНОЛОГИЙ (TECH STACK)
OCR Engine: PaddleOCR v2.7 (Специализированная модель PP-OCRv4-Arabic).
Почему: Лучший Open-Source для арабского языка и таблиц.
Document Handling: pdf2image (рендеринг PDF), python-magic (валидация типов).
Classification: FastText (Facebook) — локальная легковесная модель для классификации типа документа по первым 500 словам.
Extraction & Masking: GLiNER (Generalist NER) + RegEx (для номеров дел и ID).
Validation: FuzzyWuzzy (для сопоставления названия суда с Master-list).
3. АРХИТЕКТУРА ПРОЦЕССА (THE PIPELINE)
Фрагмент кода
graph TD
    A[User Uploads Files] -->|Validation| B{File Type Check}
    B -->|Image/PDF| C[Local OCR Paddle]
    C -->|Raw Text| D[Local Classification]
    D -->|Doc Type| E{Is it Court Mandate?}
    E -- Yes --> F[Extract Metadata]
    E -- No --> G[Tag as Evidence]
    F --> H[Create Case Draft]


4. БИЗНЕС-ЛОГИКА (STEP-BY-STEP)
4.1. Этап 1: Загрузка и Валидация
Ingestion: Пользователь перетаскивает 10-50 файлов (PDF, JPG, PNG) в зону загрузки.
Sanitization:
Проверка magic bytes (защита от exe-файлов).
Транслитерация имен файлов (чтобы Linux не сломался об арабскую вязь): دعوى.pdf -> daawa_123.pdf.
4.2. Этап 2: Локальный OCR (PaddleOCR)
Запускается на CPU/GPU сервера клиента.
Layout Analysis: Определяет, где текст, а где Таблица.
Recognition: Извлекает арабский текст.
Критично: Сохраняет структуру таблиц (для зарплатных ведомостей).
4.3. Этап 3: Классификация Документа (Local AI)
Модель FastText анализирует текст и ставит тег:
COURT_MANDATE: Если есть слова "Назначение", "Депозит", "Амана".
LEGAL_CLAIM: Если есть "Истец", "Прошу суд".
EVIDENCE_FINANCIAL: Если есть таблица с цифрами и словами "Salary", "Bank".
EVIDENCE_HR: Если есть "Contract", "Article".
4.4. Этап 4: Извлечение Метаданных (Extraction)
Если документ помечен как COURT_MANDATE (Письмо о назначении), запускается эвристический парсер:
Номер Дела:
Regex: \d{1,4}\/\d{4} (Ищет формат 1409/2024).
Logic: Если найдено несколько, берет тот, что в "Шапке".
Суд (Court Name):
Ищет названия из Master List (который мы видели на скриншоте).
Использует нечеткий поиск: Если OCR прочел "Al Seb Court", система поймет, что это "Al Seeb Primary Court".
Гонорар (Fees):
Ищет цифры рядом со словами "Amana", "Deposit", "Fees".
Парсит сумму (например, "300") и сохраняет в поле deposit_amount.
5. МОДУЛЬ ПРИВАТНОСТИ (PRIVACY & MASKING)
Перед тем как отправить текст в Gemini (например, для саммаризации иска), мы обязаны его очистить.
Правила Маскировки (Whitelist/Blacklist):
Судьи (Judges):
Pattern: فضيلة الشيخ (Honorable Sheikh) + [2-3 слова].
Action: Замена на [JUDGE_NAME].
Компании (Companies):
Используем NER (GLiNER) для поиска организаций.
Action: Замена на [COMPANY_1].
Имена (Persons):
Action: Замена на [PLAINTIFF_1], [DEFENDANT_1].
Важно: Сохраняем маппинг [PLAINTIFF_1] = Ahmed в локальной БД (таблица privacy_tokens).
6. МОДЕЛЬ ДАННЫХ (DATABASE SCHEMA - INTAKE)
documents (Файловый реестр)
id (UUID, PK)
case_id (FK) -> cases.id
original_name (String): Исходное имя файла.
storage_path (String): Путь на диске.
doc_type (Enum): MANDATE, CLAIM, CONTRACT, OTHER.
ocr_status (Enum): PENDING, COMPLETED, FAILED.
ocr_text (Text): Распознанный "сырой" текст (хранится локально и зашифрован!).
confidence_score (Float): Качество распознавания (0.0 - 1.0).
master_courts (Справочник Судов - из Excel)
id (Integer, PK)
name_ar (String): "المحكمة الابتدائية بالسيب"
name_en (String): "Al Seeb Primary Court"
type (Enum): PRIMARY, APPEAL, SUPREME
governorate (String): "Muscat"
7. API ENDPOINTS
POST /api/v1/intake/upload
Body: Multipart/Form-Data (Files[]).
Action: Загрузка, создание задач в Celery.
GET /api/v1/intake/status/{task_id}
Action: Полллинг прогресса OCR.
POST /api/v1/intake/confirm_case
Body: { extracted_data: { case_no, court_id, ... } }
Action: Эксперт проверяет то, что извлек ИИ, и нажимает "Создать дело".


📘 MODULE 4: CALCULATION CORE SPECIFICATION
1. ОБЩЕЕ ОПИСАНИЕ (OVERVIEW)
Этот модуль отвечает за всю математику проекта. Он принимает на вход параметры дела (даты, зарплаты, тип увольнения) и выдает юридически обоснованные суммы.
Модуль работает изолированно от базы данных и веба (Pure Python), что позволяет легко покрыть его Unit-тестами (что критично для судов).
Ключевая концепция: Scenario-Based Calculation. Мы считаем не одну цифру, а три сценария:
Plaintiff Claim: Что просит истец (максимум).
Defendant View: Что признает компания (минимум).
Expert Opinion: "Золотая середина" по закону (наш результат).
2. СТЕК ТЕХНОЛОГИЙ (TECH STACK)
Language: Python 3.11+ (строгая типизация).
Libraries:
pandas — для работы с временными рядами (Time Series) и генерации "Ghost Timeline".
numpy — для финансовой статистики (сравнение с Peers).
pydantic — для валидации входных данных.
holidays — библиотека праздников (нужно добавить кастомный календарь Омана).
3. БИЗНЕС-ЛОГИКА (CORE LOGIC)
3.1. Юридический Квалификатор (The Classifier)
Перед расчетом система определяет "Режим работы"1.
Режимы (Enum):
🔴 ARTICLE_40 (Грубое нарушение)
EOSB = 02.
Notice Pay = 03.
Считаем только: Зарплатные долги и неотгулянный отпуск.
🟡 NORMAL_TERMINATION (Обычное увольнение/Resignation)
EOSB = Standard (30 дней)4.
Notice Pay = По контракту.
🟢 UNFAIR_DISMISSAL (Незаконное увольнение) — Самый сложный
Compensation = 3..12 месяцев (Configurable)5.
Pension = 22.5% от Gross за период спора6.
Notice Pay = Включено7.
3.2. Алгоритмы Расчетов (Formulas)
A. EOSB (Выходное пособие)
Правило: 30 дней за каждый год (Fixed 30)8.
База: Last Drawn Basic Salary9999.
+1
Неполный год: Пропорционально (Prorated)10.
Формула: (Basic / 30) * 30 * Years_Worked.
B. Leave Encashment (Отпускные)
Делитель: 30 дней (стандарт)11.
Начисление:
Вариант А: 2.5 дня/мес (Календарные)12.
Вариант Б: 2.9 дня/мес (Рабочие - для некоторых компаний)13.
База (Критично):
Если уволен (Terminated) -> Gross Salary14.
Если работает (Active) -> Basic Salary15.
C. Overtime (Переработки)
База: Basic Salary16.
Коэффициенты:
Day: x1.2517.
Night: x1.518.
Holiday: x2.019.
D. Unfair Compensation Package (Новое!)
Если режим UNFAIR_DISMISSAL:
Judicial Comp: (Gross Salary) * X_Months (где X задает эксперт, от 3 до 12)20.
Pension arrears:
Формула: Gross_Salary * 0.225 * Months_Out_Of_Work21.
Логика: 14.5% (Доля компании) + 8% (Доля сотрудника) = 22.5%22.
3.3. Ghost Timeline Generator (Призрачный Таймлайн)
Инструмент для доказательства недоплат (как в кейсе с 3% инкремента).
Вход:
Start_Date (2019).
Start_Salary (1000 OMR).
Increment_Rule (например, "3% on Gross Annually")23.
Freeze_Periods (например, "COVID Freeze: 2020-03 to 2021-03").
Процесс:
Система генерирует массив объектов Month:
Python
[
  { "date": "2019-01", "actual": 1000, "target": 1000, "diff": 0 },
  ...
  { "date": "2020-01", "actual": 1000, "target": 1030, "diff": 30 }, # +3% applied
  ...
  { "date": "2021-01", "actual": 1000, "target": 1030, "diff": 30 }  # Frozen, no increment
]


Результат: Сумма колонки diff — это и есть сумма иска ("Arrears").
3.4. Comparator Engine (Детектор Дискриминации)
Анализ коллег (Peers)24.
Вход: Список объектов { experience_years, gross_salary }.
Логика:
Строит линию регрессии (Trend Line).
Считает отклонение Истца от средней по рынку.
Если отклонение > 10%, выдает флаг DISCRIMINATION_DETECTED.
4. МОДЕЛЬ ДАННЫХ (IN-MEMORY OBJECTS)
Эти модели используются внутри калькулятора (Pydantic).
Python
class SalaryComponent(BaseModel):
    name: str # "Basic", "Housing"
    amount: Decimal
    is_gross: bool # Входит ли в Gross?

class EmployeeProfile(BaseModel):
    join_date: date
    end_date: date | None
    termination_type: Enum # ARTICLE_40, UNFAIR, NORMAL
    nationality: Enum # OMANI, EXPAT
    basic_salary: Decimal
    gross_salary: Decimal
    leave_balance: int
    
class TenantRules(BaseModel):
    eosb_rule: str = "FIXED_30"
    increment_base: str = "GROSS" # or "BASIC" 
    leave_accrual_rate: float = 2.5 # or 2.9 


5. API ИНТЕРФЕЙС (CALCULATION SERVICE)
POST /api/v1/calculate/preview
Input: Данные формы (из UI Квалификатора).
Output: JSON с итоговыми суммами (для предпросмотра).
POST /api/v1/calculate/timeline
Input: Параметры инкремента (Start salary, rule).
Output: Массив данных для построения графика "Ghost Timeline".
POST /api/v1/calculate/commit
Action: Сохраняет расчет в БД как "Version 1".
6. ТРЕБОВАНИЯ К ТЕСТИРОВАНИЮ (TEST SUITE)
Unit Tests: Обязательно покрыть тестами кейсы:
Високосный год.
Увольнение ровно через 364 дня (получит ли EOSB? -> Prorated).
Пенсионный расчет с округлением до 3 знаков (Байсы).



Принято. Фиксируем: Инкремент начисляется в годовщину найма (Anniversary Date).
Это усложняет код (у каждого сотрудника свой график повышений), но делает расчет юридически точным.
Мы закрыли вопросы по математике. Теперь я генерирую ТОМ 3: CALCULATION ENGINE.
Это "Мозг" системы. Здесь описывается чистая Python-логика, которая будет считать деньги, строить "Призрачные таймлайны" и доказывать дискриминацию.

📘 VOLUME 3: CALCULATION ENGINE SPECIFICATION
1. ВВЕДЕНИЕ (OVERVIEW)
Этот модуль отвечает за Детерминированные Расчеты.
Здесь нет нейросетей. Здесь царит строгая математика, основанная на Трудовом Кодексе Омана и внутренних регламентах компаний (HR Manuals).
Модуль работает изолированно, принимая на вход JSON с параметрами и возвращая JSON с результатами расчетов.
Принцип: Audit Traceability. Каждая цифра в отчете должна иметь объяснение ("Почему 500? Потому что правило X применено к дате Y").
2. СТЕК ТЕХНОЛОГИЙ (TECH STACK)
Language: Python 3.11+
Core Libs: pandas (для Time Series), decimal (для точности валют), python-dateutil (для работы с годовщинами).
Architecture: Чистые функции (Pure Functions), покрытые Unit-тестами на 100%.
3. БИЗНЕС-ЛОГИКА (CORE ALGORITHMS)
3.1. Salary Simulator (Призрачный Таймлайн)
Класс, который восстанавливает историческую справедливость. Строит график того, как должна была расти зарплата.
Входные параметры:
start_date: Дата найма (напр. 14.03.2018).
start_gross_salary: Стартовая ЗП.
increment_rule: "3% on GROSS" (Настройка из HR Manual).
increment_timing: "ANNIVERSARY" (Годовщина найма).
freeze_periods: Список интервалов заморозки (напр. COVID: 19.03.2020 - 31.12.2021).
Алгоритм:
Генерируем временную шкалу по месяцам от start_date до today.
Находим точки повышения (каждое 14 марта).
Проверяем: попадает ли дата повышения в freeze_period?
Да: Пропускаем повышение (ЗП не меняется).
Нет: New_Gross = Old_Gross * 1.03.
Сохраняем состояние на каждый месяц.
Результат (JSON):
JSON
[
  {"date": "2019-03-14", "event": "INCREMENT", "amount": 1030.000, "reason": "Annual 3%"},
  {"date": "2020-03-14", "event": "SKIPPED", "amount": 1030.000, "reason": "COVID Freeze"},
  {"date": "2021-03-14", "event": "SKIPPED", "amount": 1030.000, "reason": "COVID Freeze"},
  {"date": "2022-03-14", "event": "INCREMENT", "amount": 1060.900, "reason": "Resumed"}
]


3.2. Переменные Надбавки (Allowance Time Slices)
Решение проблемы "Плавающей надбавки за Дукм" (15% -> 10.5% -> 15%).
Логика:
Мы не храним ставку как константу. Мы храним список правил с датами действия.
Python
allowance_rules = [
    {"start": "2017-01-01", "end": "2021-10-31", "rate": 0.15},
    {"start": "2021-11-01", "end": "2023-09-30", "rate": 0.105},
    {"start": "2023-10-01", "end": None, "rate": 0.15}
]


При расчете зарплаты за конкретный месяц система выбирает актуальное правило.
3.3. Калькулятор Выходного Пособия (EOSB Engine)
Для Экспатов и случаев "Normal Termination".
Формула: (Last_Basic_Salary / 30) * Total_Days_Worked.
Правило: Фиксированные 30 дней за год (New Law).
Prorata: Если отработал 2 года и 5 месяцев -> Считаем за 2.41 года.
Исключение: Если termination_reason = ARTICLE_40 (Грубое нарушение) -> Результат 0.
3.4. Пенсионный Калькулятор (Omani Pension)
Для Оманцев в случае "Unfair Dismissal". Вместо EOSB считается ущерб пенсионным накоплениям.
База: Gross Salary.
Ставка: 22.5% (14.5% Company + 8% Employee).
Формула: Monthly_Gross * 0.225 * Months_Out_Of_Work.
Нюанс: Если спор длится 12 месяцев, компания должна доплатить в фонд PASI именно эту сумму.
3.5. Компаратор (Discrimination Detector)
Анализ "Зарплатных Лент" (Salary Bands) на основе CSV с коллегами.
Вход:
Target_Employee: {Exp: 7 years, Salary: 2440}
Peers: [{Exp: 11, Salary: 2678}, {Exp: 31, Salary: 2693}]
Алгоритм:
Строит Линейную Регрессию (Salary ~ Years_Experience).
Вычисляет Expected_Salary для 7 лет опыта.
Считает Deviation (Отклонение).
Если Отклонение < -5% (ниже рынка), ставит флаг DISCRIMINATION_LIKELY.
4. API ИНТЕРФЕЙС (CALCULATION SERVICE)
POST /api/v1/calc/simulate_timeline
Body: Параметры найма, история повышений.
Return: Массив месяцев с "Идеальной зарплатой" vs "Фактической".
POST /api/v1/calc/final_settlement
Body: Дата увольнения, тип (Resignation/Article40), неиспользованный отпуск.
Return: Детализированный расчет EOSB, Отпускных, Билетов.
POST /api/v1/calc/compare_peers
Body: Данные истца + CSV файл с коллегами.
Return: JSON для построения графика (Scatter Plot) и текстовый вывод ("Undepaid by 9.8%").
5. ТЕСТИРОВАНИЕ (QA STRATEGY)
Поскольку это финтех, ошибки недопустимы.
Unit Tests: Проверяем граничные случаи (Високосный год, увольнение 31 декабря, стаж < 1 года).
Regression Tests: Используем данные из реального "Excel-файла Тарика" как эталон. Наш Python-код должен выдавать те же цифры до байсы, что и его Excel.




Принято. Отказываемся от встроенного редактора шаблонов.
Решение: Шаблоны (.docx с тегами Jinja2) готовят разработчики и заливают на сервер. Эксперт просто выбирает из списка: "Трудовой спор (Обычный)", "Трудовой спор (Топ-менеджер)".
Это сэкономит нам 2-3 недели разработки фронтенда.
Генерирую ТОМ 4: REPORT FACTORY.
Здесь описываем, как мы собираем финальный документ, поддерживаем арабскую вязь (RTL) и склеиваем "Сэндвич" из отчета и доказательств.
Сохрани этот блок как файл 04_REPORT_FACTORY_SPEC.md.

📘 VOLUME 4: REPORT FACTORY & BUNDLING SPECIFICATION
1. ВВЕДЕНИЕ (OVERVIEW)
Этот модуль — "Сборочный цех". Он не считает цифры (это делает Vol.3) и не распознает текст (это делает Vol.2).
Его задача — взять готовые данные и аккуратно вложить их в юридически выверенный Word-шаблон, а затем собрать финальный PDF-пакет для суда.
Ключевой принцип: Template Injection (Инъекция данных). Мы не рисуем документ с нуля кодом. Мы используем "Золотой шаблон" Тарика как основу.
2. СТЕК ТЕХНОЛОГИЙ (TECH STACK)
Templating: docxtpl (Python).
Почему: Единственная библиотека, которая сохраняет сложное форматирование Word (колонтитулы, шрифты, таблицы стилей) при вставке данных.
PDF Engine: pikepdf или pypdf.
Задача: Склейка (Merge) финального отчета с приложениями без потери качества.
Conversion: LibreOffice (Headless mode via Docker).
Задача: Конвертация черновика .docx -> .pdf на сервере (опционально, если эксперт не сделает это сам).
3. БИЗНЕС-ЛОГИКА (THE FACTORY PROCESS)
3.1. Шаг 1: Генерация Черновика (The Draft)
Эксперт нажимает "Сгенерировать отчет".
Сбор Контекста (Context Gathering):
Система тянет данные из БД: case_number, plaintiff_name, court_name.
Тянет результаты расчетов из Vol.3: eosb_total, leave_total.
Тянет саммари встреч из Vol.5 (будущий том).
Рендеринг (Rendering):
Загружается шаблон: templates/labor_dispute_v1.docx.
Происходит замена переменных: {{ case_no }} -> "1409/2024".
Динамические таблицы: Если в истории зарплат 5 лет, система создает 5 строк в таблице шаблона (Jinja2 Loop).
Выдача:
Эксперт скачивает файл Draft_Case_1409.docx.
3.2. Шаг 2: Человеческая Правка (Human Loop)
Эксперт открывает Word локально.
Правит формулировки, добавляет "воду", меняет шрифты.
Сохраняет финальную версию как PDF (Final_Report.pdf).
3.3. Шаг 3: Склейка Пакета (The Bundle)
Эксперт загружает Final_Report.pdf обратно в систему.
Система запускает процесс сборки (Bundling):
Порядок страниц в итоговом файле:
Титульный лист (System Generated): Логотип бюро, номер дела, QR-код для валидации.
Отчет Эксперта (User Uploaded): Тот самый файл, который загрузил Тарик.
Разделитель "ПРИЛОЖЕНИЯ" (Separator Page): Страница с крупным текстом "ANNEXES".
Список Приложений (Table of Contents): Авто-генерируемый список (1. Иск, 2. Контракт...).
Сами Приложения (Evidence):
Annex 1: Скан Иска (из Intake).
Annex 2: Скан Контракта.
Annex 3: Скриншоты WhatsApp (из Evidence Wall).
Annex 4: Таблица расчетов (Detail Sheet).
Результат: Один файл Submission_Bundle_1409.pdf.
4. СПЕЦИФИКА RTL (ARABIC SUPPORT)
Арабский язык (Right-to-Left) — это боль для генераторов отчетов.
Правила для разработчика:
Magic Characters: При вставке английских чисел/дат внутри арабского текста (напр. "Зарплата 500 OMR"), необходимо оборачивать их в невидимые символы Unicode: LRM (Left-to-Right Mark), чтобы Word не перевернул строку.
Шрифты: Шаблон должен использовать шрифты, поддерживающие арабский (напр. Simplified Arabic или Traditional Arabic), которые установлены на сервере.
5. МОДЕЛЬ ДАННЫХ (TEMPLATES & BUNDLES)
report_templates
id (UUID).
organization_id (FK).
name (String): "Трудовой спор (Стандарт)".
file_path (String): Путь к .docx исходнику.
context_keys (JSONB): Список переменных, которые ждет этот шаблон (для подсказки админу).
case_bundles
id (UUID).
case_id (FK).
final_pdf_path (String).
generated_at (Timestamp).
checksum (String): Хеш файла (для проверки неизменности).
6. API ENDPOINTS
POST /api/v1/reports/render_draft
Body: { case_id, template_id }.
Return: URL на скачивание .docx.
POST /api/v1/reports/assemble_bundle
Body: { case_id, report_pdf: (File), attachments_order: [doc_id_1, doc_id_2] }.
Action: Мержит файлы.
Return: URL на скачивание финального PDF.





📘 VOLUME 5: MEETING INTELLIGENCE & PRIVACY (REVISED)
1. ВВЕДЕНИЕ (OVERVIEW)
Этот модуль отвечает за подготовку к встречам и фиксацию их итогов.
Ключевое отличие от старой версии: Строгий контроль приватности голоса.
Транскрипт встречи проходит ту же процедуру "очистки", что и документы, перед отправкой в облако.
2. АРХИТЕКТУРА ПРИВАТНОСТИ (AUDIO PRIVACY PIPELINE)
Мы реализуем 5-ступенчатый конвейер, чтобы ни одна фамилия, произнесенная вслух, не ушла в Google.
Фрагмент кода
graph TD
    A[Audio File] -->|Local Whisper| B(Raw Transcript + Speakers)
    B -->|Local GLiNER/NER| C(Detected Entities)
    C -->|Local Masking| D[Anonymized Text]
    D -->|Cloud Gemini| E[AI Summarization & Extraction]
    E -->|Local Rehydration| F[Final Protocol & Checklist]


Детализация шагов:
Local ASR (Распознавание): Faster-Whisper (Large-v3) преобразует голос в текст с разбивкой по спикерам.
Output: Speaker A: My name is Ahmed.
Local NER (Поиск PII): Текстовая модель (GLiNER или Spacy) сканирует полученный текст.
Logic: Ищем имена, названия компаний, цифры (телефоны/ID) в потоке речи.
Masking (Маскировка): Замена на токены.
Output: Speaker A: My name is [PERSON_1].
Cloud AI (Анализ): Обезличенный текст отправляется в Gemini.
Task: "Собери факты, создай протокол".
Unmasking (Восстановление): В полученном JSON меняем [PERSON_1] обратно на Ahmed.
3. ФУНКЦИЯ: PRE-MEETING CHECKLIST (ГЕНЕРАТОР ПОВЕСТКИ)
Эксперт не должен идти на встречу с пустыми руками. Система готовит для него "Лист Допроса".
Вход: Документы Истца (Иск) + Документы Ответчика (Отзыв).
Процесс:
AI анализирует противоречия (Модуль 2).
Генерирует PDF-Чеклист для печати.
Структура Чек-листа (Output):
Блок А: Подтверждение Фактов (Agreed Facts)
[ ] Дата начала работы: 01.01.2019 (Подтверждено обеими сторонами?)
[ ] Должность: Инженер (Подтверждено?)
Блок Б: Предмет Спора (To Discuss)
[ ] Надбавка за Дукм: Истец утверждает 15%, Ответчик 10%. Вопрос: Есть ли приказ об изменении?
[ ] Овертаймы: Истец требует 300 OMR. Вопрос: Где табели за май 2023?
Блок В: Запрос Документов (Action Items)
[ ] Запросить банковскую выписку за 2022 год.
Результат: Эксперт распечатывает этот лист, на встрече ставит галочки ручкой, а потом может сфотографировать его и закинуть в систему как отчет.
4. СТРУКТУРА ХРАНЕНИЯ (FILE METADATA & ARTIFACTS)
Каждый загруженный файл (аудио) обрастает "спутниками". Мы не храним просто meeting.mp3. Мы храним Пакет Файла.
Объект MeetingFile в БД:
id: UUID
original_path: /data/cases/123/audio/meeting_01.mp3
Слой 1: Сырые данные (Hidden)
transcript_raw_json: Полный текст с таймкодами (хранится локально).
detected_pii_map: { "[PERSON_1]": "Ahmed", ... } (Ключи шифрования).
Слой 2: AI Аналитика (Artifacts)
analysis_summary: "Встреча прошла напряженно, спорили о бонусах."
extracted_facts: [{"fact": "Salary", "value": "500", "status": "Agreed"}]
sentiment_score: "Hostile/Neutral".
Слой 3: Пользовательские данные
user_notes: Заметки эксперта к этому файлу.
checklist_status: Ссылка на заполненный чек-лист (если есть).
5. ИНТЕРФЕЙС "SMART PLAYER" (UI)
Экран работы с аудио-протоколом:
Левая колонка: Плеер + Интерактивный текст (с подсвеченными маскированными данными, которые для юзера размаскированы).
Правая колонка (AI Assistant):
Вкладка "Facts": ИИ выводит список фактов, найденных в речи. Кнопки "Принять" / "Отклонить".
Вкладка "Checklist": Тот самый чек-лист. Эксперт может прямо во время прослушивания ставить галочки в интерфейсе: "Да, этот факт подтвердили на 10:15".





6. МОДЕЛЬ ДАННЫХ (DATABASE SCHEMA) — MODULE 5
Мы проектируем схему так, чтобы четко разделить "Сырые чувствительные данные" (хранятся локально/шифрованно) и "Обезличенные артефакты".
6.1. Таблица meetings (Журнал Встреч)
Хранит метаданные события.
id (UUID, PK): Уникальный ID встречи.
case_id (UUID, FK): Привязка к делу.
title (String): "Опрос свидетелей" / "Предварительная встреча".
meeting_date (Timestamp): Дата проведения.
status (Enum): SCHEDULED -> RECORDING -> PROCESSING_LOCAL -> WAITING_AI -> READY -> SIGNED.
duration_seconds (Integer).
audio_file_path (String): Локальный путь к зашифрованному файлу .enc.
6.2. Таблица meeting_transcripts (Стенограммы)
Здесь хранится результат работы Whisper и слои приватности.
meeting_id (UUID, FK, PK).
raw_segments (JSONB): Полный вывод Whisper с таймкодами и спикерами.
Структура: [{ "start": 12.5, "end": 15.0, "speaker": "SPEAKER_01", "text": "Меня зовут Ахмед." }]
masked_text (Text): Текст, где "Ахмед" заменен на [PERSON_1]. Именно это уходит в Cloud AI.
privacy_token_map (JSONB): Зашифрованное поле. Словарь для размаскировки.
Пример: { "[PERSON_1]": "Ahmed Al-Balushi", "[PHONE_1]": "9999-9999" }.
is_manually_edited (Boolean): Флаг, правил ли эксперт текст руками.
6.3. Таблица meeting_checklists (Чек-листы)
Хранит сгенерированные ИИ "Листы допроса".
id (UUID, PK).
meeting_id (UUID, FK).
source_docs (JSONB): Список ID документов (Иск, Отзыв), на основе которых создан чек-лист.
items (JSONB): Список вопросов и статусов.
Пример: [{ "id": 1, "question": "Дата найма 01.01.2020?", "status": "AGREED", "notes": "Подтвердили устно" }].
6.4. Таблица meeting_protocols (Финальные документы)
Результат саммаризации (то, что идет в PDF).
meeting_id (UUID, FK, PK).
summary_ar (Text): Юридическое саммари на арабском (с восстановленными именами).
action_items (JSONB): Список задач ("Предоставить выписку").
attendees_snapshot (JSONB): Кто реально присутствовал (для блока подписей).

7. API ENDPOINTS (SPECIFICATION) — MODULE 5
API разделено на зоны: Local Processing (тяжелые задачи) и Client Interaction (UI).
7.1. Генерация Чек-листа (Pre-Meeting)
POST /api/v1/meetings/generate_checklist
Описание: Анализирует документы дела и готовит вопросы для встречи.
Input: { case_id, doc_ids: [uuid, uuid] } (обычно Иск + Отзыв).
Process:
Берет тексты документов (уже обезличенные из Mod.2).
Шлет в Gemini: "Найди противоречия и составь вопросы".
Output: { checklist_id, items: [...] }.
7.2. Работа с Аудио (Processing Pipeline)
POST /api/v1/meetings/{id}/upload_audio
Input: Multipart File (mp3/m4a/wav).
Action:
Сохраняет файл на диск.
Запускает Celery Task process_meeting_audio.
Return: { status: "PROCESSING_LOCAL", task_id: "..." }.
Internal Task Logic (Celery):
Whisper -> Raw Text.
GLiNER -> Detected Entities.
Masking -> Masked Text + Token Map.
Save to DB.
7.3. Получение Результатов (Smart Player UI)
GET /api/v1/meetings/{id}/transcript
Описание: Возвращает данные для плеера. При отдаче на фронтенд автоматически делает Rehydration (подставляет реальные имена из Token Map), чтобы эксперт видел нормальный текст.
Output:
JSON
{
  "segments": [
    {"time": 10.5, "speaker": "Speaker A", "text": "Меня зовут Ахмед"} // На сервере было [PERSON_1]
  ],
  "speakers": {"Speaker A": "Истец", "Speaker B": "Адвокат"}
}


PATCH /api/v1/meetings/{id}/transcript
Описание: Эксперт правит ошибки распознавания или переименовывает спикеров.
Input: { renaming_map: {"Speaker A": "Адвокат"}, edited_segments: [...] }.
7.4. AI-Саммаризация (Cloud Step)
POST /api/v1/meetings/{id}/summarize
Описание: Отправляет маскированный текст в Gemini для создания протокола.
Input: { focus_points: ["Овертайм", "Бонус"] } (на чем сделать акцент).
Process:
Select masked_text from DB.
Call Gemini API ("Summarize this legal dialog").
Apply privacy_token_map to the result (Restore names).
Output: { summary_text: "Стороны согласились, что..." }.
7.5. Финализация
GET /api/v1/meetings/{id}/print_protocol_pdf
Action: Генерирует PDF с блоком для подписей (Signature Pad).
Output: Binary PDF File.


Принято. Извиняюсь, я увлекся "стандартным" финтехом и упустил твои прямые указания об упрощении.
Ты абсолютно прав: Тарик четко сказал "Нет" сложным интеграциям, QR-кодам банков и жестким блокировкам. Мы делаем простую систему учета, а не банковский терминал.
Исправляю ТОМ 6: FEES & FINANCE. Убираем segno, убираем сложные шлюзы. Оставляем только то, что просил клиент: простой PDF-инвойс и ручную галочку "Оплачено".
Сохрани этот исправленный вариант.

📘 VOLUME 6: FEES & FINANCE SPECIFICATION (CORRECTED)
1. ВВЕДЕНИЕ (OVERVIEW)
Этот модуль — Простой Финансовый Трекер.
Мы не делаем платежный шлюз. Мы не генерируем банковские QR-коды (OmanNet).
Мы просто даем эксперту инструмент, чтобы не забыть, кто и сколько ему должен, и сформировать красивую бумажку (PDF) для передачи в бухгалтерию компании-плательщика.
Принцип: "Digital Ledger" (Цифровая амбарная книга).
2. СТЕК ТЕХНОЛОГИЙ (TECH STACK)
Database: PostgreSQL (типы Decimal для денег).
PDF Generation: docxtpl (тот же движок шаблонов, что и для отчетов).
Изменение: Библиотеки для QR-кодов (segno) удалены.
Logic: Простой CRUD (Create, Read, Update, Delete) без сложных State Machines.
3. БИЗНЕС-ЛОГИКА (SIMPLIFIED FLOW)
3.1. Этап 1: Фиксация Долга (Fee Assessment)
Когда дело создается (или позже), эксперт видит поле "Гонорар".
AI-подсказка: Если в письме суда было "200 OMR", система подставляет это число.
Ручной ввод: Эксперт может в любой момент изменить сумму (например, если договорились о доплате).
Статус: PENDING (Ожидает) -> INVOICED (Выставлен счет).
3.2. Этап 2: Генерация Инвойса (Simple Invoice)
Эксперт нажимает "Сформировать счет".
Система берет простой шаблон Invoice.docx.
Вставляет:
Реквизиты эксперта (текстом: Bank Muscat, Account No...).
Сумму и Детали дела.
Генерирует PDF.
Никаких активных ссылок или QR-кодов для оплаты. Это просто документ для печати.
3.3. Этап 3: Ручная отметка оплаты (Manual Mark-as-Paid)
Процесс "Follow up" (как сказал Тарик):
Эксперт проверяет свой банковский счет через приложение банка.
Видит поступление.
Заходит в ExpertOS и нажимает кнопку "Mark as Paid".
(Опционально) Может загрузить скриншот транзакции для архива.
Статус меняется на PAID.
Плашка-предупреждение "Unpaid Case" исчезает.
3.4. Предупреждение (Warning System)
Логика: Если Status != PAID, то при попытке скачать финальный отчет система показывает желтый баннер:
"Внимание: Гонорар по этому делу еще не оплачен. Вы уверены, что хотите отправить отчет?"
Действие: Кнопка "Скачать все равно" (Download Anyway) активна. Мы не блокируем работу, просто напоминаем.
4. МОДЕЛЬ ДАННЫХ (DATABASE SCHEMA)
Предельно простая схема.
fees_ledger (Финансовый журнал)
id (UUID, PK).
case_id (UUID, FK, Unique): Одно дело = Один счет.
agreed_amount (Decimal 10,3): Сумма гонорара (200.000).
payer_name (String): Кто платит (обычно "Истец" или "Ответчик").
invoice_pdf_path (String): Ссылка на сгенерированный PDF счета.
payment_status (Enum): UNPAID, PAID.
payment_date (Date, Nullable): Когда нажали кнопку "Оплачено".
payment_proof_path (String, Nullable): Скриншот из банка (для истории).
5. API ENDPOINTS
Управление
GET /api/v1/finance/{case_id}
Return: { amount: 200, status: "UNPAID", invoice_url: "..." }.
POST /api/v1/finance/{case_id}/update_amount
Body: { amount: 250.000 }.
Action: Обновляет сумму долга.
Инвойс
POST /api/v1/finance/{case_id}/generate_invoice
Action: Создает PDF из шаблона.
Return: URL файла.
Оплата
POST /api/v1/finance/{case_id}/mark_paid
Body: { date: "2024-01-01", proof_file: (Optional) }.
Action: Переводит статус в PAID.




Принято. Давай систематизируем.
Ты абсолютно прав, мы идем по плану, чтобы ничего не упустить из требований Тарика.
📋 СПИСОК МОДУЛЕЙ "К РЕАЛИЗАЦИИ" (ЧТО ОСТАЛОСЬ)
Мы уже детально расписали Тома 1–6 (Foundation, Intake, Calc, Reports, Meetings, Finance).
Исходя из документов Тарика, нам нужно дописать:
ТОМ 7: BUSINESS INTELLIGENCE (ANALYTICS)
Суть: Внутренняя аналитика. Дашборды для Тарика (как владельца) и экспертов.
Зачем: Чтобы видеть KPI: "Сколько денег заработали?", "Кто тормозит с отчетами?", "Какой процент сбора денег?". Тарик прямо просил "Dashboard" и "Efficiency Metrics" (раздел 4.9 в его файле).

🚀 РАБОТАЕМ: ПИШЕМ ТОМ 7 (АНАЛИТИКА)
Я подготовил спецификацию для модуля аналитики. Он собирает данные из всех предыдущих модулей (Финансы, Дела, Сроки) и строит красивую картинку для бизнеса.
Сохрани этот блок как файл 07_ANALYTICS_SPEC.md.

📘 VOLUME 7: BUSINESS INTELLIGENCE & ANALYTICS
1. ВВЕДЕНИЕ (OVERVIEW)
Этот модуль — "Приборная панель" (Dashboard) бизнеса.
В отличие от Тома 5 (где мы генерируем отчеты для суда), здесь мы генерируем отчеты для Тарика.
Модуль агрегирует данные в реальном времени, чтобы ответить на вопрос: "Здоров ли мой бизнес?".
Принцип: "Data-Driven Firm". Управляем не интуицией, а цифрами.
2. СТЕК ТЕХНОЛОГИЙ (TECH STACK)
Backend: PostgreSQL (используем Materialized Views для тяжелых отчетов, чтобы не грузить основную БД).
Frontend Visualization: Recharts или Visx (React-библиотеки для графиков).
Scheduled Jobs: Celery Beat (для ночного пересчета статистики).
3. БИЗНЕС-ЛОГИКА (DASHBOARD TYPES)
3.1. Личный Дашборд Эксперта (My Performance)
То, что видит рядовой сотрудник при входе.
Виджет "Светофор Дедлайнов":
🔴 Critical (< 3 дней): 2 дела.
🟡 Warning (< 7 дней): 5 дел.
🟢 Safe: 10 дел.
Виджет "Мои Деньги":
"Выставлено счетов": 5,000 OMR.
"Оплачено": 2,000 OMR.
"Ожидается": 3,000 OMR.
Виджет "Задачи":
"Встреч на сегодня": 2.
"Черновиков на проверке": 1.
3.2. Дашборд Владельца Фирмы (Firm Overview)
То, что видит Тарик (Super Admin).
Финансовое Здоровье:
Revenue Growth: График выручки по месяцам (Line Chart).
Fee Recovery Rate: (Собрано / Назначено) %. Если ниже 80% — тревога.
Aging Report: Сколько денег зависло в статусе "Unpaid" дольше 60 дней.
Операционная Эффективность:
Case Turnaround Time: Среднее время жизни дела (от Загрузки до Закрытия). Цель: снизить с 30 до 10 дней.
Objection Rate: % дел, по которым пришли возражения. Показывает качество работы экспертов.
Нагрузка (Workload):
Bar Chart по сотрудникам: У кого 50 дел, а у кого 0. Помогает распределять новые заявки.
4. МОДЕЛЬ ДАННЫХ (DATABASE SCHEMA)
Мы не храним аналитику в "сырых" таблицах. Мы создаем Представления (Views) для быстрого чтения.
4.1. Materialized Views (Для кэширования)
analytics_expert_kpi (Обновляется раз в час)
expert_id (UUID).
active_cases_count (Int).
closed_cases_mtd (Int): Закрыто в этом месяце.
avg_resolution_days (Float): Ср. скорость закрытия.
total_fees_collected_ytd (Decimal): Денег принес с начала года.
analytics_financial_monthly (Обновляется раз в сутки)
month (Date): 2024-01-01.
total_invoiced (Decimal).
total_collected (Decimal).
outstanding_balance (Decimal).
4.2. Таблица audit_logs (Для безопасности и метрик)
id (UUID).
user_id (FK).
action (String): "DOWNLOAD_REPORT", "VIEW_CASE", "DELETE_DOC".
entity_id (UUID).
timestamp (Time).
Использование: Из этой таблицы мы считаем "Активность сотрудников".
5. API ENDPOINTS
Виджеты (Widgets)
GET /api/v1/analytics/my_stats
Return: JSON с цифрами для личного дашборда (Дедлайны, Задачи).
Optimization: Легкий запрос, выполняется < 50ms.
Графики (Charts)
GET /api/v1/analytics/firm/revenue?range=12m
Return: Массив [{ "month": "Jan", "value": 5000 }, ...].
GET /api/v1/analytics/firm/workload
Return: Распределение дел по сотрудникам.
Отчеты (Exports)
GET /api/v1/analytics/export/performance_xlsx
Action: Генерирует Excel-файл со статистикой всех сотрудников за квартал (для премирования).








Это мудрое решение. Сначала строим завод (пайплайн), потом завозим сырье (архивы). Если завалить "сырую" систему тысячами файлов, мы просто утонем в багах.
Сначала — Финальная Архитектура Базы Данных.
Я собрал воедино все таблицы из 7 томов. Это Полная Схема БД (Database Schema), которую мы отдадим разработчику. Она учитывает всё: мультитенантность, приватность, сложную математику и аналитику.
Сохрани это как 00_MASTER_DB_SCHEMA.md.

🏛️ FINAL MASTER DATABASE SCHEMA (EXPERTOS v1.0)
1. CORE & ACCESS (FOUNDATION)
Управление доступом и изоляция фирм.
SQL
-- Организации (Фирмы)
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}', -- { "increment_base": "GROSS", "eosb_rule": "FIXED_30" }
    created_at TIMESTAMP DEFAULT NOW()
);

-- Пользователи (Эксперты и Админы)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- 'SUPER_ADMIN', 'ORG_ADMIN', 'EXPERT'
    is_active BOOLEAN DEFAULT TRUE
);


2. CASE MANAGEMENT (INTAKE)
Карточки дел и участники.
SQL
-- Справочник судов (Master List)
CREATE TABLE master_courts (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(255),
    name_en VARCHAR(255),
    region VARCHAR(100) -- 'Muscat', 'Sohar'
);

-- Дела
CREATE TABLE cases (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    expert_id UUID REFERENCES users(id), -- Кто ведет дело
    
    -- Метаданные из Intake
    case_number VARCHAR(100), -- "1409/2024"
    court_id INT REFERENCES master_courts(id),
    status VARCHAR(50), -- 'DRAFT', 'ACTIVE', 'REVIEW', 'CLOSED'
    
    -- Даты для Аналитики
    assignment_date DATE, -- Дата письма
    deadline_date DATE,   -- Расчетный дедлайн
    closed_date DATE,     -- Фактическая сдача
    
    folder_path VARCHAR(500) -- Путь к файлам на диске
);

-- Стороны (Истцы/Ответчики)
CREATE TABLE parties (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    role VARCHAR(50), -- 'PLAINTIFF', 'DEFENDANT'
    name VARCHAR(255),
    nationality VARCHAR(50), -- 'OMANI', 'EXPAT' (Критично для пенсии!)
    representative VARCHAR(255) -- Адвокат
);


3. DOCUMENTS & PRIVACY
Файлы и маскировка данных.
SQL
-- Реестр документов
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    type VARCHAR(50), -- 'MANDATE', 'CLAIM', 'CONTRACT', 'EVIDENCE'
    
    -- Хранение
    file_path VARCHAR(500),
    original_filename VARCHAR(255),
    
    -- OCR и Приватность
    ocr_status VARCHAR(50), -- 'PENDING', 'DONE'
    privacy_token_map JSONB, -- Зашифровано: { "[PLAINTIFF_1]": "Ahmed" }
    extracted_text_masked TEXT -- Обезличенный текст для поиска
);


4. CALCULATION ENGINE (MATH)
Зарплаты, таймлайны и компараторы.
SQL
-- Компоненты зарплаты (History)
CREATE TABLE salary_components (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    name VARCHAR(100), -- 'Basic', 'Housing'
    amount DECIMAL(10, 3),
    is_gross_part BOOLEAN,
    effective_date DATE -- С какой даты действует
);

-- Временные отрезки (Time Slices для надбавок)
CREATE TABLE time_slices (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    start_date DATE,
    end_date DATE,
    rule_type VARCHAR(50), -- 'ALLOWANCE_CHANGE', 'GRADE_CHANGE'
    value JSONB -- { "rate": 0.15 }
);

-- Компараторы (Свидетели дискриминации)
CREATE TABLE comparators (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    name VARCHAR(255),
    hiring_date DATE,
    current_gross DECIMAL(10, 3),
    grade_level VARCHAR(50)
);

-- Результаты расчетов (Snapshot)
CREATE TABLE calculations (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    scenario_type VARCHAR(50), -- 'LEGAL_DEFAULT', 'PLAINTIFF_CLAIM'
    total_eosb DECIMAL(12, 3),
    total_leave DECIMAL(12, 3),
    details_json JSONB, -- Полный лог расчета
    created_at TIMESTAMP DEFAULT NOW()
);


5. MEETING INTELLIGENCE
Протоколы и чеклисты.
SQL
CREATE TABLE meetings (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    meeting_date DATE,
    audio_path VARCHAR(500),
    
    -- Результаты
    transcript_masked TEXT, -- Обезличенная стенограмма
    privacy_map JSONB, -- Ключи к именам
    summary_protocol TEXT, -- Финальный протокол (Арабский)
    checklist_json JSONB -- { "questions": [...], "answers": [...] }
);


6. FINANCE (FEES)
Простой учет денег.
SQL
CREATE TABLE fees_ledger (
    id UUID PRIMARY KEY,
    case_id UUID UNIQUE REFERENCES cases(id), -- Одно дело = Один счет
    
    agreed_amount DECIMAL(10, 3), -- 200.000
    payer_name VARCHAR(255),
    
    invoice_path VARCHAR(500), -- Ссылка на PDF
    payment_status VARCHAR(50) DEFAULT 'UNPAID', -- 'PAID', 'UNPAID'
    payment_date DATE,
    proof_path VARCHAR(500) -- Скрин оплаты
);


7. ANALYTICS (BI)
Кэшированные данные для дашбордов.
SQL
-- Материализованное представление (обновляется раз в час)
CREATE MATERIALIZED VIEW analytics_firm_stats AS
SELECT 
    organization_id,
    COUNT(*) FILTER (WHERE status != 'CLOSED') as active_cases,
    AVG(closed_date - assignment_date) as avg_turnaround_days,
    SUM(agreed_amount) FILTER (WHERE payment_status = 'PAID') as total_revenue
FROM cases
JOIN fees_ledger ON cases.id = fees_ledger.case_id
GROUP BY organization_id;







📂 АНАЛИЗ ЗАГРУЖЕННЫХ ФАЙЛОВ
1. نموذج تقرير أعمال الخبرة - Copy.docx (Главный Отчет)
Это "Священный Грааль". Все модули работают ради генерации этого файла.
Влияние на Архитектуру:
Meta-Data Table: В начале отчета есть таблица (Истец, Ответчик, Адвокат, Номер дела). Это подтверждает поля в нашей таблице cases.
Expert Footer: Внизу есть подпись (Имя, Номер лицензии, Дата).
Action: В таблицу users (Том 1) нужно добавить поля license_number и signature_image_path, чтобы система ставила их сама.
Структура: Отчет разбит на блоки "Первое", "Второе", "Третье".
Action: Наш RAG (Том 8) должен уметь генерировать текст именно в такой структуре: [Evidence Analysis] -> [Opinion].
2. نموذج التقرير التكميلي.docx (Дополнительный Отчет)
Тот самый отчет, который рождается, когда стороны жалуются.
Влияние на Архитектуру:
Этот файл доказывает необходимость статуса OBJECTION_RECEIVED в жизненном цикле дела.
Он ссылается на "Меморандум с возражениями" и "Протокол встречи".
Action: В Томе 5 (Встречи) мы должны добавить тип встречи "Обсуждение возражений", а результат этой встречи (саммари) должен автоматически залетать в этот шаблон.
3. حاسبة مستحقات نهاية الخدمة.xlsx (Калькулятор)
Это "Математическое Ядро" (Том 3).
Влияние на Архитектуру:
Я вижу разделение на "Нынешний закон" (Current Law) и "Предыдущий закон" (Previous Law).
Критично: Если стаж сотрудника пересекает дату изменения закона, система должна считать часть периода по старой формуле, а часть — по новой.
Action: В Том 3 (Calculation) нужно добавить логику "Split Period Calculation" (Расчет с разбивкой периодов).
4. نموذج طلب أمانة الخبرة.docx (Запрос Гонорара)
Подтверждает мой упрощенный подход к Тому 6 (Финансы).
Это просто письмо с реквизитами банка (Bank Muscat, NBO).
Action: В настройки организации (organizations) нужно добавить поле bank_details_template, чтобы оно подставлялось сюда автоматом.



Убираем RAG, убираем "умный архив", убираем обучение. Ты прав — это переусложнение для MVP.
Тарик не просил "робота-писателя", он просил автоматизацию рутины.
Возвращаемся к базе: ExpertOS — это фабрика документов.
Система работает как "Mail Merge" (Слияние документов), но на стероидах.
Вот Финальная, упрощенная логика, как мы это построим (без фантазий):

🏭 КАК РАБОТАЕТ СИСТЕМА (ОТ И ДО)
1. НАСТРОЙКА (Один раз)
Мы (разработчики) берем Word-файлы Тарика, которые ты загрузил (نموذج تقرير...docx), и расставляем в них Теги (Переменные):
Вместо "Имя истца" ставим {{ plaintiff_name }}.
Вместо пустой таблицы расчетов ставим {% for row in calc_table %}.
Вместо текста вывода ставим {{ expert_opinion_text }}.
Эти шаблоны лежат в Базе Данных.
2. ПОВСЕДНЕВНЫЙ ПРОЦЕСС (Flow)
Шаг 1: Загрузка (Input)
Эксперт кидает PDF из суда.
Система (OCR) вытаскивает: Номер дела, Имена, Даты.
Создается карточка дела. Все поля заполнены на 80% автоматом.
Шаг 2: Расчеты (Calculator)
Эксперт заходит в раздел "Калькулятор".
Вбивает даты и зарплату (как в Excel-файле Тарика).
Система считает итог: EOSB = 5,157 OMR.
Шаг 3: Написание вывода (Manual Input)
Эксперт заходит в раздел "Отчет".
Там есть текстовое поле (как в Word, только в браузере).
Эксперт пишет туда свои мысли: "Изучив документы, полагаю, что увольнение было...".
(Мы не генерируем это ИИ, эксперт пишет сам, как привык).
Шаг 4: Генерация (The Factory)
Эксперт жмет кнопку "Скачать отчет".
Система берет шаблон из БД.
Вставляет туда:
Имена и Номера (из Шага 1).
Таблицу расчетов (из Шага 2).
Текст мнения (из Шага 3).
Отдает готовый .docx или .pdf.

📦 ЧТО НА ВХОД И НА ВЫХОД
INPUT (Входящие):
Файлы: Письмо суда, Контракты, Банковские выписки.
Ручной ввод: Текст "Мнения эксперта" (Opinion).
Выбор: Галочка "Применить Ст. 40" или "Ст. 39".
OUTPUT (Исходящие):
Финальный отчет (PDF/Docx): Точная копия шаблона Тарика, но заполненная данными.
Инвойс: Для оплаты.
Протокол: Если была встреча.







