import { useMemo, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import Topbar from "../components/Topbar";
import { invoicesApi } from "../api/invoices";
import { formatCurrency, required, runValidators, positiveNumber, isFutureOrTodayDate, nonNegativeNumber } from "../lib/validation";
import type { CreateInvoiceInput, InvoiceLineItem } from "../types";
import { ApiRequestError } from "../lib/apiClient";

interface DraftLineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

interface InvoiceEditorProps {
  onSaved: (invoiceId: string) => void;
  onCancel: () => void;
}

let nextLineId = 1;

export default function InvoiceEditor({ onSaved, onCancel }: InvoiceEditorProps) {
  console.log("this component is rendered")
  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("2024-001");
  const [billingAddress, setBillingAddress] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxRatePct, setTaxRatePct] = useState("8.5");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([
    { id: String(nextLineId++), description: "", quantity: "1", unitPrice: "0" },
  ]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lineItemErrors, setLineItemErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "send" | null>(null);

  const { subtotal, taxAmount, grandTotal } = useMemo(() => {
    const sub = lineItems.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
    const rate = Number(taxRatePct) || 0;
    const tax = sub * (rate / 100);
    return { subtotal: sub, taxAmount: tax, grandTotal: sub + tax };
  }, [lineItems, taxRatePct]);

  function updateLineItem(id: string, patch: Partial<DraftLineItem>) {
    setLineItems((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addLineItem() {
    setLineItems((items) => [...items, { id: String(nextLineId++), description: "", quantity: "1", unitPrice: "0" }]);
  }

  function removeLineItem(id: string) {
    setLineItems((items) => (items.length > 1 ? items.filter((item) => item.id !== id) : items));
  }

  function validate(status: "Draft" | "Sent"): boolean {
    const errors: Record<string, string> = {};
    const lineErrors: Record<string, string> = {};

    const nameError = runValidators(customerName, [required("Customer name")]);
    if (nameError) errors.customerName = nameError;

    const invoiceNumError = runValidators(invoiceNumber, [required("Invoice number")]);
    if (invoiceNumError) errors.invoiceNumber = invoiceNumError;

    // Billing address and due date are required to send, optional while drafting.
    if (status === "Sent") {
      const addressError = runValidators(billingAddress, [required("Billing address")]);
      if (addressError) errors.billingAddress = addressError;

      const dueDateError = runValidators(dueDate, [isFutureOrTodayDate("Due date")]);
      if (dueDateError) errors.dueDate = dueDateError;
    } else if (dueDate) {
      const dueDateError = runValidators(dueDate, [isFutureOrTodayDate("Due date")]);
      if (dueDateError) errors.dueDate = dueDateError;
    }

    const taxError = runValidators(Number(taxRatePct), [nonNegativeNumber("Tax rate")]);
    if (taxError) errors.taxRatePct = taxError;

    const hasAnyLineContent = lineItems.some((item) => item.description.trim() !== "");
    if (status === "Sent" && !hasAnyLineContent) {
      errors.lineItems = "Add at least one line item before sending the invoice.";
    }

    lineItems.forEach((item) => {
      if (item.description.trim() === "" && !hasAnyLineContent) return; // fully empty single row is fine for drafts
      if (status === "Sent" || item.description.trim() !== "") {
        const descError = runValidators(item.description, [required("Description")]);
        if (descError) lineErrors[`${item.id}-description`] = descError;

        const qtyError = runValidators(Number(item.quantity), [positiveNumber("Quantity")]);
        if (qtyError) lineErrors[`${item.id}-quantity`] = qtyError;

        const priceError = runValidators(Number(item.unitPrice), [nonNegativeNumber("Unit price")]);
        if (priceError) lineErrors[`${item.id}-unitPrice`] = priceError;
      }
    });

    setFieldErrors(errors);
    setLineItemErrors(lineErrors);
    return Object.keys(errors).length === 0 && Object.keys(lineErrors).length === 0;
  }

  async function handleSubmit(status: "Draft" | "Sent") {
    setSubmitError(null);
    if (!validate(status)) return;

    const cleanLineItems: Omit<InvoiceLineItem, "id">[] = lineItems
      .filter((item) => item.description.trim() !== "")
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      }));

    const input: CreateInvoiceInput = {
      customerName: customerName.trim(),
      billingAddress: billingAddress.trim(),
      invoiceNumber: invoiceNumber.trim(),
      dueDate,
      lineItems: cleanLineItems,
      taxRate: (Number(taxRatePct) || 0) / 100,
      notes: notes.trim() || undefined,
      status,
    };

    setSaving(status === "Draft" ? "draft" : "send");
    try {
      debugger
      const created :any = await invoicesApi.create({
        ...input,
        status: "Draft",
      });
      
      console.log("Create Response", created);
      
      const invoiceId = created?.id;
      
      if (!invoiceId) {
        throw new Error("Invoice ID not returned from create API");
      }
      debugger
      const invoice = await invoicesApi.send(invoiceId);
      
      console.log("Send Response", invoice);
      
      onSaved(invoiceId);
    } catch (err) {
      if (err instanceof ApiRequestError && err.fieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      } else {
        setSubmitError(err instanceof Error ? err.message : "Couldn't save the invoice. Try again.");
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Topbar title="Invoice Editor" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Invoices / New Invoice</p>
            <h2 className="text-xl font-semibold text-slate-900">Invoice Editor</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => handleSubmit("Draft")}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {saving === "draft" ? "Saving…" : "Save Draft"}
            </button>
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => handleSubmit("Sent")}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Send size={15} />
              {saving === "send" ? "Sending…" : "Send Invoice"}
            </button>
          </div>
        </div>

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="customer-name">
                    Customer Name
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Select or type customer name"
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.customerName ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                    }`}
                  />
                  {fieldErrors.customerName && <p className="mt-1 text-xs text-red-600">{fieldErrors.customerName}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="invoice-number">
                    Invoice Number
                  </label>
                  <div className="flex items-center">
                    <span className="rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                      INV-
                    </span>
                    <input
                      id="invoice-number"
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className={`w-full rounded-r-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        fieldErrors.invoiceNumber ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                      }`}
                    />
                  </div>
                  {fieldErrors.invoiceNumber && <p className="mt-1 text-xs text-red-600">{fieldErrors.invoiceNumber}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="billing-address">
                  Billing Address
                </label>
                <input
                  id="billing-address"
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP"
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    fieldErrors.billingAddress ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                  }`}
                />
                {fieldErrors.billingAddress && <p className="mt-1 text-xs text-red-600">{fieldErrors.billingAddress}</p>}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="due-date">
                    Due Date
                  </label>
                  <input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.dueDate ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                    }`}
                  />
                  {fieldErrors.dueDate && <p className="mt-1 text-xs text-red-600">{fieldErrors.dueDate}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="tax-rate">
                    Tax Rate (%)
                  </label>
                  <input
                    id="tax-rate"
                    type="number"
                    step="0.1"
                    value={taxRatePct}
                    onChange={(e) => setTaxRatePct(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.taxRatePct ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                    }`}
                  />
                  {fieldErrors.taxRatePct && <p className="mt-1 text-xs text-red-600">{fieldErrors.taxRatePct}</p>}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Line Items</h3>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  <Plus size={14} />
                  Add Row
                </button>
              </div>
              {fieldErrors.lineItems && <p className="mb-2 text-xs text-red-600">{fieldErrors.lineItems}</p>}

              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-400">
                    <th className="pb-2 font-medium">Description</th>
                    <th className="w-16 pb-2 font-medium">Qty</th>
                    <th className="w-28 pb-2 font-medium">Unit Price</th>
                    <th className="w-24 pb-2 font-medium">Total</th>
                    <th className="w-8 pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => {
                    const qty = Number(item.quantity) || 0;
                    const price = Number(item.unitPrice) || 0;
                    return (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                            placeholder="Service or product"
                            className={`w-full rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                              lineItemErrors[`${item.id}-description`]
                                ? "border-red-300 focus:ring-red-100"
                                : "border-slate-200 focus:ring-blue-100"
                            }`}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, { quantity: e.target.value })}
                            className={`w-full rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                              lineItemErrors[`${item.id}-quantity`]
                                ? "border-red-300 focus:ring-red-100"
                                : "border-slate-200 focus:ring-blue-100"
                            }`}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(item.id, { unitPrice: e.target.value })}
                            className={`w-full rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                              lineItemErrors[`${item.id}-unitPrice`]
                                ? "border-red-300 focus:ring-red-100"
                                : "border-slate-200 focus:ring-blue-100"
                            }`}
                          />
                        </td>
                        <td className="py-2 pr-2 text-slate-700">{formatCurrency(qty * price)}</td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => removeLineItem(item.id)}
                            aria-label="Remove line item"
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="notes">
                Notes & Terms
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Enter any additional notes or payment terms for the customer..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({taxRatePct || 0}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
                  <span>Grand Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
              This invoice will be sent via the customer portal. The customer will receive an email with a secure
              payment link.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
