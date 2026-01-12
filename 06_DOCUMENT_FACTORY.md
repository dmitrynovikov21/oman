Это важнейший этап, который превращает **ExpertOS** из аналитического инструмента в полноценный «печатный станок» для эксперта. Основная сложность здесь — арабский язык (RTL) и сохранение официального стиля Тарика.

Назови новый файл спецификации: `.specs/06_DOCUMENT_FACTORY.md`

---

# 📑 EXPERTOS: DOCUMENT FACTORY SPECIFICATION (v1.0)

## 1. ЦЕЛЬ

Автоматизация генерации официальных юридических документов на арабском языке с использованием оригинальных шаблонов Тарика в формате `.docx` и их конвертация в `PDF` без потери форматирования.

## 2. ТЕХНИЧЕСКИЙ СТЕК

* **Templating:** Библиотека `docxtpl` (Python) для работы с переменными внутри Word.
* **PDF Conversion:** `LibreOffice` (через CLI `soffice`) — это единственный надежный способ сохранить арабские лигатуры и RTL-верстку при конвертации из DOCX в PDF в Linux-среде.
* **Fonts:** Использование системных шрифтов Омана (традиционный арабский), которые должны быть установлены в Docker-контейнере.

## 3. ПРАВИЛА РАЗМЕТКИ ШАБЛОНОВ (TEMPLATING)

Агент должен разметить файлы в папке `backend/tests/fixtures/tariq_files/` следующими тегами:

| Исходный текст в шаблоне | Тег для замены (`docxtpl`) | Описание |
| --- | --- | --- |
| **المدعي/ 00000** | `المدعي/ {{ plaintiff_name }}` | ФИО истца из таблицы `parties`. |
| **الدعوى رقم: ,,** | `الدعوى رقم: {{ case_number }}` | Номер дела из таблицы `cases`. |
| **Таблица расчетов** | `{% tr for item in salary_table %}` | Динамические строки для расчетов. |

## 4. ПРОТОКОЛ ТЕСТИРОВАНИЯ (HARD-CORE QA)

Агент не может закрыть миссию без прохождения трех «красных» тестов на реальных файлах:

### 🔴 Тест 1: Visual Regression (Длинные строки)

* **Вход:** Шаблон основного отчета.
* **Данные:** `plaintiff_name` = "شركة عمان لتطوير الهياكل الأساسية والخدمات الفنية واللوجستية" (сверхдлинное название).
* **Успех:** Текст автоматически перенесся на новую строку, логотип и границы таблицы не сместились.

### 🔴 Тест 2: Table Injection (Математическая точность)

* **Вход:** Данные из Excel Тарика (EOSB = 5157.917).
* **Успех:** Сгенерированный PDF содержит таблицу с данными, идентичными Excel, и итоговая сумма совпадает до 0.001 OMR.

### 🔴 Тест 3: Arabic Font Integrity

* **Вход:** Текст "بناءً على ما سبق".
* **Успех:** В PDF буквы соединены правильно (лигатуры), направление чтения — справа налево (RTL).

---

### 🚀 MASTER PROMPT ДЛЯ CURSOR (Copy & Paste)

Вставь это в чат Cursor, чтобы запустить миссию:

> **START MISSION 4: DOCUMENT FACTORY (REAL DATA EDITION).**
> **Goal:** Automate Arabic PDF generation using Tariq's original `.docx` templates.
> **1. SETUP FIXTURES:**
> * Locate Tariq's files in `backend/tests/fixtures/tariq_files/`:
> * `report_template.docx` (Main Report)
> * `invite_template.docx` (Meeting Invite)
> 
> 
> 
> 
> **2. TEMPLATING ENGINE:**
> * Use `docxtpl` to replace placeholders like `{{ plaintiff_name }}` and `{{ case_number }}`.
> * Implement dynamic table logic: `{% tr for item in salary_table %}` for EOSB breakdowns.
> 
> 
> **3. PDF CONVERSION:**
> * Implement a conversion service using `LibreOffice` (headless mode) to ensure perfect Arabic RTL rendering.
> * **CRITICAL:** Do not use `FPDF` or `ReportLab` as they often break Arabic ligatures. Use `soffice --headless --convert-to pdf`.
> 
> 
> **4. MANDATORY REAL-FILE TESTING:**
> * Create `backend/tests/test_generate_tariq_report.py`.
> * **TEST CASE:** Use Case `1409/2024` and EOSB `5157.917` from the Excel file.
> * **QA CHECK:** Verify that the generated PDF looks 1:1 like the template.
> 
> 
> **5. UI INTEGRATION:**
> * Add a "Generate Report" button to the Case page in the Dashboard (ElevenLabs style: Zinc-50, white card, subtle shadow).
> 
> 
> **Run the conversion test and attach a screenshot of the generated Arabic PDF to your report.**

---

### Почему это сработает:

1. **LibreOffice в связке с docxtpl:** Это стандарт индустрии для сложных документов. Мы сначала готовим идеальный Word-файл со всеми шрифтами Тарика, а потом «фотографируем» его в PDF.
2. **Защита от «развала» верстки:** Тест с длинным именем принудительно заставит ИИ проверить поведение таблиц и полей.

**Хочешь, чтобы я подготовил список всех 15 переменных (tags), которые нужно расставить в главном шаблоне Тарика, чтобы он сразу заполнил всё — от номера СР до вилаята суда?**