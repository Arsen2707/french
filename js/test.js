class TestManager {
  constructor(toast, sound) {
    this.toast = toast;
    this.sound = sound;
    this.container = document.getElementById('test-container');
    this.questions = [];
    this.current = 0;
    this.score = 0;
    this.answered = false;
    this.matchSelected = null;
    this.matchPairs = [];
    this.mistakes = [];
    this.render();
  }

  start() {
    this.questions = this.generateQuestions();
    this.current = 0;
    this.score = 0;
    this.mistakes = [];
    this.render();
  }

  generateQuestions() {
    const count = Math.min(10, DICTIONARY.length);
    const shuffled = [...DICTIONARY].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    const types = ['choice', 'fill', 'matching'];
    return selected
      .map((word, i) => {
        const type = types[i % types.length];
        if (type === 'choice') return this.makeChoice(word);
        if (type === 'fill') return this.makeFill(word);
        return this.makeMatching(word);
      })
      .sort(() => Math.random() - 0.5);
  }

  makeChoice(word) {
    const others = DICTIONARY.filter((w) => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [...others.map((w) => w.translation), word.translation].sort(
      () => Math.random() - 0.5
    );
    return {
      type: 'choice',
      word,
      question: 'Что означает «' + word.word + '»?',
      options,
      answer: word.translation
    };
  }

  makeFill(word) {
    return {
      type: 'fill',
      word,
      question: 'Перевод «' + word.word + '» — это:',
      answer: word.translation.toLowerCase()
    };
  }

  makeMatching(word) {
    const pair = DICTIONARY.filter((w) => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    pair.push(word);
    const pairs = pair.sort(() => Math.random() - 0.5);
    return {
      type: 'matching',
      word,
      question: 'Сопоставь французское слово с переводом:',
      pairs,
      answer: word.id
    };
  }

  render() {
    if (!this.container) return;
    if (!this.questions.length) {
      this.container.innerHTML =
        '<div class="test-result fade-in">' +
        '<h2>Тест по французскому</h2>' +
        '<p class="test-feedback">Проверь, как хорошо ты запомнил слова</p>' +
        '<button class="btn btn-primary" id="btn-start-test"><i class="fas fa-play"></i> Начать тест</button>' +
        '</div>';
      document.getElementById('btn-start-test')?.addEventListener('click', () => this.start());
      return;
    }
    if (this.current >= this.questions.length) {
      this.renderResult();
      return;
    }
    const q = this.questions[this.current];
    const pct = Math.round((this.current / this.questions.length) * 100);
    let body = '';
    if (q.type === 'choice') {
      body =
        '<div class="test-options">' +
        q.options
          .map((opt) => '<button class="test-option" data-answer="' + opt + '">' + opt + '</button>')
          .join('') +
        '</div>';
    } else if (q.type === 'fill') {
      body =
        '<input type="text" class="test-fill-input" id="fill-answer" placeholder="Введи перевод..." autocomplete="off">' +
        '<button class="btn btn-primary btn-block" style="margin-top:1rem" id="btn-check-fill">Проверить</button>';
    } else {
      const wordItems = q.pairs
        .map((p) => '<div class="match-item" data-side="word" data-id="' + p.id + '">' + p.word + '</div>')
        .join('');
      const transItems = [...q.pairs]
        .sort(() => Math.random() - 0.5)
        .map((p) => '<div class="match-item" data-side="trans" data-id="' + p.id + '">' + p.translation + '</div>')
        .join('');
      body = '<div class="matching-grid"><div>' + wordItems + '</div><div>' + transItems + '</div></div>';
    }
    this.container.innerHTML =
      '<div class="test-progress">' +
      '<span>' +
      (this.current + 1) +
      '/' +
      this.questions.length +
      '</span>' +
      '<div class="test-progress-bar"><div class="test-progress-fill" style="width:' +
      pct +
      '%"></div></div>' +
      '</div>' +
      '<div class="test-question-card fade-in">' +
      '<div class="test-question-text">' +
      q.question +
      '</div>' +
      body +
      '</div>';
    this.answered = false;
    this.matchSelected = null;
    this.matchPairs = [];
    if (q.type === 'choice') this.bindChoice(q);
    else if (q.type === 'fill') this.bindFill(q);
    else this.bindMatching(q);
  }

  recordMistake(q, userAnswer) {
    this.mistakes.push({
      word: q.word.word,
      correct: q.word.translation,
      given: userAnswer || '—',
      type: q.type
    });
  }

  bindChoice(q) {
    this.container.querySelectorAll('.test-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.answered) return;
        this.answered = true;
        const correct = btn.dataset.answer === q.answer;
        this.container.querySelectorAll('.test-option').forEach((b) => {
          b.disabled = true;
          if (b.dataset.answer === q.answer) b.classList.add('correct');
          else if (b === btn && !correct) b.classList.add('wrong');
        });
        if (correct) {
          this.score++;
          this.sound?.play('success');
        } else {
          this.sound?.play('error');
          this.recordMistake(q, btn.dataset.answer);
        }
        setTimeout(() => {
          this.current++;
          this.render();
        }, 1100);
      });
    });
  }

  bindFill(q) {
    const input = document.getElementById('fill-answer');
    document.getElementById('btn-check-fill')?.addEventListener('click', () => {
      if (this.answered) return;
      this.answered = true;
      const val = input.value.trim().toLowerCase();
      const correct = val === q.answer;
      input.style.borderColor = correct ? 'var(--success)' : 'var(--error)';
      if (correct) {
        this.score++;
        this.sound?.play('success');
      } else {
        this.sound?.play('error');
        this.recordMistake(q, input.value.trim() || '—');
        input.value = q.word.translation;
      }
      setTimeout(() => {
        this.current++;
        this.render();
      }, 1400);
    });
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-check-fill')?.click();
    });
  }

  bindMatching(q) {
    this.container.querySelectorAll('.match-item').forEach((item) => {
      item.addEventListener('click', () => {
        if (this.answered || item.classList.contains('matched')) return;
        if (!this.matchSelected) {
          this.matchSelected = item;
          item.classList.add('selected');
          return;
        }
        if (this.matchSelected === item) {
          item.classList.remove('selected');
          this.matchSelected = null;
          return;
        }
        if (this.matchSelected.dataset.side === item.dataset.side) {
          this.matchSelected.classList.remove('selected');
          this.matchSelected = item;
          item.classList.add('selected');
          return;
        }
        const id1 = this.matchSelected.dataset.id;
        const id2 = item.dataset.id;
        if (id1 === id2) {
          this.matchSelected.classList.add('matched');
          item.classList.add('matched');
          this.matchSelected.classList.remove('selected');
          this.matchPairs.push(id1);
          this.matchSelected = null;
          if (this.matchPairs.length === q.pairs.length) {
            this.answered = true;
            this.score++;
            this.sound?.play('success');
            setTimeout(() => {
              this.current++;
              this.render();
            }, 900);
          }
        } else {
          this.matchSelected.classList.remove('selected');
          this.matchSelected = item;
          item.classList.add('selected');
        }
      });
    });
  }

  renderResult() {
    const total = this.questions.length;
    const pct = Math.round((this.score / total) * 100);
    let feedback = 'Bravo! Ты отлично знаешь французский!';
    if (pct < 50) feedback = 'Нужно ещё потренироваться…';
    else if (pct < 80) feedback = 'Неплохо! Продолжай учиться!';

    let reviewHtml = '';
    if (this.mistakes.length) {
      reviewHtml =
        '<div class="test-review"><h3>Разбор ошибок</h3>' +
        this.mistakes
          .map(
            (m) =>
              '<div class="test-review-item wrong">' +
              '<strong>' +
              m.word +
              '</strong> → ' +
              m.correct +
              ' <span style="opacity:0.7">(твой ответ: ' +
              m.given +
              ')</span></div>'
          )
          .join('') +
        '</div>';
    } else {
      reviewHtml = '<div class="test-review"><div class="test-review-item correct">Ошибок нет — идеально!</div></div>';
    }

    this.container.innerHTML =
      '<div class="test-result fade-in">' +
      '<div class="test-score">' +
      this.score +
      '/' +
      total +
      '</div>' +
      '<p class="test-feedback">' +
      feedback +
      '</p>' +
      '<p style="color:var(--text-muted);margin-bottom:1.5rem">' +
      pct +
      '% правильных ответов</p>' +
      reviewHtml +
      '<button class="btn btn-primary" id="btn-retry-test"><i class="fas fa-redo"></i> Ещё раз</button>' +
      '</div>';
    document.getElementById('btn-retry-test')?.addEventListener('click', () => this.start());
    localStorage.setItem(
      'arsen_last_test',
      JSON.stringify({ score: this.score, total, date: Date.now() })
    );
    if (window.app?.auth?.getMode() === 'local') {
      const user = window.app.auth.getUser();
      if (user) {
        LocalAuth.updateAccount(user.email, {
          lastTest: { score: this.score, total, date: Date.now() }
        });
      }
    }
    if (API.getToken()) {
      API.saveTestResult(this.score, total).catch(() => {});
    }
    document.dispatchEvent(
      new CustomEvent('test-completed', { detail: { score: this.score, total } })
    );
    this.toast.show('Тест завершён: ' + this.score + '/' + total, 'success');
  }
}
