

# 💰 EXPERTOS: FINANCE & ANALYTICS SPECIFICATION (v1.0)

## 1. ЦЕЛЬ
ДАШ
Внедрить модуль управления гонорарами, генерацию писем об оплате по шаблонам Тарика и дашборд руководителя для контроля эффективности фирмы.

## 2. МОДУЛЬ: ФИНАНСЫ (FEE MANAGEMENT)

### A. Генерация запроса на гонорар (Fee Request)

* **Шаблон:** Используется оригинальный файл `نموذج طلب أمانة الخبرة.docx`.
* **Данные:** - Сумма гонорара извлекается из письма о назначении (Court Assignment Letter).
* Банковские реквизиты (Имя банка, счет) берутся из настроек организации (`organizations`).
* **Даты:** Обязательная конвертация текущей даты в **Хиджру** и Григорианский формат.


* **Логика:** Система предлагает сумму, эксперт может её скорректировать перед печатью.

### B. Контроль оплаты

* **Статусы:** `UNPAID` (по умолчанию), `PAID`.
* **Мягкая блокировка:** При попытке скачать финальный отчет для дела со статусом `UNPAID`, система показывает **Warning-модалку**: «Гонорар не оплачен. Вы уверены, что хотите продолжить?».

## 3. МОДУЛЬ: АНАЛИТИКА (BI DASHBOARD)

* **Фоновый процесс:** Обновление статистики раз в час через кэширующую таблицу `analytics_cache`.
* **Виджеты (ElevenLabs Style):**
* **Revenue MTD:** Выручка за текущий месяц (только оплаченные счета).
* **Avg Turnaround:** Среднее время от получения письма до закрытия дела.
* **Open Cases:** Счетчик активных дел.



## 4. ПРОТОКОЛ ПРИЕМКИ (QA)

* **Тест 1 (Инвойс):** В сгенерированном PDF в таблице внизу должны стоять реальные реквизиты из БД (например, Bank Muscat), а не пустые строки.
* **Тест 2 (Предупреждение):** Модальное окно появляется только для неоплаченных дел и исчезает после нажатия кнопки "Mark as Paid".

---

### 🚀 MASTER PROMPT ДЛЯ CURSOR (Stage 5 - No Deploy)

Скопируй это в чат Cursor:

> **START MISSION 5: FINANCE & ANALYTICS (BUSINESS LAYER).**
> **Goal:** Implement fee management, automated payment requests in Arabic, and a KPI dashboard.
> **1. DATABASE UPDATE:**
> * Create `fee_requests` table and add bank detail columns to `organizations` as per `.specs/07_FINANCE_ANALYTICS.md`.
> * Setup `analytics_cache` for fast dashboard rendering.
> 
> 
> **2. FEE REQUEST ENGINE:**
> * Use `docxtpl` with Tariq's template `backend/templates/source/نموذج طلب أمانة الخبرة.docx`.
> * **CRITICAL:** Implement Hijri date conversion for the letter header using `python-hijri-calendar`.
> * Map variables: `{{ court_name }}`, `{{ case_number }}`, and Bank Table fields.
> 
> 
> **3. BUSINESS LOGIC:**
> * Implement "Mark as Paid" toggle in the Case View.
> * Create a **Warning UI Component** (Radix UI / Shadcn) that triggers when downloading a report for an unpaid case.
> 
> 
> **4. DASHBOARD (Visual Design):**
> * Use **ElevenLabs Aesthetic**: `bg-zinc-50` global background, floating white cards with `rounded-3xl`.
> * Render 3 main charts: Revenue (Recharts), Average Turnaround Time, and Active Cases count.
> 
> 
> **5. VERIFICATION:**
> * Run `pytest` for the fee generation logic.
> * Confirm that the generated PDF contains the correct Bank Account Number from the DB.
> 
> 
> **Note:** Skip Docker/Production deployment for now. Focus strictly on local implementation of these features.

---