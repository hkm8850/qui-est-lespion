const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

function parseResponse(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    const codeMatch = text.match(/"code"\s*:\s*"([A-Z]{6})"/);
    if (codeMatch) {
      return { code: codeMatch[1] };
    }

    throw err;
  }
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || errorData.error;

    if (message) {
      throw new Error(message);
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error('Acces refuse. Verifiez que vous etes connecte avec le bon compte.');
    }

    throw new Error(`Erreur ${res.status}`);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  return parseResponse(text);
}

export async function register(username, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function createGame() {
  return request('/game/create', { method: 'POST' });
}

export async function joinGame(code) {
  return request(`/game/join?code=${encodeURIComponent(code)}`, { method: 'POST' });
}

export async function startGame(code) {
  return request(`/game/start?code=${encodeURIComponent(code)}`, { method: 'POST' });
}

export async function getGameState(code) {
  return request(`/game/get?code=${encodeURIComponent(code)}`);
}

export async function getMyRole(code) {
  return request(`/game/my-role?code=${encodeURIComponent(code)}`);
}

export async function sendClue(gameCode, content) {
  return request('/game/send-clue', {
    method: 'POST',
    body: JSON.stringify({ gameCode, content }),
  });
}

export async function castVote(gameCode, targetUsername) {
  return request('/game/vote', {
    method: 'POST',
    body: JSON.stringify({ gameCode, targetUsername }),
  });
}

export async function getWaitingGames() {
  return request('/game/waiting');
}

export async function getChatMessages(code) {
  return request(`/game/history?code=${encodeURIComponent(code)}`);
}
