import { useEffect, useState } from "react";
import { Filter, Download, Plus, MoreVertical } from "lucide-react";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { invoicesApi } from "../api/invoices";
import { formatCurrency } from "../lib/validation";
import type { Invoice, InvoicesSummary, InvoiceStatus } from "../types";
import { DollarSign, AlertTriangle, Send, CheckCircle2 } from "lucide-react";

const PAGE_SIZE = 10;
const TABS: Array<"All" | InvoiceStatus> = ["All", "Paid", "Sent", "Overdue", "Draft"];

interface InvoiceManagementProps {
  onCreateInvoice: () => void;
  onOpenInvoice: (invoiceId: string) => void;
}

/** Builds up to 2 initials from a name, safe against missing/empty names. */
function getInitials(name: string | undefined | null): string {
  if (!name) return "?";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return initials || "?";
}

export default function InvoiceManagement({ onCreateInvoice, onOpenInvoice }: InvoiceManagementProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"All" | InvoiceStatus>("All");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState<InvoicesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(currentPage: number, currentTab: typeof tab, currentSearch: string) {
    setLoading(true);
    setError(null);
    try {
      const [list, summaryData] = await Promise.all([
        invoicesApi.list(currentPage, PAGE_SIZE, currentTab, currentSearch || undefined),
        invoicesApi.getSummary(),
      ]);
      console.log(list)
      console.log(summary)

      setInvoices(list.items);
      setTotal(list.total);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page, tab, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tab]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      load(1, tab, search);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex h-full flex-col">
      <Topbar
        title="Invoice Management"
        searchPlaceholder="Search invoices, customers, or amounts..."
        searchValue={search}
        onSearchChange={setSearch}
        actions={
          <button
            type="button"
            onClick={onCreateInvoice}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Create Invoice
          </button>
        }
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Invoice Management</h2>
          <p className="text-sm text-slate-500">Manage and track enterprise-grade freight & logistics billing.</p>
        </div>

        {summary && (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <StatCard
      icon={DollarSign}
      label="Total Outstanding"
      value={formatCurrency(summary.totalOutstanding)}
      changePct={summary.totalOutstandingChangePct}
    />

    <StatCard
      icon={AlertTriangle}
      label={`${summary.overdueCount} Invoices`}
      value={formatCurrency(summary.overdueBalance)}
      neutral
      changeLabel="Overdue Balance"
      iconBgClassName="bg-red-50 text-red-600"
    />

    <StatCard
      icon={Send}
      label={`${summary.pendingApprovalCount} Invoices`}
      value={formatCurrency(summary.pendingApproval)}
      neutral
      changeLabel="Pending Approval"
      iconBgClassName="bg-blue-50 text-blue-600"
    />

    <StatCard
      icon={CheckCircle2}
      label={summary.paymentsReceivedPeriodLabel}
      value={formatCurrency(summary.paymentsReceived)}
      neutral
      changeLabel=""
      iconBgClassName="bg-emerald-50 text-emerald-600"
    />
  </div>
)}

        {/* <div className="flex items-center gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div> */}

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Recent Invoices</h3>
            <div className="flex items-center gap-2">
              {/* <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Filter size={14} />
                Filter
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Download size={14} />
                Export
              </button> */}
            </div>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Remaining</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {/* <th className="px-4 py-3 font-medium">Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">
                    Loading invoices…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-red-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">
                    No invoices found for this filter.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => onOpenInvoice(invoice.id)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-blue-600">#{invoice.invoiceNumber ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                          {getInitials(invoice.customerName)}
                        </div>
                        <span className="text-slate-700">{invoice.customerName || "Unknown Customer"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{invoice.dueDate || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(invoice.amount)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(invoice.paidAmount)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(invoice.remainingAmount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status} />
                    </td>
                    {/* <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button type="button" aria-label="More actions" className="rounded p-1 hover:bg-slate-100">
                        <MoreVertical size={16} className="text-slate-400" />
                      </button>
                    </td> */}
                  </tr>
                ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>
              Showing {invoices.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} invoices
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}