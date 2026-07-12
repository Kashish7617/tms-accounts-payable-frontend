import { useEffect, useState } from "react";
import { Landmark, ArrowLeftRight, PackageCheck, DollarSign, Clock, Gauge } from "lucide-react";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { dashboardApi } from "../api/dashboard";
import { formatCurrency } from "../lib/validation";
import type { DashboardSummary } from "../types";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
console.log('summary', summary)
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await dashboardApi.getSummary(controller.signal);
        setSummary(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Couldn't load the dashboard. Try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading dashboard…</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!summary) return null;

  const statusRows: Array<{ key: keyof DashboardSummary["invoiceStatusSummary"]; label: string; dot: string }> = [
    { key: "paid", label: "Paid", dot: "bg-emerald-500" },
    { key: "sent", label: "Sent", dot: "bg-blue-500" },
    { key: "draft", label: "Draft", dot: "bg-slate-400" },
    { key: "overdue", label: "Overdue", dot: "bg-red-500" },
  ];
  const totalStatusCount = statusRows.reduce((sum, row) => sum + summary.invoiceStatusSummary[row.key], 0) || 1;

  return (
    <div className="flex h-full flex-col">
      <Topbar title="Dashboard" searchPlaceholder="Search transactions, invoices, or accounts..." />

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
  icon={Landmark}
  label="Total Accounts"
  value={summary.totalAccounts.toLocaleString()}
  neutral
/>

<StatCard
  icon={ArrowLeftRight}
  label="Total Transactions"
  value={summary.totalTransactions.toLocaleString()}
  neutral
  iconBgClassName="bg-indigo-50 text-indigo-600"
/>

<StatCard
  icon={Clock}
  label="Outstanding Invoices"
  value={summary.outstandingInvoices.toLocaleString()}
  neutral
  iconBgClassName="bg-orange-50 text-orange-600"
/>

<StatCard
  icon={PackageCheck}
  label="Paid Invoices"
  value={summary.paidInvoices.toLocaleString()}
  neutral
  iconBgClassName="bg-emerald-50 text-emerald-600"
/>

<StatCard
  icon={DollarSign}
  label="Total Revenue"
  value={formatCurrency(summary.totalRevenue)}
  neutral
/>

<StatCard
  icon={Gauge}
  label="Pending Payments"
  value={formatCurrency(summary.pendingPayments)}
  neutral
  iconBgClassName="bg-violet-50 text-violet-600"
/>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
              {/* <button type="button" className="text-xs font-medium text-blue-600 hover:underline">
                View All
              </button> */}
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="pb-2 font-medium">Transaction ID</th>
                  <th className="pb-2 font-medium">Entity</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
  {summary.recentPayments.map((payment) => (
    <tr key={payment.id} className="border-t border-slate-100">
      <td className="py-2.5 font-medium text-blue-600">
        {payment.reference}
      </td>
      <td className="py-2.5 text-slate-700">
        {payment.payer}
      </td>
      <td className="py-2.5 text-slate-500">
        {payment.date}
      </td>
      <td className="py-2.5 text-slate-700">
        {formatCurrency(payment.amount)}
      </td>
      <td className="py-2.5">
        <StatusBadge status={payment.status} />
      </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Invoice Status Summary</h2>
            <div className="space-y-3">
              {statusRows.map((row) => {
                const count = summary.invoiceStatusSummary[row.key];
                const pct = (count / totalStatusCount) * 100;
                return (
                  <div key={row.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                        {row.label}
                      </span>
                      <span className="font-medium text-slate-800">{count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div className={`h-1.5 rounded-full ${row.dot}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs text-slate-400">Total Value</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(summary.totalInvoiceValue)}</p>
              </div>
              {/* <button
                type="button"
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                Generate Report
              </button> */}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Payments</h2>
            {/* <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              Export CSV
            </button> */}
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="pb-2 font-medium">Payer</th>
                <th className="pb-2 font-medium">Payment Method</th>
                <th className="pb-2 font-medium">Reference</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentPayments.map((payment) => (
                <tr key={payment.id} className="border-t border-slate-100">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                        {payment.payer
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <span className="text-slate-700">{payment.payer}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-slate-500">{payment.paymentMethod}</td>
                  <td className="py-2.5 text-slate-500">{payment.reference}</td>
                  <td className="py-2.5 text-slate-700">{formatCurrency(payment.amount)}</td>
                  <td className="py-2.5">
                    <StatusBadge status={payment.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
