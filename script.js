console.log('📦 Загрузка script.js...');

(function() {
  "use strict";

  console.log('✅ script.js выполняется');

  const screens = {
    start: document.querySelector('[data-screen="start"]'),
    map: document.querySelector('[data-screen="map"]'),
    level: document.querySelector('[data-screen="level"]'),
    envelope: document.querySelector('[data-screen="envelope"]'),
    gifts: document.querySelector('[data-screen="gifts"]'),
    book: document.querySelector('[data-screen="book"]'),
    final: document.querySelector('[data-screen="final"]')
  };

  let currentLevelIndex = 0;
  let completedLevels = [];
  let giftChosen = false;

  function showScreen(name) {
    console.log(`🔄 showScreen("${name}")`);
    if (!screens[name]) {
      console.error(`❌ ЭКРАН "${name}" НЕ СУЩЕСТВУЕТ`);
      return;
    }
    Object.values(screens).forEach(function(el) {
      if (el) el.classList.remove('is-active');
    });
    screens[name].classList.add('is-active');
  }

  function setPhoto(frame, img, src, placeholder) {
    if (!frame || !img) return;
    frame.classList.remove('is-missing');
    frame.dataset.placeholder = placeholder || 'Добавь файл\n' + src;
    img.onerror = function() {
      console.warn('⚠️ Фото не загружено: ' + src);
      frame.classList.add('is-missing');
    };
    img.onload = function() {
      console.log('✅ Фото загружено: ' + src);
      frame.classList.remove('is-missing');
    };
    img.src = src;
  }

  function initStart() {
    console.log('🚀 initStart()');
    var nameSpan = document.querySelector('.name');
    if (nameSpan) nameSpan.textContent = CONFIG.girlName;
    document.getElementById('start-subtitle').textContent = CONFIG.startSubtitle;
    document.getElementById('btn-start').addEventListener('click', function() {
      buildMap();
      showScreen('map');
    });
  }

  var NODE_COORDS = [
    { x: 50, y: 5 }, { x: 73, y: 8 }, { x: 79, y: 15 }, { x: 78, y: 23 },
    { x: 69, y: 30 }, { x: 55, y: 36 }, { x: 39, y: 42 }, { x: 28, y: 50 },
    { x: 30, y: 58 }, { x: 40, y: 64 }, { x: 55, y: 69 }, { x: 69, y: 74 },
    { x: 73, y: 80 }, { x: 63, y: 87 }, { x: 48, y: 92 }
  ];

  var mapNodes = [];
  var segmentLines = [];

  function buildMap() {
    console.log('🗺️ buildMap()');
    var container = document.getElementById('mapNodes');
    if (!container) {
      console.error('❌ #mapNodes не найден');
      return;
    }
    container.innerHTML = '';
    mapNodes = [];

    var svg = document.getElementById('mapSvg');
    if (!svg) {
      console.error('❌ #mapSvg не найден');
      return;
    }

    var viewBoxWidth = 600;
    var viewBoxHeight = 900;

    svg.querySelectorAll('.map-line').forEach(function(el) {
      el.remove();
    });
    segmentLines = [];

    for (var i = 0; i < NODE_COORDS.length - 1; i++) {
      var p1 = NODE_COORDS[i];
      var p2 = NODE_COORDS[i + 1];
      
      var x1 = (p1.x / 100) * viewBoxWidth;
      var y1 = (p1.y / 100) * viewBoxHeight;
      var x2 = (p2.x / 100) * viewBoxWidth;
      var y2 = (p2.y / 100) * viewBoxHeight;
      
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      var d = 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2;
      line.setAttribute('d', d);
      line.setAttribute('stroke', 'rgba(201, 169, 110, 0.25)');
      line.setAttribute('stroke-width', '4');
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-linejoin', 'round');
      line.classList.add('map-line');
      line.dataset.segment = i;
      svg.appendChild(line);
      segmentLines.push(line);
    }

    CONFIG.levels.forEach(function(level, i) {
      var p = NODE_COORDS[i] || NODE_COORDS[NODE_COORDS.length - 1];
      var node = document.createElement('div');
      node.className = 'map-node map-node--locked';
      if (i === 0) node.classList.add('map-node--available');
      if (completedLevels.includes(i)) node.classList.add('map-node--done');
      node.textContent = i + 1;
      node.style.left = p.x + '%';
      node.style.top = p.y + '%';
      node.dataset.index = i;
      node.addEventListener('click', function() {
        openLevel(parseInt(this.dataset.index));
      });
      container.appendChild(node);
      mapNodes.push(node);
    });

    updateMapProgress();
  }

  function updateMapProgress() {
    var total = CONFIG.levels.length;
    var completed = completedLevels.length;

    mapNodes.forEach(function(node, i) {
      node.classList.remove('map-node--available', 'map-node--done', 'map-node--locked', 'map-node--current');
      if (completedLevels.includes(i)) {
        node.classList.add('map-node--done');
      } else if (i === completed) {
        node.classList.add('map-node--available');
        node.classList.add('map-node--current');
      } else {
        node.classList.add('map-node--locked');
      }
    });

    var passedSegments = Math.min(completed, segmentLines.length);
    segmentLines.forEach(function(line, i) {
      if (i < passedSegments) {
        line.setAttribute('stroke', '#C9A96E');
      } else {
        line.setAttribute('stroke', 'rgba(201, 169, 110, 0.25)');
      }
    });
    
    console.log('📊 Пройдено уровней: ' + completed + ', закрашено отрезков: ' + passedSegments);
  }

  function openLevel(index) {
    console.log('📂 openLevel(' + index + ')');
    if (index > completedLevels.length) {
      console.warn('⚠️ Уровень ' + (index + 1) + ' ещё не доступен');
      return;
    }
    currentLevelIndex = index;
    renderLevel(index);
    showScreen('level');
  }

  function renderLevel(index) {
    console.log('📄 renderLevel(' + index + ')');
    var level = CONFIG.levels[index];
    if (!level) {
      console.error('❌ Уровень ' + index + ' не найден');
      return;
    }

    var isQuestion = level.question && level.options && level.options.length > 0;

    document.getElementById('levelCounter').textContent = (index + 1) + ' / ' + CONFIG.levels.length;
    document.getElementById('levelCaption').textContent = level.caption;

    var frame = document.getElementById('level-photo-frame');
    var img = document.getElementById('level-photo');
    if (frame && img) {
      frame.style.animation = 'none';
      void frame.offsetWidth;
      frame.style.animation = '';
      setPhoto(frame, img, level.img, 'Добавь файл\n' + level.img);
    }

    document.getElementById('levelDate').textContent = level.date;

    var questionEl = document.getElementById('levelQuestion');
    var optionsEl = document.getElementById('levelOptions');
    var answerEl = document.getElementById('levelAnswer');
    var memoryEl = document.getElementById('levelMemory');
    var continueBtn = document.getElementById('btn-level-continue');

    if (answerEl) answerEl.classList.remove('is-visible');
    optionsEl.innerHTML = '';
    optionsEl.style.display = 'none';

    if (isQuestion) {
      questionEl.textContent = level.question;
      optionsEl.style.display = 'flex';
      
      level.options.forEach(function(opt, i) {
        var btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = opt;
        btn.dataset.index = i;
        
        btn.addEventListener('click', function(e) {
          if (this.disabled) return;
          
          var selectedIndex = parseInt(this.dataset.index);
          var correctIndex = level.correct;
          
          console.log('Выбран вариант: ' + selectedIndex + ', Правильный: ' + correctIndex);
          
          document.querySelectorAll('.level-options .btn').forEach(function(b) {
            b.disabled = true;
          });
          
          if (selectedIndex === correctIndex) {
            console.log('✅ Правильно!');
            this.classList.add('btn--correct');
            memoryEl.textContent = level.memory;
            answerEl.classList.add('is-visible');
            continueBtn.style.display = 'inline-block';
          } else {
            console.log('❌ Неправильно!');
            this.classList.add('btn--wrong');
            
            var errorDiv = document.createElement('div');
            errorDiv.className = 'level-error-hint';
            errorDiv.style.cssText = 'color: #C95A5A; font-size: 14px; margin-top: 8px; font-style: italic;';
            errorDiv.textContent = 'Котенок, не расстраивайся, попробуй еще раз ❤️';
            this.parentElement.appendChild(errorDiv);
            
            setTimeout(function() {
              document.querySelectorAll('.level-options .btn').forEach(function(b) {
                b.disabled = false;
                b.classList.remove('btn--wrong');
              });
              var hint = document.querySelector('.level-error-hint');
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
    var index = currentLevelIndex;
    if (!completedLevels.includes(index)) {
      completedLevels.push(index);
    }
    if (completedLevels.length >= CONFIG.levels.length) {
      showEnvelope();
    } else {
      updateMapProgress();
      showScreen('map');
    }
  });

  // ===== СЕКРЕТНЫЙ КОНВЕРТ =====
  var envelopeOpened = false;

  function showEnvelope() {
    console.log('📨 Показываем конверт');
    envelopeOpened = false;
    document.getElementById('envelopeFlap').classList.remove('open');
    document.getElementById('letterFull').classList.remove('open');
    document.getElementById('envelopeWrapper').classList.remove('hidden');
    document.getElementById('envelopeHint').classList.remove('hidden');
    
    document.getElementById('letterText').textContent = 
      'Анюта, ты прошла весь путь. Каждый уровень — это наша с тобой история. Я хочу, чтобы ты знала: ты — самое лучшее, что случалось со мной. А теперь выбери свой подарок. Я тебя люблю. ❤️';
    
    showScreen('envelope');
  }

  document.getElementById('envelopeWrapper').addEventListener('click', function(e) {
    if (envelopeOpened) return;
    if (e.target.classList.contains('letter-full__btn')) return;
    
    console.log('📨 Конверт открыт');
    envelopeOpened = true;
    document.getElementById('envelopeFlap').classList.add('open');
    document.getElementById('envelopeHint').classList.add('hidden');
    
    setTimeout(function() {
      document.getElementById('envelopeWrapper').classList.add('hidden');
      document.getElementById('letterFull').classList.add('open');
    }, 600);
  });

  document.getElementById('letterBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    console.log('📨 Переход к подаркам');
    document.getElementById('letterFull').classList.remove('open');
    setTimeout(function() {
      initHeartField();
      showScreen('gifts');
    }, 400);
  });

  // ===== ПОДАРКИ =====
  function heartPoint(t) {
    var x = 16 * Math.pow(Math.sin(t), 3);
    var y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x: x, y: -y };
  }

  var heartFieldBuilt = false;

  function initHeartField() {
    if (heartFieldBuilt) return;
    heartFieldBuilt = true;

    var field = document.getElementById('heartField');
    if (!field) {
      console.error('❌ #heartField не найден');
      return;
    }

    var count = CONFIG.giftCount || 8;
    var pts = [];
    for (var i = 0; i < count; i++) {
      pts.push(heartPoint((i / count) * Math.PI * 2));
    }
    var xs = pts.map(function(p) { return p.x; });
    var ys = pts.map(function(p) { return p.y; });
    var minX = Math.min.apply(null, xs);
    var maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys);
    var maxY = Math.max.apply(null, ys);

    var heartSVG = '<svg viewBox="0 0 24 24" class="heart-icon" style="width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:2;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

    pts.forEach(function(p, i) {
      var nx = 8 + ((p.x - minX) / (maxX - minX)) * 84;
      var ny = 8 + ((p.y - minY) / (maxY - minY)) * 84;
      var btn = document.createElement('button');
      btn.className = 'gift-node';
      btn.style.setProperty('--x', nx + '%');
      btn.style.setProperty('--y', ny + '%');
      btn.style.setProperty('--delay', (i * 0.06) + 's');
      btn.innerHTML = heartSVG;
      btn.addEventListener('click', function() {
        chooseGift(this);
      });
      field.appendChild(btn);
    });
  }

  function chooseGift(btn) {
    if (giftChosen) return;
    giftChosen = true;

    document.getElementById('heartField').classList.add('has-choice');
    btn.classList.add('is-chosen');

    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 80,
        startVelocity: 35,
        origin: { y: 0.6 },
        colors: ['#C9A96E', '#F3C9C6', '#FFF8F0', '#6E85A6', '#C95A5A']
      });
    }

    setTimeout(function() {
      document.getElementById('giftsReveal').classList.add('is-visible');
    }, 500);
  }

  document.getElementById('btn-see-final').addEventListener('click', function() {
    initBook();
    showScreen('book');
  });

  // ===== КНИГА ВОСПОМИНАНИЙ =====
  var bookData = [
    {
      title: 'Как всё начиналось',
      text: 'Наше знакомство началось глупо и смешно — в боте знакомств "ДаВинчик". Просто обменялись парой сообщений, просто остались в контактах. Никто из нас тогда не думал, что это приведёт к чему-то серьёзному. Но потом кто-то перестал быть "чсвшным", и началось настоящее общение. Встречи, прогулки, разговоры, которые ничего не значили — но на самом деле значили всё. Мы привязались друг к другу. Не заметили, не планировали — просто стали теми, без кого уже нельзя.',
      img: 'images/book1.jpg'
    },
    {
      title: 'Твои объятия',
      text: 'Твои объятия. После долгого дня я хочу только одного — чтобы ты обняла меня. Это лучшее лекарство от всего на свете.',
      img: 'images/book2.jpg'
    },
    {
      title: 'Наши мечты',
      text: 'Я хочу, чтобы у нас был двухэтажный дом на берегу моря. Большая собака, два кота. Чтобы мы путешествовали, смотрели закаты и просыпались в обнимку. Чтобы у нас была жизнь, о которой мы мечтали.',
      img: 'images/book3.jpg'
    },
    {
      title: 'Я люблю тебя за…',
      text: '1. Твою улыбку, которая лечит всё.\n2. Твою доброту, когда ты всегда приходишь ко мне на помощь.\n3. Твою нежность, когда ты обнимаешь меня.\n4. Твои глаза, в которых я вижу дом.\n5. То, что ты просто есть.',
      img: ''
    }
  ];

  var bookCurrentPage = 0;

  function initBook() {
    var container = document.getElementById('bookPages');
    container.innerHTML = '';
    
    bookData.forEach(function(page, index) {
      var div = document.createElement('div');
      div.className = 'book-page' + (index === 0 ? ' active' : '');
      div.dataset.page = index;
      
      var photoHTML = '';
      if (page.img) {
        photoHTML = '<div class="polaroid book-polaroid"><img src="' + page.img + '" alt="' + page.title + '" loading="lazy"></div>';
      }
      
      div.innerHTML = '<h3 class="book-page__title">' + page.title + '</h3>' + photoHTML + '<div class="book-page__text">' + page.text.replace(/\n/g, '<br>') + '</div>';
      
      container.appendChild(div);
    });
    
    bookCurrentPage = 0;
    updateBookNav();
    document.getElementById('bookCloseBtn').style.display = 'none';
  }

  function updateBookNav() {
    var total = bookData.length;
    document.getElementById('bookCounter').textContent = (bookCurrentPage + 1) + ' / ' + total;
    document.getElementById('bookPrev').style.display = bookCurrentPage === 0 ? 'none' : 'inline-block';
    document.getElementById('bookNext').style.display = bookCurrentPage === total - 1 ? 'none' : 'inline-block';
    
    document.getElementById('bookCloseBtn').style.display = bookCurrentPage === total - 1 ? 'inline-block' : 'none';
  }

  function goToPage(index) {
    var pages = document.querySelectorAll('.book-page');
    if (index < 0 || index >= pages.length) return;
    
    pages.forEach(function(p, i) {
      p.classList.remove('active', 'exit');
      if (i === index) {
        p.classList.add('active');
      } else if (i < index) {
        p.classList.add('exit');
      }
    });
    
    bookCurrentPage = index;
    updateBookNav();
  }

  document.getElementById('bookNext').addEventListener('click', function() {
    if (bookCurrentPage < bookData.length - 1) {
      goToPage(bookCurrentPage + 1);
    }
  });

  document.getElementById('bookPrev').addEventListener('click', function() {
    if (bookCurrentPage > 0) {
      goToPage(bookCurrentPage - 1);
    }
  });

  document.getElementById('bookCloseBtn').addEventListener('click', function() {
    renderFinal();
    showScreen('final');
  });

  // ===== СЧЁТЧИК ВРЕМЕНИ =====
  function getTimeTogether() {
    var startDate = new Date(2023, 8, 21);
    var now = new Date();
    
    var years = now.getFullYear() - startDate.getFullYear();
    var months = now.getMonth() - startDate.getMonth();
    var days = now.getDate() - startDate.getDate();
    
    if (days < 0) {
      months--;
      var prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    var yearWord = (years % 10 === 1 && years % 100 !== 11) ? 'год' : 
                   (years % 10 >= 2 && years % 10 <= 4 && !(years % 100 >= 12 && years % 100 <= 14) ? 'года' : 'лет');
    var monthWord = (months % 10 === 1 && months % 100 !== 11) ? 'месяц' : 
                    (months % 10 >= 2 && months % 10 <= 4 && !(months % 100 >= 12 && months % 100 <= 14) ? 'месяца' : 'месяцев');
    var dayWord = (days % 10 === 1 && days % 100 !== 11) ? 'день' : 
                  (days % 10 >= 2 && days % 10 <= 4 && !(days % 100 >= 12 && days % 100 <= 14) ? 'дня' : 'дней');
    
    var result = '';
    if (years > 0) result += years + ' ' + yearWord + ' ';
    if (months > 0) result += months + ' ' + monthWord + ' ';
    result += days + ' ' + dayWord;
    
    return result;
  }

  // ===== ФИНАЛ =====
  function renderFinal() {
    var frame = document.getElementById('finalPhotoFrame');
    var img = document.getElementById('finalPhoto');
    if (frame && img) {
      setPhoto(frame, img, CONFIG.giftImage, 'Добавь файл\n' + CONFIG.giftImage);
    }
    document.getElementById('finalTitle').textContent = CONFIG.finalTitle.replace('{name}', CONFIG.girlName);
    document.getElementById('finalMessage').textContent = CONFIG.finalMessage;
    
    var timeTogether = getTimeTogether();
    var counterEl = document.getElementById('timeCounter');
    if (counterEl) {
      counterEl.textContent = timeTogether;
    }
  }

  // ===== ЗВЁЗДЫ =====
  function createStars() {
    var container = document.getElementById('stars-container');
    if (!container) return;
    for (var i = 0; i < 30; i++) {
      var star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.width = (2 + Math.random() * 4) + 'px';
      star.style.height = star.style.width;
      star.style.animationDelay = (Math.random() * 3) + 's';
      star.style.animationDuration = (1.5 + Math.random() * 2) + 's';
      container.appendChild(star);
    }
  }

  // ===== ЗАПУСК =====
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен');
    createStars();
    initStart();
  });

})();

console.log('✅ script.js загружен');
