function decodeJwtUsername(token) {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalized));
    return decoded.sub || null;
  } catch {
    return null;
  }
}

export function saveAuth(data) {
  if (typeof window === 'undefined') return;
  const username = data.username || decodeJwtUsername(data.token);

  localStorage.setItem('token', data.token);
  if (username) {
    localStorage.setItem('username', username);
  }
}

export function getAuth() {
  if (typeof window === 'undefined') {
    return { token: null, username: null };
  }

  return {
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username'),
  };
}

export function isLoggedIn() {
  return Boolean(getAuth().token);
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('username');
}
