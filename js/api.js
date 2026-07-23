const API = {
  base: '/api',

  getToken() {
    return localStorage.getItem('burmalda_token');
  },

  setToken(token) {
    if (token) localStorage.setItem('burmalda_token', token);
    else localStorage.removeItem('burmalda_token');
  },

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = this.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    const res = await fetch(this.base + path, { ...options, headers });
    let data = {};
    try { data = await res.json(); } catch { /* empty */ }
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
  },

  completeDailyTask(taskId) {
    return this.request('/daily', {
      method: 'POST',
      body: JSON.stringify({ taskId })
    });
  }
};
