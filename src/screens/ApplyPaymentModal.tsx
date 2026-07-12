import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { paymentsApi } from "../api/payments";
import { formatCurrency, required, runValidators, positiveNumber, maxAmount } from "../lib/validation";
import type { ApplyPaymentInput, Invoice, PaymentMethod } from "../types";
import { ApiRequestError } from "../lib/apiClient";

const PAYMENT_METHODS: PaymentMethod[] = ["Bank Transfer", "ACH Transfer", "Wire Transfer", "Direct Debit", "Check"];

interface ApplyPaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onApplied: () => void;
}

export default function ApplyPaymentModal({ invoice, onClose, onApplied }: ApplyPaymentModalProps) {
  console.log("page called")
  const [amount, setAmount] = useState(invoice.remainingAmount.toFixed(2));
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Bank Transfer");
  const [internalNotes, setInternalNotes] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Close on Escape for keyboard accessibility.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    const amountNum = Number(amount);
    const amountError =
      amount.trim() === ""
        ? "Payment amount is required."
        : runValidators(amountNum, [
            positiveNumber("Payment amount"),
            maxAmount("Payment amount", invoice.remainingAmount),
          ]);
    if (amountError) errors.amount = amountError;

    const referenceError = runValidators(reference, [required("Payment reference")]);
    if (referenceError) errors.reference = referenceError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const input: ApplyPaymentInput = {
      invoiceId: invoice.id,
      amount: Number(amount),
      paymentReference: reference.trim(),
      paymentMethod: method,
      internalNotes: internalNotes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await paymentsApi.apply(input);
      onApplied();
    } catch (err) {
      if (err instanceof ApiRequestError && err.fieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      } else {
        setSubmitError(err instanceof Error ? err.message : "Couldn't apply the payment. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Apply Payment</h3>
            <p className="text-xs text-slate-400">Invoice {invoice.invoiceNumber}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Payment Snapshot</p>
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-xs text-slate-400">Invoice Total</p>
              <p className="font-semibold text-slate-900">{formatCurrency(invoice.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Paid Amount</p>
              <p className="font-semibold text-slate-900">{formatCurrency(invoice.paidAmount)}</p>
            </div>
          </div>
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-400">Remaining Balance</p>
            <p className="text-lg font-semibold text-blue-700">{formatCurrency(invoice.remainingAmount)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="payment-amount">
              Payment Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                id="payment-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full rounded-lg border py-2 pl-6 pr-3 text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.amount ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              />
            </div>
            {fieldErrors.amount ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.amount}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">Auto-filled with full remaining balance</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="payment-reference">
              Payment Reference
            </label>
            <input
              id="payment-reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Check #5021 or Wire ID"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.reference ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.reference && <p className="mt-1 text-xs text-red-600">{fieldErrors.reference}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="payment-method">
              Payment Method
            </label>
            <select
              id="payment-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="internal-notes">
              Internal Notes
            </label>
            <textarea
              id="internal-notes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes for the finance team..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {submitError && <p className="text-xs text-red-600">{submitError}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Applying…" : "Apply Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
