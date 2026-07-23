class ThemeManager {
  constructor() {
    this.theme =
      localStorage.getItem('arsen_theme') ||
      localStorage.getItem('violet_theme') ||
      'light';
    this.apply();
  }

  apply() {
    document.documentElement.setAttribute('data-theme', this.theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = this.theme === 'light' ? '🌙' : '☀️';
  }

  toggle() {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('arsen_theme', this.theme);
    this.apply();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('theme-switching');
      });
    });
  }
}

class SoundManager {
  constructor() {
    this.enabled =
      (localStorage.getItem('arsen_sound') || localStorage.getItem('violet_sound')) !== 'false';
    this.ctx = null;
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      /* no audio */
    }
    this.updateButton();
    document.getElementById('sound-toggle')?.addEventListener('click', () => {
      const on = this.toggle();
      window.app?.toast?.show(on ? 'Звук включён' : 'Звук выключен', 'info');
    });
  }

  updateButton() {
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;
    btn.innerHTML = this.enabled
      ? '<i class="fas fa-volume-up"></i>'
      : '<i class="fas fa-volume-mute"></i>';
    btn.setAttribute('aria-label', this.enabled ? 'Выключить звук' : 'Включить звук');
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('arsen_sound', String(this.enabled));
    this.updateButton();
    if (!this.enabled && window.speechSynthesis) window.speechSynthesis.cancel();
    return this.enabled;
  }

  play(type) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;

    if (type === 'success') {
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'error') {
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'tap') {
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  speak(text, lang) {
    if (!this.enabled || !text || !window.speechSynthesis) return false;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(String(text));
    utter.lang = lang || 'fr-FR';
    utter.rate = 0.92;
    utter.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const fr = voices.find((v) => v.lang.toLowerCase().startsWith('fr'));
    if (fr) utter.voice = fr;
    window.speechSynthesis.speak(utter);
    return true;
  }
}

class ToastManager {
  constructor() {
    this.container = document.getElementById('toast-container');
  }

  show(message, type = 'info') {
    if (!this.container) return;
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    this.container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}
