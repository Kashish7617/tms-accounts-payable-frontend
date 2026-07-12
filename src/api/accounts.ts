import { apiClient } from "../lib/apiClient";
import type { Account, CreateAccountInput } from "../types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type ApiAccount = {
  id: string;
  name: string;
  type: Account["type"];
  currency: Account["currency"];
  created_at: string;
};

const mapAccount = (raw: ApiAccount): Account => ({
  id: raw.id,
  name: raw.name,
  type: raw.type,
  currency: raw.currency,
  createdAt: raw.created_at,
});

export const accountsApi = {
  list: async (signal?: AbortSignal) => {
    const response = await apiClient.get<ApiResponse<ApiAccount[]>>(
      "/accounts",
      undefined,
      signal
    );

    return response.data.map(mapAccount);
  },

  get: async (id: string, signal?: AbortSignal) => {
    const response = await apiClient.get<ApiResponse<ApiAccount>>(
      `/accounts/${id}`,
      undefined,
      signal
    );

    return mapAccount(response.data);
  },

  create: async (input: CreateAccountInput) => {
    const response = await apiClient.post<ApiResponse<ApiAccount>>(
      "/accounts",
      input
    );

    return mapAccount(response.data);
  },
};
