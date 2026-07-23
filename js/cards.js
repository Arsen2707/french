class CardsManager {
  constructor(toast, sound) {
    this.toast = toast;
    this.sound = sound;
    this.progress = this.loadProgress();
    this.category = 'all';
    this.search = '';
    this.focusedIndex = 0;
    this.grid = document.getElementById('cards-grid');
    this.progressFill = document.getElementById('cards-progress-fill');
    this.progressText = document.getElementById('cards-progress-text');
    this.searchInput = document.getElementById('card-search');
    this.chipsContainer = document.getElementById('category-chips');
    this.init();
  }

  init() {
    this.renderChips();
    this.render();
    this.searchInput?.addEventListener('input', (e) => {
      this.search = e.target.value.toLowerCase();
      this.render();
    });
    document.addEventListener('auth-changed', (e) => this.onAuthChanged(e.detail || {}));
  }

  async onAuthChanged(detail) {
    if (detail.loggedOut) {
      this.progress = {};
      this.saveProgressLocal();
      this.render();
      return;
    }
    if (!detail.user) return;

    const guest = this.loadGuestProgress();
    let remote = {};

    if (detail.mode === 'server') {
      if (detail.profile && detail.profile.progress) {
        detail.profile.progress.forEach((p) => {
          remote[p.wordId] = p.status;
        });
      }
      this.progress = this.mergeProgress(guest, remote);
      this.saveProgressLocal();
      try {
        const synced = await API.syncProgress(this.progress);
        if (synced.progress) this.progress = synced.progress;
        this.saveProgressLocal();
      } catch {
        /* keep local merge */
      }
    } else if (detail.mode === 'local' && detail.account) {
      remote = detail.account.progress || {};
      this.progress = this.mergeProgress(guest, remote);
      this.saveProgressLocal();
      this.persistLocalAccount();
    }

    this.render();
    document.dispatchEvent(new CustomEvent('progress-updated'));
  }

  mergeProgress(a, b) {
    const merged = { ...(a || {}) };
    Object.entries(b || {}).forEach(([id, status]) => {
      if (status === 'learned' || !merged[id]) merged[id] = status;
      else if (status === 'review' && merged[id] !== 'learned') merged[id] = status;
    });
    return merged;
  }

  loadGuestProgress() {
    try {
      return JSON.parse(
        localStorage.getItem('arsen_progress') ||
          localStorage.getItem('violet_progress') ||
          '{}'
      );
    } catch {
      return {};
    }
  }

  loadProgress() {
    return this.loadGuestProgress();
  }

  saveProgressLocal() {
    localStorage.setItem('arsen_progress', JSON.stringify(this.progress));
    this.updateProgressBar();
    document.dispatchEvent(new CustomEvent('progress-updated'));
  }

  persistLocalAccount() {
    const user = window.app?.auth?.getUser();
    if (!user || window.app?.auth?.getMode() !== 'local') return;
    LocalAuth.updateAccount(user.email, { progress: this.progress });
  }

  saveProgress() {
    this.saveProgressLocal();
    this.persistLocalAccount();
    if (API.getToken()) {
      /* single word updated in setStatus */
    }
  }

  renderChips() {
    if (!this.chipsContainer) return;
    this.chipsContainer.innerHTML = CATEGORIES.map((cat) =>
      '<button class="chip ' + (this.category === cat.id ? 'active' : '') + '" data-cat="' + cat.id + '">' + cat.label + '</button>'
    ).join('');
    this.chipsContainer.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.category = chip.dataset.cat;
        this.renderChips();
        this.render();
      });
    });
  }

  getFiltered() {
    return DICTIONARY.filter((w) => {
      const matchCat = this.category === 'all' || w.category === this.category;
      const matchSearch =
        !this.search ||
        w.word.toLowerCase().includes(this.search) ||
        w.translation.toLowerCase().includes(this.search) ||
        w.context.toLowerCase().includes(this.search) ||
        w.example.toLowerCase().includes(this.search);
      return matchCat && matchSearch;
    });
  }

  updateProgressBar() {
    const total = DICTIONARY.length;
    const learned = DICTIONARY.filter((w) => this.progress[w.id] === 'learned').length;
    const pct = total ? Math.round((learned / total) * 100) : 0;
    if (this.progressFill) this.progressFill.style.width = pct + '%';
    if (this.progressText) this.progressText.textContent = learned + ' / ' + total + ' слов (' + pct + '%)';
    this.renderCategoryProgress();
  }

  renderCategoryProgress() {
    const container = document.getElementById('category-progress-list');
    if (!container) return;
    const cats = CATEGORIES.filter((c) => c.id !== 'all');
    container.innerHTML = cats
      .map((cat) => {
        const words = DICTIONARY.filter((w) => w.category === cat.id);
        const learned = words.filter((w) => this.progress[w.id] === 'learned').length;
        const pct = words.length ? Math.round((learned / words.length) * 100) : 0;
        return (
          '<div class="category-progress-item">' +
          '<div class="progress-header"><span>' +
          cat.label +
          '</span><span>' +
          learned +
          '/' +
          words.length +
          ' (' +
          pct +
          '%)</span></div>' +
          '<div class="progress-bar"><div class="progress-fill" style="width:' +
          pct +
          '%"></div></div></div>'
        );
      })
      .join('');
  }

  render() {
    if (!this.grid) return;
    const words = this.getFiltered();
    this.updateProgressBar();
    if (!words.length) {
      this.grid.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Ничего не найдено</p></div>';
      return;
    }
    this.grid.innerHTML = words.map((w, i) => this.cardHTML(w, i)).join('');
    this.grid.classList.add('stagger');
    words.forEach((w) => {
      const card = this.grid.querySelector('[data-id="' + w.id + '"]');
      card?.addEventListener('click', (e) => {
        if (e.target.closest('.card-action-btn')) return;
        card.classList.toggle('flipped');
        this.sound?.play('tap');
      });
      card?.querySelectorAll('[data-action="speak"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const ok = this.sound?.speak(w.word, 'fr-FR');
          if (!ok) this.toast.show('Включи звук для озвучки', 'info');
        });
      });
      card?.querySelector('[data-action="learned"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setStatus(w.id, 'learned');
      });
      card?.querySelector('[data-action="review"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setStatus(w.id, 'review');
      });
    });
  }

  flipFocused() {
    const cards = this.grid?.querySelectorAll('.flip-card');
    if (!cards?.length) return;
    if (this.focusedIndex >= cards.length) this.focusedIndex = 0;
    cards[this.focusedIndex].classList.toggle('flipped');
    cards[this.focusedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    this.sound?.play('tap');
  }

  cardHTML(w, i) {
    const status = this.progress[w.id];
    const statusIcon =
      status === 'learned'
        ? '<span class="card-status learned"><i class="fas fa-check"></i></span>'
        : status === 'review'
          ? '<span class="card-status review"><i class="fas fa-redo"></i></span>'
          : '';
    return (
      '<div class="flip-card" data-id="' +
      w.id +
      '" style="animation-delay:' +
      i * 0.05 +
      's">' +
      '<div class="flip-card-inner">' +
      '<div class="flip-card-front">' +
      statusIcon +
      '<span class="card-category">' +
      w.categoryLabel +
      '</span>' +
      '<div class="card-slang">' +
      w.word +
      '</div>' +
      '<div class="card-phonetic">' +
      w.phonetic +
      '</div>' +
      '<button class="btn btn-sm btn-speak card-action-btn" data-action="speak" aria-label="Озвучить"><i class="fas fa-volume-up"></i> Слушать</button>' +
      '<div class="card-hint">Нажми — перевернуть</div>' +
      '</div>' +
      '<div class="flip-card-back">' +
      '<span class="card-category">Перевод</span>' +
      '<div class="card-slang">' +
      w.translation +
      '</div>' +
      '<p class="card-context">' +
      w.context +
      '</p>' +
      '<p class="card-example">' +
      w.example +
      '</p>' +
      '<div class="card-actions">' +
      '<button class="btn btn-sm btn-speak card-action-btn" data-action="speak" aria-label="Озвучить"><i class="fas fa-volume-up"></i></button>' +
      '<button class="btn btn-sm btn-secondary card-action-btn" data-action="learned"><i class="fas fa-check"></i> Выучено</button>' +
      '<button class="btn btn-sm btn-ghost card-action-btn card-action-review" data-action="review"><i class="fas fa-redo"></i> Повторить</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  setStatus(wordId, status) {
    this.progress[wordId] = status;
    this.saveProgress();
    this.render();
    this.sound?.play('success');
    this.toast.show(
      status === 'learned' ? 'Слово отмечено как выученное!' : 'Добавлено на повторение',
      'success'
    );
    if (API.getToken()) {
      API.updateProgress(wordId, status).catch(() => {});
    }
  }

  getLearnedCount() {
    return DICTIONARY.filter((w) => this.progress[w.id] === 'learned').length;
  }

  getProgress() {
    return this.progress;
  }
}
