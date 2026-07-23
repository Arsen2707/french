class ArsenApp {
  constructor() {
    this.theme = new ThemeManager();
    this.sound = new SoundManager();
    this.toast = new ToastManager();
    this.cards = new CardsManager(this.toast, this.sound);
    this.test = new TestManager(this.toast, this.sound);
    this.tapGame = new TapGame(this.toast, this.sound);
    this.currentSection = 'cards';
    this.init();
  }

  init() {
    this.bindNavigation();
    this.bindThemeToggle();
    this.bindHotkeys();
    this.bindDailyTasks();
    this.bindAchievements();
    this.updateProfile();
    this.hideLoading();
    document.addEventListener('progress-updated', () => this.updateProfile());
    document.addEventListener('test-completed', () => this.updateDailyTask('test', 1));
    document.addEventListener('tap-completed', (e) => this.updateDailyTask('tap', e.detail.score));
  }

  bindHotkeys() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;

      if (e.key === 'Escape') {
        if (this.tapGame.running) this.tapGame.stopGame();
        return;
      }

      if (typing) return;

      if (e.code === 'Space' || e.key === ' ') {
        if (this.currentSection === 'cards') {
          e.preventDefault();
          this.cards.flipFocused();
        }
        return;
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
        if (this.currentSection === 'tap-game' && this.tapGame.running) {
          e.preventDefault();
          this.tapGame.togglePause();
        }
      }
    });
  }

  bindNavigation() {
    document.querySelectorAll('[data-section]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(link.dataset.section);
      });
    });
  }

  navigateTo(section) {
    document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));
    const target = document.getElementById('section-' + section);
    if (target) {
      target.classList.add('active', 'fade-in');
      setTimeout(() => target.classList.remove('fade-in'), 400);
    }
    document
      .querySelectorAll('.nav-link[data-section="' + section + '"]')
      .forEach((l) => l.classList.add('active'));
    this.currentSection = section;
    const titles = {
      cards: 'Карточки',
      test: 'Тест',
      'tap-game': 'Быстрая игра',
      profile: 'Профиль'
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = titles[section] || 'Arsen';
    if (section === 'profile') this.updateProfile();
    if (section === 'test' && !this.test.questions.length) this.test.render();
  }

  bindThemeToggle() {
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      this.theme.toggle();
      this.toast.show(this.theme.theme === 'dark' ? 'Тёмная тема' : 'Светлая тема', 'info');
    });
  }

  storageGet(key, fallback) {
    return localStorage.getItem('arsen_' + key) || localStorage.getItem('violet_' + key) || fallback;
  }

  storageSet(key, value) {
    localStorage.setItem('arsen_' + key, value);
  }

  updateProfile() {
    const learned = this.cards.getLearnedCount();
    const total = DICTIONARY.length;
    const streak = this.getStreak();
    const testData = JSON.parse(this.storageGet('last_test', 'null'));
    const tapBest = this.storageGet('tap_best', '0');

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText('stat-learned', learned);
    setText('stat-total', total);
    setText('stat-streak', streak);
    setText('stat-tests', testData ? testData.score + '/' + testData.total : '—');
    setText('stat-tap-best', tapBest);
    setText('streak-count', streak);

    const pct = total ? Math.round((learned / total) * 100) : 0;
    const fill = document.getElementById('overall-progress-fill');
    if (fill) fill.style.width = pct + '%';
    setText('overall-progress-text', pct + '%');

    this.updateDailyTask('learn', learned);
    this.updateAchievements();
  }

  getStreak() {
    const data = JSON.parse(this.storageGet('streak', '{"count":0,"last":null}'));
    const today = new Date().toDateString();
    if (data.last === today) return data.count;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (data.last === yesterday) {
      data.count++;
      data.last = today;
    } else {
      data.count = 1;
      data.last = today;
    }
    this.storageSet('streak', JSON.stringify(data));
    return data.count;
  }

  bindDailyTasks() {
    const container = document.getElementById('daily-tasks');
    if (!container) return;
    const progress = JSON.parse(this.storageGet('daily', '{}'));
    const today = new Date().toDateString();
    if (progress.date !== today) {
      this.storageSet('daily', JSON.stringify({ date: today, tasks: {} }));
    }
    container.innerHTML = DAILY_TASKS.map(
      (task) =>
        '<div class="daily-task" data-task="' +
        task.id +
        '">' +
        '<span class="daily-task-icon">' +
        task.icon +
        '</span>' +
        '<div class="daily-task-info">' +
        '<div class="daily-task-label">' +
        task.label +
        '</div>' +
        '<div class="daily-task-progress" id="task-progress-' +
        task.id +
        '">0 / ' +
        task.target +
        '</div>' +
        '</div>' +
        '<div class="daily-task-check"><i class="fas fa-check" style="display:none"></i></div>' +
        '</div>'
    ).join('');
  }

  updateDailyTask(taskId, value) {
    const daily = JSON.parse(this.storageGet('daily', '{}'));
    const today = new Date().toDateString();
    if (daily.date !== today) daily.tasks = {};
    daily.date = today;
    if (!daily.tasks) daily.tasks = {};
    const task = DAILY_TASKS.find((t) => t.id === taskId);
    if (!task) return;
    daily.tasks[taskId] = Math.max(daily.tasks[taskId] || 0, value);
    this.storageSet('daily', JSON.stringify(daily));
    const current = daily.tasks[taskId] || 0;
    const el = document.getElementById('task-progress-' + taskId);
    const row = document.querySelector('[data-task="' + taskId + '"]');
    if (el) el.textContent = Math.min(current, task.target) + ' / ' + task.target;
    if (row && current >= task.target) {
      row.classList.add('completed');
      const icon = row.querySelector('.daily-task-check i');
      if (icon) icon.style.display = 'block';
    }
  }

  bindAchievements() {
    this.achievements = [
      { id: 'first', name: 'Первое слово', icon: '🌱', req: () => this.cards.getLearnedCount() >= 1 },
      {
        id: 'half',
        name: 'Пол пути',
        icon: '📚',
        req: () => this.cards.getLearnedCount() >= Math.ceil(DICTIONARY.length / 2)
      },
      {
        id: 'all',
        name: 'Francophone',
        icon: '🏆',
        req: () => this.cards.getLearnedCount() >= DICTIONARY.length
      },
      {
        id: 'tap100',
        name: 'Vite!',
        icon: '⚡',
        req: () => parseInt(this.storageGet('tap_best', '0'), 10) >= 100
      },
      {
        id: 'tap500',
        name: 'Éclair',
        icon: '💫',
        req: () => parseInt(this.storageGet('tap_best', '0'), 10) >= 500
      },
      {
        id: 'test',
        name: 'Отличник',
        icon: '✅',
        req: () => {
          const t = JSON.parse(this.storageGet('last_test', 'null'));
          return t && t.score / t.total >= 0.8;
        }
      }
    ];
  }

  updateAchievements() {
    const container = document.getElementById('achievements-list');
    if (!container || !this.achievements) return;
    container.innerHTML = this.achievements
      .map((a) => {
        const unlocked = a.req();
        return (
          '<div class="achievement ' +
          (unlocked ? 'unlocked' : 'locked') +
          '">' +
          '<span class="achievement-icon">' +
          a.icon +
          '</span>' +
          '<span class="achievement-name">' +
          a.name +
          '</span></div>'
        );
      })
      .join('');
  }

  hideLoading() {
    setTimeout(() => document.getElementById('loading-overlay')?.classList.add('hidden'), 450);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
  window.app = new ArsenApp();
  window.app.sound.init();
});
