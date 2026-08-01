const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const DEFAULT_TIMEOUT_MS = 20000; 
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server may be waking up — please try again.');
    }
    throw new Error('Network error. Please check your connection and try again.');
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const isAuthRoute = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
    const hasToken = !!localStorage.getItem('token');

    if (hasToken && !isAuthRoute) {
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    throw new Error(data.message || 'Invalid credentials.');
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  get: (url) => request(url, { method: 'GET' }),
  post: (url, body) =>
    request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  put: (url, body) =>
    request(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  delete: (url) => request(url, { method: 'DELETE' }),
  postForm: (url, formData) =>
    request(url, {
      method: 'POST',
      body: formData,
    }),
};

export default api;