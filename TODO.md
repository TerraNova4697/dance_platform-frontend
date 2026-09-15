# Задача

Реализовать экран детальной страницы Ивента:

```text
/events/:id
```

Экран должен поддерживать два типа Ивентов:

```text
Tournament
Master Class
```

Один route используется для обоих типов.

Тип Ивента определяется данными backend.

Frontend:

```text
React
TypeScript
TanStack
```

Экран является публичной титульной страницей Ивента и должен позволять пользователю:

* получить полную информацию об Ивенте;
* увидеть дату и время;
* увидеть место проведения;
* посмотреть место на карте;
* увидеть организатора;
* ознакомиться с программой;
* увидеть цены;
* увидеть доступные категории либо слоты;
* увидеть судей или преподавателей;
* ознакомиться с правилами;
* перейти к регистрации;
* перейти к покупке зрительского билета, если он доступен.

Дизайн должен полностью соответствовать существующему приложению.

---

# 1. Критическое требование по дизайну

Не создавать отдельный визуальный стиль для страницы Ивента.

Перед началом разработки изучить существующие:

```text
Dashboard
/events
Header
Mobile Bottom Navigation
EventCard
Button
Badge
Input
Select
Card
Modal / Drawer
Typography
Spacing
Colors
Border Radius
Shadows
```

Переиспользовать существующие компоненты и design tokens.

Не вводить без необходимости:

* новые цвета;
* новые размеры кнопок;
* отдельные border radius;
* отдельную систему spacing;
* новую typography;
* отдельный стиль карточек.

Страница должна выглядеть как естественное продолжение:

```text
Dashboard → /events → /events/:id
```

---

# 2. Route

Основной route:

```text
/events/:id
```

Пример:

```text
/events/EVT-00042
```

Если используется TanStack Router, использовать типизированный route param.

Пример:

```ts
{
  id: string;
}
```

Не хранить текущий Event ID параллельно в дополнительном global state без необходимости.

---

# 3. Основная структура страницы

Desktop:

```text
┌───────────────────────────────────────────────────────────┐
│ Application Header                                        │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ Breadcrumb / Back                                         │
│                                                           │
│ Event Hero                                                │
│ ┌──────────────────────────────────┬────────────────────┐ │
│ │ Cover / Event Info               │ Registration Card  │ │
│ │                                  │                    │ │
│ └──────────────────────────────────┴────────────────────┘ │
│                                                           │
│ Main Content                         Sticky Sidebar         │
│                                                           │
│ About                                                     │
│ Schedule                                                  │
│ Tournament Categories / Master Class Slots                │
│ Judges / Instructors                                      │
│ Pricing                                                   │
│ Location + Map                                            │
│ Rules                                                     │
│ Organizer                                                 │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

Mobile:

```text
Header

Back

Cover

Event Type
Event Title

Date
Location

Primary CTA

About

Schedule

Categories / Slots

People

Prices

Location
Map

Rules

Organizer

Sticky Bottom CTA
```

---

# 4. Back navigation

В верхней части страницы предусмотреть:

```text
← Назад к Ивентам
```

Переход:

```text
/events
```

Если возможно, browser history back можно использовать при сохранении безопасного fallback на `/events`.

Если пользователь пришел с фильтрами:

```text
/events?city=astana&type=tournament
```

желательно сохранить возможность вернуться к предыдущему состоянию через browser history.

---

# 5. Event Hero

Главная информационная область страницы.

Показывать:

```text
cover
event type
title
host
date
time
city
venue
registration status
minimum price
```

Пример:

```text
[ COVER IMAGE ]

Турнир

Astana Dance Cup 2026

Dance Federation KZ

20 сентября 2026
10:00–21:00

Astana Arena
Астана

Регистрация открыта
```

---

# 6. Event Type Badge

Для Tournament:

```text
Турнир
```

Для Master Class:

```text
Мастер-класс
```

Использовать существующий Badge.

Не создавать отдельную визуальную систему badge.

---

# 7. Cover

Cover должен:

* занимать заметную часть hero;
* использовать существующий aspect ratio Event Card, если это возможно;
* использовать `object-fit: cover`;
* иметь placeholder, если изображения нет;
* корректно работать на mobile.

Не использовать poster/афишу как cover автоматически, если backend предоставляет оба изображения отдельно.

---

# 8. Poster

Если Event имеет отдельную афишу:

```text
posterUrl
```

показать ее внутри контентной части.

Например секция:

```text
Афиша
```

На desktop афиша может открываться в lightbox/modal.

На mobile изображение должно масштабироваться по ширине контейнера.

---

# 9. Registration Summary Card

На desktop справа от hero разместить компактную sticky card.

Пример Tournament:

```text
Регистрация открыта

