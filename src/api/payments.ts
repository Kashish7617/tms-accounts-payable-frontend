import { apiClient } from "../lib/apiClient";
import type { ApplyPaymentInput, Payment, PaymentMethod } from "../types";

// ── Payment method mapping ──────────────────────────────────────────────────
// Confirmed by your curl: "paymentMethod": "BANK_TRANSFER". The rest follow
// the same UPPER_SNAKE convention as the frontend's PaymentMethod union.

const METHOD_TO_BACKEND: Record<PaymentMethod, string> = {
  "Bank Transfer": "BANK_TRANSFER",
  "ACH Transfer": "ACH_TRANSFER",
  "Wire Transfer": "WIRE_TRANSFER",
  "Direct Debit": "DIRECT_DEBIT",
  Check: "CHECK",
};

const METHOD_FROM_BACKEND: Record<string, PaymentMethod> = {
  BANK_TRANSFER: "Bank Transfer",
  ACH_TRANSFER: "ACH Transfer",
  WIRE_TRANSFER: "Wire Transfer",
  DIRECT_DEBIT: "Direct Debit",
  CHECK: "Check",
};

const STATUS_FROM_BACKEND: Record<string, Payment["status"]> = {
  SUCCESS: "Success",
  COMPLETED: "Success",
  PROCESSING: "Processing",
  PENDING: "Processing",
  FAILED: "Failed",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePayment(raw: any): Payment {
  return {
    id: String(raw.id),

    invoiceId: String(raw.invoice_id),

    payer: raw.customer_name ?? "",

    paymentMethod:
      METHOD_FROM_BACKEND[raw.payment_method] ?? "Bank Transfer",

    reference: raw.payment_reference,

    amount: Number(raw.amount_cents),

    status: "Success",

    date: new Date(raw.payment_date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractListPayload(raw: any): any[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (Array.isArray(raw?.data)) {
    return raw.data;
  }

  return raw?.items ?? [];
}

/** POST /api/payments — matches your curl exactly (invoiceId, paymentReference,
 *  amount, paymentMethod). internalNotes is sent along in case the backend
 *  accepts it even though it wasn't in your sample request. */
async function apply(input: ApplyPaymentInput, signal?: AbortSignal): Promise<Payment> {
  const body = {
    invoiceId: input.invoiceId,
    paymentReference: input.paymentReference,
    amount: input.amount,
    paymentMethod: METHOD_TO_BACKEND[input.paymentMethod],
    internalNotes: input.internalNotes,
  };
  const raw: any = await apiClient.post("/payments", body, signal);

  return normalizePayment(raw.data);
}

/**
 * GET /api/payments?invoiceId=:id
 * NOT present in your Postman collection — this exact path/query wasn't
 * confirmed, so it's a best guess following REST convention. If your backend
 * uses a different route (e.g. GET /api/invoices/:id/payments), change the
 * path/params below — normalizePayment and the return type stay the same.
 */
async function listForInvoice(
  invoiceId: string,
  signal?: AbortSignal
): Promise<Payment[]> {

  const raw: any = await apiClient.get(
    "/payments",
    { invoiceId },
    signal
  );

  const payments = extractListPayload(raw);

  return payments.map(normalizePayment);
}

async function list(signal?: AbortSignal): Promise<Payment[]> {
  const raw: any = await apiClient.get(
    "/payments/all",
    undefined,
    signal
  );

  return extractListPayload(raw).map(normalizePayment);
}

export const paymentsApi = {
  apply,
  listForInvoice,
  list
};