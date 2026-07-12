import axios, { AxiosError } from "axios";
import type { ApiError } from "../types";

export class ApiRequestError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (!error.response) {
      return Promise.reject(
        new ApiRequestError(
          "Couldn't reach the server. Check your connection and try again.",
          0
        )
      );
    }

    const { status, data } = error.response;

    return Promise.reject(
      new ApiRequestError(
        data?.message ?? `Request failed with status ${status}`,
        status,
        data?.fieldErrors
      )
    );
  }
);

export default axiosClient;