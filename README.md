# Finance Copilot

Finance Copilot is a personal finance workspace for understanding balances, spending, budgets, and grounded financial questions in one calm daily experience.

The product includes:

- An overview dashboard with balances, trends, spending insights, budgets, and recent activity
- Searchable transactions with category filtering and manual entry
- Account and budget creation with user-scoped persistence
- A grounded finance assistant with model/source transparency and a local fallback
- Clerk authentication with protected finance routes
- A responsive, minimal glass-style interface built around shared visual primitives

## Tech stack

- **Frontend:** React, Vite, TypeScript, Wouter, TanStack Query, Tailwind CSS
- **Backend:** Express 5, TypeScript, Clerk middleware
- **Database:** PostgreSQL with Drizzle ORM
- **Validation and API contracts:** OpenAPI, Zod, Orval-generated React hooks
- **Authentication:** Replit-managed Clerk
- **AI assistant:** OpenAI-compatible server-side integration with a local rules-engine fallback
- **Workspace:** pnpm monorepo

## Repository structure

```text
artifacts/
├── finance-copilot/       # React/Vite web application
├── api-server/            # Express API and finance routes
└── mockup-sandbox/        # Isolated component preview server

lib/
├── api-client-react/      # Generated React API client and hooks
├── api-spec/              # OpenAPI source of truth and codegen
├── api-zod/               # Generated server validation schemas
└── db/                    # Drizzle database client and schema
```

Important source locations:

- `artifacts/finance-copilot/src/pages/finance-pages.tsx` — product routes and page-level data flows
- `artifacts/finance-copilot/src/components/finance.tsx` — shared finance UI components
- `artifacts/finance-copilot/src/index.css` — theme tokens, glass surfaces, focus states, and shared motion
- `artifacts/api-server/src/routes/finance.ts` — account, transaction, budget, and dashboard endpoints
- `artifacts/api-server/src/routes/assistant.ts` — grounded assistant endpoint and fallback behavior
- `lib/api-spec/openapi.yaml` — source of truth for generated clients and schemas
- `lib/db/src/schema/finance.ts` — PostgreSQL schema for finance data

## Routes

### Public routes

- `/` — landing page
- `/sign-in` — Clerk sign-in
- `/sign-up` — Clerk account creation

### Protected routes

- `/app` — overview dashboard
- `/transactions` — transaction search, filtering, and creation
- `/budgets` — budget progress and budget creation
- `/accounts` — connected account list and account creation
- `/assistant` — grounded finance assistant
- `/settings` — display and notification preferences

## Prerequisites

- Node.js 24 or a compatible current Node.js release
- pnpm
- A PostgreSQL database
- Clerk application credentials

Install dependencies from the repository root:

```bash
pnpm install
```

## Environment configuration

Configure secrets through Replit Secrets or your local environment. Never commit secret values to the repository.

Required for the API and database:

```text
DATABASE_URL
CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY
```

Required by the browser app:

```text
VITE_CLERK_PUBLISHABLE_KEY
```

Optional:

```text
VITE_CLERK_PROXY_URL
OPENAI_API_KEY
```

When `OPENAI_API_KEY` is unavailable or the provider cannot answer, the assistant returns a clearly labeled local response from the same finance context instead of failing silently.

## Running the project

The repository is configured with three Replit workflows:

| Workflow | Command | Purpose |
| --- | --- | --- |
| Finance Copilot | `pnpm --filter @workspace/finance-copilot run dev` | Runs the React/Vite web app |
| API Server | `pnpm --filter @workspace/api-server run dev` | Runs the Express API |
| Component Preview Server | `pnpm --filter @workspace/mockup-sandbox run dev` | Runs isolated UI previews |

In Replit, start the configured workflows from the workspace. The artifact configuration supplies the required ports and base paths.

For manual local development, run the web and API in separate terminals:

```bash
# Terminal 1
PORT=8080 pnpm --filter @workspace/api-server run dev

# Terminal 2
PORT=19493 BASE_PATH=/ pnpm --filter @workspace/finance-copilot run dev
```

The web artifact serves on port `19493` and the API artifact serves on port `8080` in the current Replit configuration.

## Common commands

Run these from the repository root:

```bash
# Typecheck all libraries and artifacts
pnpm run typecheck

# Typecheck and build all packages
pnpm run build

# Typecheck only the web app
pnpm --filter @workspace/finance-copilot run typecheck

# Build only the web app
PORT=19493 BASE_PATH=/ pnpm --filter @workspace/finance-copilot run build

# Typecheck only the API
pnpm --filter @workspace/api-server run typecheck

# Regenerate API hooks and validation schemas
pnpm --filter @workspace/api-spec run codegen

# Push development database schema changes
pnpm --filter @workspace/db run push
```

Run database schema commands only against the intended development database. Review schema changes before applying them to production.

## API overview

The API is mounted at `/api` and protected finance endpoints use the authenticated Clerk user ID to scope data.

Key endpoints include:

- `GET /api/healthz` — health check
- `GET /api/finance/dashboard` — dashboard summary and trend data
- `GET|POST /api/finance/accounts` — list or create accounts
- `GET|POST /api/finance/transactions` — list or create transactions
- `GET|POST /api/finance/budgets` — list or create budgets
- `POST /api/assistant/chat` — ask a grounded finance question

The frontend consumes generated hooks from `@workspace/api-client-react`. If the OpenAPI contract changes, regenerate the client and schemas rather than editing generated files manually.

## Data and safety notes

- Finance routes require authentication.
- Account, transaction, and budget records are scoped to the authenticated Clerk user.
- The assistant receives finance context from the application and is instructed not to invent financial facts or present regulated financial advice.
- The OpenAI key is read only by the server and must never be exposed in browser code or logs.
- The local assistant fallback should remain available when the external model is unavailable.

## Development conventions

- Keep API request and response shapes defined in `lib/api-spec/openapi.yaml`.
- Use generated React hooks for frontend API calls.
- Keep shared visual behavior in the shared finance components and `index.css`.
- Preserve existing `data-testid` attributes when changing UI.
- Maintain responsive behavior and visible keyboard focus states.
- Do not add emojis to the product UI.

## License

This project is licensed under the MIT License.