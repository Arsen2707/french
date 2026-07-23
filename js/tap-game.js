class TapGame {
  constructor(toast, sound) {
    this.toast = toast;
    this.sound = sound;
    this.container = document.getElementById('tap-game-container');
    this.difficulty = 'normal';
    this.difficultySettings = {
      easy: { options: 2, interval: 3500, label: 'Лёгкий' },
      normal: { options: 3, interval: 2500, label: 'Средний' },
      hard: { options: 4, interval: 1800, label: 'Сложный' }
    };
    this.comboMultipliers = [1, 1.5, 2, 2.5];
    this.running = false;
    this.paused = false;
    this.answering = false;
    this.timeLeft = 60;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.currentWord = null;
    this.options = [];
    this.wordShownAt = 0;
    this.timerInterval = null;
    this.wordTimeout = null;
    this.init();
  }

  init() {
    this.renderIdle();
  }

  bindDifficultyButtons() {
    document.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.running) return;
        this.difficulty = btn.dataset.diff;
        document.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    document.querySelector('.diff-btn[data-diff="' + this.difficulty + '"]')?.classList.add('active');
  }

  getSettings() {
    return this.difficultySettings[this.difficulty] || this.difficultySettings.normal;
  }

  getComboMultiplier() {
    const index = Math.min(Math.max(this.combo, 1), this.comboMultipliers.length) - 1;
    return this.comboMultipliers[index];
  }

  renderIdle() {
    if (!this.container) return;
    this.container.innerHTML =
      '<div class="tap-difficulty">' +
      Object.entries(this.difficultySettings)
        .map(
          ([key, value]) =>
            '<button class="diff-btn" data-diff="' +
            key +
            '">' +
            value.label +
            ' (' +
            value.options +
            ')</button>'
        )
        .join('') +
      '</div>' +
      '<div class="tap-stats">' +
      '<div class="tap-stat"><div class="tap-stat-value timer-green">60</div><div class="tap-stat-label">Секунд</div></div>' +
      '<div class="tap-stat"><div class="tap-stat-value">0</div><div class="tap-stat-label">Очки</div></div>' +
      '<div class="tap-stat"><div class="tap-stat-value">x1</div><div class="tap-stat-label">Комбо</div></div>' +
      '</div>' +
      '<div class="tap-question-card">' +
      '<div class="tap-word">VITE!</div>' +
      '<div class="tap-prompt">Французское слово → найди перевод за 60 секунд</div>' +
      '</div>' +
      '<div class="tap-controls">' +
      '<button class="btn btn-primary" id="btn-start-tap"><i class="fas fa-play"></i> Старт</button>' +
      '</div>' +
      '<p class="tap-hint">P — пауза. Быстрый ответ (&lt;3 сек) даёт +5 бонусных очков.</p>';
    document.getElementById('btn-start-tap')?.addEventListener('click', () => this.start());
    this.bindDifficultyButtons();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.answering = false;
    this.timeLeft = 60;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.renderGame();
    this.nextWord();
    this.timerInterval = setInterval(() => {
      if (this.paused) return;
      this.timeLeft--;
      this.updateStats();
      if (this.timeLeft <= 0) this.gameOver();
    }, 1000);
  }

  renderGame() {
    if (!this.container) return;
    this.container.innerHTML =
      '<div class="tap-stats">' +
      '<div class="tap-stat"><div class="tap-stat-value timer-green" id="tap-time">' +
      this.timeLeft +
      '</div><div class="tap-stat-label">Секунд</div></div>' +
      '<div class="tap-stat"><div class="tap-stat-value" id="tap-score">' +
      this.score +
      '</div><div class="tap-stat-label">Очки</div></div>' +
      '<div class="tap-stat"><div class="tap-stat-value" id="tap-combo-stat">x' +
      this.getComboMultiplier() +
      '</div><div class="tap-stat-label">Комбо</div></div>' +
      '</div>' +
      '<div class="tap-question-card" id="tap-question-card">' +
      '<div class="tap-combo" id="tap-combo-badge">x' +
      this.getComboMultiplier() +
      '</div>' +
      '<div class="tap-word" id="tap-word">...</div>' +
      '<button class="btn btn-sm btn-speak" id="btn-speak-tap" type="button" aria-label="Озвучить"><i class="fas fa-volume-up"></i> Слушать</button>' +
      '<div class="tap-prompt" id="tap-prompt">Выбери перевод</div>' +
      '</div>' +
      '<div class="tap-options" id="tap-options"></div>' +
      '<div class="tap-controls">' +
      '<button class="btn btn-secondary" id="btn-pause-tap"><i class="fas fa-pause"></i> Пауза (P)</button>' +
      '<button class="btn btn-ghost" id="btn-stop-tap"><i class="fas fa-stop"></i> Стоп</button>' +
      '</div>';
    document.getElementById('btn-pause-tap')?.addEventListener('click', () => this.togglePause());
    document.getElementById('btn-stop-tap')?.addEventListener('click', () => this.gameOver());
    document.getElementById('btn-speak-tap')?.addEventListener('click', () => {
      if (this.currentWord) this.sound?.speak(this.currentWord.word, 'fr-FR');
    });
  }

  nextWord() {
    if (!this.running || this.paused) return;
    this.answering = false;
    clearTimeout(this.wordTimeout);

    const settings = this.getSettings();
    this.currentWord = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
    this.wordShownAt = Date.now();

    const wrongPool = DICTIONARY.filter((w) => w.id !== this.currentWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, settings.options - 1);

    this.options = [...wrongPool.map((w) => w.translation), this.currentWord.translation].sort(
      () => Math.random() - 0.5
    );

    const wordEl = document.getElementById('tap-word');
    const promptEl = document.getElementById('tap-prompt');
    const optionsEl = document.getElementById('tap-options');

    if (wordEl) {
      wordEl.classList.remove('word-pop');
      void wordEl.offsetWidth;
      wordEl.textContent = this.currentWord.word;
      wordEl.classList.add('word-pop');
    }
    if (promptEl) promptEl.textContent = 'Найди перевод быстрее!';

    if (optionsEl) {
      optionsEl.className = 'tap-options options-' + settings.options;
      optionsEl.innerHTML = this.options
        .map(
          (option) =>
            '<button class="tap-option" data-answer="' +
            this.escapeHtml(option) +
            '">' +
            this.escapeHtml(option) +
            '</button>'
        )
        .join('');
      optionsEl.querySelectorAll('.tap-option').forEach((btn) => {
        btn.addEventListener('click', (e) => this.handleAnswer(btn.dataset.answer, e));
      });
    }

    this.wordTimeout = setTimeout(() => {
      if (!this.running || this.paused || this.answering) return;
      this.handleAnswer(null);
    }, settings.interval);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  spawnParticles(x, y, correct) {
    const card = document.getElementById('tap-question-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const colors = correct
      ? ['#a78bfa', '#c084fc', '#10b981', '#8b5cf6']
      : ['#ef4444', '#f87171', '#a78bfa'];
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const angle = (Math.PI * 2 * i) / 12;
      const dist = 40 + Math.random() * 50;
      p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
      p.style.left = x - rect.left + 'px';
      p.style.top = y - rect.top + 'px';
      p.style.background = colors[i % colors.length];
      card.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }

  handleAnswer(selected, event) {
    if (!this.running || this.paused || this.answering) return;
    this.answering = true;
    clearTimeout(this.wordTimeout);

    const card = document.getElementById('tap-question-card');
    const optionsEl = document.getElementById('tap-options');
    const correct = selected === this.currentWord.translation;
    const elapsed = Date.now() - this.wordShownAt;

    optionsEl?.querySelectorAll('.tap-option').forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.answer === this.currentWord.translation) btn.classList.add('correct');
      else if (btn.dataset.answer === selected) btn.classList.add('wrong');
    });

    if (event) this.spawnParticles(event.clientX, event.clientY, correct);

    if (correct) {
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.correctCount++;
      const speedBonus = elapsed < 3000 ? 5 : 0;
      const points = Math.round((10 + speedBonus) * this.getComboMultiplier());
      this.score += points;
      this.sound?.play('success');
      card?.classList.remove('shake');
      card?.classList.add('flash-green');
      setTimeout(() => card?.classList.remove('flash-green'), 350);
      if (event) this.showFloatingPoints(event, '+' + points);
    } else {
      this.combo = 0;
      this.wrongCount++;
      this.sound?.play('error');
      card?.classList.remove('flash-green');
      card?.classList.add('flash-red', 'shake');
      setTimeout(() => card?.classList.remove('flash-red', 'shake'), 450);
      if (event) this.showFloatingPoints(event, '0');
    }

    this.updateStats();
    setTimeout(() => {
      if (this.running && this.timeLeft > 0) this.nextWord();
    }, 450);
  }

  showFloatingPoints(event, text) {
    const card = document.getElementById('tap-question-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'floating-points';
    el.textContent = text;
    el.style.left = event.clientX - rect.left + 'px';
    el.style.top = event.clientY - rect.top + 'px';
    card.style.position = 'relative';
    card.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  updateTimerClass(el) {
    if (!el) return;
    el.classList.remove('timer-green', 'timer-yellow', 'timer-red');
    if (this.timeLeft > 30) el.classList.add('timer-green');
    else if (this.timeLeft > 15) el.classList.add('timer-yellow');
    else el.classList.add('timer-red');
  }

  updateStats() {
    const timeEl = document.getElementById('tap-time');
    const scoreEl = document.getElementById('tap-score');
    const comboEl = document.getElementById('tap-combo-stat');
    const badge = document.getElementById('tap-combo-badge');
    if (timeEl) {
      timeEl.textContent = this.timeLeft;
      this.updateTimerClass(timeEl);
    }
    if (scoreEl) scoreEl.textContent = this.score;
    const multiplier = this.combo > 0 ? 'x' + this.getComboMultiplier() : 'x1';
    if (comboEl) comboEl.textContent = multiplier;
    if (badge) badge.textContent = multiplier;
  }

  togglePause() {
    if (!this.running) return;
    this.paused = !this.paused;
    const card = document.getElementById('tap-question-card');
    const optionsEl = document.getElementById('tap-options');
    const btn = document.getElementById('btn-pause-tap');

    if (this.paused) {
      clearTimeout(this.wordTimeout);
      card?.classList.add('paused');
      optionsEl?.classList.add('paused');
      if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Продолжить (P)';
      this.toast.show('Пауза', 'info');
    } else {
      card?.classList.remove('paused');
      optionsEl?.classList.remove('paused');
      if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> Пауза (P)';
      if (!this.answering) {
        const remaining = this.getSettings().interval - (Date.now() - this.wordShownAt);
        this.wordTimeout = setTimeout(() => {
          if (!this.running || this.paused || this.answering) return;
          this.handleAnswer(null);
        }, Math.max(remaining, 300));
      }
    }
  }

  stopGame() {
    if (this.running) this.gameOver();
  }

  gameOver() {
    this.running = false;
    this.paused = false;
    clearInterval(this.timerInterval);
    clearTimeout(this.wordTimeout);

    const best = parseInt(
      localStorage.getItem('arsen_tap_best') || localStorage.getItem('violet_tap_best') || '0',
      10
    );
    if (this.score > best) localStorage.setItem('arsen_tap_best', String(this.score));

    document.dispatchEvent(new CustomEvent('tap-completed', { detail: { score: this.score } }));

    if (!this.container) return;
    this.container.innerHTML =
      '<div class="tap-game-over fade-in">' +
      '<h2>Игра окончена!</h2>' +
      '<div class="tap-final-score">' +
      this.score +
      '</div>' +
      '<p class="tap-game-over-label">очков</p>' +
      '<p class="tap-game-over-meta">Верно: ' +
      this.correctCount +
      ' | Ошибок: ' +
      this.wrongCount +
      ' | Макс. комбо: x' +
      this.maxCombo +
      ' | Рекорд: ' +
      Math.max(best, this.score) +
      '</p>' +
      '<div class="tap-controls">' +
      '<button class="btn btn-primary" id="btn-restart-tap"><i class="fas fa-redo"></i> Ещё раз</button>' +
      '</div>' +
      '</div>';

    document.getElementById('btn-restart-tap')?.addEventListener('click', () => this.renderIdle());
    this.toast.show('Игра окончена! ' + this.score + ' очков', 'success');
  }
}
