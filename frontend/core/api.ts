const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
};

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
    throw new Error(err.error ?? "Request failed");
  }

  return res.json();
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, { token }),
  post: <T>(path: string, body: unknown, token?: string) => request<T>(path, { method: "POST", body, token }),
  patch: <T>(path: string, body: unknown, token?: string) => request<T>(path, { method: "PATCH", body, token }),
  delete: <T>(path: string, token?: string) => request<T>(path, { method: "DELETE", token }),
};