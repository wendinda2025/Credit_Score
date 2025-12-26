export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${txt ? ` - ${txt}` : ''}`);
  }
  return (await res.json()) as T;
}

export async function apiLogin(username: string, password: string): Promise<TokenPair> {
  return await http<TokenPair>('/iam/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function apiMe(accessToken: string): Promise<any> {
  return await http('/iam/me', {
    method: 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
}

