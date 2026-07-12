// ── Shared domain types ────────────────────────────────────────────────────

export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "REVENUE"
  | "EXPENSE";

export type Currency = "USD" | "EUR" | "GBP";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  createdAt: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: Currency;
}

export type TransactionStatus = "Completed" | "Pending" | "Flagged" | "Posted";

export interface Transaction {
  id: string;
  transactionRefId: string; // e.g. TXN-90218
  entity: string;
  date: string;
  amount: number;
  status: TransactionStatus;
}

export interface LedgerEntry {
  id: string;
  reference: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency: Currency;
  date: string;
  status: "Posted";
}

export interface CreateLedgerEntryInput {
  reference: string;
  description: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
}

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
export type PaymentMethod = "Bank Transfer" | "ACH Transfer" | "Wire Transfer" | "Direct Debit" | "Check";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2024-001
  customerName: string;
  billingAddress: string;
  dueDate: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  taxRate: number; // e.g. 0.085
  notes?: string;
  paymentMethodAccountId?: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  createdDate: string;
}

export interface CreateInvoiceInput {
  customerName: string;
  billingAddress: string;
  invoiceNumber: string;
  dueDate: string;
  lineItems: Omit<InvoiceLineItem, "id">[];
  taxRate: number;
  notes?: string;
  paymentMethodAccountId?: string;
  status: "Draft" | "Sent";
}

export interface Payment {
  id: string;
  invoiceId: string;
  payer: string;
  paymentMethod: PaymentMethod;
  reference: string;
  amount: number;
  status: "Success" | "Processing" | "Failed";
  date: string;
}

export interface ApplyPaymentInput {
  invoiceId: string;
  amount: number;
  paymentReference: string;
  paymentMethod: PaymentMethod;
  internalNotes?: string;
}

export interface DashboardSummary {
  totalAccounts: number;
  totalAccountsChangePct: number;
  totalTransactions: number;
  totalTransactionsChangePct: number;
  outstandingInvoices: number;
  outstandingInvoicesChangePct: number;
  paidInvoices: number;
  paidInvoicesChangePct: number;
  totalRevenue: number;
  totalRevenueChangePct: number;
  pendingPayments: number;
  invoiceStatusSummary: {
    paid: number;
    sent: number;
    draft: number;
    overdue: number;
  };
  totalInvoiceValue: number;
  recentTransactions: Transaction[];
  recentPayments: Payment[];
}

export interface AccountsSummary {
  totalNetBalance: number;
  totalNetBalanceChangePct: number;
  operationalAssets: number;
  operationalAssetsCount: number;
  totalLiabilities: number;
  totalLiabilitiesCreditLines: number;
  pendingInvoices: number;
  pendingInvoicesAwaitingSettlement: number;
}

export interface InvoicesSummary {
  totalOutstanding: number;
  totalOutstandingChangePct: number;
  overdueBalance: number;
  overdueCount: number;
  pendingApproval: number;
  pendingApprovalCount: number;
  paymentsReceived: number;
  paymentsReceivedPeriodLabel: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  fieldErrors?: Record<string, string>;
}
