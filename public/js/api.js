const API = {
  token() {
    return localStorage.getItem('token');
  },

  user() {
    const value = localStorage.getItem('user');
    return value ? JSON.parse(value) : null;
  },

  setSession(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  },

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  requireLogin() {
    if (!this.token()) {
      window.location.href = '/login.html';
    }
  },

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token()) {
      headers.Authorization = `Bearer ${this.token()}`;
    }

    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }
};

function setupLayout() {
  API.requireLogin();
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      API.clearSession();
      window.location.href = '/login.html';
    });
  }

  const user = API.user();
  if (user && user.role !== 'Admin') {
    document.querySelectorAll('.admin-only').forEach((element) => element.classList.add('hidden'));
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
