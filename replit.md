# Finance Copilot

Finance Copilot gives people a clear daily view of balances, spending, budgets, and grounded financial questions in one workspace.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/finance-copilot/` — React/Vite app with the dashboard, ledger, budgets, accounts, assistant, and settings routes.
- `artifacts/api-server/src/routes/finance.ts` — finance data endpoints plus demo seed data.
- `artifacts/api-server/src/routes/assistant.ts` — grounded assistant endpoint with provider fallback.
- `lib/api-spec/openapi.yaml` — source of truth for the generated client and validation schemas.
- `lib/db/src/schema/finance.ts` — PostgreSQL schema for accounts, transactions, and budgets.
- `artifacts/finance-copilot/src/index.css` — app theme tokens and shared motion styles.

## Architecture decisions

- The frontend only uses generated hooks from the OpenAPI contract; endpoint payloads are validated with generated Zod schemas on the server.
- The first release is populated with a small, explicit demo workspace so the product is useful before bank connections and per-user finance ownership are added.
- Replit-managed Clerk protects the finance routes; browser API calls use Clerk session cookies and never expose bearer tokens.
- The assistant receives account, budget, and transaction context on every request and is instructed not to invent financial facts or present regulated advice.
- If the external model is unavailable, the assistant returns a clearly labeled local rules-engine answer from the same finance context instead of failing silently.

## Product

- Overview: balances, six-month money movement, spending insight, budgets, recent activity, and connected accounts.
- Transactions: search, category filter, and manual transaction creation with persisted PostgreSQL data.
- Budgets: category progress and spending context.
- Accounts: combined balance and account cards.
- Assistant: grounded questions with model/source transparency and a safe fallback.
- Settings: locally persisted display and notification preferences.
- Authentication: public landing page, branded Clerk sign-in/sign-up routes, protected finance routes, signed-in profile display, and sign-out.

## User preferences

- User asked for an industry-level finance management product with a chatbot, using real products/models where available.

## Gotchas

- The OpenAI API key is read only on the server. Do not expose it in the frontend or logs.
- The assistant can return the local rules-engine fallback when the external API key has no remaining provider quota.
- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
