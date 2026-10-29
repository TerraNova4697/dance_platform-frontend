# on dance space — Design System & UI/UX Rules

> **Статус:** Обязательно к соблюдению для всех агентов и разработчиков платформы.  
> **Референс визуального стиля:** [on-dance.space](https://www.on-dance.space/)  
> **Глобальные стили:** [`src/index.css`](../src/index.css) | **Базовые компоненты:** [`src/App.css`](../src/App.css)

---

## 1. Философия и Концепция дизайна

Платформа **on dance space** использует эстетику **тактильного минимализма и софт-скевоморфизма (Tactile Neo-Brutalism / Soft Skeuomorphism)**:
1. **Теплый каменный холст (Warm Stone Canvas)**: отказ от холодных синеватых SaaS-фонов (`#F4F7FB`, `#FFFFFF`). Фон всей платформы — мягкий теплый цинковый оттенок `#EDECEC`.
2. **Тактильный 3D-объем**: карточки, кнопки и бейджи не являются плоскими («flat»). Они имеют физическую глубину за счет сочетания верхнего внутреннего полупрозрачного блика (`inset 0 1px 0 rgba(255,255,255,...)`) и нижней жесткой фаски (`inset 0 -3px 0 #...`), имитируя реальные физические плашки и кнопки.
3. **Капсульная геометрия (Pill Shapes)**: все интерактивные контролы (кнопки, чипы, табы, поисковые капсулы, плавающий хедер) имеют скругление `100px` (`--radius-pill`). Крупные контейнеры имеют радиус `24px–32px`.
4. **Контрастная триада цветов**:
   - Фон: теплый камень `#EDECEC` / светлый цинк `#F4F4F5`.
   - Акцент: пламенно-алый / вермильон **`#FD3A25`** (индикаторы, активные состояния, акцентные бейджи, свечение).
   - Контраст (Primary CTA): глубокий графит **`#272727`** и темный уголь **`#292C2E`**.

---

## 2. Строгие правила (DOs and DON'Ts)

### ❌ КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО:
* **Никаких синих/фиолетовых/индиго оттенков!** Никогда не использовать:
  `#4F46E5`, `#6366F1`, `#4338CA`, `#5B48E8`, `#EEF2FF`, `#E0E7FF`, `#F4F7FB`.
* **Никаких острых прямоугольных кнопок** с `border-radius: 4px–8px`. Кнопки должны быть капсулами `border-radius: 100px` или карточками со скруглением `16px–24px`.
* **Никакого хардкода случайных HEX-цветов** в локальных CSS-файлах или `style={{ ... }}`. Всегда используйте CSS-переменные из `src/index.css`.
* **Никаких плоских рамок `1px solid #ccc`** без тактильных теней на ключевых карточках.
* **Никаких сторонних или старых квадратных логотипов** (буква «D», синий квадрат и т.д.). Для брендинга используется только `<BrandLogo />`.

### ✅ ОБЯЗАТЕЛЬНО К СОБЛЮДЕНИЮ:
* **Использовать семантические токены**: `var(--bg-canvas)`, `var(--bg-surface)`, `var(--brand-accent)`, `var(--brand-dark)`, `var(--shadow-btn-dark)` и т.д.
* **Кнопки Primary действия**: цвет фона `#272727` (`var(--brand-dark)`), цвет текста `#FFFFFF`, скругление `100px`, тень `var(--shadow-btn-dark)`.
* **Акцентные элементы и фокусы**: акцент только `#FD3A25` (`var(--brand-accent)`). Фокус инпутов — `outline: none; border-color: var(--brand-accent); box-shadow: 0 0 0 3px var(--brand-accent-soft);`.
* **Заголовки секций и H1**: использовать класс `.metallic-heading` (металлический градиент `#61666A` $\to$ `#292C2E`) и плотный кернинг `letter-spacing: -0.03em`.
* **Секционные теги**: использовать плашки с левой алой точкой `#FD3A25` (класс `.section-tagline` или `.eyebrow-badge`).

---

## 3. Таблица Дизайн-Токенов (Design Tokens)

### 3.1. Палитра цветов (Colors)

| CSS Переменная | Значение HEX / RGB | Назначение |
| :--- | :--- | :--- |
| `--bg-canvas` | `#EDECEC` | Базовый фон страницы (`body`, главные контейнеры) |
| `--bg-surface` | `#FFFFFF` | Активные карточки, поля ввода в фокусе, модальные окна |
| `--bg-surface-tactile` | `#F4F4F5` | Тактильные контейнеры, закрытые панели, вторичные карточки |
| `--bg-surface-subtle` | `#F5F5F5` | Подложки под инпуты, неактивные чипы, теги |
| `--bg-glass` | `rgba(255, 255, 255, 0.55)` | Стеклянные парящие панели и Header (`backdrop-filter: blur(44px)`) |
| `--brand-accent` | **`#FD3A25`** | Главный алый акцент: активные табы, индикаторы, бейджи, фокус |
| `--brand-accent-gradient`| `linear-gradient(180deg, #EA2B16 0%, #FF3B26 100%)` | Заливка ключевых акцентных иконок и кнопок |
| `--brand-accent-soft` | `rgba(253, 58, 37, 0.10)` | Мягкая подсветка активных чипов, тегов и фокус-колец |
| `--brand-dark` | **`#272727`** | Основная кнопка (Primary Dark Pill), бейджи даты |
| `--brand-charcoal` | **`#292C2E`** | Заголовки, градиенты текста, темные иконки |
| `--text-primary` | `#09090B` | Основной высококонтрастный текст |
| `--text-secondary` | `#3F3F46` / `#52525B` | Подзаголовки, вторичный текст описаний |
| `--text-muted` | `#71717A` / `#A1A1AA` | Плейсхолдеры, таймкоды, неактивные подписи |
| `--border-default` | `#E4E4E7` | Базовые границы инпутов и разделителей |
| `--border-strong` | `#D4D4D8` | Ховер-границы, разделители карточек |
| `--status-success-bg` | `#EAF5ED` | Фон успешных статусов (оплачен, подтвержден) |
| `--status-success-text` | `#15803D` | Зеленый текст статуса успеха |

### 3.2. Тактильные тени (Tactile Shadows & Insets)

Всегда применяйте заготовленные CSS-переменные теней:

```css
/* Объемная карточка с верхним бликом и нижней фаской */
box-shadow: var(--shadow-card-tactile);
/*
  inset 0px 4px 0px 0px rgba(255, 255, 255, 0.6),
  inset 0px -8px 0px 0px rgba(0, 0, 0, 0.05),
  0px 3px 3px 0px rgba(0, 0, 0, 0.10),
  0px 7.77px 16px 0px rgba(0, 0, 0, 0.06);
*/

/* Графитовая primary кнопка (#272727) с 3D-фаской */
box-shadow: var(--shadow-btn-dark);
/*
  0px 2.77px 2.21px 0px rgba(0, 0, 0, 0.12),
  0px 6.65px 5.32px 0px rgba(0, 0, 0, 0.12),
  0px 12.52px 10.02px 0px rgba(0, 0, 0, 0.13),
  0px 22.34px 17.87px 0px rgba(0, 0, 0, 0.14),
  inset 0px 1px 0px 0px rgba(255, 255, 255, 0.3),
  inset 0px -3px 0px 0px #080808;
*/

/* Тактильные светлые бейджи, кнопки пагинации, теги */
box-shadow: var(--shadow-badge-tactile);

/* Свечение алых акцентных иконок и бейджей */
box-shadow: var(--shadow-accent-glow);

/* Парящий стеклянный Header */
box-shadow: var(--shadow-glass-header);
```

### 3.3. Шкала скруглений (Border Radius)

```css
--radius-pill: 100px; /* Кнопки, переключатели табов, поисковые капсулы, шапка */
--radius-xl:   32px;  /* Hero-баннеры, главная карточка ближайшего мероприятия, контейнеры страниц */
--radius-lg:   24px;  /* Карточки мероприятий, тренеров, модальные окна, форма авторизации */
--radius-md:   16px;  /* Иконки-контейнеры, внутренние виджеты, строки расписания */
--radius-sm:   10px;  /* Инпуты, селекты, бейджи */
```

---

## 4. Паттерны верстки компонентов

### 4.1. Кнопки (Buttons)

```html
<!-- Primary Dark Pill Button -->
<button class="primary-button">
  Зарегистрироваться
</button>

<!-- Accent Red Pill Button (для ключевых конверсионных триггеров) -->
<button class="accent-button">
  Купить билет
</button>

<!-- Secondary Light Tactile Button -->
<button class="secondary-button">
  Подробнее
</button>
```

```css
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  font-family: var(--font-display);
  font-size: 0.9375rem;
  font-weight: 600;
  color: #ffffff;
  background: var(--brand-dark);
  border: 1px solid #1f1f1f;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-btn-dark);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.primary-button:hover {
  transform: translateY(-1px);
  background: #1f1f1f;
}

.primary-button:active {
  transform: translateY(1px);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}
```

### 4.2. Секционные теги с алой точкой (Section Eyebrow)

```html
<div class="section-tagline">
  <span class="tagline-dot"></span>
  <span>Каталог мероприятий</span>
</div>
```

```css
.section-tagline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background: var(--bg-surface-tactile);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-badge-tactile);
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--brand-charcoal);
}

.tagline-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-accent);
  box-shadow: 0 0 6px rgba(253, 58, 37, 0.6);
}
```

### 4.3. Металлический заголовок (Metallic Heading)

```html
<h1 class="metallic-heading">Все мероприятия</h1>
```

```css
.metallic-heading {
  font-family: var(--font-display);
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  background: linear-gradient(93deg, #61666A 0%, #292C2E 36%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### 4.4. Тактильная карточка (Tactile Card)

```css
.tactile-card {
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card-tactile);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tactile-card:hover {
  transform: translateY(-2px);
}
```

### 4.5. Поля ввода (Inputs & Controls)

```css
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  color: var(--text-primary);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-input:focus {
  border-color: var(--brand-accent);
  box-shadow: 0 0 0 3px var(--brand-accent-soft);
}
```

### 4.6. Фирменный знак (Logo)

Во всех хедерах, страницах авторизации и модальных окнах используйте компонент:
```tsx
import { BrandLogo } from '@/components/BrandLogo';

// В хедере:
<BrandLogo size={28} showText={true} />

// В карточках авторизации:
<BrandLogo size={36} showText={true} />
```

---

## 5. Контрольный чек-лист перед сдачей UI-задачи

Перед завершением любой задачи по фронтенду агент **ОБЯЗАН** проверить:

1. [ ] В созданных или измененных стилях **нет ни одного цвета из старой индиго-палитры** (`#4F46E5`, `#6366F1`, `#5B48E8` и т.д.).
2. [ ] Все фоновые панели и карточки опираются на `--bg-canvas` (`#EDECEC`) и `--bg-surface` (`#FFFFFF`).
3. [ ] Кнопки имеют форму капсулы (`100px`) и используют `--shadow-btn-dark` или `--shadow-badge-tactile`.
4. [ ] Акцентные индикаторы и выделенные табы используют пламенно-алый `#FD3A25`.
5. [ ] Пройдены проверки:
   ```bash
   npm run lint
   npm run build
   ```