от 10 000 ₸

Регистрация до:
18 сентября

[Зарегистрироваться]

или

[Купить билет зрителя]
```

Пример Master Class:

```text
Есть свободные места

от 8 000 ₸

Ближайший слот:
20 сентября · 15:00

[Записаться]
```

---

# 10. Sticky behavior

На desktop registration card может быть:

```text
position: sticky
```

в пределах основной страницы.

Не перекрывать Header.

На mobile эту card не делать sticky сбоку.

Вместо этого использовать:

* обычный CTA в контенте;
* sticky bottom action.

---

# 11. Sticky Mobile CTA

На mobile внизу экрана:

Tournament:

```text
от 10 000 ₸         [Зарегистрироваться]
```

Master Class:

```text
от 8 000 ₸              [Записаться]
```

Если доступен только зрительский билет:

```text
от 5 000 ₸              [Купить билет]
```

Нижняя панель не должна перекрывать mobile navigation приложения.

Если одновременно используется bottom navigation, корректно учитывать safe spacing.

---

# 12. Event status

Поддержать статусы:

```text
registration_not_open
registration_open
registration_closed

upcoming
in_progress
finished
cancelled
```

UI не должен самостоятельно вычислять бизнес-статус из дат, если backend предоставляет готовое значение.

Примеры:

```text
Регистрация откроется 10 сентября
```

```text
Регистрация открыта
```

```text
Регистрация закрыта
```

```text
Ивент завершен
```

```text
Ивент отменен
```

---

# 13. Cancelled Event

Если Ивент отменен:

вывести заметный warning:

```text
Ивент отменен

Организатор отменил мероприятие.
Если вы уже оплатили участие или билет,
возврат будет обработан согласно правилам платформы.
```

Основные CTA регистрации отключить.

Не удалять остальную информацию страницы.

---

# 14. Event changes warning

Если Ивент был перенесен:

показать notification block:

```text
Дата или место проведения были изменены

Новая дата:
20 сентября

Новое место:
Astana Arena
```

Если backend предоставляет историю изменений, можно дать:

```text
Подробнее об изменениях
```

---

# 15. Main content navigation

Если страница достаточно длинная, допускается внутренняя sticky navigation:

```text
Описание
Расписание
Категории
Стоимость
Место
Правила
```

Для Master Class:

```text
Описание
Расписание
Слоты
Преподаватели
Стоимость
Место
Правила
```

Не реализовывать tabs, которые скрывают важную информацию, если обычные sections проще.

Предпочтительно использовать vertical sections + anchors.

---

# 16. About section

Заголовок:

```text
Об Ивенте
```

Показывать:

```text
description
```

Текст должен поддерживать переносы строк.

Если backend предоставляет безопасный rich text, использовать существующий механизм отображения rich content.

Не вставлять непроверенный HTML через `dangerouslySetInnerHTML`.

---

# 17. Schedule

Секция:

```text
Расписание
```

Отображать элементы по времени.

Пример:

```text
20 сентября

09:00
Регистрация участников

10:00
Начало соревнований

13:00
Final — Solo Beginner

18:00
Награждение
```

Для Master Class:

```text
14:00–15:30
Hip-Hop Foundation

16:00–17:30
Musicality

18:00–19:30
Freestyle Practice
```

---

# 18. Schedule component

Пример модели:

```ts
interface EventScheduleItem {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  location?: string;
}
```

Группировать по датам для multi-day Event.

---

# 19. Multi-day Event

Ивент может длиться несколько дней.

Не предполагать:

```text
startAt == endAt date
```

На странице:

```text
20–22 сентября 2026
```

Расписание:

```text
20 сентября
...

21 сентября
...

22 сентября
...
```

---

# 20. Tournament-specific content

Если:

```ts
event.type === "tournament"
```

отобразить Tournament секции.

---

# 21. Tournament Categories

Секция:

```text
Категории
```

Показывать доступные категории турнира.

Для каждой:

```text
discipline
category
age
level
league/class
participation type
price
capacity status
registration status
```

Пример:

```text
Hip-Hop

Solo Beginner
Возраст: 14–17
Уровень: Beginner

10 000 ₸

