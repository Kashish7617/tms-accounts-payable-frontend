# TMS Fintech UI

React + TypeScript screens for the TMS Fintech dashboard, built from the reference
screenshots (Dashboard, Accounts Management, General Ledger, Invoice Management,
Invoice Editor, Apply Payment).

## Structure

```
src/
  types/index.ts        All shared TypeScript interfaces (Account, Invoice, Payment, etc.)
  lib/apiClient.ts       fetch wrapper: base URL, JSON handling, typed errors
  lib/validation.ts      Reusable field validators (required, positiveNumber, dates, etc.)
  api/                    One module per resource — accounts, invoices, ledger, payments, dashboard
  components/             Shared UI: Sidebar, Topbar, StatCard, StatusBadge
  screens/
    Dashboard.tsx
    AccountsManagement.tsx   (includes Create Account modal)
    GeneralLedger.tsx        (includes Create Transaction modal)
    InvoiceManagement.tsx    (list + filters + summary cards)
    InvoiceEditor.tsx        (line items, live totals, Save Draft / Send Invoice)
    InvoiceDetails.tsx       (invoice detail + payment history)
    ApplyPaymentModal.tsx    (slide-over payment form)
  App.tsx                 Wires sidebar navigation to screens
```

## How the pieces fit together

- **`App.tsx`** owns top-level navigation. Drop it into your existing app (or use it
  as the reference for wiring these screens into your own router).
- Every screen fetches its own data via the `api/*` modules — no prop-drilling of
  server state between screens.
- All forms validate client-side (`lib/validation.ts`) before submitting, and also
  surface `fieldErrors` returned from the backend (see `ApiRequestError`), so
  server-side validation failures render the same way client-side ones do.

## Backend contract

The frontend never talks to Supabase directly — it calls your backend's REST API,
which is the only place `SUPABASE_SERVICE_ROLE_KEY` should live. Set the API base
URL via an env var:

```
VITE_API_BASE_URL=https://your-backend.example.com/api
```

Expected endpoints (adjust paths in `src/api/*.ts` to match your actual routes):

| Method | Path | Used by |
|---|---|---|
| GET | `/dashboard/summary` | Dashboard |
| GET | `/accounts` | Accounts Management (paginated list) |
| GET | `/accounts/summary` | Accounts Management (top stat cards) |
| POST | `/accounts` | Create Account modal |
| GET | `/ledger` | General Ledger |
| POST | `/ledger` | Create Transaction modal |
| GET | `/ledger/export` | Export CSV button |
| GET | `/invoices` | Invoice Management (paginated, filterable) |
| GET | `/invoices/summary` | Invoice Management stat cards |
| GET | `/invoices/:id` | Invoice Details |
| POST | `/invoices` | Invoice Editor (Save Draft / Send Invoice) |
| POST | `/invoices/:id/send` | Invoice Editor (Send Invoice) |
| GET | `/invoices/:id/payments` | Invoice Details payment history |
| POST | `/invoices/:id/payments` | Apply Payment modal |

Every list endpoint is expected to return:

```ts
{ items: T[], total: number, page: number, pageSize: number }
```

Errors are expected as JSON:

```ts
{ message: string, fieldErrors?: Record<string, string> }
```

## Setup

```bash
npm install lucide-react
```

(`react`, `react-dom`, and TypeScript are assumed to already be in your project.)

Then set `VITE_API_BASE_URL` in your `.env`, and render `<App />` from your entry
point — or import individual screens directly if you already have your own
router/layout.
