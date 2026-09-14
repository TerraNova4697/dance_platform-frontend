# Задача

Реализовать **главный экран авторизованного танцора** для веб-приложения танцевальной платформы.

Платформа предназначена для:

* поиска танцевальных Ивентов;
* регистрации на турниры и мастер-классы;
* покупки билетов;
* хранения QR-билетов;
* записи на тренировки к тренерам;
* просмотра личного расписания.

Frontend:

```text
React
TypeScript
TanStack
```

Интерфейс должен быть:

* минималистичным;
* современным;
* легким визуально;
* адаптивным;
* mobile-first;
* без визуальной перегруженности.

Не использовать Frappe UI на frontend.

---

# 1. Цель экрана

После успешной авторизации пользователь с ролью `Athlete` должен попадать на:

```text
/
```

или:

```text
/dashboard
```

Главный экран должен отвечать на три основных вопроса:

1. Что у пользователя ближайшее?
2. На какие Ивенты и тренировки он уже зарегистрирован?
3. Какие новые Ивенты и тренировки доступны?

Приоритет информации:

```text
Личное расписание
        ↓
Предстоящие регистрации
        ↓
Тренировки
        ↓
Поиск новых Ивентов
```

---

# 2. Общий layout

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Header                                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Greeting                                                    │
│                                                             │
│ Next Activity                                               │
│                                                             │
│ Schedule                                                    │
│                                                             │
│ My Events                                                   │
│                                                             │
│ My Trainings                                                │
│                                                             │
│ Upcoming Events                                             │
│                                                             │
│ Nearby Events / Trainers CTA                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Максимальная ширина основного контента:

```text
1200–1400px
```

Контент должен быть центрирован.

На больших экранах использовать свободное пространство и grid.

На мобильных все блоки располагаются вертикально.

---

# 3. Header

Создать общий верхний navigation bar.

Desktop:

```text
[LOGO]

Главная
Ивенты
Тренеры
Мои Ивенты
Календарь

                    [Notifications] [Avatar]
```

Активный пункт:

```text
Главная
```

должен быть визуально выделен.

Header должен быть sticky.

---

# 4. Mobile navigation

На мобильных основной navigation вынести вниз.

Bottom navigation:

```text
Главная
Ивенты
Календарь
Билеты
Профиль
```

Использовать иконку + короткую подпись.

Активный пункт:

```text
Главная
```

Mobile bottom navigation должна быть fixed.

Контент страницы должен иметь нижний padding, чтобы navigation не перекрывала элементы.

---

# 5. Greeting

В начале страницы показать:

```text
Добрый день, {firstName} 👋
```

или:

```text
Доброе утро
Добрый день
Добрый вечер
```

в зависимости от времени.

Не делать большой marketing hero.

Блок должен быть компактным.

Пример:

```text
Добрый день, Никита 👋

Вот что у вас запланировано.
```

---

# 6. Next Activity

Самый заметный блок страницы.

Необходимо определить ближайшую будущую активность пользователя среди:

```text
Event Registration
Training Booking
Master Class Registration
```

Показать только одну — ближайшую.

## Event

Пример:

```text
Следующий Ивент

Astana Dance Cup
20 сентября · 10:00
Astana Arena

Hip-Hop
Solo / Beginner

[Подробнее] [Открыть билет]
```

## Training

Пример:

```text
Следующая тренировка

Hip-Hop Individual

Сегодня · 18:00–19:00

Иван Петров
Dance Studio One

[Подробнее]
```

## Нет активностей

Если ничего нет:

```text
У вас пока нет предстоящих мероприятий

Найдите турнир, мастер-класс
или запишитесь на тренировку.

[Найти Ивент]
[Найти тренера]
```

---

# 7. Schedule

Добавить блок:

```text
Мое расписание
```

Он объединяет:

* турниры;
* мастер-классы;
* тренировки.

Показывать ближайшие 3–5 записей.

Пример:

