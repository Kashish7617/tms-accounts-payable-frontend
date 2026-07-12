import axiosClient, { ApiRequestError } from "./axiosClient";
export { ApiRequestError };

export const apiClient = {
  get: async <T>(
    path: string,
    params?: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<T> => {
    const { data } = await axiosClient.get<T>(path, {
      params,
      signal,
    });

    return data;
  },

  post: async <T>(
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> => {
    const { data } = await axiosClient.post<T>(path, body, {
      signal,
    });

    return data;
  },

  put: async <T>(
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> => {
    const { data } = await axiosClient.put<T>(path, body, {
      signal,
    });

    return data;
  },

  patch: async <T>(
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> => {
    const { data } = await axiosClient.patch<T>(path, body, {
      signal,
    });

    return data;
  },

  delete: async <T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> => {
    const { data } = await axiosClient.delete<T>(path, {
      signal,
    });

    return data;
  },
};