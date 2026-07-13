export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function token() {
  return typeof window === 'undefined' ? null : localStorage.getItem('wis_auth_token');
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `API error ${response.status}`);
  return body as T;
}

export const businessApi = {
  list: <T>(resource: string) => apiRequest<{ items: T[] }>(`/api/business/${resource}`).then(x => x.items),
  create: <T>(resource: string, data: T) => apiRequest<{ item: T }>(`/api/business/${resource}`, { method: 'POST', body: JSON.stringify(data) }).then(x => x.item),
  update: <T extends { id: string }>(resource: string, data: T) => apiRequest<{ item: T }>(`/api/business/${resource}/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }).then(x => x.item),
  remove: (resource: string, id: string) => apiRequest(`/api/business/${resource}/${id}`, { method: 'DELETE' }),
};