```text
Сегодня

18:00
Индивидуальная тренировка
Иван Петров


20 сентября

10:00
Astana Dance Cup
Solo / Beginner


22 сентября

19:30
Group Hip-Hop
Dance Studio One
```

Для каждой записи показать:

```text
date
time
type
title
secondary info
```

Тип визуально обозначить небольшой badge:

```text
Турнир
Мастер-класс
Тренировка
```

В header блока:

```text
Мое расписание                    Все →
```

`Все` ведет на:

```text
/calendar
```

---

# 8. My Events

Блок:

```text
Мои Ивенты
```

Показывать максимум 2–3 ближайших Ивента.

Использовать горизонтальный grid на desktop.

Пример карточки:

```text
┌───────────────────────────────┐
│ [Cover]                       │
│                               │
│ Astana Dance Cup              │
│                               │
│ 20 сентября                   │
│ Astana Arena                  │
│                               │
│ Hip-Hop                       │
│                               │
│ Solo / Beginner               │
│ Solo / Open                   │
│                               │
│ ✓ Регистрация подтверждена    │
│                               │
│ [Подробнее]      [Билет]      │
└───────────────────────────────┘
```

Карточка должна содержать:

```text
cover
title
date
venue
direction
entries
registrationStatus
```

Не показывать финансовую информацию без необходимости.

---

# 9. My Trainings

Блок:

```text
Мои тренировки
```

Показывать 1–3 ближайшие тренировки.

Карточка:

```text
Hip-Hop Individual

Сегодня
18:00–19:00

Иван Петров

Dance Studio One

[Подробнее] [Перенести]
```

Показывать:

```text
training title
trainer
date
time
venue
booking status
```

Не размещать кнопку:

```text
Отменить
```

непосредственно на Dashboard.

Она должна находиться на detail page записи.

---

# 10. Upcoming Events

После персонального контента показать:

```text
Предстоящие Ивенты
```

Это discovery-блок.

Добавить быстрые фильтры:

```text
Сегодня
Эта неделя
Турниры
Мастер-классы
```

Фильтры должны выглядеть как chips.

---

# 11. Event Card

Каждая карточка нового Ивента должна содержать:

```text
cover image
event type
title
date
city
dance direction
host name
minimum price
currency
```

Пример:

```text
┌─────────────────────────────┐
│ [IMAGE]                     │
│                             │
│ Турнир                      │
│                             │
│ Kazakhstan Dance Open       │
│                             │
│ 25 сентября                 │
│ Алматы                      │
│                             │
│ Hip-Hop                     │
│                             │
│ от 10 000 ₸                 │
│                             │
│ Dance Federation KZ         │
└─────────────────────────────┘
```

Вся карточка clickable.

Переход:

```text
/events/:eventId
```

---

# 12. Event grid

Desktop:

```text
3 карточки в ряд
```

Tablet:

```text
2 карточки
```

Mobile:

```text
1 карточка
```

Показать максимум:

```text
6 events
```

На мобильном можно уменьшить до:

```text
3–4
```

В конце блока:

```text
[Посмотреть все Ивенты]
```

Переход:

```text
/events
```

---

# 13. Nearby Events

Не размещать большую интерактивную карту непосредственно на Dashboard.

Добавить компактную карточку:

```text
Ивенты рядом

[Map preview]

12 предстоящих Ивентов
в вашем городе

[Открыть карту]
```

Карта может быть placeholder/mock на первом этапе.

Переход:

```text
/events/map
```

---

# 14. Trainers CTA

Рядом с картой на desktop добавить блок:

```text
Тренировки

Найдите тренера и выберите
удобное время для тренировки.

[Найти тренера]
```

Переход:

```text
/trainers
```

Desktop:

```text
┌──────────────────────┬──────────────────────┐
│ Events nearby        │ Find trainer         │
└──────────────────────┴──────────────────────┘
```

Mobile:

```text
Events nearby

Find trainer
```

один под другим.

---

# 15. Notifications

