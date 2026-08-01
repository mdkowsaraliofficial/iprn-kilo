import { configureApiClient } from "@iprn/api-client";

export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";

export function setupApiClient(): void {
  configureApiClient({ baseUrl: "/api" });
}

export function storeAccessToken(token: string): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function storeRefreshToken(token: string): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAuth(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