Регистрация открыта
```

---

# 22. Tournament Category filters

Если категорий много, внутри секции можно добавить локальные фильтры:

```text
Дисциплина
Возраст
Уровень
Формат
```

Эти фильтры относятся только к списку категорий текущего турнира.

Не записывать их в глобальный `/events` filter state.

---

# 23. Participation types

Поддержать отображение:

```text
Solo
Couple
Team
Formation
```

Использовать понятные labels.

Не переводить внутреннее значение `formation` в `Команда`.

---

# 24. Tournament registration warning

Backend может вернуть предупреждение о несоответствии:

```text
age
level
league
class
```

Поскольку по бизнес-правилам несоответствие не блокирует регистрацию, frontend должен уметь отображать warning, но не должен автоматически запрещать действие.

Саму валидацию регистрации можно реализовать на следующем экране регистрации.

---

# 25. Judges

Для Tournament показать секцию:

```text
Судьи
```

Карточка:

```text
[photo]

Иван Иванов
Главный судья
```

Если данных нет, секцию скрыть.

Не показывать пустой заголовок.

---

# 26. Master Class-specific content

Если:

```ts
event.type === "master_class"
```

отображать Master Class секции.

---

# 27. Instructors

Секция:

```text
Преподаватели
```

Показывать:

```text
photo
name
role
```

Пример:

```text
[photo]

Анна Петрова
Choreographer / Hip-Hop
```

---

# 28. Master Class Slots

Секция:

```text
Доступные занятия
```

Показывать каждый слот:

```text
date
start time
end time
venue
available places
price
status
```

Пример:

```text
20 сентября

15:00–16:30

Hip-Hop Foundation

12 мест осталось

8 000 ₸

[Выбрать]
```

---

# 29. Slot availability

Поддержать:

```text
available
low
full
cancelled
```

Примеры:

```text
Есть места
```

```text
Осталось 3 места
```

```text
Мест нет
```

Не вычислять значение `low` на frontend, если backend уже его предоставляет.

---

# 30. Master Class Packages

Если backend предоставляет пакетные продукты:

```text
Full Day
3 Classes
All Access
```

вывести отдельную секцию:

```text
Пакеты
```

Пример:

```text
All Access

Все мастер-классы мероприятия

25 000 ₸

[Выбрать]
```

Если packages отсутствуют, секцию скрыть.

---

# 31. Pricing section

Добавить:

```text
Стоимость
```

Для Tournament:

может быть несколько ценовых правил.

Пример:

```text
Early Bird
до 10 сентября
10 000 ₸

Standard
11–18 сентября
15 000 ₸

Late
19–20 сентября
20 000 ₸
```

Или:

```text
Первая категория
10 000 ₸

Каждая дополнительная
5 000 ₸
```

Frontend не должен самостоятельно рассчитывать эти правила.

Backend должен вернуть данные в отображаемом виде либо структурированной форме.

---

# 32. Spectator tickets

Если Ивент позволяет зрителей:

показать:

```text
Билеты для зрителей
```

Пример:

```text
Standard
5 000 ₸

[Купить]
```

Если несколько типов:

```text
Standard
VIP
Child
Day Pass
Full Pass
```

вывести список.

---

# 33. Location section

Обязательная секция:

```text
Место проведения
```

Показывать:

```text
venue name
city
address
```

Пример:

```text
Astana Arena

Астана
пр. Туран, 57
```

---

# 34. Map

На странице Ивента обязательно отображать карту места проведения.

Карта должна использовать:

```text
latitude
longitude
```

И показывать marker Ивента.

Предварительно map provider:

```text
2GIS
```

Но компонент карты должен быть абстрагирован от конкретного provider.

---

# 35. Map component

Создать или переиспользовать общий компонент:

```tsx
<EventLocationMap
  latitude={event.venue.latitude}
  longitude={event.venue.longitude}
  title={event.venue.name}
/>
```

Не вызывать SDK 2GIS напрямую внутри большого `EventDetailsPage`.

---

# 36. Map design

Desktop:

```text
Место проведения

Astana Arena
пр. Туран, 57

