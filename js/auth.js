class AuthManager {
  constructor(toast) {
    this.toast = toast;
    this.user = null;
    this.mode = null;
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
    document.getElementById('user-menu-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });
    document.querySelectorAll('[data-switch-auth]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.hideModals();
        this.showModal(el.dataset.switchAuth);
      });
    });
    document.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', () => this.hideModals());
    });
    this.loginModal?.addEventListener('click', (e) => {
      if (e.target === this.loginModal) this.hideModals();
    });
    this.registerModal?.addEventListener('click', (e) => {
      if (e.target === this.registerModal) this.hideModals();
    });
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
    const loginErr = document.getElementById('login-error');
    const regErr = document.getElementById('register-error');
    if (loginErr) loginErr.textContent = '';
    if (regErr) regErr.textContent = '';
  }

  toggleDropdown() {
    document.getElementById('user-dropdown')?.classList.toggle('open');
  }

  mergeProgress(localProgress, remoteProgress) {
    const merged = { ...(localProgress || {}) };
    Object.entries(remoteProgress || {}).forEach(([id, status]) => {
      if (status === 'learned' || !merged[id]) merged[id] = status;
      else if (status === 'review' && merged[id] !== 'learned') merged[id] = status;
    });
    return merged;
  }

  async checkAuth() {
    const online = await API.probe();
    if (online && API.getToken()) {
      try {
        const data = await API.getProfile();
        this.user = data.user;
        this.mode = 'server';
        this.updateUI(this.user);
        document.dispatchEvent(
          new CustomEvent('auth-changed', {
            detail: { user: this.user, mode: 'server', profile: data }
          })
        );
        return this.user;
      } catch {
        API.setToken(null);
      }
    }

    const session = LocalAuth.getSession();
    if (session) {
      this.user = session;
      this.mode = 'local';
      const account = LocalAuth.getAccount(session.email);
      this.updateUI(this.user);
      document.dispatchEvent(
        new CustomEvent('auth-changed', {
          detail: { user: this.user, mode: 'local', account }
        })
      );
      return this.user;
    }

    this.user = null;
    this.mode = null;
    this.updateUI(null);
    document.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null } }));
    return null;
  }

  updateUI(user) {
    if (!this.authButtons || !this.userMenu) return;
    if (user) {
      this.authButtons.style.display = 'none';
      this.userMenu.classList.add('visible');
      const name = user.username || user.email || 'User';
      if (this.userNameEl) this.userNameEl.textContent = name;
      if (this.userAvatarEl) this.userAvatarEl.textContent = name.charAt(0).toUpperCase();
    } else {
      this.authButtons.style.display = 'flex';
      this.userMenu.classList.remove('visible');
      document.getElementById('user-dropdown')?.classList.remove('open');
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.textContent = '';
    try {
      const online = await API.probe();
      if (online) {
        try {
          const data = await API.login(email, password);
          API.setToken(data.token);
          LocalAuth.logout();
          this.user = data.user;
          this.mode = 'server';
          this.updateUI(this.user);
          this.hideModals();
          this.toast.show('С возвращением, ' + data.user.username + '!', 'success');
          e.target.reset();
          const profile = await API.getProfile();
          document.dispatchEvent(
            new CustomEvent('auth-changed', {
              detail: { user: this.user, mode: 'server', profile, justLoggedIn: true }
            })
          );
          return;
        } catch (err) {
          if (!String(err.message).includes('fetch') && err.message !== 'Failed to fetch') {
            throw err;
          }
        }
      }

      const data = await LocalAuth.login(email, password);
      API.setToken(null);
      this.user = data.user;
      this.mode = 'local';
      this.updateUI(this.user);
      this.hideModals();
      this.toast.show('С возвращением, ' + data.user.username + '!', 'success');
      e.target.reset();
      document.dispatchEvent(
        new CustomEvent('auth-changed', {
          detail: { user: this.user, mode: 'local', account: data.account, justLoggedIn: true }
        })
      );
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message || 'Ошибка входа';
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const errorEl = document.getElementById('register-error');
    if (errorEl) errorEl.textContent = '';
    if (password.length < 6) {
      if (errorEl) errorEl.textContent = 'Пароль минимум 6 символов';
      return;
    }
    try {
      const online = await API.probe();
      if (online) {
        try {
          const data = await API.register(username, email, password);
          API.setToken(data.token);
          LocalAuth.logout();
          this.user = data.user;
          this.mode = 'server';
          this.updateUI(this.user);
          this.hideModals();
          this.toast.show('Аккаунт создан!', 'success');
          e.target.reset();
          document.dispatchEvent(
            new CustomEvent('auth-changed', {
              detail: { user: this.user, mode: 'server', justLoggedIn: true }
            })
          );
          return;
        } catch (err) {
          if (!String(err.message).includes('fetch') && err.message !== 'Failed to fetch') {
            throw err;
          }
        }
      }

      const data = await LocalAuth.register(username, email, password);
      API.setToken(null);
      this.user = data.user;
      this.mode = 'local';
      this.updateUI(this.user);
      this.hideModals();
      this.toast.show('Аккаунт создан!', 'success');
      e.target.reset();
      document.dispatchEvent(
        new CustomEvent('auth-changed', {
          detail: { user: this.user, mode: 'local', account: data.account, justLoggedIn: true }
        })
      );
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message || 'Ошибка регистрации';
    }
  }

  logout() {
    API.setToken(null);
    LocalAuth.logout();
    this.user = null;
    this.mode = null;
    this.updateUI(null);
    this.toast.show('Вы вышли из аккаунта', 'info');
    document.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null, loggedOut: true } }));
  }

  isLoggedIn() {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }

  getMode() {
    return this.mode;
  }
}
