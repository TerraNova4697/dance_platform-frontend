# Event Details API audit

Проверено по `apiContract.json`. Все пять endpoint-ов существуют, используют GET и принимают обязательный query-параметр. При этом OpenAPI описывает успешный ответ каждого метода только как `{ "message": { "type": "object" } }`: свойства объектов и массивов отсутствуют.

Также проверены фактические Python methods в `dance_platform/api`. Их текущие ответы поддержаны frontend-нормализатором, включая вложенные `price`, `masterClass.packages` и статусы билетов `full`/`unavailable`.

## Required for MVP

### Get Event Details

- Endpoint: `GET /api/method/dance_platform.api.get_event_details.get_event_details`
- Request: `event_id: string`
- Frontend: `EventDetailsPage`, hero, статусы, расписание, цены, люди, правила, контакты и organizer.
- Требуемая response schema: поля `EventDetails` из `src/types/eventDetails.ts`, включая `id`, `type`, `title`, `start_at`, `registration_status`, `event_status`, `host`, `venue`, `schedule`, `people`, `pricing`, `rules`, `contacts` и `current_user_state`.
- Недостаток контракта: структура `message` не описана, поэтому невозможно статически проверить обязательные поля, enum и nullable-поля.
- Недостающие backend-поля для полного ТЗ: `people` (судьи/преподаватели), `currentUserState`, `spectatorTicketsAvailable`. Пока соответствующие персональные секции/состояния скрываются, а доступность зрительских билетов определяется отдельным endpoint.

### Get Venue

- Endpoint: `GET /api/method/dance_platform.api.get_venue.get_venue`
- Request: `venue_id: string`
- Frontend: `EventLocation`, `EventLocationMap`.
- Требуемая response schema: `id`, `name`, `city`, `address`, `latitude`, `longitude`.
- Недостаток контракта: поля venue, включая обязательные координаты карты, не описаны.

### Get Tournament Categories

- Endpoint: `GET /api/method/dance_platform.api.get_tournament_categories.get_tournament_categories`
- Request: `event_id: string`
- Frontend: `TournamentCategories`.
- Требуемая response schema: `items[]` с `id`, `discipline`, `category`, возрастом, level/league/class, `participation_type`, availability/registration status, price и currency.
- Недостаток контракта: `items` и схема элемента отсутствуют.

### Get Master Class Slots

- Endpoint: `GET /api/method/dance_platform.api.get_master_class_slots.get_master_class_slots`
- Request: `event_id: string`
- Frontend: `MasterClassSlots`.
- Требуемая response schema: `items[]` с `id`, `title`, `start_at`, `end_at`, venue, capacity, available places, availability status, price и currency.
- Недостаток контракта: `items` и схема элемента отсутствуют.

### Get Spectator Ticket Types

- Endpoint: `GET /api/method/dance_platform.api.get_spectator_ticket_types.get_spectator_ticket_types`
- Request: `event_id: string`
- Frontend: `SpectatorTickets`, registration card, mobile CTA.
- Требуемая response schema: `items[]` с `id`, `title`, `type`, `price`, `currency`, availability status и периодом продаж.
- Недостаток контракта: `items` и схема элемента отсутствуют.

## Optional / can be deferred

- История переноса даты или места: endpoint/поля не описаны; без них warning об изменениях вывести достоверно нельзя.
- Master Class packages: отдельный endpoint и schema отсутствуют; для MVP секция использует `masterClass.packages` из Event Details response.
- Checkout URL/contract для зрительского билета: отсутствует; frontend зарезервировал route `/events/:id/tickets?ticket_type=:ticketTypeId`.
- Публичный профиль организатора и внешний deep link 2GIS: отсутствуют и для MVP не требуются.

## Recommendation

Добавить в `apiContract.json` полные JSON Schema для `message` каждого метода, включая required, enum, nullable и примеры. После этого frontend-нормализатор можно сделать строгим и удалить поддержку нескольких возможных вариантов snake_case/camelCase.
