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

export async function adminLogin(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      return { success: false, error: data.error || 'Server error occurred' };
    }
    
    if (data.token) {
      setAdminToken(data.token);
      return { success: true };
    }
    
    return { success: false, error: 'Invalid response from server' };
  } catch (err) {
    return { success: false, error: 'Network error occurred' };
  }
}

export function adminLogout(): void {
  clearAdminToken();
  window.location.href = '/admin';
}