┌─────────────────────────────────────┐
│                                     │
│               MAP                   │
│                 ●                   │
│                                     │
└─────────────────────────────────────┘
```

Map height:

ориентировочно:

```text
300–400px
```

Визуально карта должна соответствовать карточкам приложения.

Использовать существующий:

* border radius;
* border;
* spacing.

---

# 37. Mobile map

На mobile карта:

* занимает 100% доступной ширины;
* имеет высоту ориентировочно 240–320px;
* не ломает horizontal scrolling.

---

# 38. Map marker

Marker должен указывать место проведения.

При клике можно показать:

```text
Astana Arena
пр. Туран, 57
```

Не требуется отображать все соседние Ивенты на detail page.

---

# 39. Open in map

Если возможно с текущим provider, добавить:

```text
Открыть на карте
```

Это secondary action.

Если корректный external/deep link пока не поддерживается, не реализовывать фальшивую кнопку.

---

# 40. Missing coordinates

Если backend не вернул:

```text
latitude
longitude
```

не рендерить пустую карту.

Показать только адрес:

```text
Astana Arena
пр. Туран, 57
```

и при необходимости текст:

```text
Координаты места пока не указаны
```

---

# 41. Rules

Секция:

```text
Правила
```

Показывать правила текущего Ивента.

Если текст длинный:

* отображать аккуратно;
* использовать нормальную typography;
* можно использовать collapsed preview + `Показать полностью`.

---

# 42. Legal notice

Возле registration CTA должен присутствовать текст:

```text
Продолжая регистрацию или покупку,
вы соглашаетесь с правилами Ивента
и условиями платформы.
```

Не использовать checkbox, если текущий бизнес-процесс предполагает согласие фактом покупки.

---

# 43. Contacts

Секция:

```text
Контакты
```

Отображать только то, что Хост разрешил публиковать:

```text
phone
email
contact name
```

Не предполагать наличие каждого поля.

---

# 44. Organizer section

Секция:

```text
Организатор
```

Показывать:

```text
logo
display name
organization type optional
contacts optional
```

Пример:

```text
[logo]

Dance Federation KZ

Федерация
```

Публичная страница Хоста пока не требуется, если такого route нет.

---

# 45. Registration CTA — Tournament

При открытой регистрации:

```text
[Зарегистрироваться]
```

Переход рекомендован на:

```text
/events/:id/register
```

Если route пока не реализован, предусмотреть navigation contract, но не создавать весь registration flow в рамках этой задачи.

---

# 46. Registration CTA — Master Class

```text
[Записаться]
```

Если пользователь заранее выбрал slot:

рекомендованный route:

```text
/events/:id/register?slot=:slotId
```

---

# 47. Guest behavior

Страница Event является публичной.

Гость может:

* видеть Ивент;
* смотреть место;
* смотреть цены;
* покупать зрительский билет.

Для регистрации спортсмена требуется авторизация.

Если гость нажимает:

```text
Зарегистрироваться
```

и система требует аккаунт:

направить на login с redirect:

```text
/login?redirect=/events/:id/register
```

Использовать уже существующий auth flow приложения.

---

# 48. Spectator purchase

Если зрительский билет можно купить без аккаунта:

CTA:

```text
Купить билет
```

не должен принудительно отправлять пользователя на login.

Переход в checkout flow согласно существующей архитектуре приложения.

---

# 49. Registered user state

Если текущий пользователь уже зарегистрирован:

вместо основного CTA можно показывать:

```text
Вы зарегистрированы
```

и действия:

```text
[Моя регистрация]
[Открыть билет]
```

если такие ссылки доступны.

---

# 50. Event already purchased as spectator

Если билет уже есть:

```text
Билет куплен

[Открыть билет]
```

Не показывать misleading CTA `Купить` без необходимости.

---

# 51. Loading

Использовать page skeleton.

Skeleton должен включать:

```text
cover
title
metadata
sidebar
content sections
map placeholder
```

Не использовать только fullscreen spinner.

---

# 52. Partial loading

Если основные данные Event уже получены, но отдельно загружаются:

* категории;
* slots;
* tickets;

не скрывать всю страницу.

Показывать skeleton конкретной секции.

---

# 53. Not Found

Если Event не существует:

```text
Ивент не найден

Возможно, он был удален
или ссылка больше недействительна.

[Вернуться к Ивентам]
```

---

# 54. Error state

Если backend недоступен:

```text
Не удалось загрузить Ивент

Попробуйте еще раз.

[Повторить]
```

Header приложения должен продолжить отображаться.

---

# 55. Event model

Предпочтительный общий DTO:

```ts
type EventType =
  | "tournament"
  | "master_class";

interface EventDetails {
  id: string;

  type: EventType;

  title: string;
  description: string;

  coverUrl?: string;
  posterUrl?: string;

