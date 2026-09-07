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

  console.log('📱 Найдены экраны:', {
    start: !!screens.start,
    map: !!screens.map,
    level: !!screens.level,
    gifts: !!screens.gifts,
    final: !!screens.final
  });

  Object.keys(screens).forEach(name => {
    if (!screens[name]) {
      console.error(`❌ ЭКРАН НЕ НАЙДЕН: ${name}`);
    }
  });

  let currentLevelIndex = 0;
  let completedLevels = [];
  let giftChosen = false;
  let isAnswering = false;

  function showScreen(name) {
    console.log(`🔄 showScreen("${name}") вызвана`);
    if (!screens[name]) {
      console.error(`❌ ЭКРАН "${name}" НЕ СУЩЕСТВУЕТ`);
      return;
    }
    Object.values(screens).forEach(el => {
      if (el) el.classList.remove('is-active');
    });
    screens[name].classList.add('is-active');
    console.log(`✅ Экран "${name}" активен`);
  }

  function setPhoto(frame, img, src, placeholder) {
    if (!frame) { console.error('❌ setPhoto: frame не найден'); return; }
    if (!img) { console.error('❌ setPhoto: img не найден'); return; }
    console.log(`📷 Загрузка фото: ${src}`);
    frame.classList.remove('is-missing');
    frame.dataset.placeholder = placeholder || `Добавь файл\n${src}`;
    img.onerror = () => {
      console.warn(`⚠️ Фото не загружено: ${src}`);
      frame.classList.add('is-missing');
    };
    img.onload = () => {
      console.log(`✅ Фото загружено: ${src}`);
      frame.classList.remove('is-missing');
    };
    img.src = src;
  }

  // === СТАРТ ===
  function initStart() {
    console.log('🚀 initStart() запущена');
    try {
      const nameSpan = document.querySelector('.name');
      if (nameSpan) {
        nameSpan.textContent = CONFIG.girlName;
        console.log(`✅ Имя установлено: ${CONFIG.girlName}`);
      }
      const subtitle = document.getElementById('start-subtitle');
      if (subtitle) {
        subtitle.textContent = CONFIG.startSubtitle;
        console.log('✅ Подзаголовок установлен');
      }
      const btn = document.getElementById('btn-start');
      if (!btn) {
        console.error('❌ КНОПКА #btn-start НЕ НАЙДЕНА');
        return;
      }
      console.log('✅ Кнопка найдена, добавляю обработчик');
      btn.addEventListener('click', function(e) {
        console.log('🖱️ КНОПКА НАЖАТА!');
        try {
          buildMap();
          showScreen('map');
        } catch (err) {
          console.error('❌ ОШИБКА ПРИ НАЖАТИИ КНОПКИ:', err);
        }
      });
      console.log('✅ Обработчик кнопки добавлен');
    } catch (err) {
      console.error('❌ ОШИБКА В initStart:', err);
    }
  }

  // === КООРДИНАТЫ ===
  const NODE_COORDS = [
    { x: 280, y: 40 }, { x: 440, y: 70 }, { x: 500, y: 140 }, { x: 480, y: 220 },
    { x: 380, y: 280 }, { x: 260, y: 330 }, { x: 160, y: 400 }, { x: 120, y: 480 },
    { x: 160, y: 560 }, { x: 240, y: 620 }, { x: 340, y: 660 }, { x: 440, y: 700 },
    { x: 460, y: 760 }, { x: 400, y: 810 }, { x: 280, y: 840 }
  ];

  let mapNodes = [];

  // === ПОСТРОЕНИЕ КАРТЫ ===
  function buildMap() {
    console.log('🗺️ buildMap() запущена');
    try {
      const container = document.getElementById('mapNodes');
      if (!container) {
        console.error('❌ ЭЛЕМЕНТ #mapNodes НЕ НАЙДЕН!');
        return;
      }
      console.log('✅ #mapNodes найден');
      container.innerHTML = '';
      mapNodes = [];

      const svg = document.getElementById('mapSvg');
      if (!svg) {
        console.error('❌ #mapSvg НЕ НАЙДЕН!');
        return;
      }
      console.log('✅ #mapSvg найден');

      let pathD = '';
      CONFIG.levels.forEach((_, i) => {
        const p = NODE_COORDS[i] || NODE_COORDS[NODE_COORDS.length - 1];
        if (i === 0) pathD += `M ${p.x} ${p.y}`;
        else pathD += ` L ${p.x} ${p.y}`;
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
        node.style.left = p.x + 'px';
        node.style.top = p.y + 'px';
        node.dataset.index = i;
        node.addEventListener('click', () => {
          console.log(`🖱️ Точка ${i+1} нажата`);
          openLevel(i);
        });
        container.appendChild(node);
        mapNodes.push(node);
      });
      console.log(`✅ Создано ${mapNodes.length} точек`);

      updateMapProgress();
      console.log('✅ Карта построена');
    } catch (err) {
      console.error('❌ ОШИБКА В buildMap:', err);
    }
  }

  function updateMapProgress() {
    console.log('📊 updateMapProgress() вызвана');
    const total = CONFIG.levels.length;
    const completed = completedLevels.length;
    console.log(`📊 Прогресс: ${completed}/${total}`);

    mapNodes.forEach((node, i) => {
      node.classList.remove('map-node--available', 'map-node--done', 'map-node--locked', 'map-node--current');
      if (completedLevels.includes(i)) {
        node.classList.add('map-node--done');
      } else if (i === completed) {
        node.classList.add('map-node--available');
        if (i === completed) {
          node.classList.add('map-node--current');
        }
      } else {
        node.classList.add('map-node--locked');
      }
    });

    const activeLine = document.getElementById('mapActiveLine');
    if (activeLine) {
      const progress = completed / total;
      const totalLength = 2000;
      const offset = totalLength - progress * totalLength;
      activeLine.setAttribute('stroke-dashoffset', offset);
      console.log(`📊 Линия обновлена: ${Math.round(progress * 100)}%`);
    }

    updateZoom(completed);
  }

  function updateZoom(level) {
    const mapContent = document.getElementById('mapContent');
    if (!mapContent) return;

    mapContent.className = 'map-content';

    let zoomLevel = 0;
    if (level >= 0 && level < 2) zoomLevel = 0;
    else if (level >= 2 && level < 4) zoomLevel = 1;
    else if (level >= 4 && level < 6) zoomLevel = 2;
    else if (level >= 6 && level < 8) zoomLevel = 3;
    else if (level >= 8 && level < 10) zoomLevel = 4;
    else if (level >= 10 && level < 12) zoomLevel = 5;
    else if (level >= 12 && level < 14) zoomLevel = 6;
    else if (level >= 14) zoomLevel = 7;

    mapContent.classList.add(`zoom-level-${zoomLevel}`);
    console.log(`🔍 Зум установлен на уровень ${zoomLevel} (пройдено: ${level})`);
  }

  // === ОТКРЫТИЕ УРОВНЯ ===
  function openLevel(index) {
    console.log(`📂 openLevel(${index}) вызвана`);
    if (index > completedLevels.length) {
      console.warn(`⚠️ Уровень ${index+1} ещё не доступен`);
      return;
    }
    currentLevelIndex = index;
    renderLevel(index);
    showScreen('level');
  }

  function renderLevel(index) {
    console.log(`📄 renderLevel(${index}) вызвана`);
    try {
      const level = CONFIG.levels[index];
      if (!level) {
        console.error(`❌ Уровень ${index} не найден в CONFIG`);
        return;
      }
      console.log(`📄 Уровень: "${level.caption}"`);

      const isQuestion = level.question && level.options && level.options.length > 0;
      console.log(`📄 Есть вопрос: ${isQuestion}`);

      const counter = document.getElementById('levelCounter');
      if (counter) counter.textContent = `${index + 1} / ${CONFIG.levels.length}`;

      const caption = document.getElementById('levelCaption');
      if (caption) caption.textContent = level.caption;

      const frame = document.getElementById('level-photo-frame');
      const img = document.getElementById('level-photo');
      if (frame && img) {
        frame.style.animation = 'none';
        void frame.offsetWidth;
        frame.style.animation = '';
        setPhoto(frame, img, level.img, `Добавь файл\n${level.img}`);
      }

      const dateEl = document.getElementById('levelDate');
      if (dateEl) dateEl.textContent = level.date;

      const questionEl = document.getElementById('levelQuestion');
      const optionsEl = document.getElementById('levelOptions');
      const answerEl = document.getElementById('levelAnswer');
      const memoryEl = document.getElementById('levelMemory');
      const continueBtn = document.getElementById('btn-level-continue');

      if (answerEl) answerEl.classList.remove('is-visible');

      if (isQuestion) {
        console.log('📄 Показываю вопрос');
        if (questionEl) questionEl.textContent = level.question;
        if (optionsEl) {
          optionsEl.innerHTML = '';
          level.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = opt;
            btn.dataset.index = i;
            btn.addEventListener('click', () => {
              console.log(`🖱️ Выбран вариант: ${i} - "${opt}"`);
              handleAnswer(i, index, btn);
            });
            optionsEl.appendChild(btn);
          });
          optionsEl.style.display = 'flex';
          console.log(`📄 Добавлено ${level.options.length} вариантов`);
        }
        if (continueBtn) continueBtn.style.display = 'none';
        isAnswering = false;
      } else {
        console.log('📄 Показываю текст без вопроса');
        if (questionEl) questionEl.textContent = '';
        if (optionsEl) optionsEl.style.display = 'none';
        if (memoryEl) memoryEl.textContent = level.memory;
        if (answerEl) answerEl.classList.add('is-visible');
        if (continueBtn) {
          continueBtn.style.display = 'inline-block';
          continueBtn.textContent = 'Продолжить путь';
        }
      }
      console.log('✅ Уровень отрендерен');
    } catch (err) {
      console.error('❌ ОШИБКА В renderLevel:', err);
    }
  }

  function handleAnswer(selected, levelIndex, btn) {
    const level = CONFIG.levels[levelIndex];
    const buttons = document.querySelectorAll('.level-options .btn');

    if (buttons[0] && buttons[0].disabled) return;

    if (selected === level.correct) {
      console.log('✅ Правильный ответ!');
      buttons.forEach(b => b.disabled = true);
      buttons.forEach((b, i) => {
        if (i === level.correct) b.classList.add('btn--correct');
      });

      const memoryEl = document.getElementById('levelMemory');
      if (memoryEl) memoryEl.textContent = level.memory;
      const answerEl = document.getElementById('levelAnswer');
      if (answerEl) answerEl.classList.add('is-visible');

      const continueBtn = document.getElementById('btn-level-continue');
      if (continueBtn) {
        continueBtn.style.display = 'inline-block';
        continueBtn.textContent = 'Продолжить путь';
      }
      console.log('✅ Ответ обработан');
    } else {
      console.log('❌ Неправильный ответ');
      btn.classList.add('btn--wrong');
      const errorMsg = document.getElementById('levelError');
      if (!errorMsg) {
        const div = document.createElement('div');
        div.id = 'levelError';
        div.style.cssText = 'color: #C95A5A; font-size: 14px; margin-top: 8px; font-style: italic;';
        div.textContent = 'Котенок, не расстраивайся, попробуй еще раз ❤️';
        btn.parentElement.appendChild(div);
      } else {
        errorMsg.style.display = 'block';
      }
      setTimeout(() => {
        btn.classList.remove('btn--wrong');
        btn.disabled = false;
        const errorMsgEl = document.getElementById('levelError');
        if (errorMsgEl) errorMsgEl.style.display = 'none';
      }, 1500);
    }
  }

  // === КНОПКА "ПРОДОЛЖИТЬ" ===
  const continueBtn = document.getElementById('btn-level-continue');
  if (continueBtn) {
    console.log('✅ Кнопка продолжения найдена');
    continueBtn.addEventListener('click', function() {
      console.log('🖱️ Кнопка "Продолжить" нажата');
      const index = currentLevelIndex;
      if (!completedLevels.includes(index)) {
        completedLevels.push(index);
        console.log(`📊 Уровень ${index+1} завершён`);
      }
      if (completedLevels.length >= CONFIG.levels.length) {
        console.log('🎉 Все уровни пройдены! Показываем подарки');
        initHeartField();
        showScreen('gifts');
      } else {
        console.log(`📊 Пройдено ${completedLevels.length}/${CONFIG.levels.length}`);
        updateMapProgress();
        showScreen('map');
      }
    });
  } else {
    console.warn('⚠️ #btn-level-continue не найдена');
  }

  // === ПОДАРКИ ===
  function heartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x, y: -y };
  }

  let heartFieldBuilt = false;

  function initHeartField() {
    console.log('❤️ initHeartField() вызвана');
    if (heartFieldBuilt) {
      console.log('❤️ Поле подарков уже построено');
      return;
    }
    heartFieldBuilt = true;

    const field = document.getElementById('heartField');
    if (!field) {
      console.error('❌ #heartField не найден');
      return;
    }
    console.log('✅ #heartField найден');

    const count = CONFIG.giftCount || 8;
    console.log(`❤️ Количество подарков: ${count}`);

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
      btn.setAttribute('aria-label', 'Выбрать подарок ' + (i + 1));
      btn.addEventListener('click', () => chooseGift(btn));
      field.appendChild(btn);
    });
    console.log(`❤️ ${count} подарков создано`);
  }

  function chooseGift(btn) {
    console.log('🎁 Подарок выбран!');
    if (giftChosen) {
      console.log('⚠️ Подарок уже выбран');
      return;
    }
    giftChosen = true;

    const field = document.getElementById('heartField');
    if (field) field.classList.add('has-choice');
    btn.classList.add('is-chosen');

    if (typeof confetti === 'function') {
      console.log('🎊 Запускаем конфетти');
      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 32,
        origin: { y: 0.6 },
        colors: ['#C9A96E', '#F3C9C6', '#FFF8F0', '#6E85A6']
      });
    } else {
      console.warn('⚠️ Конфетти не загружено');
    }

    setTimeout(() => {
      const reveal = document.getElementById('giftsReveal');
      if (reveal) {
        reveal.classList.add('is-visible');
        console.log('✅ Подарок открыт');
      }
    }, 500);
  }

  // === КНОПКА "УЗНАТЬ, ЧТО ВНУТРИ" ===
  const seeFinalBtn = document.getElementById('btn-see-final');
  if (seeFinalBtn) {
    console.log('✅ Кнопка "Узнать, что внутри" найдена');
    seeFinalBtn.addEventListener('click', function() {
      console.log('🖱️ "Узнать, что внутри" нажата');
      renderFinal();
      showScreen('final');
    });
  } else {
    console.warn('⚠️ #btn-see-final не найдена');
  }

  // === ФИНАЛ ===
  function renderFinal() {
    console.log('🏁 renderFinal() вызвана');
    const frame = document.getElementById('finalPhotoFrame');
    const img = document.getElementById('finalPhoto');
    if (frame && img) {
      setPhoto(frame, img, CONFIG.giftImage, `Добавь файл\n${CONFIG.giftImage}`);
    }
    const title = document.getElementById('finalTitle');
    if (title) title.textContent = CONFIG.finalTitle.replace('{name}', CONFIG.girlName);
    const msg = document.getElementById('finalMessage');
    if (msg) msg.textContent = CONFIG.finalMessage;
    console.log('✅ Финальный экран готов');
  }

  // === ЗАПУСК ===
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен, инициализация...');
    try {
      if (CONFIG.levels.length < 14) {
        console.warn(`⚠️ В config.js должно быть 14 уровней. Сейчас: ${CONFIG.levels.length}`);
      } else {
        console.log('✅ Уровней: 14 OK');
      }
      initStart();
      console.log('✅ Инициализация завершена');
    } catch (err) {
      console.error('❌ ОШИБКА ПРИ ИНИЦИАЛИЗАЦИИ:', err);
    }
  });

})();

console.log('✅ script.js загружен полностью');