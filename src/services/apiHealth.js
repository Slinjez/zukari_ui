const API_BASE_URL = (import.meta.env.VITE_ZUKARI_API_BASE_URL || 'https://127.0.0.1:8000/api').replace(/\/$/, '');
const TOKEN_KEY = 'zukari_api_token';

function storedToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

async function apiRequest(path, { method = 'GET', body, token, headers = {} } = {}) {
  const authToken = token || storedToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.detail || `Request failed with status ${response.status}`);
  }

  return data;
}

function withQuery(path, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value));
    }
  });

  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

export const apiHealth = {
  request: apiRequest,

  dashboard(params = {}) {
    return apiRequest(withQuery('/dashboard', params));
  },

  listGlucose(params = {}) {
    return apiRequest(withQuery('/glucose-logs', params));
  },

  createGlucose(payload) {
    return apiRequest('/glucose-logs', { method: 'POST', body: payload });
  },

  updateGlucose(id, payload) {
    return apiRequest(`/glucose-logs/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload });
  },

  deleteGlucose(id) {
    return apiRequest(`/glucose-logs/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  importGlucose(items, source = 'mobile_sync') {
    return apiRequest('/glucose-logs/import', { method: 'POST', body: { source, items } });
  },

  listInsulin(params = {}) {
    return apiRequest(withQuery('/insulin-logs', params));
  },

  createInsulin(payload) {
    return apiRequest('/insulin-logs', { method: 'POST', body: payload });
  },

  updateInsulin(id, payload) {
    return apiRequest(`/insulin-logs/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload });
  },

  deleteInsulin(id) {
    return apiRequest(`/insulin-logs/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  importInsulin(items, source = 'mobile_sync') {
    return apiRequest('/insulin-logs/import', { method: 'POST', body: { source, items } });
  },

  listFood(params = {}) {
    return apiRequest(withQuery('/food-logs', params));
  },

  createFood(payload) {
    return apiRequest('/food-logs', { method: 'POST', body: payload });
  },

  updateFood(id, payload) {
    return apiRequest(`/food-logs/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload });
  },

  deleteFood(id) {
    return apiRequest(`/food-logs/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  importFood(items, source = 'mobile_sync') {
    return apiRequest('/food-logs/import', { method: 'POST', body: { source, items } });
  },

  syncImport(payload) {
    return apiRequest('/sync/import', { method: 'POST', body: payload });
  },
};
