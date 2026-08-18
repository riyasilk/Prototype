export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  
  options.credentials = 'include';
  
  if (!options.headers) {
    options.headers = {};
  }
  
  if (options.body && !(options.body instanceof FormData) && !((options.headers as any)['Content-Type'])) {
    (options.headers as any)['Content-Type'] = 'application/json';
  }

  let response = await fetch(url, options);

  // Auto-refresh token if we hit a 401 Unauthorized block
  if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/refresh') && !path.includes('/auth/me')) {
    try {
      const refreshResponse = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        // Retry the original request
        response = await fetch(url, options);
      }
    } catch (err) {
      console.error('Token refresh attempt failed:', err);
    }
  }

  return response;
}