  host: {
    id: string;
    name: string;
    logoUrl?: string;
    type?: string;
  };

  startAt: string;
  endAt?: string;

  publicationStatus: string;
  registrationStatus:
    | "not_open"
    | "open"
    | "closed";

  eventStatus:
    | "upcoming"
    | "in_progress"
    | "finished"
    | "cancelled";

  registrationOpenAt?: string;
  registrationCloseAt?: string;

  venue: {
    id?: string;
    name: string;
    city: string;
    address: string;

    latitude?: number;
    longitude?: number;
  };

  directions: {
    id: string;
    name: string;
  }[];

  minimumPrice?: number;

  currency:
    | "KZT"
    | "RUB"
    | "USD"
    | "EUR";

  schedule: EventScheduleItem[];

  people: EventPerson[];

  rules?: string;

  contacts?: EventContact[];

  spectatorTicketsAvailable: boolean;

  currentUserState?: {
    registered: boolean;
    ticketId?: string;
    spectatorTicketOwned?: boolean;
  };
}
```

---

# 56. Event Person

```ts
interface EventPerson {
  id: string;

  personId?: string;

  name: string;

  role:
    | "judge"
    | "instructor"
    | "speaker"
    | "organizer";

  photoUrl?: string;
}
```

---

# 57. Tournament Category DTO

```ts
interface TournamentCategory {
  id: string;

  discipline: {
    id: string;
    name: string;
  };

  category: {
    id: string;
    name: string;
  };

  ageFrom?: number;
  ageTo?: number;

  level?: {
    id: string;
    name: string;
  };

  league?: {
    id: string;
    name: string;
  };

  className?: string;

  participationType:
    | "solo"
    | "couple"
    | "team"
    | "formation";

  capacity?: number;

  availabilityStatus:
    | "available"
    | "low"
    | "full";

  registrationStatus:
    | "not_open"
    | "open"
    | "closed";

  price?: number;
  currency?: string;
}
```

---

# 58. Master Class Slot DTO

```ts
interface MasterClassSlot {
  id: string;

  title?: string;

  startAt: string;
  endAt: string;

  venue?: {
    id?: string;
    name: string;
  };

  capacity?: number;

  availablePlaces?: number;

  availabilityStatus:
    | "available"
    | "low"
    | "full"
    | "cancelled";

  price?: number;
  currency?: string;
}
```

---

# 59. Spectator Ticket DTO

```ts
interface SpectatorTicketType {
  id: string;

  title: string;

  type:
    | "standard"
    | "vip"
    | "child"
    | "day"
    | "full_pass";

  price: number;

  currency: string;

  availabilityStatus:
    | "available"
    | "low"
    | "sold_out";

  salesStartAt?: string;
  salesEndAt?: string;
}
```

---

# 60. Pricing DTO

Backend должен по возможности предоставлять рассчитанные/готовые pricing rules.

```ts
interface EventPriceRule {
  id: string;

  label: string;

  description?: string;

  price: number;

  currency: string;

  validFrom?: string;
  validTo?: string;
}
```

---

# 61. API abstraction

Не вызывать Frappe endpoints напрямую из presentation components.

Создать:

```text
services/eventDetails.ts
```

или соответствующий feature API layer.

Пример методов:

```ts
getEventDetails(eventId)

getTournamentCategories(eventId)

getMasterClassSlots(eventId)

getMasterClassPackages(eventId)

