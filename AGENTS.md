# Project instructions

## Stack

- React 19
- TypeScript
- Vite
- Frappe REST API
- Socket.IO

## Code style

- Use functional React components.
- Use TypeScript.
- Do not use `any`.
- Prefer async/await.
- Keep components small.
- Put API calls in `src/api/`.
- Put reusable hooks in `src/hooks/`.

## Architecture

Frontend communicates with Frappe through REST API.

Do not call Frappe APIs directly from UI components.

Use:

src/api/
    frappe.ts
    users.ts
    devices.ts

## Tools

TanStack Table: All table logic
React Query: backend requests from tables
Redux: calculator state
decimal.js: exact financial calculations
Zod: validation
dnd-kit: drag & drop for rows and blocks
React Hook Form  

## Testing

After making changes run:

npm run lint
npm run test
npm run build

Fix all errors before completing the task.

## Important

- Do not modify generated files.
- Do not change API contracts without asking.
- Do not add dependencies unless necessary.
