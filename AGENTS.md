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
Zustand: calculator state
decimal.js: exact financial calculations
Zod: validation
dnd-kit: drag & drop for rows and blocks
React Hook Form  

## Design System & UI/UX Guidelines

All frontend UI/UX must strictly adhere to the `on dance space` tactile design system:
👉 **Full specification & design tokens:** [docs/design-rules.md](docs/design-rules.md)

Key constraints for agents:
- **NO indigo / purple / cold SaaS blue colors** (e.g. `#4f46e5`, `#6366f1`, `#5b48e8`).
- **Canvas:** Warm stone `#EDECEC` (`--bg-canvas`).
- **Brand Accent:** Flame Vermilion `#FD3A25` (`--brand-accent`) for active states, dots, and indicators.
- **Primary CTA:** Deep charcoal `#272727` (`--brand-dark`) pill button with `--shadow-btn-dark`.
- **Buttons & Pills:** Always use pill geometry (`border-radius: 100px` / `--radius-pill`).
- **Tactile Surfaces:** Use 3D bevels and multi-layered shadows (`--shadow-card-tactile`, `--shadow-badge-tactile`).
- **Branding:** Always use `<BrandLogo />` from `src/components/BrandLogo.tsx`.

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