Dashboard должен поддерживать important notification banner.

Например:

```text
⚠ Astana Dance Cup изменил расписание

Ваше выступление:
15:30 → 16:10

[Посмотреть]
```

Другой пример:

```text
Тренировка отменена

16 сентября · 18:00

[Выбрать другое время]
```

Показывать только важные operational notifications.

Не использовать этот блок для рекламы.

---

# 16. Empty states

Обязательно реализовать корректные empty states.

## Нет Ивентов

```text
У вас пока нет Ивентов

Найдите ближайшее мероприятие
и зарегистрируйтесь.

[Найти Ивент]
```

## Нет тренировок

```text
Нет предстоящих тренировок

Найдите тренера и выберите
удобное время.

[Найти тренера]
```

## Нет расписания

```text
Расписание пока пустое
```

---

# 17. Loading states

Не показывать пустую страницу во время загрузки.

Использовать skeleton loading.

Skeleton должен существовать для:

* Next Activity;
* Schedule;
* Event Cards;
* Training Cards.

Не использовать глобальный fullscreen spinner для всего Dashboard.

---

# 18. Error states

Если один endpoint не отвечает, остальные блоки страницы должны продолжить работать.

Например:

```text
Не удалось загрузить ближайшие Ивенты.

[Повторить]
```

Не падать всей страницей из-за ошибки одного widget.

---

# 19. Responsive requirements

Breakpoints ориентировочно:

```text
mobile:
< 768px

tablet:
768–1024px

desktop:
> 1024px
```

Не привязываться жестко к этим значениям, если существующий проект использует другие breakpoints.

---

# 20. Design

Использовать существующую дизайн-систему проекта, если она есть.

Если ее пока нет:

* белый/нейтральный background;
* мягкие границы;
* небольшие border radius;
* умеренные тени;
* четкая typography hierarchy;
* один primary accent color;
* нейтральные secondary colors.

Не использовать:

* тяжелые gradients;
* glassmorphism;
* чрезмерные shadows;
* огромные hero banners;
* слишком много цветов;
* анимации ради анимаций.

---

# 21. Component architecture

Не писать весь Dashboard одним компонентом.

Предлагаемая структура:

```text
pages/
└── dashboard/
    ├── AthleteDashboard.tsx
    └── components/
        ├── DashboardHeader.tsx
        ├── GreetingSection.tsx
        ├── NextActivityCard.tsx
        ├── SchedulePreview.tsx
        ├── MyEventsSection.tsx
        ├── MyEventCard.tsx
        ├── MyTrainingsSection.tsx
        ├── TrainingCard.tsx
        ├── UpcomingEventsSection.tsx
        ├── EventCard.tsx
        ├── NearbyEventsCard.tsx
        ├── FindTrainerCard.tsx
        ├── ImportantNotification.tsx
        ├── EmptyState.tsx
        └── DashboardSkeleton.tsx
```

Не обязательно следовать названиям буквально, если архитектура существующего проекта отличается.

---

# 22. TanStack Query

Все server state получать через React Query.

Не писать ручной:

```ts
useEffect(() => {
  fetch(...)
})
```

для обычной загрузки API данных.

Предпочтительно:

```text
useQuery
```

для каждого независимого блока.

Например:

```text
profileQuery
nextActivityQuery
scheduleQuery
myEventsQuery
myTrainingsQuery
upcomingEventsQuery
notificationsQuery
```

Независимые запросы должны выполняться параллельно.

---

# 23. Предполагаемые API данные

Использовать backend API из apiContract.json

Не хардкодить mock data непосредственно внутри JSX.

Например:

```ts
interface AthleteDashboardProfile {
  id: string;
  firstName: string;
  avatarUrl?: string;
  city?: string;
}
```

---

# 24. Activity model

Использовать унифицированную модель:

```ts
type ActivityType =
  | "tournament"
  | "master_class"
  | "training";
```

Пример:

```ts
interface DashboardActivity {
  id: string;
  type: ActivityType;

  title: string;

  startAt: string;
  endAt?: string;

  venueName?: string;

  status: string;

  ticketId?: string;
}
```

---

# 25. Event model

```ts
interface EventPreview {
  id: string;

  type:
    | "tournament"
    | "master_class";

  title: string;

  coverUrl?: string;

  startAt: string;

  city: string;

  venueName?: string;

  direction?: string;

  hostName: string;

  minimumPrice?: number;

  currency:
    | "KZT"
    | "RUB"
    | "USD"
    | "EUR";
}
```

---

# 26. Registered Event model

```ts
interface RegisteredEventPreview
  extends EventPreview {

  registrationStatus:
    | "pending_payment"
    | "confirmed"
    | "cancelled"
    | "transferred";

  entries: {
    id: string;
    label: string;
  }[];

  ticketId?: string;
}
```

---

# 27. Training model

```ts
interface TrainingBookingPreview {
  id: string;

  title: string;

  trainerId: string;
  trainerName: string;

  trainerAvatarUrl?: string;

  startAt: string;
  endAt: string;

  venueName?: string;

  status:
    | "booked"
    | "rescheduled"
    | "cancelled"
    | "completed";
}
```

---

# 28. Notification model

```ts
interface ImportantNotification {
  id: string;

  type:
    | "event_changed"
    | "event_cancelled"
    | "training_changed"
    | "training_cancelled";

  title: string;

  description: string;

  targetUrl?: string;

  createdAt: string;
}
```

---

# 29. Proposed API layer

Не привязывать UI напрямую к конкретным Frappe endpoint.

Создать abstraction:

```text
services/
    dashboard.ts
```

Например:

```ts
getDashboardProfile()

getNextActivity()

getUpcomingSchedule()

getMyEvents()

getMyTrainings()

getUpcomingEvents()

getImportantNotifications()
```

В дальнейшем implementation можно заменить на Frappe REST API без изменения компонентов.

---

# 30. Navigation

Поддержать переходы:

```text
/events

/events/:eventId

/events/map

/my-events

/calendar

/trainers

/trainers/:trainerId

/trainings/:bookingId

/tickets/:ticketId

/profile
```

Использовать существующий router проекта.

Если проект уже использует TanStack Router — использовать его.

Не добавлять второй router.

---

# 31. Ticket action

Если у зарегистрированного Ивента имеется:

```text
ticketId
```

показать:

```text
Открыть билет
```

Переход:

```text
/tickets/:ticketId
```

QR непосредственно внутри Dashboard не показывать.

---

# 32. Dates

Все backend даты считать ISO datetime.

Например:

```text
2026-09-20T10:00:00+05:00
```

Форматировать на UI локализованно:

```text
20 сентября
10:00
```

Для текущего дня:

```text
Сегодня
```

Для следующего:

```text
Завтра
```

Не хранить форматированные даты в state.

---

# 33. Currency

Форматировать через:

```ts
Intl.NumberFormat
```

Пример:

```text
10 000 ₸
$50
€25
```

Не делать ручную конкатенацию currency symbol по всему UI.

Создать общий formatter.

---

# 34. Accessibility

Минимальные требования:

* interactive элементы доступны с keyboard;
* buttons являются `<button>`;
* links являются `<a>` / router Link;
* изображения имеют `alt`;
* достаточный contrast;
* icon-only buttons имеют `aria-label`;
* focus state нельзя удалять полностью.

---

# 35. Что НЕ реализовывать

Не добавлять на Dashboard:

* рейтинги;
* отзывы;
* комментарии;
* друзей;
* социальную ленту;
* рекомендации на основе AI;
* избранное;
* популярные Ивенты;
* достижения;
* leaderboard;
* рекламу;
* новости;
* маркетинговые баннеры.

Этого нет в MVP.

---

# 36. Не реализовывать backend

В рамках этой задачи:

**не создавать Frappe DocType и backend API**, если они еще не существуют.

Frontend должен иметь clean service layer.

Если API отсутствует:

* создать mocks;
* typed interfaces;
* query hooks.

Это должно позволить позже заменить mock implementation настоящим API.

---

# 37. Demo data

Для разработки можно использовать mock пользователя:

```text
Никита
Астана
```

Предстоящие активности:

```text
Сегодня 18:00
Hip-Hop Individual
Trainer: Иван Петров
```

```text
20 сентября 10:00
Astana Dance Cup
Solo / Beginner
```

```text
22 сентября 19:30
Group Hip-Hop
```

Upcoming Events:

```text
Kazakhstan Dance Open
Almaty
25 сентября
Hip-Hop
от 10 000 KZT
```

```text
Autumn Dance Battle
Astana
3 октября
Breaking
от 8 000 KZT
```

Mock data должны находиться отдельно:

```text
mocks/
```

а не непосредственно в компонентах.

---

# 38. Код

Требования:

* TypeScript strict;
* избегать `any`;
* reusable components;
* небольшие компоненты;
* понятные названия;
* отсутствует duplicated formatting logic;
* отсутствуют hardcoded URLs внутри UI компонентов;
* API logic не находится внутри presentation components;
* не создавать глобальный state без необходимости.

---

# 39. Рекомендуемая структура

```text
src/
├── pages/
│   └── dashboard/
│       ├── AthleteDashboard.tsx
│       └── components/
│
├── features/
│   ├── events/
│   ├── trainings/
│   ├── tickets/
│   └── dashboard/
│
├── services/
│   └── dashboard.ts
│
├── hooks/
│   └── dashboard/
│
├── types/
│   └── dashboard.ts
│
├── mocks/
│   └── dashboard.ts
│
└── utils/
    ├── date.ts
    └── currency.ts
```

Адаптировать под существующую структуру проекта, если она уже определена.

Не делать массовый refactoring существующего приложения без необходимости.

---

# 40. Acceptance Criteria

Задача считается выполненной, если:

1. После авторизации танцор может открыть Dashboard.
2. Dashboard корректно работает на desktop и mobile.
3. Отображается имя пользователя.
4. Определяется ближайшая активность.
5. Показывается ближайшее расписание.
6. Показываются зарегистрированные Ивенты.
7. Показываются будущие тренировки.
8. Показываются доступные предстоящие Ивенты.
9. Есть переход в каталог Ивентов.
10. Есть переход на карту.
11. Есть переход в каталог тренеров.
12. Есть переход к билету.
13. Реализованы empty states.
14. Реализованы loading skeletons.
15. Ошибка одного API блока не ломает весь Dashboard.
16. Все API данные типизированы.
17. Используется React Query.
18. UI не содержит бизнес-логики платежей.
19. UI не содержит hardcoded production data.
20. Mobile bottom navigation работает корректно.
21. На desktop navigation находится в header.
22. Дизайн визуально минималистичный и не перегруженный.
23. Не добавлен функционал, которого нет в MVP.

---

# 41. Приоритет реализации

Реализовать в следующем порядке:

```text
1. Layout
2. Header / Mobile navigation
3. Greeting
4. Next Activity
5. Schedule
6. My Events
7. My Trainings
8. Upcoming Events
9. Nearby Events CTA
10. Find Trainer CTA
11. Notifications
12. Loading / Empty / Error states
13. Responsive polishing
```

---

# 42. Итог

На выходе должен получиться законченный главный экран танцора:

```text
Dashboard
│
├── Greeting
│
├── Important Notification
│
├── Next Activity
│
├── My Schedule
│
├── My Events
│
├── My Trainings
│
├── Upcoming Events
│
├── Nearby Events
│
└── Find Trainer
```

Основной UX-принцип:

> Сначала показать пользователю то, что уже относится лично к нему, и только после этого предлагать новые Ивенты и тренировки.

Не перегружать главный экран второстепенной информацией.
