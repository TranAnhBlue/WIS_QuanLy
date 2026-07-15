export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function token() {
  return typeof window === 'undefined' ? null : localStorage.getItem('wis_auth_token');
}

export async function authenticatedFetch(input: string, init: RequestInit = {}) {
  const url = input.startsWith("http") ? input : `${API_BASE}${input}`;
  const response = await fetch(url, {
    ...init,
    headers: { ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...init.headers },
  });
  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("wis_auth_token");
    localStorage.removeItem("wis_user_data");
    window.dispatchEvent(new Event("wis:unauthorized"));
  }
  return response;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const response = await authenticatedFetch(path, {
    ...init,
    headers: { ...(!isFormData ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `API error ${response.status}`);
  return body as T;
}

export type UploadedBusinessFile = {
  name: string;
  url: string;
  publicId: string;
  resourceType: string;
  type: string;
  size: number;
};

export async function uploadBusinessFile(file: File, area: 'documents' | 'training' = 'documents') {
  const body = new FormData();
  body.append('file', file);
  body.append('area', area);
  return apiRequest<{ file: UploadedBusinessFile }>('/api/business-files/upload', { method: 'POST', body }).then(result => result.file);
}

export function deleteBusinessFile(publicId: string, resourceType = 'raw') {
  return apiRequest('/api/business-files', { method: 'DELETE', body: JSON.stringify({ publicId, resourceType }) });
}

export const businessApi = {
  list: <T>(resource: string) => apiRequest<{ items: T[] }>(`/api/business/${resource}`).then(x => x.items),
  create: <T>(resource: string, data: T) => apiRequest<{ item: T }>(`/api/business/${resource}`, { method: 'POST', body: JSON.stringify(data) }).then(x => x.item),
  update: <T extends { id: string }>(resource: string, data: T) => apiRequest<{ item: T }>(`/api/business/${resource}/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }).then(x => x.item),
  remove: (resource: string, id: string) => apiRequest(`/api/business/${resource}/${id}`, { method: 'DELETE' }),
};
