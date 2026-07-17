import { apiClient } from "../lib/apiClient";
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceLineItem,
  InvoicesSummary,
  InvoiceStatus,
  PaginatedResult,
} from "../types";

// ── Status mapping ──────────────────────────────────────────────────────────
// Confirmed by your PATCH curl: { "status": "SENT" }. Draft/Paid/Overdue follow
// the same UPPER_SNAKE convention.

type BackendStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE";

const STATUS_TO_BACKEND: Record<InvoiceStatus, BackendStatus> = {
  Draft: "DRAFT",
  Sent: "SENT",
  Paid: "PAID",
  Overdue: "OVERDUE",
};

const STATUS_FROM_BACKEND: Record<string, InvoiceStatus> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

// ── Response shape normalization ────────────────────────────────────────────
// Your create curl sends `items`, the frontend types use `lineItems`. This
// normalizer accepts either key so it keeps working whichever your GET
// responses use.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLineItems(raw: any[] = []): InvoiceLineItem[] {
  return raw.map((item) => ({
    id: String(item.id),
    description: item.description,
    quantity: Number(item.quantity),
    unitPrice: Number(
      item.unitPrice ??
      item.unit_price_cents ??
      0
    ),
  }));
}

function computeSubtotal(items: InvoiceLineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeInvoice(raw: any): Invoice {
  const invoice = raw?.data ?? raw;

  const lineItems = normalizeLineItems(
    invoice.invoice_items ??
    invoice.items ??
    invoice.lineItems ??
    []
  );

  const amount = Number(
    invoice.total_amount_cents ??
    invoice.totalAmount ??
    invoice.amount ??
    0
  );

  const paidAmount = Number(
    invoice.paid_amount_cents ??
    invoice.paidAmount ??
    0
  );
  
  const remainingAmount = Number(
    invoice.remaining_balance_cents ??
    invoice.remainingAmount ??
    Math.max(amount - paidAmount, 0)
  );

  return {
    id: String(invoice.id),

    invoiceNumber:
      invoice.invoice_number ??
      invoice.invoiceNumber ??
      "",

    customerName:
      invoice.customer_name ??
      invoice.customerName ??
      "",

    billingAddress:
      invoice.billing_address ??
      invoice.billingAddress ??
      "",

    dueDate:
      invoice.due_date ??
      invoice.dueDate ??
      "",

    status:
      STATUS_FROM_BACKEND[invoice.status] ??
      "Draft",

    lineItems,

    taxRate:
      Number(invoice.tax_rate ?? 0),

    notes:
      invoice.notes ?? "",

    paymentMethodAccountId:
      invoice.payment_method_account_id ??
      invoice.paymentMethodAccountId,

    amount,

    paidAmount,

    remainingAmount,

    createdDate:
      invoice.created_at ??
      invoice.createdDate ??
      "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractListPayload(raw: any): { items: unknown[]; total?: number } {
  if (Array.isArray(raw)) return { items: raw };
  return { items: raw?.items ?? raw?.data ?? [], total: raw?.total };
}

// ── API calls ────────────────────────────────────────────────────────────

/** POST /api/invoices — matches your curl exactly (invoiceNumber, customerName,
 *  dueDate, status, items[]). billingAddress/taxRate/notes are sent when present
 *  so the endpoint can ignore fields it doesn't support yet. */
async function create(input: CreateInvoiceInput, signal?: AbortSignal): Promise<Invoice> {
  const body = {
    invoiceNumber: input.invoiceNumber,
    customerName: input.customerName,
    billingAddress: input.billingAddress || undefined,
    dueDate: input.dueDate,
    status: STATUS_TO_BACKEND[input.status],
    taxRate: input.taxRate,
    notes: input.notes,
    paymentMethodAccountId: input.paymentMethodAccountId,
    items: input.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
  const raw :any = await apiClient.post<unknown>("/invoices", body, signal);
  return normalizeInvoice(raw.data);
}

/** PATCH /api/invoices/:id/status — matches your curl exactly. Used by
 *  InvoiceEditor's "Send Invoice" flow after creating a Draft. */
async function send(id: string, signal?: AbortSignal): Promise<Invoice> {
  debugger
  const raw :any= await apiClient.patch<unknown>(`/invoices/${id}/status`, { status: "SENT" }, signal);
  console.log(raw)
  return normalizeInvoice(raw.data);
}

/** Generic status update, in case you need it elsewhere (e.g. marking Paid manually). */
async function updateStatus(id: string, status: InvoiceStatus, signal?: AbortSignal): Promise<Invoice> {
  const raw = await apiClient.patch<unknown>(
    `/invoices/${id}/status`,
    { status: STATUS_TO_BACKEND[status] },
    signal,
  );
  return normalizeInvoice(raw);
}

/** GET /api/invoices/:id — matches your curl exactly. */
async function getById(id: string, signal?: AbortSignal): Promise<Invoice> {
  const raw = await apiClient.get<unknown>(`/invoices/${id}`, undefined, signal);
  return normalizeInvoice(raw);
}

/** GET /api/invoices — matches your curl. Adds page/pageSize/status/search as
 *  query params, and accepts either a bare array response or a
 *  { items, total } paginated response so it works with either shape. */
async function list(
  page: number,
  pageSize: number,
  tab: "All" | InvoiceStatus,
  search?: string,
  signal?: AbortSignal,
): Promise<PaginatedResult<Invoice>> {
  const raw :any = await apiClient.get<unknown>(
    "/invoices",
    {
      page,
      pageSize,
      status: tab !== "All" ? STATUS_TO_BACKEND[tab] : undefined,
      search,
    },
    signal,
  );

  const { items: rawItems, total: rawTotal } = extractListPayload(raw);
  const items = rawItems.map(normalizeInvoice);
  const total = rawTotal ?? items.length;

  return { items, total, page, pageSize };
}

/**
 * GET /api/invoices/summary
 * NOT present in your Postman collection — this endpoint wasn't confirmed, so
 * this falls back to fetching a large page of invoices and computing the
 * dashboard numbers on the client. Swap in a real endpoint call here if/when
 * your backend exposes one; the return shape (InvoicesSummary) stays the same
 * either way, so no component changes would be needed.
 */
async function getSummary(signal?: AbortSignal): Promise<InvoicesSummary> {
  const { items } = await list(1, 500, "All", undefined, signal);

  const totalOutstanding = items
    .filter((inv) => inv.status !== "Paid")
    .reduce((sum, inv) => sum + inv.remainingAmount, 0);

  const overdueInvoices = items.filter((inv) => inv.status === "Overdue");
  const overdueBalance = overdueInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);

  const sentInvoices = items.filter((inv) => inv.status === "Sent");
  const pendingApproval = sentInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);

  const paymentsReceived = items.reduce((sum, inv) => sum + inv.paidAmount, 0);

  return {
    totalOutstanding,
    totalOutstandingChangePct: 0,
    overdueBalance,
    overdueCount: overdueInvoices.length,
    pendingApproval,
    pendingApprovalCount: sentInvoices.length,
    paymentsReceived,
    paymentsReceivedPeriodLabel: "All Time",
  };
}

export const invoicesApi = {
  create,
  send,
  updateStatus,
  getById,
  list,
  getSummary,
};