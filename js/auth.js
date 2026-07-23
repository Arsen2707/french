class AuthManager {
  constructor(toast) {
    this.toast = toast;
    this.user = null;
    this.loginModal = document.getElementById('login-modal');
    this.registerModal = document.getElementById('register-modal');
    this.authButtons = document.getElementById('auth-buttons');
    this.userMenu = document.getElementById('user-menu');
    this.userNameEl = document.getElementById('user-name');
    this.userAvatarEl = document.getElementById('user-avatar');
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btn-login')?.addEventListener('click', () => this.showModal('login'));
    document.getElementById('btn-register')?.addEventListener('click', () => this.showModal('register'));
    document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e));
    document.getElementById('btn-logout')?.addEventListener('click', () => this.logout());
    document.getElementById('user-menu-btn')?.addEventListener('click', () => this.toggleDropdown());
    document.querySelectorAll('[data-switch-auth]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const target = el.dataset.switchAuth;
        this.hideModals();
        this.showModal(target);
      });
    });
    document.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', () => this.hideModals());
    });
    this.loginModal?.addEventListener('click', (e) => { if (e.target === this.loginModal) this.hideModals(); });
    this.registerModal?.addEventListener('click', (e) => { if (e.target === this.registerModal) this.hideModals(); });
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('user-dropdown');
      if (dropdown && !e.target.closest('.user-menu')) dropdown.classList.remove('open');
    });
  }

  showModal(type) {
    this.hideModals();
    const modal = type === 'login' ? this.loginModal : this.registerModal;
    modal?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  hideModals() {
    this.loginModal?.classList.remove('open');
    this.registerModal?.classList.remove('open');
    document.body.style.overflow = '';
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
  }

  toggleDropdown() {
    document.getElementById('user-dropdown')?.classList.toggle('open');
  }

  async checkAuth() {
    const token = API.getToken();
    if (!token) { this.updateUI(null); return null; }
    try {
      const data = await API.getProfile();
      this.user = data.user || data;
      this.updateUI(this.user);
      return this.user;
    } catch {
      API.setToken(null);
      this.user = null;
      this.updateUI(null);
      return null;
    }
  }

  updateUI(user) {
    if (user) {
      this.authButtons.style.display = 'none';
      this.userMenu.classList.add('visible');
      const name = user.username || user.email || 'User';
      this.userNameEl.textContent = name;
      this.userAvatarEl.textContent = name.charAt(0).toUpperCase();
    } else {
      this.authButtons.style.display = 'flex';
      this.userMenu.classList.remove('visible');
    }
    document.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';
    try {
      const data = await API.login(email, password);
      API.setToken(data.token);
      this.user = data.user;
      this.updateUI(this.user);
      this.hideModals();
      this.toast.show('Добро пожаловать!', 'success');
      e.target.reset();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const errorEl = document.getElementById('register-error');
    errorEl.textContent = '';
    if (password.length < 6) { errorEl.textContent = 'Пароль минимум 6 символов'; return; }
    try {
      const data = await API.register(username, email, password);
      API.setToken(data.token);
      this.user = data.user;
      this.updateUI(this.user);
      this.hideModals();
      this.toast.show('Аккаунт создан!', 'success');
      e.target.reset();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  }

  logout() {
    API.setToken(null);
    this.user = null;
    this.updateUI(null);
    this.toast.show('Вы вышли из аккаунта', 'info');
  }

  isLoggedIn() { return !!this.user; }
  getUser() { return this.user; }
}