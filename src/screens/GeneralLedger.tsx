import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Calendar, Plus } from "lucide-react";
import Topbar from "../components/Topbar";
import StatusBadge from "../components/StatusBadge";
import { accountsApi } from "../api/accounts";
import { ledgerApi } from "../api/ledger";
import { formatCurrency, required, runValidators, positiveNumber } from "../lib/validation";
import type { Account, CreateLedgerEntryInput, LedgerEntry } from "../types";
import { ApiRequestError } from "../lib/apiClient";

const PAGE_SIZE = 4;

export default function GeneralLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const total = entries.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pagedEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return entries.slice(start, start + PAGE_SIZE);
  }, [entries, page]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setEntries(await ledgerApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the ledger.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="flex h-full flex-col">
      <Topbar title="General Ledger" searchPlaceholder="Search entries, accounts, or references..." />

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">General Ledger</h2>
            <p className="text-sm text-slate-500">Real-time double-entry financial monitoring.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Calendar size={15} />
              All transactions
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={15} />
              Create Transaction
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Debit Account</th>
                <th className="px-4 py-3 font-medium">Credit Account</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400">
                    Loading ledger entries…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-red-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && pagedEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                pagedEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-blue-600">{entry.reference}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.description}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {entry.debitAccount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {entry.creditAccount}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatCurrency(entry.amount, entry.currency)}
                      {/* {entry.amount} */}
                      <span className="ml-1 text-xs text-slate-400">{entry.currency}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{entry.date}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={entry.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>
              Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} entries
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded-lg text-xs font-medium ${
                    p === page ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <CreateTransactionModal
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            setPage(1);
            load();
          }}
        />
      )}
    </div>
  );
}

interface FormState {
  reference: string;
  description: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: string;
}

const INITIAL: FormState = {
  reference: "",
  description: "",
  debitAccountId: "",
  creditAccountId: "",
  amount: "",
};

function CreateTransactionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    accountsApi
      .list()
      .then(setAccounts)
      .catch(() => setSubmitError("Couldn't load accounts. Try again."))
      .finally(() => setAccountsLoading(false));
  }, []);

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};

    const referenceError = runValidators(form.reference, [required("Reference")]);
    if (referenceError) errors.reference = referenceError;

    const descError = runValidators(form.description, [required("Description")]);
    if (descError) errors.description = descError;

    const debitError = runValidators(form.debitAccountId, [required("Debit account")]);
    if (debitError) errors.debitAccountId = debitError;

    const creditError = runValidators(form.creditAccountId, [required("Credit account")]);
    if (creditError) errors.creditAccountId = creditError;

    if (
      !errors.debitAccountId &&
      !errors.creditAccountId &&
      form.debitAccountId === form.creditAccountId
    ) {
      errors.creditAccountId = "Credit account must be different from the debit account.";
    }

    const amountNum = Number(form.amount);
    const amountError =
      form.amount.trim() === "" ? "Amount is required." : runValidators(amountNum, [positiveNumber("Amount")]);
    if (amountError) errors.amount = amountError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const input: CreateLedgerEntryInput = {
      reference: form.reference.trim(),
      description: form.description.trim(),
      debitAccountId: form.debitAccountId,
      creditAccountId: form.creditAccountId,
      amount: Math.round(Number(form.amount) * 100),
    };

    setSubmitting(true);
    try {
      await ledgerApi.create(input);
      onCreated();
    } catch (err) {
      if (err instanceof ApiRequestError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors as Partial<Record<keyof FormState, string>>);
      } else {
        setSubmitError(err instanceof Error ? err.message : "Couldn't create the transaction. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Create Transaction</h3>
        <p className="mb-4 text-sm text-slate-500">Record a new double-entry ledger transaction.</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="txn-reference">
              Reference
            </label>
            <input
              id="txn-reference"
              type="text"
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.reference ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
              }`}
              placeholder="e.g. TXN-1001"
            />
            {fieldErrors.reference && <p className="mt-1 text-xs text-red-600">{fieldErrors.reference}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="txn-description">
              Description
            </label>
            <input
              id="txn-description"
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.description ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
              }`}
              placeholder="e.g. Vendor Payment"
            />
            {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="txn-debit">
                Debit Account
              </label>
              <select
                id="txn-debit"
                value={form.debitAccountId}
                onChange={(e) => setForm((f) => ({ ...f, debitAccountId: e.target.value }))}
                disabled={accountsLoading}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.debitAccountId ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              {fieldErrors.debitAccountId && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.debitAccountId}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="txn-credit">
                Credit Account
              </label>
              <select
                id="txn-credit"
                value={form.creditAccountId}
                onChange={(e) => setForm((f) => ({ ...f, creditAccountId: e.target.value }))}
                disabled={accountsLoading}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.creditAccountId ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              {fieldErrors.creditAccountId && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.creditAccountId}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="txn-amount">
              Amount
            </label>
            <input
              id="txn-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.amount ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
              }`}
              placeholder="500.00"
            />
            <p className="mt-1 text-xs text-slate-400">Enter amount in dollars (e.g. 500.00)</p>
            {fieldErrors.amount && <p className="mt-1 text-xs text-red-600">{fieldErrors.amount}</p>}
          </div>

          {submitError && <p className="text-xs text-red-600">{submitError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || accountsLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Post Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