getSpectatorTicketTypes(eventId)
```

Не обязательно делать отдельный HTTP request на каждый блок, если backend способен вернуть все данные одним агрегированным endpoint.

---

# 62. Предпочтительный backend подход

Для detail page предпочтителен агрегированный endpoint:

```http
GET /api/method/dance_platform.api.events.get_event_details
```

Параметр:

```text
event_id
```

Пример:

```http
GET /api/method/dance_platform.api.events.get_event_details?event_id=EVT-00042
```

Он должен вернуть базовую информацию, общую для обоих типов Ивента.

---

# 63. Tournament API

Для Tournament при необходимости отдельный endpoint:

```http
GET /api/method/dance_platform.api.events.get_tournament_categories
```

Параметры:

```text
event_id
```

Response:

```json
{
  "items": [
    {
      "id": "TC-001",
      "discipline": {
        "id": "DISC-01",
        "name": "Hip-Hop"
      },
      "category": {
        "id": "CAT-01",
        "name": "Solo Beginner"
      },
      "age_from": 14,
      "age_to": 17,
      "level": {
        "id": "LEVEL-01",
        "name": "Beginner"
      },
      "participation_type": "solo",
      "availability_status": "available",
      "registration_status": "open",
      "price": 10000,
      "currency": "KZT"
    }
  ]
}
```

---

# 64. Master Class Slots API

```http
GET /api/method/dance_platform.api.events.get_master_class_slots
```

Параметр:

```text
event_id
```

Response:

```json
{
  "items": [
    {
      "id": "MCS-001",
      "title": "Hip-Hop Foundation",
      "start_at": "2026-09-20T15:00:00+05:00",
      "end_at": "2026-09-20T16:30:00+05:00",
      "capacity": 20,
      "available_places": 12,
      "availability_status": "available",
      "price": 8000,
      "currency": "KZT"
    }
  ]
}
```

---

# 65. Spectator Tickets API

При необходимости:

```http
GET /api/method/dance_platform.api.events.get_spectator_ticket_types
```

Response:

```json
{
  "items": [
    {
      "id": "TICKET-TYPE-01",
      "title": "Standard",
      "type": "standard",
      "price": 5000,
      "currency": "KZT",
      "availability_status": "available"
    }
  ]
}
```

---

# 66. Map / Venue API requirements

Для отображения карты Event Details должен обязательно получить:

```json
{
  "venue": {
    "id": "VENUE-01",
    "name": "Astana Arena",
    "city": "Astana",
    "address": "пр. Туран, 57",
    "latitude": 51.1200,
    "longitude": 71.4300
  }
}
```

Если текущий backend возвращает только address без coordinates, этого недостаточно для гарантированного отображения marker.

В этом случае backend должен быть доработан.

---

# 67. Обязательное требование при отсутствии API

Перед завершением задачи агент обязан проверить фактически существующий backend/API.

Нельзя молча:

* придумывать данные;
* хардкодить production DTO;
* считать endpoint существующим;
* эмулировать отсутствующий backend как финальное решение.

Если какого-либо endpoint или поля не хватает, создать файл:

```text
docs/missing-event-details-api.md
```

или вывести эквивалентный отчет в результате работы.

---

# 68. Формат отчета Missing API

Для каждого отсутствующего API указать:

```text
Название:
Назначение:
Method:
Endpoint:
Request:
Response:
Какие компоненты frontend его используют:
Почему существующих API недостаточно:
```

Пример:

```text
Название:
Get Event Details

Назначение:
Получение полной информации титульной страницы Ивента.

Method:
GET

Endpoint:
/api/method/dance_platform.api.events.get_event_details

Request:
event_id: string

Response:
{
  id,
  type,
  title,
  description,
  cover_url,
  poster_url,
  start_at,
  end_at,
  host,
  venue,
  schedule,
  people,
  rules,
  contacts,
  registration_status,
  event_status
}

Frontend:
EventDetailsPage
EventHero
EventLocation
EventSchedule
```

---

# 69. Missing fields

Если endpoint существует, но в нем не хватает отдельных полей, агент должен отдельно это указать.

Например:

```text
Existing endpoint:
GET /api/resource/Dance Event/EVT-001

Missing fields required by UI:

venue.latitude
venue.longitude
host.logo_url
minimum_price
registration_status
current_user_state
spectator_tickets_available
```

Не создавать workaround с hardcoded данными без явного TODO/report.

---

# 70. API report categories

Разделить отчет минимум на:

```text
Required for MVP
Optional / can be deferred
```

Например:

### Required

```text
Event details
Venue coordinates
Tournament categories
Master Class slots
Spectator ticket types
```

### Optional

```text
Event history
Advanced capacity messages
Host public profile
External map link
```

---

# 71. Mock data

Если backend еще не готов, разрешается использовать mocks для разработки UI.

Но:

* mocks должны находиться отдельно;
* UI interfaces должны соответствовать будущему API;
* отсутствие API должно быть зафиксировано в отчете;
* mock не считается реализацией backend.

Например:

```text
mocks/eventDetails.ts
```

---

# 72. TanStack Query

Использовать:

```ts
useQuery
```

Пример:

```ts
useQuery({
  queryKey: ["event-details", eventId],
  queryFn: () => getEventDetails(eventId),
});
```

Дополнительные запросы:

```text
["tournament-categories", eventId]

["master-class-slots", eventId]

