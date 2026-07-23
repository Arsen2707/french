const API = {
  base: '/api',
  available: null,

  getToken() {
    return localStorage.getItem('arsen_token') || localStorage.getItem('burmalda_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('arsen_token', token);
      localStorage.removeItem('burmalda_token');
    } else {
      localStorage.removeItem('arsen_token');
      localStorage.removeItem('burmalda_token');
    }
  },

  async probe() {
    if (this.available !== null) return this.available;
    try {
      const res = await fetch(this.base + '/leaderboard', { method: 'GET' });
      this.available = res.ok;
    } catch {
      this.available = false;
    }
    return this.available;
  },

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = this.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    const res = await fetch(this.base + path, { ...options, headers });
    let data = {};
    try {
      data = await res.json();
    } catch {
      /* empty */
    }
    if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
  },

  register(username, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  },

  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  getProfile() {
    return this.request('/profile');
  },

  updateProgress(wordId, status) {
    return this.request('/progress', {
      method: 'POST',
      body: JSON.stringify({ wordId, status })
    });
  },

  syncProgress(progress) {
    return this.request('/progress/sync', {
      method: 'POST',
      body: JSON.stringify({ progress })
    });
  },

  saveTestResult(score, total) {
    return this.request('/test', {
      method: 'POST',
      body: JSON.stringify({ score, total })
    });
  },

  saveTapScore(score, difficulty) {
    return this.request('/tap', {
      method: 'POST',
      body: JSON.stringify({ score, difficulty })
    });
  },

  getLeaderboard() {
    return this.request('/leaderboard');
  }
};

const LocalAuth = {
  USERS_KEY: 'arsen_users',
  SESSION_KEY: 'arsen_session',

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY) || '{}');
    } catch {
      return {};
    }
  },

  saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(this.SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  },

  setSession(user) {
    if (user) localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(this.SESSION_KEY);
  },

  async hash(password) {
    const data = new TextEncoder().encode('arsen:' + password);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  },

  async register(username, email, password) {
    const users = this.getUsers();
    const key = email.trim().toLowerCase();
    if (!username || !key || !password) throw new Error('Заполните все поля');
    if (password.length < 6) throw new Error('Пароль минимум 6 символов');
    if (users[key]) throw new Error('Такой email уже зарегистрирован');
    const passHash = await this.hash(password);
    users[key] = {
      username: username.trim(),
      email: key,
      passHash,
      progress: {},
      lastTest: null,
      tapBest: 0,
      streak: { count: 0, last: null },
      daily: {}
    };
    this.saveUsers(users);
    const user = { id: key, username: users[key].username, email: key, mode: 'local' };
    this.setSession(user);
    return { user, account: users[key] };
  },

  async login(email, password) {
    const users = this.getUsers();
    const key = email.trim().toLowerCase();
    const acc = users[key];
    if (!acc) throw new Error('Неверный email или пароль');
    const passHash = await this.hash(password);
    if (passHash !== acc.passHash) throw new Error('Неверный email или пароль');
    const user = { id: key, username: acc.username, email: key, mode: 'local' };
    this.setSession(user);
    return { user, account: acc };
  },

  updateAccount(email, patch) {
    const users = this.getUsers();
    const key = String(email).toLowerCase();
    if (!users[key]) return;
    users[key] = { ...users[key], ...patch };
    this.saveUsers(users);
  },

  getAccount(email) {
    return this.getUsers()[String(email).toLowerCase()] || null;
  },

  logout() {
    this.setSession(null);
  }
};
