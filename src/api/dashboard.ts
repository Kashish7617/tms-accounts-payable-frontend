import { accountsApi } from "./accounts";
// import { transactionsApi } from "./transactions";
import { invoicesApi } from "./invoices";
import { paymentsApi } from "./payments";

export const dashboardApi = {
  async getSummary(signal?: AbortSignal) {
    const [accounts, transactions, invoices, payments] = await Promise.all([
      accountsApi.list(signal),
      // transactionsApi.list(signal),
      [],
      invoicesApi.list(1, 1000, "All", "", signal),
      paymentsApi.list(signal),
    ]);

    const invoiceList = invoices.items;

    const totalRevenue = payments.reduce(
      (sum:any, p:any) => sum + p.amount,
      0
    );

    const pendingPayments = invoiceList.reduce(
      (sum:any, inv:any) => sum + inv.remainingAmount,
      0
    );

    const paidInvoices = invoiceList.filter(
      (i:any) => i.status === "Paid"
    ).length;

    const outstandingInvoices = invoiceList.filter(
      (i:any) => i.remainingAmount > 0
    ).length;

    return {
      totalAccounts: accounts.length,
      totalAccountsChangePct: 0,

      totalTransactions: transactions.length,
      totalTransactionsChangePct: 0,

      outstandingInvoices,
      outstandingInvoicesChangePct: 0,

      paidInvoices,
      paidInvoicesChangePct: 0,

      totalRevenue,
      totalRevenueChangePct: 0,

      pendingPayments,

      totalInvoiceValue: invoiceList.reduce(
        (sum:any, inv:any) => sum + inv.amount,
        0
      ),

      invoiceStatusSummary: {
        paid: invoiceList.filter((i: { status: string; }) => i.status === "Paid").length,
        sent: invoiceList.filter((i: { status: string; }) => i.status === "Sent").length,
        draft: invoiceList.filter((i: { status: string; }) => i.status === "Draft").length,
        overdue: invoiceList.filter((i: { status: string; }) => i.status === "Overdue").length,
      },

      recentTransactions: transactions.slice(0, 5),

      recentPayments: payments.slice(0, 5),
    };
  },
};