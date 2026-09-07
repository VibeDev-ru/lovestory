console.log('📦 Загрузка script.js...');

(function() {
  "use strict";

  console.log('✅ script.js выполняется');

  const screens = {
    start: document.querySelector('[data-screen="start"]'),
    map: document.querySelector('[data-screen="map"]'),
    level: document.querySelector('[data-screen="level"]'),
    gifts: document.querySelector('[data-screen="gifts"]'),
    final: document.querySelector('[data-screen="final"]')
  };

  let currentLevelIndex = 0;
  let completedLevels = [];
  let giftChosen = false;

  function showScreen(name) {
    console.log(`🔄 showScreen("${name}")`);
    if (!screens[name]) { console.error(`❌ ЭКРАН "${name}" НЕ СУЩЕСТВУЕТ`); return; }
    Object.values(screens).forEach(el => { if (el) el.classList.remove('is-active'); });
    screens[name].classList.add('is-active');
  }

  function setPhoto(frame, img, src, placeholder) {
    if (!frame || !img) return;
    frame.classList.remove('is-missing');
    frame.dataset.placeholder = placeholder || `Добавь файл\n${src}`;
    img.onerror = () => { console.warn(`⚠️ Фото не загружено: ${src}`); frame.classList.add('is-missing'); };
    img.onload = () => { console.log(`✅ Фото загружено: ${src}`); frame.classList.remove('is-missing'); };
    img.src = src;
  }

  function initStart() {
    console.log('🚀 initStart()');
    const nameSpan = document.querySelector('.name');
    if (nameSpan) nameSpan.textContent = CONFIG.girlName;
    document.getElementById('start-subtitle').textContent = CONFIG.startSubtitle;
    document.getElementById('btn-start').addEventListener('click', () => { buildMap(); showScreen('map'); });
  }

  // ===== 14 ТОЧЕК В ПРОЦЕНТАХ =====
  const NODE_COORDS = [
    { x: 50, y: 5 }, { x: 73, y: 8 }, { x: 79, y: 15 }, { x: 78, y: 23 },
    { x: 69, y: 30 }, { x: 55, y: 36 }, { x: 39, y: 42 }, { x: 28, y: 50 },
    { x: 30, y: 58 }, { x: 40, y: 64 }, { x: 55, y: 69 }, { x: 69, y: 74 },
    { x: 73, y: 80 }, { x: 63, y: 87 }, { x: 48, y: 92 }
  ];

  let mapNodes = [];

  function buildMap() {
    console.log('🗺️ buildMap()');
    const container = document.getElementById('mapNodes');
    if (!container) { console.error('❌ #mapNodes не найден'); return; }
    container.innerHTML = '';
    mapNodes = [];

    const svg = document.getElementById('mapSvg');
    if (!svg) { console.error('❌ #mapSvg не найден'); return; }

    const viewBoxWidth = 600;
    const viewBoxHeight = 900;

    let pathD = '';
    NODE_COORDS.forEach((p, i) => {
      const x = (p.x / 100) * viewBoxWidth;
      const y = (p.y / 100) * viewBoxHeight;
      if (i === 0) pathD += `M ${x} ${y}`;
      else pathD += ` L ${x} ${y}`;
    });

    svg.querySelectorAll('.map-line').forEach(el => el.remove());

    const bgLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bgLine.setAttribute('d', pathD);
    bgLine.setAttribute('stroke', 'rgba(201, 169, 110, 0.25)');
    bgLine.setAttribute('stroke-width', '4');
    bgLine.setAttribute('fill', 'none');
    bgLine.setAttribute('stroke-linecap', 'round');
    bgLine.setAttribute('stroke-linejoin', 'round');
    bgLine.classList.add('map-line');
    svg.appendChild(bgLine);

    const activeLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    activeLine.setAttribute('d', pathD);
    activeLine.setAttribute('stroke', '#C9A96E');
    activeLine.setAttribute('stroke-width', '4');
    activeLine.setAttribute('fill', 'none');
    activeLine.setAttribute('stroke-linecap', 'round');
    activeLine.setAttribute('stroke-linejoin', 'round');
    activeLine.setAttribute('stroke-dasharray', '2000');
    activeLine.setAttribute('stroke-dashoffset', '2000');
    activeLine.id = 'mapActiveLine';
    activeLine.classList.add('map-line');
    svg.appendChild(activeLine);

    CONFIG.levels.forEach((level, i) => {
      const p = NODE_COORDS[i] || NODE_COORDS[NODE_COORDS.length - 1];
      const node = document.createElement('div');
      node.className = 'map-node map-node--locked';
      if (i === 0) node.classList.add('map-node--available');
      if (completedLevels.includes(i)) node.classList.add('map-node--done');
      node.textContent = i + 1;
      node.style.left = p.x + '%';
      node.style.top = p.y + '%';
      node.dataset.index = i;
      node.addEventListener('click', () => openLevel(i));
      container.appendChild(node);
      mapNodes.push(node);
    });

    updateMapProgress();
  }

  function updateMapProgress() {
    const total = CONFIG.levels.length;
    const completed = completedLevels.length;

    mapNodes.forEach((node, i) => {
      node.classList.remove('map-node--available', 'map-node--done', 'map-node--locked', 'map-node--current');
      if (completedLevels.includes(i)) { node.classList.add('map-node--done'); }
      else if (i === completed) { node.classList.add('map-node--available'); node.classList.add('map-node--current'); }
      else { node.classList.add('map-node--locked'); }
    });

    const activeLine = document.getElementById('mapActiveLine');
    if (activeLine) {
      const progress = completed / total;
      const totalLength = 2000;
      const offset = totalLength - progress * totalLength;
      activeLine.setAttribute('stroke-dashoffset', offset);
    }
  }

  function openLevel(index) {
    console.log(`📂 openLevel(${index})`);
    if (index > completedLevels.length) { console.warn(`⚠️ Уровень ${index+1} ещё не доступен`); return; }
    currentLevelIndex = index;
    renderLevel(index);
    showScreen('level');
  }

  function renderLevel(index) {
    console.log(`📄 renderLevel(${index})`);
    const level = CONFIG.levels[index];
    if (!level) { console.error(`❌ Уровень ${index} не найден`); return; }

    const isQuestion = level.question && level.options && level.options.length > 0;

    document.getElementById('levelCounter').textContent = `${index + 1} / ${CONFIG.levels.length}`;
    document.getElementById('levelCaption').textContent = level.caption;

    const frame = document.getElementById('level-photo-frame');
    const img = document.getElementById('level-photo');
    if (frame && img) {
      frame.style.animation = 'none';
      void frame.offsetWidth;
      frame.style.animation = '';
      setPhoto(frame, img, level.img, `Добавь файл\n${level.img}`);
    }

    document.getElementById('levelDate').textContent = level.date;

    const questionEl = document.getElementById('levelQuestion');
    const optionsEl = document.getElementById('levelOptions');
    const answerEl = document.getElementById('levelAnswer');
    const memoryEl = document.getElementById('levelMemory');
    const continueBtn = document.getElementById('btn-level-continue');

    if (answerEl) answerEl.classList.remove('is-visible');

    // Убираем старые обработчики, чтобы не накапливались
    optionsEl.innerHTML = '';
    optionsEl.style.display = 'none';

    if (isQuestion) {
      questionEl.textContent = level.question;
      optionsEl.style.display = 'flex';
      
      level.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = opt;
        btn.dataset.index = i;
        
        // НАДЁЖНАЯ ЛОГИКА ПРОВЕРКИ
        btn.addEventListener('click', function(e) {
          // Если кнопка уже нажата и заблокирована — игнорируем
          if (this.disabled) return;
          
          const selectedIndex = parseInt(this.dataset.index);
          const correctIndex = level.correct;
          
          console.log(`Выбран вариант: ${selectedIndex}, Правильный: ${correctIndex}`);
          
          // Блокируем все кнопки
          document.querySelectorAll('.level-options .btn').forEach(b => b.disabled = true);
          
          if (selectedIndex === correctIndex) {
            // ПРАВИЛЬНЫЙ ОТВЕТ
            console.log('✅ Правильно!');
            this.classList.add('btn--correct');
            memoryEl.textContent = level.memory;
            answerEl.classList.add('is-visible');
            continueBtn.style.display = 'inline-block';
          } else {
            // НЕПРАВИЛЬНЫЙ ОТВЕТ
            console.log('❌ Неправильно!');
            this.classList.add('btn--wrong');
            
            // Показываем подсказку
            const errorDiv = document.createElement('div');
            errorDiv.className = 'level-error-hint';
            errorDiv.style.cssText = 'color: #C95A5A; font-size: 14px; margin-top: 8px; font-style: italic;';
            errorDiv.textContent = 'Котенок, не расстраивайся, попробуй еще раз ❤️';
            this.parentElement.appendChild(errorDiv);
            
            // Через 1.5 секунды разблокируем кнопки и убираем подсказку
            setTimeout(() => {
              document.querySelectorAll('.level-options .btn').forEach(b => {
                b.disabled = false;
                b.classList.remove('btn--wrong');
              });
              const hint = document.querySelector('.level-error-hint');
              if (hint) hint.remove();
            }, 1500);
          }
        });
        
        optionsEl.appendChild(btn);
      });
      
      continueBtn.style.display = 'none';
    } else {
      questionEl.textContent = '';
      optionsEl.style.display = 'none';
      memoryEl.textContent = level.memory;
      answerEl.classList.add('is-visible');
      continueBtn.style.display = 'inline-block';
    }
  }

  document.getElementById('btn-level-continue').addEventListener('click', function() {
    const index = currentLevelIndex;
    if (!completedLevels.includes(index)) { completedLevels.push(index); }
    if (completedLevels.length >= CONFIG.levels.length) {
      initHeartField();
      showScreen('gifts');
    } else {
      updateMapProgress();
      showScreen('map');
    }
  });

  function heartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x, y: -y };
  }

  let heartFieldBuilt = false;

  function initHeartField() {
    if (heartFieldBuilt) return;
    heartFieldBuilt = true;

    const field = document.getElementById('heartField');
    if (!field) { console.error('❌ #heartField не найден'); return; }

    const count = CONFIG.giftCount || 8;
    const pts = Array.from({ length: count }, (_, i) => heartPoint((i / count) * Math.PI * 2));
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    const heartSVG = `<svg viewBox="0 0 24 24" class="heart-icon" style="width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:2;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

    pts.forEach((p, i) => {
      const nx = 8 + ((p.x - minX) / (maxX - minX)) * 84;
      const ny = 8 + ((p.y - minY) / (maxY - minY)) * 84;
      const btn = document.createElement('button');
      btn.className = 'gift-node';
      btn.style.setProperty('--x', nx + '%');
      btn.style.setProperty('--y', ny + '%');
      btn.style.setProperty('--delay', (i * 0.06) + 's');
      btn.innerHTML = heartSVG;
      btn.addEventListener('click', () => chooseGift(btn));
      field.appendChild(btn);
    });
  }

  function chooseGift(btn) {
    if (giftChosen) return;
    giftChosen = true;

    document.getElementById('heartField').classList.add('has-choice');
    btn.classList.add('is-chosen');

    if (typeof confetti === 'function') {
      confetti({ particleCount: 80, spread: 70, startVelocity: 32, origin: { y: 0.6 }, colors: ['#C9A96E', '#F3C9C6', '#FFF8F0', '#6E85A6'] });
    }

    setTimeout(() => { document.getElementById('giftsReveal').classList.add('is-visible'); }, 500);
  }

  document.getElementById('btn-see-final').addEventListener('click', function() {
    renderFinal();
    showScreen('final');
  });

  function renderFinal() {
    const frame = document.getElementById('finalPhotoFrame');
    const img = document.getElementById('finalPhoto');
    if (frame && img) { setPhoto(frame, img, CONFIG.giftImage, `Добавь файл\n${CONFIG.giftImage}`); }
    document.getElementById('finalTitle').textContent = CONFIG.finalTitle.replace('{name}', CONFIG.girlName);
    document.getElementById('finalMessage').textContent = CONFIG.finalMessage;
  }

  document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен');
    initStart();
  });

})();

console.log('✅ script.js загружен');