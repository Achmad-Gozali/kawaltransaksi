"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
  /** Internal: cegah retry tak terbatas kalau refresh sendiri balas 401. */
  _isRetry?: boolean;
};

export class ApiError extends Error {
  status: number;
  retryAfter: number | null;

  constructor(message: string, status: number, retryAfter: number | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function parseRetryAfter(res: Response): number | null {
  const header = res.headers.get("Retry-After");
  if (!header) return null;
  const seconds = parseInt(header, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

// Single-flight refresh: kalau beberapa request 401 di waktu yang hampir
// bersamaan (misal 4 komponen fetch paralel saat token baru expired),
// semuanya menunggu SATU refresh yang sama, bukan memicu refresh berkali-kali.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    // Import lazy untuk hindari circular import (client.ts -> api.ts -> client.ts).
    refreshInFlight = import("./auth/client")
      .then(({ authClient }) => authClient.refresh())
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, signal, _isRetry = false } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal,
  });

  if (!res.ok) {
    // Access token expired di tengah sesi aktif -> coba refresh sekali,
    // lalu ulangi request yang sama dengan token baru.
    // Endpoint auth sendiri (login/register/refresh/logout) dikecualikan
    // supaya tidak retry-loop saat refresh token itu sendiri sudah invalid.
    const isAuthEndpoint = path.startsWith("/api/auth/");
    if (res.status === 401 && !_isRetry && !isAuthEndpoint && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request<T>(path, { ...opts, token: newToken, _isRetry: true });
      }
    }

    const err = await res.json().catch(() => ({ error: "Request failed" }));
    const retryAfter = res.status === 429 ? parseRetryAfter(res) : null;
    throw new ApiError(err.error ?? "Request failed", res.status, retryAfter);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, { token }),
  post: <T>(path: string, body: unknown, token?: string) => request<T>(path, { method: "POST", body, token }),
  patch: <T>(path: string, body: unknown, token?: string) => request<T>(path, { method: "PATCH", body, token }),
  delete: <T>(path: string, token?: string) => request<T>(path, { token, method: "DELETE" }),
};