["spectator-tickets", eventId]
```

Запрашивать только данные, нужные типу текущего Ивента.

---

# 73. Conditional queries

Если Tournament:

```ts
enabled: event.type === "tournament"
```

Если Master Class:

```ts
enabled: event.type === "master_class"
```

Не запрашивать Tournament Categories для Master Class.

---

# 74. Date formatting

Backend даты приходят как ISO.

Пример:

```text
2026-09-20T10:00:00+05:00
```

UI:

```text
20 сентября 2026
10:00–21:00
```

Использовать общий date formatter приложения.

---

# 75. Currency formatting

Использовать общий:

```ts
Intl.NumberFormat
```

Пример:

```text
10 000 ₸
$50
€25
```

Не создавать отдельную currency formatting logic для страницы.

---

# 76. Map loading

Map SDK желательно lazy-load.

Если карта пока не видна пользователю или находится ниже fold, можно загружать компонент лениво.

Не позволять тяжелой map library значительно ухудшать initial render страницы.

---

# 77. Map error

Если map provider не загрузился:

не падать всей страницей.

Показать:

```text
Не удалось загрузить карту

Astana Arena
пр. Туран, 57
```

Адрес должен оставаться доступным.

---

# 78. Accessibility

Минимум:

* корректная heading hierarchy;
* buttons являются button;
* navigation links являются links;
* image alt;
* map container имеет понятный accessible label;
* sticky CTA доступна keyboard;
* accordion имеет aria state;
* badges не являются единственным способом передать критический статус;
* достаточный contrast.

---

# 79. Performance

Не делать:

* один большой component на сотни строк;
* повторные запросы одного Event;
* повторное форматирование одних данных в разных компонентах;
* тяжелую map initialization до необходимости.

Использовать TanStack Query cache.

---

# 80. Рекомендуемая структура компонентов

```text
pages/
└── events/
    └── details/
        ├── EventDetailsPage.tsx
        │
        └── components/
            ├── EventBreadcrumb.tsx
            ├── EventHero.tsx
            ├── EventRegistrationCard.tsx
            ├── EventMobileCTA.tsx
            ├── EventStatusBanner.tsx
            ├── EventAbout.tsx
            ├── EventPoster.tsx
            ├── EventSchedule.tsx
            ├── EventPeople.tsx
            │
            ├── TournamentDetails.tsx
            ├── TournamentCategories.tsx
            ├── TournamentCategoryCard.tsx
            │
            ├── MasterClassDetails.tsx
            ├── MasterClassSlots.tsx
            ├── MasterClassSlotCard.tsx
            ├── MasterClassPackages.tsx
            │
            ├── SpectatorTickets.tsx
            ├── EventPricing.tsx
            │
            ├── EventLocation.tsx
            ├── EventLocationMap.tsx
            │
            ├── EventRules.tsx
            ├── EventContacts.tsx
            ├── EventOrganizer.tsx
            │
            ├── EventDetailsSkeleton.tsx
            ├── EventDetailsError.tsx
            └── EventNotFound.tsx
