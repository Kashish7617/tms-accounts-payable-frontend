import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Wallet, Landmark, CreditCard, PiggyBank } from "lucide-react";

import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import { accountsApi } from "../api/accounts";
import { runValidators, required } from "../lib/validation";
import { ApiRequestError } from "../lib/apiClient";
import type { Account, AccountType, Currency, CreateAccountInput } from "../types";

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "ASSET", label: "Asset" },
  { value: "LIABILITY", label: "Liability" },
  { value: "EQUITY", label: "Equity" },
  { value: "REVENUE", label: "Revenue" },
  { value: "EXPENSE", label: "Expense" },
];

const CURRENCY_OPTIONS: Currency[] = ["USD", "EUR", "GBP"];

const ACCOUNT_TYPE_STYLES: Record<AccountType, string> = {
  ASSET: "bg-emerald-100 text-emerald-700",
  LIABILITY: "bg-rose-100 text-rose-700",
  EQUITY: "bg-violet-100 text-violet-700",
  REVENUE: "bg-sky-100 text-sky-700",
  EXPENSE: "bg-amber-100 text-amber-700",
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: "Asset",
  LIABILITY: "Liability",
  EQUITY: "Equity",
  REVENUE: "Revenue",
  EXPENSE: "Expense",
};

type FormState = {
  name: string;
  type: AccountType;
  currency: Currency;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  name: "",
  type: "ASSET",
  currency: "USD",
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
};

export default function AccountsManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const assetCount = useMemo(
    () => accounts.filter((account) => account.type === "ASSET").length,
    [accounts]
  );

  const liabilityCount = useMemo(
    () => accounts.filter((account) => account.type === "LIABILITY").length,
    [accounts]
  );

  const otherCount = useMemo(
    () =>
      accounts.filter((account) =>
        ["EQUITY", "REVENUE", "EXPENSE"].includes(account.type)
      ).length,
    [accounts]
  );

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setPageError("");
      setAccounts(await accountsApi.list());
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: FormErrors = {
      name: runValidators(form.name, [required("Account name is required")]),
    };

    if (!form.type) errors.type = "Account type is required";
    if (!form.currency) errors.currency = "Currency is required";

    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setPageError("");

      const payload: CreateAccountInput = {
        name: form.name.trim(),
        type: form.type,
        currency: form.currency,
      };

      const createdAccount = await accountsApi.create(payload);
      setAccounts((prev) => [createdAccount, ...prev]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar title="Accounts" />

      <main className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Accounts</h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage your financial accounts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Add account
            </button>
          </div>

          {pageError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {pageError}
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
  label="Total Accounts"
  value={String(accounts.length)}
  icon={Wallet}
  neutral
/>

<StatCard
  label="Asset Accounts"
  value={String(assetCount)}
  icon={Landmark}
  neutral
/>

<StatCard
  label="Liability Accounts"
  value={String(liabilityCount)}
  icon={CreditCard}
  neutral
/>

<StatCard
  label="Other Accounts"
  value={String(otherCount)}
  icon={PiggyBank}
  neutral
/>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">All accounts</h2>
            </div>

            {loading ? (
              <div className="px-5 py-10 text-sm text-slate-500">Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="px-5 py-10 text-sm text-slate-500">No accounts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Account
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        ID
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Type
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Currency
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {account.name}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          {account.id}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ACCOUNT_TYPE_STYLES[account.type]}`}
                          >
                            {ACCOUNT_TYPE_LABELS[account.type]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {account.currency}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {new Date(account.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Create account</h2>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-5 px-6 py-5">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                  Account name
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                  placeholder="e.g. Cash Account"
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="type" className="mb-1 block text-sm font-medium text-slate-700">
                  Account type
                </label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, type: e.target.value as AccountType }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                >
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formErrors.type && (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.type}</p>
                )}
              </div>

              <div>
                <label htmlFor="currency" className="mb-1 block text-sm font-medium text-slate-700">
                  Currency
                </label>
                <select
                  id="currency"
                  value={form.currency}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, currency: e.target.value as Currency }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                >
                  {CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
                {formErrors.currency && (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.currency}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (submitting) return;
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
