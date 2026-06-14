const API_BASE_URL = (import.meta.env.VITE_ZUKARI_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const TOKEN_KEY = 'zukari_api_token';
const USER_KEY = 'zukari_api_user';

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function getStoredUser() {
  try {
    const value = localStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveSession(payload) {
  if (payload?.token) {
    localStorage.setItem(TOKEN_KEY, payload.token);
  }

  if (payload?.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }

  return {
    token: payload?.token || getStoredToken(),
    user: payload?.user || getStoredUser(),
  };
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data?.message || data?.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function registerUser(input = {}) {
  const identifier = normalizeEmail(input.email || input.identifier);

  const payload = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: identifier,
      phone: input.phone || '',
      password: input.password,
      diabetesType: input.diabetesType || 'type_1',
    }),
  });

  return saveSession(payload);
}

async function loginUser(input = {}) {
  const payload = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: input.identifier || input.email || input.phone,
      password: input.password,
    }),
  });

  return saveSession(payload);
}

async function loginWithGoogleIdToken(idToken, extra = {}) {
  const payload = await request('/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      idToken,
      diabetesType: extra.diabetesType || 'type_1',
    }),
  });

  return saveSession(payload);
}

async function getCurrentUser() {
  const token = getStoredToken();

  if (!token) {
    return null;
  }

  const payload = await request('/me');
  return saveSession({ user: payload.user, token });
}

function getCachedSession() {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user?.id) {
    return null;
  }

  return { token, user };
}

function logoutUser() {
  clearSession();
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Missing VITE_GOOGLE_CLIENT_ID.'));
      return;
    }

    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existing = document.querySelector('script[data-zukari-google-gsi="true"]');

    if (existing) {
      existing.addEventListener('load', () => resolve(window.google), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.zukariGoogleGsi = 'true';
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Sign-In.'));
    document.head.appendChild(script);
  });
}

async function renderGoogleButton(element, onSuccess, onError) {
  try {
    const google = await loadGoogleScript();

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const session = await loginWithGoogleIdToken(response.credential);
          onSuccess?.(session);
        } catch (error) {
          onError?.(error);
        }
      },
    });

    if (element) {
      google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 360,
      });
    }
  } catch (error) {
    onError?.(error);
  }
}

export const apiAuth = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getCachedSession,
  loginWithGoogleIdToken,
  renderGoogleButton,
  hasGoogleClient: Boolean(GOOGLE_CLIENT_ID),
};
