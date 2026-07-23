(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  // === COLORS ===
  const BG = "#1a0f2e";
  const TEXT = "#f0e6ff";
  const PURPLE = "#bb86fc";
  const INPUT_BG = "#2d1e46";
  const INPUT_ACTIVE = "#bb86fc";
  const BTN_SPIN = "#e056fd";
  const GREEN = "#28c864";
  const RED = "#dc3c46";
  const ARROW = "#ffffff";
  const CLICKER_COLOR = "#78dc96";
  const TAB_ACTIVE = "#bb86fc";
  const TAB_INACTIVE = "#3c2d5a";
  const TAB_TEXT_ACTIVE = "#140a23";
  const TAB_TEXT_INACTIVE = "#b4aac8";
  const GOLD = "#ffd700";
  const EXIT_BTN = "#c8323c";
  const SCALE_COLOR = "#dcdce6";
  const OUTLINE_COLOR = "#c864ff";

  const RARITY_COLORS = {
    common: "#9696a0",
    uncommon: "#50b4ff",
    rare: "#b464ff",
    epic: "#ff64c8",
    legendary: "#ffc832",
  };

  const SPEED_PRESETS = { normal: 5.0, fast: 3.0 };
  const CLICKER_REWARD = 50;
  const OUTLINE_THICKNESS = 20;
  const FPS = 60;

  const CASES = [
    {
      name: "СТАРТОВЫЙ",
      price: 100,
      color: "#5082c8",
      icon: "[S]",
      items: [
        { name: "50", value: 50, chance: 40, rarity: "common" },
        { name: "150", value: 150, chance: 30, rarity: "uncommon" },
        { name: "300", value: 300, chance: 20, rarity: "rare" },
        { name: "1000", value: 1000, chance: 10, rarity: "epic" },
      ],
    },
    {
      name: "ЛУННЫЙ",
      price: 500,
      color: "#6450b4",
      icon: "[M]",
      items: [
        { name: "200", value: 200, chance: 40, rarity: "common" },
        { name: "600", value: 600, chance: 30, rarity: "uncommon" },
        { name: "1500", value: 1500, chance: 20, rarity: "rare" },
        { name: "5000", value: 5000, chance: 10, rarity: "epic" },
      ],
    },
    {
      name: "ОГНЕННЫЙ",
      price: 2000,
      color: "#dc5a3c",
      icon: "[F]",
      items: [
        { name: "800", value: 800, chance: 40, rarity: "common" },
        { name: "2500", value: 2500, chance: 30, rarity: "uncommon" },
        { name: "6000", value: 6000, chance: 20, rarity: "rare" },
        { name: "20000", value: 20000, chance: 10, rarity: "epic" },
      ],
    },
    {
      name: "ЛЕГЕНДАРНЫЙ",
      price: 10000,
      color: "#c89632",
      icon: "[L]",
      items: [
        { name: "3000", value: 3000, chance: 40, rarity: "uncommon" },
        { name: "10000", value: 10000, chance: 30, rarity: "rare" },
        { name: "30000", value: 30000, chance: 20, rarity: "epic" },
        { name: "100000", value: 100000, chance: 10, rarity: "legendary" },
      ],
    },
  ];

  // === STATE ===
  let WIDTH = 0;
  let HEIGHT = 0;
  let WHEEL_RADIUS = 0;
  let CENTER = { x: 0, y: 0 };
  let dpr = 1;

  let balance = 1000;
  let betStr = "100";
  let chanceStr = "50";
  let activeInput = null;
  let resultText = "";
  let resultColor = TEXT;

  let arrowAngle = 90.0;
  let spinning = false;
  let spinStart = 0;
  let spinDuration = 5.0;
  let startAngle = 0.0;
  let finalAngle = 0.0;
  let spinBet = 0;
  let spinMultiplier = 0;
  let spinWin = false;

  let currentTab = "game";
  let wheelSpeed = "normal";

  let clickFloatingTexts = [];
  let clickerPulse = 0.0;
  let totalClicks = 0;

  let maxWin = 0;
  let totalSpins = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalWagered = 0;
  let totalWon = 0;

  let caseOpening = false;
  let caseCurrent = null;
  let caseStrip = [];
  let caseStripOffset = 0.0;
  let caseTargetOffset = 0.0;
  let caseStartTime = 0.0;
  let caseWinnerIdx = 0;
  let caseResultShown = false;

  // Hit areas rebuilt each frame for clicks
  let hitAreas = {
    exit: null,
    tabs: {},
    bet: null,
    chance: null,
    spin: null,
    clicker: null,
    speedNormal: null,
    speedFast: null,
    cases: [],
    caseClose: null,
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas.width = Math.floor(WIDTH * dpr);
    canvas.height = Math.floor(HEIGHT * dpr);
    canvas.style.width = WIDTH + "px";
    canvas.style.height = HEIGHT + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    WHEEL_RADIUS = Math.min(WIDTH, HEIGHT) / 4 - 30;
    CENTER = { x: WIDTH / 2, y: HEIGHT / 2 + 50 };
  }

  window.addEventListener("resize", resize);
  resize();

  // === HELPERS ===
  function roundRect(x, y, w, h, r, fill, stroke) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width || 2;
      ctx.stroke();
    }
  }

  function roundRectTLTR(x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function text(str, x, y, size, color, bold, align) {
    ctx.font = `${bold ? "bold " : ""}${size}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align || "left";
    ctx.textBaseline = "top";
    ctx.fillText(str, x, y);
  }

  function measure(str, size, bold) {
    ctx.font = `${bold ? "bold " : ""}${size}px "Segoe UI", system-ui, sans-serif`;
    return ctx.measureText(str).width;
  }

  function pointInRect(px, py, r) {
    return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  function randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  function randUniform(a, b) {
    return a + Math.random() * (b - a);
  }

  function getChanceVal() {
    const n = parseInt(chanceStr, 10);
    if (Number.isNaN(n)) return 50;
    return Math.max(1, Math.min(99, n));
  }

  // === DRAWING ===
  function drawArrow(angle, wheelContentRadius) {
    const length = wheelContentRadius;
    const rad = (angle * Math.PI) / 180;
    const tipX = CENTER.x + length * Math.cos(rad);
    const tipY = CENTER.y - length * Math.sin(rad);

    const baseRad = rad + Math.PI;
    const baseCx = CENTER.x + 20 * Math.cos(baseRad);
    const baseCy = CENTER.y - 20 * Math.sin(baseRad);

    const blX = baseCx + 10 * Math.cos(rad + Math.PI / 2);
    const blY = baseCy - 10 * Math.sin(rad + Math.PI / 2);
    const brX = baseCx + 10 * Math.cos(rad - Math.PI / 2);
    const brY = baseCy - 10 * Math.sin(rad - Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(blX, blY);
    ctx.lineTo(brX, brY);
    ctx.closePath();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = ARROW;
    ctx.fill();
  }

  function drawScale() {
    const tickOuter = WHEEL_RADIUS - OUTLINE_THICKNESS + 2;
    const tickInner = tickOuter - 10;
    const textRadius = tickInner - 12;

    function drawSide(vals, angleFn) {
      for (const val of vals) {
        let angleDeg = angleFn(val);
        if (angleDeg >= 360) angleDeg -= 360;
        const rad = (angleDeg * Math.PI) / 180;
        const major = val % 10 === 0;
        const inner = major ? tickInner - 3 : tickInner;
        const width = major ? 3 : 2;

        const x1 = CENTER.x + tickOuter * Math.cos(rad);
        const y1 = CENTER.y - tickOuter * Math.sin(rad);
        const x2 = CENTER.x + inner * Math.cos(rad);
        const y2 = CENTER.y - inner * Math.sin(rad);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = SCALE_COLOR;
        ctx.lineWidth = width;
        ctx.stroke();

        if (major) {
          const tx = CENTER.x + textRadius * Math.cos(rad);
          const ty = CENTER.y - textRadius * Math.sin(rad);
          ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = SCALE_COLOR;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(val), tx, ty);
        }
      }
    }

    const rightVals = [];
    for (let v = 0; v <= 100; v += 5) rightVals.push(v);
    drawSide(rightVals, (val) => 270 + val * 1.8);

    const leftVals = [];
    for (let v = 100; v >= 0; v -= 5) leftVals.push(v);
    drawSide(leftVals, (val) => 90 + (100 - val) * 1.8);
  }

  function drawWheel(chance) {
    const greenDeg = chance * 3.6;
    const greenStart = 270 - greenDeg / 2;

    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, WHEEL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = RED;
    ctx.fill();

    const sectorRadius = WHEEL_RADIUS - OUTLINE_THICKNESS / 2 - 1;
    const steps = Math.max(20, Math.floor(greenDeg));
    ctx.beginPath();
    ctx.moveTo(CENTER.x, CENTER.y);
    for (let i = 0; i <= steps; i++) {
      const ourAngle = greenStart + (i * greenDeg) / steps;
      const rad = (ourAngle * Math.PI) / 180;
      ctx.lineTo(
        CENTER.x + sectorRadius * Math.cos(rad),
        CENTER.y - sectorRadius * Math.sin(rad)
      );
    }
    ctx.closePath();
    ctx.fillStyle = GREEN;
    ctx.fill();

    drawArrow(arrowAngle, sectorRadius);

    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, WHEEL_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = OUTLINE_COLOR;
    ctx.lineWidth = OUTLINE_THICKNESS;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, WHEEL_RADIUS - OUTLINE_THICKNESS, 0, Math.PI * 2);
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, 30, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE_COLOR;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, 30, 0, Math.PI * 2);
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#281941";
    ctx.fill();

    drawScale();
  }

  function drawInput(rect, label, value, active) {
    roundRect(rect.x, rect.y, rect.w, rect.h, 8, INPUT_BG, {
      color: active ? INPUT_ACTIVE : "#503c78",
      width: 2,
    });
    text(label, rect.x + 10, rect.y - 22, 18, TEXT, false);
    text(value, rect.x + 10, rect.y + 8, 26, active ? PURPLE : TEXT, false);
  }

  function drawButton(rect, label, color) {
    roundRect(rect.x, rect.y, rect.w, rect.h, 10, color, {
      color: "#ffffff",
      width: 2,
    });
    const tw = measure(label, 26, false);
    text(label, rect.x + rect.w / 2 - tw / 2, rect.y + rect.h / 2 - 13, 26, "#141414", false);
  }

  function drawTabs() {
    const tabWidth = 120;
    const tabHeight = 40;
    const tabY = 75;
    const tabXStart = 20;
    const tabGap = 5;
    const tabsData = [
      ["game", "ИГРА"],
      ["clicker", "КЛИКЕР"],
      ["cases", "КЕЙСЫ"],
      ["profile", "ПРОФИЛЬ"],
      ["settings", "НАСТР."],
    ];

    hitAreas.tabs = {};
    for (let i = 0; i < tabsData.length; i++) {
      const [tabId, labelText] = tabsData[i];
      const tabX = tabXStart + i * (tabWidth + tabGap);
      const tabRect = { x: tabX, y: tabY, w: tabWidth, h: tabHeight };
      hitAreas.tabs[tabId] = tabRect;

      const isActive = currentTab === tabId;
      roundRect(
        tabX,
        tabY,
        tabWidth,
        tabHeight,
        8,
        isActive ? TAB_ACTIVE : TAB_INACTIVE,
        { color: isActive ? PURPLE : "#503c78", width: 2 }
      );
      const tw = measure(labelText, 18, false);
      text(
        labelText,
        tabX + tabWidth / 2 - tw / 2,
        tabY + tabHeight / 2 - 9,
        18,
        isActive ? TAB_TEXT_ACTIVE : TAB_TEXT_INACTIVE,
        false
      );
    }
  }

  function drawExitButton() {
    const btn = { x: WIDTH - 120, y: 20, w: 100, h: 40 };
    hitAreas.exit = btn;
    roundRect(btn.x, btn.y, btn.w, btn.h, 8, EXIT_BTN, {
      color: "#ff6464",
      width: 2,
    });
    const label = "ВЫХОД";
    const tw = measure(label, 18, false);
    text(label, btn.x + btn.w / 2 - tw / 2, btn.y + btn.h / 2 - 9, 18, "#ffffff", false);
  }

  function drawUiHeader() {
    const title = "ARSENGRADER";
    const tw = measure(title, 48, true);
    text(title, WIDTH / 2 - tw / 2, 130, 48, PURPLE, true);

    const chanceVal = getChanceVal();
    const mult = 100 / chanceVal;

    const multLabel = "МНОЖИТЕЛЬ";
    const multValue = `x${mult.toFixed(2)}`;
    const mW = Math.max(measure(multLabel, 18, false), measure(multValue, 26, false));
    const mx = WIDTH - mW - 30;
    const my = 130;

    text(multLabel, mx + (mW - measure(multLabel, 18, false)) / 2, my, 18, "#9682b4", false);
    text(multValue, mx + (mW - measure(multValue, 26, false)) / 2, my + 25, 26, PURPLE, false);

    return chanceVal;
  }

  function drawBalanceHud() {
    const balText = String(balance);
    const balLabel = "БАЛАНС";
    const padding = 15;
    const textW = measure(balText, 32, true);
    const labelW = measure(balLabel, 18, false);
    const w = Math.max(textW, labelW) + padding * 2;
    const h = 32 + 18 + padding * 2 + 5;
    const x = WIDTH - w - 20;
    const y = HEIGHT - h - 20;

    roundRect(x, y, w, h, 12, "#281941", { color: PURPLE, width: 2 });
    text(balLabel, x + w / 2 - labelW / 2, y + 10, 18, PURPLE, false);
    text(balText, x + w / 2 - textW / 2, y + 10 + 18, 32, GOLD, true);
  }

  function drawClickerTab() {
    const btnSize = 250;
    const clickerRect = {
      x: WIDTH / 2 - btnSize / 2,
      y: HEIGHT / 2 - btnSize / 2,
      w: btnSize,
      h: btnSize,
    };
    hitAreas.clicker = clickerRect;

    if (clickerPulse > 0) {
      const pulseSize = clickerPulse * 20;
      const px = clickerRect.x - pulseSize / 2;
      const py = clickerRect.y - pulseSize / 2;
      const pw = clickerRect.w + pulseSize;
      const ph = clickerRect.h + pulseSize;
      ctx.globalAlpha = 0.4 * clickerPulse;
      roundRect(px, py, pw, ph, 25, CLICKER_COLOR);
      ctx.globalAlpha = 1;
    }

    roundRect(clickerRect.x, clickerRect.y, clickerRect.w, clickerRect.h, 25, CLICKER_COLOR, {
      color: PURPLE,
      width: 4,
    });

    const label = "КЛИК";
    const lw = measure(label, 50, true);
    text(label, clickerRect.x + clickerRect.w / 2 - lw / 2, clickerRect.y + clickerRect.h / 2 - 35, 50, "#141414", true);

    const sub = `+${CLICKER_REWARD} за клик`;
    const sw = measure(sub, 18, false);
    text(sub, WIDTH / 2 - sw / 2, clickerRect.y + clickerRect.h + 20, 18, TEXT, false);

    const stats = `Кликов: ${totalClicks} | Заработано: ${totalClicks * CLICKER_REWARD}`;
    const stw = measure(stats, 18, false);
    text(stats, WIDTH / 2 - stw / 2, HEIGHT - 60, 18, "#9682b4", false);

    for (const ft of clickFloatingTexts) {
      const [x, y, alpha] = ft;
      ctx.globalAlpha = Math.max(0, alpha);
      const t = `+${CLICKER_REWARD}`;
      const tw = measure(t, 48, true);
      text(t, x - tw / 2, y - 24, 48, "#000000", true);
      ctx.globalAlpha = 1;
    }
  }

  function drawProfileTab() {
    const title = "ПРОФИЛЬ ИГРОКА";
    const tw = measure(title, 48, true);
    text(title, WIDTH / 2 - tw / 2, 130, 48, PURPLE, true);

    const panelW = 500;
    const panelH = 400;
    const panel = {
      x: WIDTH / 2 - panelW / 2,
      y: 240,
      w: panelW,
      h: panelH,
    };
    roundRect(panel.x, panel.y, panel.w, panel.h, 15, INPUT_BG, {
      color: PURPLE,
      width: 3,
    });

    let y = panel.y + 20;
    const lh = 45;

    function drawStat(labelTxt, valueTxt, color) {
      text(labelTxt, panel.x + 30, y, 26, TEXT, false);
      const vw = measure(String(valueTxt), 32, true);
      text(String(valueTxt), panel.x + panel.w - vw - 30, y, 32, color, true);
      y += lh;
    }

    drawStat("Макс. выигрыш:", maxWin, GOLD);
    drawStat("Баланс:", balance, PURPLE);
    ctx.beginPath();
    ctx.moveTo(panel.x + 20, y - 10);
    ctx.lineTo(panel.x + panel.w - 20, y - 10);
    ctx.strokeStyle = "#3c3250";
    ctx.lineWidth = 2;
    ctx.stroke();
    drawStat("Всего спинов:", totalSpins, TEXT);
    drawStat("Побед:", totalWins, GREEN);
    drawStat("Поражений:", totalLosses, RED);
    drawStat("Оборот ставок:", totalWagered, "#c8b4dc");
    drawStat("Всего выиграно:", totalWon, "#c8b4dc");
  }

  function drawSettingsTab() {
    const title = "НАСТРОЙКИ РУЛЕТКИ";
    const tw = measure(title, 48, true);
    text(title, WIDTH / 2 - tw / 2, 150, 48, PURPLE, true);

    const panelW = 450;
    const panelH = 200;
    const panel = {
      x: WIDTH / 2 - panelW / 2,
      y: 220,
      w: panelW,
      h: panelH,
    };
    roundRect(panel.x, panel.y, panel.w, panel.h, 15, INPUT_BG, {
      color: PURPLE,
      width: 3,
    });

    const lbl = "Скорость вращения:";
    const lw = measure(lbl, 26, false);
    text(lbl, panel.x + panel.w / 2 - lw / 2, panel.y + 30, 26, TEXT, false);

    const bw = 180;
    const bh = 60;
    const by = panel.y + 80;
    const nr = { x: panel.x + panel.w / 2 - bw - 10, y: by, w: bw, h: bh };
    const fr = { x: panel.x + panel.w / 2 + 10, y: by, w: bw, h: bh };
    hitAreas.speedNormal = nr;
    hitAreas.speedFast = fr;

    const isN = wheelSpeed === "normal";
    roundRect(nr.x, nr.y, nr.w, nr.h, 10, isN ? TAB_ACTIVE : TAB_INACTIVE, {
      color: isN ? PURPLE : "#503c78",
      width: 2,
    });
    text(
      "Стандартная",
      nr.x + nr.w / 2 - measure("Стандартная", 18, false) / 2,
      nr.y + nr.h / 2 - 9,
      18,
      isN ? TAB_TEXT_ACTIVE : TAB_TEXT_INACTIVE,
      false
    );

    const isF = wheelSpeed === "fast";
    roundRect(fr.x, fr.y, fr.w, fr.h, 10, isF ? TAB_ACTIVE : TAB_INACTIVE, {
      color: isF ? PURPLE : "#503c78",
      width: 2,
    });
    text(
      "Быстрая",
      fr.x + fr.w / 2 - measure("Быстрая", 18, false) / 2,
      fr.y + fr.h / 2 - 9,
      18,
      isF ? TAB_TEXT_ACTIVE : TAB_TEXT_INACTIVE,
      false
    );

    const hint = `Текущее время: ${spinDuration.toFixed(1)} сек`;
    const hw = measure(hint, 18, false);
    text(hint, panel.x + panel.w / 2 - hw / 2, panel.y + panel.h - 30, 18, "#9682b4", false);
  }

  function drawCasesGrid() {
    const title = "МАГАЗИН КЕЙСОВ";
    const tw = measure(title, 48, true);
    text(title, WIDTH / 2 - tw / 2, 130, 48, PURPLE, true);

    const cw = 220;
    const ch = 280;
    const gap = 20;
    const totalW = cw * 2 + gap;
    const sx = WIDTH / 2 - totalW / 2;
    const sy = 190;

    hitAreas.cases = [];
    for (let i = 0; i < CASES.length; i++) {
      const caseItem = CASES[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = sx + col * (cw + gap);
      const y = sy + row * (ch + gap);
      const r = { x, y, w: cw, h: ch };
      hitAreas.cases.push({ rect: r, caseItem });

      roundRect(x, y, cw, ch, 12, INPUT_BG);
      roundRectTLTR(x, y, cw, 80, 12, caseItem.color);
      roundRect(x, y, cw, ch, 12, null, { color: caseItem.color, width: 3 });

      const iconW = measure(caseItem.icon, 50, true);
      text(caseItem.icon, r.x + cw / 2 - iconW / 2, y + 18, 50, "#ffffff", true);

      const nameW = measure(caseItem.name, 26, false);
      text(caseItem.name, r.x + cw / 2 - nameW / 2, y + 90, 26, "#ffffff", false);

      const priceLbl = "Цена:";
      text(priceLbl, r.x + cw / 2 - measure(priceLbl, 18, false) / 2, y + 130, 18, "#b4aac8", false);
      const priceVal = String(caseItem.price);
      text(priceVal, r.x + cw / 2 - measure(priceVal, 32, true) / 2, y + 155, 32, GOLD, true);

      let iy = y + 210;
      for (const item of caseItem.items.slice(0, 2)) {
        const c = RARITY_COLORS[item.rarity];
        const t = `${item.name} (${item.chance}%)`;
        text(t, r.x + cw / 2 - measure(t, 14, false) / 2, iy, 14, c, false);
        iy += 18;
      }
    }
  }

  function generateCaseStrip(caseItem) {
    const strip = [];
    const totalChance = caseItem.items.reduce((s, i) => s + i.chance, 0);
    let roll = randInt(1, totalChance);
    let cum = 0;
    let winner = caseItem.items[0];
    for (const item of caseItem.items) {
      cum += item.chance;
      if (roll <= cum) {
        winner = item;
        break;
      }
    }

    for (let i = 0; i < 60; i++) {
      if (i === 50) {
        strip.push(winner);
      } else {
        const r = randInt(1, totalChance);
        let c = 0;
        let picked = caseItem.items[0];
        for (const item of caseItem.items) {
          c += item.chance;
          if (r <= c) {
            picked = item;
            break;
          }
        }
        strip.push(picked);
      }
    }
    return { strip, winnerIdx: 50 };
  }

  function drawCaseOverlay() {
    const winW = 800;
    const winH = 400;
    const winX = WIDTH / 2 - winW / 2;
    const winY = HEIGHT / 2 - winH / 2;

    ctx.fillStyle = "rgba(0,0,0,0.78)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    roundRect(winX, winY, winW, winH, 20, INPUT_BG, {
      color: caseCurrent.color,
      width: 4,
    });

    text(`ОТКРЫТИЕ: ${caseCurrent.name}`, winX + 20, winY + 20, 26, caseCurrent.color, false);

    const stripH = 150;
    const stripY = winY + 80;
    const clipX = winX + 20;
    const clipW = winW - 40;

    ctx.save();
    ctx.beginPath();
    ctx.rect(clipX, stripY, clipW, stripH);
    ctx.clip();

    const itemW = 120;
    const centerX = WIDTH / 2;

    for (let i = 0; i < caseStrip.length; i++) {
      const item = caseStrip[i];
      const posX = centerX + (i - 50) * itemW - caseStripOffset;
      if (posX + itemW < clipX || posX > clipX + clipW) continue;

      const rColor = RARITY_COLORS[item.rarity];
      const itemRect = { x: posX + 5, y: stripY + 10, w: itemW - 10, h: stripH - 20 };

      roundRect(itemRect.x, itemRect.y, itemRect.w, itemRect.h, 8, "#1e1432");
      roundRectTLTR(posX + 5, stripY + 10, itemW - 10, 6, 8, rColor);
      roundRect(itemRect.x, itemRect.y, itemRect.w, itemRect.h, 8, null, {
        color: rColor,
        width: 2,
      });

      const valW = measure(item.name, 32, true);
      text(
        item.name,
        itemRect.x + itemRect.w / 2 - valW / 2,
        itemRect.y + itemRect.h / 2 - 16,
        32,
        rColor,
        true
      );
    }
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(centerX, stripY - 10);
    ctx.lineTo(centerX, stripY + stripH + 10);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, stripY - 15);
    ctx.lineTo(centerX - 10, stripY);
    ctx.lineTo(centerX + 10, stripY);
    ctx.closePath();
    ctx.fillStyle = GOLD;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX, stripY + stripH + 15);
    ctx.lineTo(centerX - 10, stripY + stripH);
    ctx.lineTo(centerX + 10, stripY + stripH);
    ctx.closePath();
    ctx.fillStyle = GOLD;
    ctx.fill();

    hitAreas.caseClose = null;
    if (caseResultShown) {
      const winner = caseStrip[caseWinnerIdx];
      const wColor = RARITY_COLORS[winner.rarity];

      const resBoxW = 450;
      const resBoxH = 180;
      const resBox = {
        x: winX + winW / 2 - resBoxW / 2,
        y: stripY + stripH + 40,
        w: resBoxW,
        h: resBoxH,
      };

      roundRect(resBox.x, resBox.y, resBox.w, resBox.h, 15, INPUT_BG, {
        color: wColor,
        width: 4,
      });

      const t1 = "ВЫПАЛО:";
      text(t1, resBox.x + resBox.w / 2 - measure(t1, 26, false) / 2, resBox.y + 30, 26, TEXT, false);
      const t2 = `+${winner.value}`;
      text(t2, resBox.x + resBox.w / 2 - measure(t2, 26, false) / 2, resBox.y + 65, 26, "#ffffff", false);

      const closeBtn = {
        x: resBox.x + resBox.w / 2 - 90,
        y: resBox.y + resBox.h - 45 - 15,
        w: 180,
        h: 45,
      };
      hitAreas.caseClose = closeBtn;

      roundRect(closeBtn.x, closeBtn.y, closeBtn.w, closeBtn.h, 8, GREEN, {
        color: "#ffffff",
        width: 2,
      });
      text("ЗАБРАТЬ", closeBtn.x + closeBtn.w / 2 - measure("ЗАБРАТЬ", 26, false) / 2, closeBtn.y + closeBtn.h / 2 - 13, 26, "#141414", false);
    }
  }

  function startSpin() {
    let bet;
    let chance;
    try {
      bet = parseInt(betStr, 10);
      chance = parseInt(chanceStr, 10);
    } catch {
      resultText = "Ошибка ввода";
      resultColor = RED;
      return;
    }
    if (Number.isNaN(bet) || Number.isNaN(chance)) {
      resultText = "Ошибка ввода";
      resultColor = RED;
      return;
    }
    if (!(chance >= 1 && chance <= 99)) {
      resultText = "Шанс 1-99";
      resultColor = RED;
      return;
    }
    if (bet <= 0 || bet > balance) {
      resultText = "Мало денег";
      resultColor = RED;
      return;
    }

    const mult = 100 / chance;
    const win = randInt(1, 100) <= chance;
    const gDeg = chance * 3.6;
    const gStart = 270 - gDeg / 2;
    const gEnd = 270 + gDeg / 2;

    let target;
    if (win) {
      target = randUniform(gStart, gEnd);
    } else {
      const tr = 360 - gDeg;
      const p = randUniform(0, tr);
      target = p < 360 - gEnd ? gEnd + p : p - (360 - gEnd);
    }

    const spins = randInt(5, 8);
    startAngle = arrowAngle;
    finalAngle = startAngle + spins * 360 + ((target - startAngle + 360) % 360);

    spinStart = performance.now() / 1000;
    spinning = true;
    resultText = "";
    spinBet = bet;
    spinMultiplier = mult;
    spinWin = win;
    totalSpins += 1;
    totalWagered += bet;
  }

  // === INPUT ===
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    handleClick(mx, my);
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      handleClick(t.clientX - rect.left, t.clientY - rect.top);
    },
    { passive: false }
  );

  function handleClick(mx, my) {
    if (pointInRect(mx, my, hitAreas.exit)) {
      if (confirm("Закрыть игру?")) {
        window.close();
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#1a0f2e;color:#bb86fc;font:48px Segoe UI">ARSENGRADER</div>';
      }
      return;
    }

    if (caseOpening) {
      if (caseResultShown && pointInRect(mx, my, hitAreas.caseClose)) {
        const winner = caseStrip[caseWinnerIdx];
        balance += winner.value;
        totalWon += winner.value;
        if (winner.value > maxWin) maxWin = winner.value;
        caseOpening = false;
        caseResultShown = false;
      }
      return;
    }

    for (const [tid, tr] of Object.entries(hitAreas.tabs)) {
      if (pointInRect(mx, my, tr)) {
        currentTab = tid;
        activeInput = null;
        return;
      }
    }

    if (currentTab === "clicker") {
      if (pointInRect(mx, my, hitAreas.clicker)) {
        balance += CLICKER_REWARD;
        totalClicks += 1;
        clickerPulse = 1.0;
        clickFloatingTexts.push([
          hitAreas.clicker.x + hitAreas.clicker.w / 2 + randInt(-50, 50),
          hitAreas.clicker.y + hitAreas.clicker.h / 2,
          1.0,
        ]);
      }
    } else if (currentTab === "settings") {
      if (pointInRect(mx, my, hitAreas.speedNormal)) {
        wheelSpeed = "normal";
        spinDuration = SPEED_PRESETS.normal;
      } else if (pointInRect(mx, my, hitAreas.speedFast)) {
        wheelSpeed = "fast";
        spinDuration = SPEED_PRESETS.fast;
      }
    } else if (currentTab === "cases") {
      for (const { rect, caseItem } of hitAreas.cases) {
        if (pointInRect(mx, my, rect)) {
          if (balance >= caseItem.price) {
            balance -= caseItem.price;
            totalWagered += caseItem.price;
            caseCurrent = caseItem;
            const gen = generateCaseStrip(caseItem);
            caseStrip = gen.strip;
            caseWinnerIdx = gen.winnerIdx;
            caseStripOffset = -2500.0;
            caseTargetOffset = randUniform(-20, 20);
            caseStartTime = performance.now() / 1000;
            caseOpening = true;
            caseResultShown = false;
            resultText = "";
          } else {
            resultText = "Недостаточно средств!";
            resultColor = RED;
          }
          break;
        }
      }
    } else if (currentTab === "game") {
      if (pointInRect(mx, my, hitAreas.bet)) {
        activeInput = "bet";
      } else if (pointInRect(mx, my, hitAreas.chance)) {
        activeInput = "chance";
      } else if (pointInRect(mx, my, hitAreas.spin) && !spinning) {
        startSpin();
      } else {
        activeInput = null;
      }
    }
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (confirm("Закрыть игру?")) {
        window.close();
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#1a0f2e;color:#bb86fc;font:48px Segoe UI">ARSENGRADER</div>';
      }
      return;
    }

    if (!activeInput) return;

    if (e.key === "Enter") {
      activeInput = null;
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      if (activeInput === "bet") betStr = betStr.slice(0, -1);
      else chanceStr = chanceStr.slice(0, -1);
      return;
    }
    if (/^\d$/.test(e.key)) {
      if (activeInput === "bet" && betStr.length < 7) betStr += e.key;
      else if (activeInput === "chance" && chanceStr.length < 2) chanceStr += e.key;
    }
  });

  // === MAIN LOOP ===
  let lastTime = performance.now();

  function frame(nowMs) {
    const now = nowMs / 1000;
    const dt = Math.min((nowMs - lastTime) / 1000, 0.05);
    lastTime = nowMs;

    if (clickerPulse > 0) clickerPulse = Math.max(0, clickerPulse - dt * 3);
    for (const ft of clickFloatingTexts) {
      ft[1] -= dt * 80;
      ft[2] -= dt * 0.8;
    }
    clickFloatingTexts = clickFloatingTexts.filter((ft) => ft[2] > 0);

    if (caseOpening && !caseResultShown) {
      const t = Math.min((now - caseStartTime) / spinDuration, 1.0);
      const eased = 1 - Math.pow(1 - t, 3);
      caseStripOffset = -2500.0 + (caseTargetOffset - -2500.0) * eased;
      if (t >= 1.0) {
        caseStripOffset = caseTargetOffset;
        caseResultShown = true;
      }
    }

    if (spinning) {
      const t = Math.min((now - spinStart) / spinDuration, 1.0);
      const eased = 1 - Math.pow(1 - t, 3);
      arrowAngle = startAngle + (finalAngle - startAngle) * eased;
      if (t >= 1.0) {
        spinning = false;
        arrowAngle = ((finalAngle % 360) + 360) % 360;
        if (spinWin) {
          const wa = Math.floor(spinBet * spinMultiplier);
          balance += wa - spinBet;
          resultText = `ВЫИГРЫШ! +${wa - spinBet}`;
          resultColor = GREEN;
          totalWins += 1;
          totalWon += wa;
          if (wa > maxWin) maxWin = wa;
        } else {
          balance -= spinBet;
          resultText = `ПРОИГРЫШ! -${spinBet}`;
          resultColor = RED;
          totalLosses += 1;
        }
      }
    }

    // Draw
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const chanceVal = drawUiHeader();
    drawTabs();
    drawExitButton();
    drawBalanceHud();

    hitAreas.bet = null;
    hitAreas.chance = null;
    hitAreas.spin = null;
    hitAreas.clicker = null;
    hitAreas.speedNormal = null;
    hitAreas.speedFast = null;
    hitAreas.cases = [];

    if (currentTab === "game") {
      drawWheel(chanceVal);

      const inputWidth = 200;
      const inputHeight = 50;
      const lx = CENTER.x - WHEEL_RADIUS - inputWidth - 40;
      const br = { x: lx, y: CENTER.y - 70, w: inputWidth, h: inputHeight };
      const chr = { x: lx, y: CENTER.y + 20, w: inputWidth, h: inputHeight };
      const bw = 180;
      const bh = 70;
      const rx = CENTER.x + WHEEL_RADIUS + 40;
      const sr = { x: rx, y: CENTER.y - bh / 2, w: bw, h: bh };

      hitAreas.bet = br;
      hitAreas.chance = chr;
      hitAreas.spin = sr;

      drawInput(br, "Ставка", betStr || "0", activeInput === "bet");
      drawInput(chr, "Шанс %", chanceStr || "0", activeInput === "chance");
      drawButton(sr, spinning ? "..." : "КРУТИТЬ", spinning ? "#64508c" : BTN_SPIN);

      if (resultText) {
        const rw = measure(resultText, 26, false);
        text(resultText, WIDTH / 2 - rw / 2, HEIGHT - 150, 26, resultColor, false);
      }
    } else if (currentTab === "clicker") {
      drawClickerTab();
    } else if (currentTab === "profile") {
      drawProfileTab();
    } else if (currentTab === "settings") {
      drawSettingsTab();
    } else if (currentTab === "cases") {
      drawCasesGrid();
      if (resultText) {
        const rw = measure(resultText, 26, false);
        text(resultText, WIDTH / 2 - rw / 2, HEIGHT - 150, 26, resultColor, false);
      }
    }

    if (caseOpening) {
      drawCaseOverlay();
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
