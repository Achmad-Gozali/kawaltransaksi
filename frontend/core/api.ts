const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
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

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, signal } = opts;

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