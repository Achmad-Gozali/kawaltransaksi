import { api } from "../api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

let accessToken: string | null = null;

export const authClient = {
  setToken: (token: string) => { accessToken = token; },
  getToken: () => accessToken,
  clearToken: () => { accessToken = null; },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/api/auth/login", { email, password });
    accessToken = res.accessToken;
    return res;
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/api/auth/register", { name, email, password });
    accessToken = res.accessToken;
    return res;
  },

  logout: async () => {
    await api.post("/api/auth/logout", {});
    accessToken = null;
  },

  refresh: async (): Promise<string | null> => {
    try {
      const res = await api.post<{ accessToken: string }>("/api/auth/refresh", {});
      accessToken = res.accessToken;
      return res.accessToken;
    } catch {
      accessToken = null;
      return null;
    }
  },

  me: async (): Promise<AuthUser | null> => {
  if (!accessToken) {
    const refreshed = await authClient.refresh();
    if (!refreshed) return null;
  }
  try {
    return await api.get<AuthUser>("/api/auth/me", accessToken!);
  } catch {
    return null;
  }
},
};