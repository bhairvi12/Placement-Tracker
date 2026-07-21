const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Shared fetch handler supporting automatic header mapping and auth redirection.
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(
    `${baseUrl}${endpoint}`, 
    {
      ...options,
      headers: {
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...(token && { 
          Authorization: `Bearer ${token}` 
        }),
        ...options.headers
      }
    }
  );

  const data = await res.json().catch(() => ({}));
  
  if (res.status === 401) {
  
  const isAuthRoute = endpoint.includes('/auth/login') || 
                      endpoint.includes('/auth/register')
  const hasToken = !!localStorage.getItem('token')
  
  if (hasToken && !isAuthRoute) {
   
    localStorage.clear()
    window.location.href = '/login'
    throw new Error('Session expired. Please login again.')
  }
  
 
  throw new Error(data.message || 'Invalid credentials.')
}
  
  if (!res.ok || data.success === false) {
    throw new Error(
      data.message || 'Something went wrong'
    );
  }
  
  return data;  // returns { success, data, message }
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
      body: formData, // Browser automatically sets Content-Type boundary for FormData
    }),
};

export default api;
