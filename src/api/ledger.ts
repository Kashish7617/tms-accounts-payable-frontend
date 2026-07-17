import { apiClient } from "../lib/apiClient";
import type { CreateLedgerEntryInput, Currency, LedgerEntry } from "../types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type ApiAccount = {
  id: string;
  name: string;
  type: string;
  currency: Currency;
  created_at: string;
};

type ApiTransactionEntry = {
  id: string;
  account_id: string;
  entry_type: "DEBIT" | "CREDIT";
  amount_cents: number;
  accounts?: ApiAccount;
};

type ApiTransaction = {
  id: string;
  reference: string;
  description: string;
  created_at: string;
  total_amount_cents: number;
  transaction_entries?: ApiTransactionEntry[];
};

const mapTransaction = (raw: ApiTransaction): LedgerEntry => {
  const debit = raw.transaction_entries?.find((entry) => entry.entry_type === "DEBIT");
  const credit = raw.transaction_entries?.find((entry) => entry.entry_type === "CREDIT");

  return {
    id: raw.id,
    reference: raw.reference,
    description: raw.description,
    debitAccount: debit?.accounts?.name ?? "—",
    creditAccount: credit?.accounts?.name ?? "—",
    amount: raw.total_amount_cents,
    currency: debit?.accounts?.currency ?? credit?.accounts?.currency ?? "USD",
    date: new Date(raw.created_at).toLocaleDateString("en-IN"),
    status: "Posted",
  };
};

export const ledgerApi = {
  list: async (signal?: AbortSignal) => {
    const response = await apiClient.get<ApiResponse<ApiTransaction[]>>(
      "/transactions",
      undefined,
      signal
    );

    const details = await Promise.all(
      response.data.map(async (transaction) => {
        const detail = await apiClient.get<ApiResponse<ApiTransaction>>(
          `/transactions/${transaction.id}`,
          undefined,
          signal
        );

        return mapTransaction(detail.data);
      })
    );

    return details;
  },

  get: async (id: string, signal?: AbortSignal) => {
    const response = await apiClient.get<ApiResponse<ApiTransaction>>(
      `/transactions/${id}`,
      undefined,
      signal
    );

    return mapTransaction(response.data);
  },

  create: async (input: CreateLedgerEntryInput) => {
    const response = await apiClient.post<ApiResponse<ApiTransaction>>(
      "/transactions",
      input
    );

    const created = await ledgerApi.get(response.data.id);
    return created;
  },
};