```

Адаптировать к существующей архитектуре проекта.

---

# 81. Не дублировать shared components

Если уже существуют:

```text
EventCard
Button
Badge
Avatar
Skeleton
Alert
Map
CurrencyText
DateText
```

переиспользовать.

Не создавать:

```text
EventDetailsButton
EventDetailsBadge
```

только ради этой страницы.

---

# 82. Что НЕ реализовывать

Не добавлять:

* отзывы;
* рейтинги;
* комментарии;
* социальную ленту;
* related events;
* AI recommendations;
* favorite;
* share counters;
* leaderboard;
* судейский scoring;
* результаты турнира;
* полноценную турнирную сетку.

Этого нет в MVP текущего этапа.

---

# 83. Acceptance Criteria — общие

Задача считается выполненной, если:

1. Route `/events/:id` работает.
2. Дизайн соответствует остальному приложению.
3. Переиспользуется общий Header.
4. На mobile используется общий navigation.
5. Отображается cover.
6. Отображается тип Event.
7. Отображается название.
8. Отображается Host.
9. Отображается дата.
10. Корректно работает multi-day Event.
11. Отображается venue.
12. Отображается описание.
13. Отображается расписание.
14. Отображаются правила.
15. Отображаются контакты.
16. Корректно отображаются статусы.
17. Есть registration CTA.
18. Есть spectator ticket CTA при наличии билетов.
19. Есть loading state.
20. Есть error state.
21. Есть 404 state.
22. Страница responsive.
23. Используется TanStack Query.
24. API слой отделен от UI.
25. TypeScript модели типизированы.

---

# 84. Acceptance Criteria — Tournament

Для Tournament:

1. Отображаются Tournament Categories.
2. Отображается discipline.
3. Отображается category.
4. Отображается возраст.
5. Отображается level.
6. Отображается participation type.
7. Поддерживаются Solo.
8. Поддерживаются Couple.
9. Поддерживаются Team.
10. Поддерживаются Formation.
11. Отображается price.
12. Отображается availability.
13. Отображаются судьи, если существуют.
14. CTA ведет в Tournament Registration flow.

---

# 85. Acceptance Criteria — Master Class

Для Master Class:

1. Отображаются преподаватели.
2. Отображаются доступные slots.
3. Показываются даты слотов.
4. Показывается время.
5. Показывается availability.
6. Показывается стоимость.
7. Full slot нельзя выбрать.
8. Cancelled slot нельзя выбрать.
9. Packages показываются при наличии.
10. CTA может передать выбранный slot.

---

# 86. Acceptance Criteria — Map

Обязательно:

1. На странице существует секция места проведения.
2. Отображаются название venue и адрес.
3. При наличии coordinates отображается карта.
4. На карте есть marker Ивента.
5. Marker соответствует координатам backend.
6. На mobile карта адаптивна.
7. Ошибка карты не ломает страницу.
8. При отсутствии coordinates карта не рендерится.
9. Map provider изолирован от EventDetailsPage.
10. Решение готово к использованию 2GIS.

---

# 87. Acceptance Criteria — API audit

Перед завершением работы агент обязан:

1. Проверить существующие API.
2. Не предполагать наличие endpoint без проверки.
3. Использовать существующие endpoint, если они подходят.
4. Не создавать дублирующий API без необходимости.
5. Зафиксировать недостающие endpoint.
6. Зафиксировать недостающие поля существующих endpoint.
7. Для каждого отсутствующего endpoint описать request.
8. Описать response.
9. Указать, какие frontend components его используют.
10. Разделить API на обязательные и опциональные.
11. Сохранить результат в `docs/missing-event-details-api.md`, если backend не покрывает все требования.

---

# 88. Приоритет разработки

```text
1. Изучить существующий дизайн
2. Изучить существующий /events
3. Проверить backend API
4. Определить DTO
5. Реализовать общий Event Details layout
6. Event Hero
7. Registration Card
8. Общие Event sections
9. Tournament-specific sections
10. Master Class-specific sections
11. Spectator tickets
12. Location
13. Map
14. Loading / Error / Not Found
15. Mobile CTA
16. Responsive polishing
17. API audit report
```

---

# 89. Итоговая структура Tournament

```text
/events/:id
│
├── Header
├── Back
│
├── Event Hero
│   ├── Cover
│   ├── Tournament Badge
│   ├── Title
│   ├── Host
│   ├── Date
│   └── Venue
│
├── Registration Card
│
├── About
├── Poster
├── Schedule
├── Tournament Categories
├── Judges
├── Pricing
├── Spectator Tickets
│
├── Location
│   ├── Venue
│   ├── Address
│   └── Map
│
├── Rules
├── Contacts
├── Organizer
│
└── Registration CTA
```

---

# 90. Итоговая структура Master Class

```text
/events/:id
│
├── Header
├── Back
│
├── Event Hero
│   ├── Cover
│   ├── Master Class Badge
│   ├── Title
│   ├── Host
│   ├── Date
│   └── Venue
│
├── Registration Card
│
├── About
├── Poster
├── Schedule
├── Instructors
├── Master Class Slots
├── Packages
├── Pricing
├── Spectator Tickets
│
├── Location
│   ├── Venue
│   ├── Address
│   └── Map
│
├── Rules
├── Contacts
├── Organizer
│
└── Booking CTA
```

---

# 91. Основной UX-принцип

Страница должна отвечать на вопросы пользователя в таком порядке:

```text
Что это за Ивент?
        ↓
Когда он проходит?
        ↓
Где он проходит?
        ↓
Подходит ли он мне?
        ↓
Какие категории / занятия доступны?
        ↓
Сколько это стоит?
        ↓
Как зарегистрироваться?
```

Карта является обязательной частью ответа на вопрос:

```text
Где проходит Ивент?
```

а не отдельной второстепенной функцией.

Главная задача страницы — дать пользователю достаточно информации для принятия решения и быстро привести его к регистрации либо покупке билета.
