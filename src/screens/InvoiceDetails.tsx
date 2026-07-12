import { useEffect, useState } from "react";
import { ArrowLeft, PlusCircle } from "lucide-react";
import Topbar from "../components/Topbar";
import StatusBadge from "../components/StatusBadge";
import ApplyPaymentModal from "./ApplyPaymentModal";
import { invoicesApi } from "../api/invoices";
import { paymentsApi } from "../api/payments";
import { formatCurrency } from "../lib/validation";
import type { Invoice, Payment } from "../types";

interface InvoiceDetailsProps {
  invoiceId: string;
  onBack: () => void;
}

export default function InvoiceDetails({ invoiceId, onBack }: InvoiceDetailsProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [invoiceData, paymentsData] = await Promise.all([
        invoicesApi.getById(invoiceId),
        paymentsApi.listForInvoice(invoiceId),
      ]);
      console.log(invoiceData)
      
      setInvoice(invoiceData);
      setPayments(paymentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this invoice.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading invoice…</div>;
  if (error || !invoice) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? "Invoice not found."}
        </div>
      </div>
    );
  }

  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * invoice.taxRate;

  return (
    <div className="flex h-full flex-col">
      <Topbar
        title="Invoice Details"
        actions={
          invoice.remainingAmount > 0 ? (
            <button
              type="button"
              onClick={() => setPaymentModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <PlusCircle size={16} />
              New Payment
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={15} />
          Back to invoices
        </button>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400">Invoice {invoice.invoiceNumber}</p>
            <h2 className="text-xl font-semibold text-slate-900">{invoice.customerName}</h2>
            <p className="text-sm text-slate-500">Created {invoice.createdDate} · Due {invoice.dueDate}</p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Line Items</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-400">
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 font-medium">Unit Price</th>
                    <th className="pb-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="py-2 text-slate-700">{item.description}</td>
                      <td className="py-2 text-slate-500">{item.quantity}</td>
                      <td className="py-2 text-slate-500">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 text-slate-700">{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({(invoice.taxRate * 100).toFixed(1)}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.amount)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Payment History</h3>
              {payments.length === 0 ? (
                <p className="text-sm text-slate-400">No payments recorded yet.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Method</th>
                      <th className="pb-2 font-medium">Reference</th>
                      <th className="pb-2 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-t border-slate-100">
                        <td className="py-2 text-slate-500">{payment.date}</td>
                        <td className="py-2 text-slate-600">{payment.paymentMethod}</td>
                        <td className="py-2 text-slate-500">{payment.reference}</td>
                        <td className="py-2 text-slate-700">{formatCurrency(payment.amount)}</td>
                        <td className="py-2">
                          <StatusBadge status={payment.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Balance</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Invoice Total</span>
                <span className="font-medium text-slate-900">{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Paid Amount</span>
                <span className="font-medium text-slate-900">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-semibold text-blue-700">
                <span>Remaining</span>
                <span>{formatCurrency(invoice.remainingAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {paymentModalOpen && (
        <ApplyPaymentModal
          invoice={invoice}
          onClose={() => setPaymentModalOpen(false)}
          onApplied={() => {
            setPaymentModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
