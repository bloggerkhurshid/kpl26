// Simple admin auth helper — password stored in ADMIN_PASSWORD env var.
// A token is kept in localStorage and validated against the env var via API.

const TOKEN_KEY = 'kpl_admin_token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAdminToken();
}

export async function adminLogin(password: string): Promise<boolean> {
  const res = await fetch('/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  if (data.token) {
    setAdminToken(data.token);
    return true;
  }
  return false;
}

export function adminLogout(): void {
  clearAdminToken();
  window.location.href = '/admin';
}
