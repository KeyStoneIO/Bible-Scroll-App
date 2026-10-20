/**
 * Bible Scroll App - Full New Testament Edition
 * Continuous Smooth Rolling Scripture Reader (27 Books, 260 Chapters)
 * Powered by Tamil New Testament Audio Narration & English KJV Reference
 */

(function () {
  'use strict';

  // --- State Configuration ---
  const state = {
    bookId: 1,                // 1 to 27 (Matthew to Revelation)
    chapter: 1,               // 1 to currentBook.total_chapters
    activeVerseNum: null,
    isPlaying: false,
    viewMode: 'scroll',       // 'scroll' (Cinematic Roll) | 'cards' (Cards View)
    displayMode: 'tamil',     // 'tamil' | 'english' | 'parallel'
    rollMode: 'steady',       // 'steady' (Constant tempo for entire audio) | 'glide' (Synced smooth glide)
    playbackRate: 1.0,
    volume: 1.0,
    isMuted: false,
    autoRoll: true,
    repeatVerse: false,
    theme: 'dark',
    fontSize: 22,
    isUserScrolling: false,
    userScrollTimer: null,
    showFocalGuide: false,
    verseOffsets: []          // Cached Y positions for each verse element
  };

  // --- DOM Elements ---
  const el = {
    audio: new Audio(),
    scrollViewport: document.getElementById('scrollViewport'),
    scrollCanvas: document.getElementById('scrollCanvas'),
    versesStream: document.getElementById('versesStream'),
    
    // Header Buttons & Selectors
    bookSelectBtn: document.getElementById('bookSelectBtn'),
    bookSelectLabel: document.getElementById('bookSelectLabel'),
    chapterSelectBtn: document.getElementById('chapterSelectBtn'),
    chapterSelectLabel: document.getElementById('chapterSelectLabel'),
    
    bookModal: document.getElementById('bookModal'),
    bookCategoryList: document.getElementById('bookCategoryList'),
    closeBookModalBtn: document.getElementById('closeBookModalBtn'),
    
    chapterModal: document.getElementById('chapterModal'),
    chapterGrid: document.getElementById('chapterGrid'),
    closeChapterModalBtn: document.getElementById('closeChapterModalBtn'),
    
    btnViewScroll: document.getElementById('btnViewScroll'),
    btnViewCards: document.getElementById('btnViewCards'),
    btnModeTamil: document.getElementById('btnModeTamil'),
    btnModeEnglish: document.getElementById('btnModeEnglish'),
    btnModeParallel: document.getElementById('btnModeParallel'),
    btnFullscreenToggle: document.getElementById('btnFullscreenToggle'),
    
    // Subheader Banner
    bannerAudioLabel: document.getElementById('bannerAudioLabel'),
    btnRollModeToggle: document.getElementById('btnRollModeToggle'),
    rollModeLabel: document.getElementById('rollModeLabel'),
    
    // Scroll Header Titles
    scrollTitleTa: document.getElementById('scrollTitleTa'),
    scrollSubTa: document.getElementById('scrollSubTa'),
    scrollTitleEn: document.getElementById('scrollTitleEn'),
    
    // Resume Roll Banner & Guide
    resumeRollBanner: document.getElementById('resumeRollBanner'),
    btnResumeRoll: document.getElementById('btnResumeRoll'),
    focalReadingGuide: document.getElementById('focalReadingGuide'),
    
    // Outro Buttons
    btnOutroPrev: document.getElementById('btnOutroPrev'),
    btnOutroReplay: document.getElementById('btnOutroReplay'),
    btnOutroNext: document.getElementById('btnOutroNext'),
    
    // Player Controls
    playerProgressWrap: document.getElementById('playerProgressWrap'),
    playerProgressBar: document.getElementById('playerProgressBar'),
    playerBufferedBar: document.getElementById('playerBufferedBar'),
    playerTrackArt: document.getElementById('playerTrackArt'),
    playerTrackTitle: document.getElementById('playerTrackTitle'),
    playerVersePill: document.getElementById('playerVersePill'),
    playerCurTime: document.getElementById('playerCurTime'),
    playerTotTime: document.getElementById('playerTotTime'),
    
    btnScrollToggle: document.getElementById('btnScrollToggle'),
    btnPrevChapter: document.getElementById('btnPrevChapter'),
    btnNextChapter: document.getElementById('btnNextChapter'),
    btnRewind10: document.getElementById('btnRewind10'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    btnForward10: document.getElementById('btnForward10'),
    btnRepeatVerse: document.getElementById('btnRepeatVerse'),
    btnSpeed: document.getElementById('btnSpeed'),
    btnMute: document.getElementById('btnMute'),
    volumeSlider: document.getElementById('volumeSlider'),
    
    // Search Modal
    btnSearchOpen: document.getElementById('btnSearchOpen'),
    searchModal: document.getElementById('searchModal'),
    closeSearchModalBtn: document.getElementById('closeSearchModalBtn'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    
    // Settings Modal
    btnSettingsOpen: document.getElementById('btnSettingsOpen'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
    btnRollStyleSteady: document.getElementById('btnRollStyleSteady'),
    btnRollStyleGlide: document.getElementById('btnRollStyleGlide'),
    btnThemeDark: document.getElementById('btnThemeDark'),
    btnThemeLight: document.getElementById('btnThemeLight'),
    btnThemeSepia: document.getElementById('btnThemeSepia'),
    btnFontDec: document.getElementById('btnFontDec'),
    btnFontInc: document.getElementById('btnFontInc'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    toggleFocalGuideSwitch: document.getElementById('toggleFocalGuideSwitch'),
    
    toast: document.getElementById('toastNotice')
  };

  // --- Helpers ---
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function showToast(message, duration = 2200) {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.classList.add('is-visible');
    setTimeout(() => {
      el.toast.classList.remove('is-visible');
    }, duration);
  }

  // --- State Persistence ---
  function loadPersistedState() {
    try {
      const savedTheme = localStorage.getItem('biblescroll_theme');
      if (savedTheme) state.theme = savedTheme;

      const savedMode = localStorage.getItem('biblescroll_mode');
      if (savedMode) state.displayMode = savedMode;

      const savedRoll = localStorage.getItem('biblescroll_rollmode');
      if (savedRoll) state.rollMode = savedRoll;

      const savedView = localStorage.getItem('biblescroll_view');
      if (savedView) state.viewMode = savedView;

      const savedBook = localStorage.getItem('biblescroll_book');
      if (savedBook && window.NT_DATA[savedBook]) {
        state.bookId = parseInt(savedBook, 10);
      }

      const savedChapter = localStorage.getItem('biblescroll_ch');
      if (savedChapter) {
        state.chapter = parseInt(savedChapter, 10);
      }

      const savedFont = localStorage.getItem('biblescroll_font');
      if (savedFont) state.fontSize = parseInt(savedFont, 10);
    } catch (e) {
      console.warn('Storage read failed:', e);
    }
  }

  function getCurrentBook() {
    return window.NT_DATA[String(state.bookId)] || window.NT_DATA["1"];
  }

  function getCurrentChapterData() {
    const book = getCurrentBook();
    return book.chapters[String(state.chapter)] || book.chapters["1"];
  }

  // --- Audio Track Setup ---
  function setupAudio() {
    const chData = getCurrentChapterData();
    const book = getCurrentBook();
    if (!chData) return;

    el.audio.src = chData.audio_url;
    el.audio.playbackRate = state.playbackRate;
    el.audio.volume = state.volume;

    if (el.bannerAudioLabel) {
      el.bannerAudioLabel.textContent = `Tamil Narration • ${book.name_ta} (${book.name_en}) ${chData.chapter}`;
    }

    el.audio.onerror = () => {
      console.warn('Audio load error for:', el.audio.src);
      showToast('Audio file loading, please check path');
    };
  }

  // --- Render Chapter Verses ---
  function renderChapter() {
    const book = getCurrentBook();
    const chData = getCurrentChapterData();
    if (!book || !chData) return;

    // Header Selectors
    if (el.bookSelectLabel) el.bookSelectLabel.textContent = `${book.name_ta} • ${book.name_en}`;
    if (el.chapterSelectLabel) el.chapterSelectLabel.textContent = `அதிகாரம் ${chData.chapter} (Ch ${chData.chapter})`;

    // Scroll Header
    if (el.scrollTitleTa) el.scrollTitleTa.textContent = `${book.name_ta} ${chData.chapter}`;
    if (el.scrollSubTa) el.scrollSubTa.textContent = `${book.category_ta} • ${book.name_en} ${chData.chapter}`;
    if (el.scrollTitleEn) el.scrollTitleEn.textContent = `${book.name_en} Chapter ${chData.chapter} (King James Version)`;

    // Player Track Meta
    if (el.playerTrackArt) el.playerTrackArt.textContent = book.code || 'NT';
    if (el.playerTrackTitle) el.playerTrackTitle.textContent = `${book.name_ta} ${chData.chapter} — ${book.name_en} ${chData.chapter}`;
    if (el.playerVersePill) el.playerVersePill.textContent = 'Verse 1';
    if (el.playerTotTime) el.playerTotTime.textContent = formatTime(chData.duration);

    // Prev / Next button states
    const isFirstChapterOverall = (state.bookId === 1 && state.chapter === 1);
    const isLastChapterOverall = (state.bookId === 27 && state.chapter === book.total_chapters);

    if (el.btnOutroPrev) el.btnOutroPrev.disabled = isFirstChapterOverall;
    if (el.btnOutroNext) el.btnOutroNext.disabled = isLastChapterOverall;
    if (el.btnPrevChapter) el.btnPrevChapter.disabled = isFirstChapterOverall;
    if (el.btnNextChapter) el.btnNextChapter.disabled = isLastChapterOverall;

    // Render Verses
    el.versesStream.innerHTML = '';
    const frag = document.createDocumentFragment();

    chData.verses.forEach((v) => {
      const item = document.createElement('article');
      item.className = 'scroll-verse-item';
      item.id = `verse-${v.verse}`;
      item.dataset.verse = v.verse;
      item.dataset.start = v.start;
      item.dataset.end = v.end;

      item.innerHTML = `
        <div class="verse-item-inner">
          <div class="verse-num-roll">${v.verse}</div>
          <div class="verse-text-group">
            <div class="verse-ta">${v.ta}</div>
            <div class="verse-en">${v.en}</div>
          </div>
        </div>
      `;

      item.addEventListener('click', () => {
        seekToVerse(v.verse, true);
      });

      frag.appendChild(item);
    });

    el.versesStream.appendChild(frag);

    // Reset scroll to top
    if (el.scrollViewport) {
      el.scrollViewport.scrollTop = 0;
    }

    setupAudio();
    updateBookPickerHighlight();
    updateChapterPickerHighlight();

    localStorage.setItem('biblescroll_book', state.bookId);
    localStorage.setItem('biblescroll_ch', state.chapter);

    // Recalculate geometric offsets for smooth roll interpolation
    setTimeout(cacheVerseOffsets, 150);
  }

  // --- Cache Geometric Offsets for Continuous Rolling ---
  function cacheVerseOffsets() {
    if (!el.scrollViewport) return;
    const chData = getCurrentChapterData();
    if (!chData) return;

    state.verseOffsets = [];
    const vpRect = el.scrollViewport.getBoundingClientRect();
    const currentScroll = el.scrollViewport.scrollTop;

    chData.verses.forEach((v) => {
      const elem = document.getElementById(`verse-${v.verse}`);
      if (elem) {
        const rect = elem.getBoundingClientRect();
        // Target scroll to center the verse in the reading zone (42% from top of viewport)
        const targetScroll = currentScroll + (rect.top - vpRect.top) - (vpRect.height * 0.40);
        state.verseOffsets.push({
          verse: v.verse,
          start: v.start,
          end: v.end,
          targetY: Math.max(0, targetScroll)
        });
      }
    });
  }

  // --- Continuous Smooth Rolling Animation Engine ---
  let animFrameId = null;

  function startRollLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    function tick() {
      if (state.isPlaying && state.autoRoll && !state.isUserScrolling) {
        updateContinuousScroll();
      }
      animFrameId = requestAnimationFrame(tick);
    }

    animFrameId = requestAnimationFrame(tick);
  }

  function updateContinuousScroll() {
    const curTime = el.audio.currentTime;
    const dur = el.audio.duration || getCurrentChapterData().duration;
    if (!dur || dur <= 0 || !el.scrollViewport) return;

    const maxScroll = el.scrollViewport.scrollHeight - el.scrollViewport.clientHeight;
    if (maxScroll <= 0) return;

    let targetScroll = 0;

    if (state.rollMode === 'steady') {
      // Steady Tempo Roll: constant uniform velocity matching YouTube scripture video
      const chData = getCurrentChapterData();
      const intro = chData.intro_end || 4.5;
      const outro = dur - 1.5;

      if (curTime < intro) {
        targetScroll = 0;
      } else if (curTime >= outro) {
        targetScroll = maxScroll;
      } else {
        const progress = (curTime - intro) / (outro - intro);
        targetScroll = progress * maxScroll;
      }
    } else {
      // Audio-Synced Glide: Continuous piecewise interpolation through verse offsets
      const offsets = state.verseOffsets;
      if (offsets.length > 0) {
        const first = offsets[0];
        const last = offsets[offsets.length - 1];

        if (curTime <= first.start) {
          targetScroll = 0;
        } else if (curTime >= last.end) {
          targetScroll = maxScroll;
        } else {
          for (let i = 0; i < offsets.length; i++) {
            const curV = offsets[i];
            const nextV = offsets[i + 1];

            if (nextV && curTime >= curV.start && curTime < nextV.start) {
              const alpha = (curTime - curV.start) / (nextV.start - curV.start);
              targetScroll = curV.targetY + alpha * (nextV.targetY - curV.targetY);
              break;
            } else if (!nextV && curTime >= curV.start) {
              targetScroll = curV.targetY;
              break;
            }
          }
        }
      }
    }

    // Apply exponential smoothing
    const curScroll = el.scrollViewport.scrollTop;
    const diff = targetScroll - curScroll;

    if (Math.abs(diff) > 0.4) {
      el.scrollViewport.scrollTop = curScroll + diff * 0.12;
    }
  }

  // --- Active Verse Focus & Audio Time Updates ---
  function onAudioTimeUpdate() {
    const curTime = el.audio.currentTime;
    const dur = el.audio.duration || getCurrentChapterData().duration;

    // Progress Bar
    if (dur > 0 && el.playerProgressBar) {
      const pct = (curTime / dur) * 100;
      el.playerProgressBar.style.width = `${pct}%`;
    }

    if (el.playerCurTime) {
      el.playerCurTime.textContent = formatTime(curTime);
    }

    // Buffered Bar
    if (el.audio.buffered.length > 0 && el.playerBufferedBar) {
      const bufEnd = el.audio.buffered.end(el.audio.buffered.length - 1);
      el.playerBufferedBar.style.width = `${Math.min((bufEnd / dur) * 100, 100)}%`;
    }

    // Find Active Verse
    const chData = getCurrentChapterData();
    if (!chData) return;

    let matchedVerse = null;
    for (const v of chData.verses) {
      if (curTime >= v.start && curTime < v.end) {
        matchedVerse = v;
        break;
      }
    }

    if (matchedVerse) {
      if (state.repeatVerse && curTime >= matchedVerse.end - 0.25) {
        el.audio.currentTime = matchedVerse.start;
        return;
      }

      if (state.activeVerseNum !== matchedVerse.verse) {
        setActiveVerse(matchedVerse.verse);
      }
    } else {
      if (state.activeVerseNum !== null && curTime < chData.verses[0].start) {
        clearActiveVerse();
        if (el.playerVersePill) el.playerVersePill.textContent = 'Intro...';
      }
    }
  }

  function setActiveVerse(verseNum) {
    state.activeVerseNum = verseNum;

    document.querySelectorAll('.scroll-verse-item.is-active').forEach((node) => {
      node.classList.remove('is-active');
    });

    const activeEl = document.getElementById(`verse-${verseNum}`);
    if (activeEl) {
      activeEl.classList.add('is-active');
    }

    if (el.playerVersePill) {
      el.playerVersePill.textContent = `Verse ${verseNum}`;
    }
  }

  function clearActiveVerse() {
    state.activeVerseNum = null;
    document.querySelectorAll('.scroll-verse-item.is-active').forEach((node) => {
      node.classList.remove('is-active');
    });
  }

  function seekToVerse(verseNum, andPlay = true) {
    const chData = getCurrentChapterData();
    const v = chData.verses.find((item) => item.verse === verseNum);
    if (!v) return;

    el.audio.currentTime = v.start;
    setActiveVerse(verseNum);

    const offset = state.verseOffsets.find((o) => o.verse === verseNum);
    if (offset && el.scrollViewport) {
      el.scrollViewport.scrollTop = offset.targetY;
    }

    if (andPlay && el.audio.paused) {
      playAudio();
    }
  }

  // --- Audio Control Functions ---
  function playAudio() {
    el.audio.play().then(() => {
      state.isPlaying = true;
      updatePlayPauseUI();
    }).catch((err) => {
      console.warn('Playback error:', err);
      showToast('Click anywhere to start playback');
    });
  }

  function pauseAudio() {
    el.audio.pause();
    state.isPlaying = false;
    updatePlayPauseUI();
  }

  function togglePlayPause() {
    if (el.audio.paused) {
      playAudio();
    } else {
      pauseAudio();
    }
  }

  function updatePlayPauseUI() {
    const playIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    const pauseIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    if (el.btnPlayPause) {
      el.btnPlayPause.innerHTML = state.isPlaying ? pauseIcon : playIcon;
      el.btnPlayPause.setAttribute('title', state.isPlaying ? 'Pause (Space)' : 'Play (Space)');
    }
  }

  // --- Navigation: Across Chapters and Books ---
  function nextChapter() {
    const book = getCurrentBook();
    if (state.chapter < book.total_chapters) {
      state.chapter++;
      renderChapter();
      if (state.isPlaying) playAudio();
      showToast(`${book.name_ta} ${state.chapter}`);
    } else if (state.bookId < 27) {
      state.bookId++;
      state.chapter = 1;
      const nextBook = getCurrentBook();
      renderChapter();
      if (state.isPlaying) playAudio();
      showToast(`Next Book: ${nextBook.name_ta} 1`);
    }
  }

  function prevChapter() {
    if (state.chapter > 1) {
      state.chapter--;
      const book = getCurrentBook();
      renderChapter();
      if (state.isPlaying) playAudio();
      showToast(`${book.name_ta} ${state.chapter}`);
    } else if (state.bookId > 1) {
      state.bookId--;
      const prevBook = getCurrentBook();
      state.chapter = prevBook.total_chapters;
      renderChapter();
      if (state.isPlaying) playAudio();
      showToast(`Previous Book: ${prevBook.name_ta} ${state.chapter}`);
    }
  }

  function cycleSpeed() {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const curIdx = speeds.indexOf(state.playbackRate);
    const nextIdx = (curIdx + 1) % speeds.length;
    state.playbackRate = speeds[nextIdx];
    el.audio.playbackRate = state.playbackRate;
    if (el.btnSpeed) el.btnSpeed.textContent = `${state.playbackRate}x`;
    showToast(`Playback Speed: ${state.playbackRate}x`);
  }

  function toggleRepeatVerse() {
    state.repeatVerse = !state.repeatVerse;
    if (el.btnRepeatVerse) el.btnRepeatVerse.classList.toggle('is-active', state.repeatVerse);
    showToast(state.repeatVerse ? 'Looping Current Verse' : 'Verse Looping Off');
  }

  function toggleRollMode() {
    state.rollMode = state.rollMode === 'steady' ? 'glide' : 'steady';
    updateRollModeUI();
    localStorage.setItem('biblescroll_rollmode', state.rollMode);
    showToast(state.rollMode === 'steady' ? 'Mode: Steady Tempo Roll (YouTube Style)' : 'Mode: Audio-Synced Glide');
  }

  function setRollMode(mode) {
    state.rollMode = mode;
    updateRollModeUI();
    localStorage.setItem('biblescroll_rollmode', mode);
  }

  function updateRollModeUI() {
    const isSteady = state.rollMode === 'steady';
    if (el.rollModeLabel) {
      el.rollModeLabel.textContent = isSteady ? 'Steady Tempo Roll' : 'Audio-Synced Glide';
    }
    if (el.btnRollStyleSteady) el.btnRollStyleSteady.classList.toggle('is-active', isSteady);
    if (el.btnRollStyleGlide) el.btnRollStyleGlide.classList.toggle('is-active', !isSteady);
  }

  function toggleAutoRoll() {
    state.autoRoll = !state.autoRoll;
    if (el.btnScrollToggle) el.btnScrollToggle.classList.toggle('is-active', state.autoRoll);
    showToast(state.autoRoll ? 'Auto-Roll Resumed' : 'Auto-Roll Paused');
  }

  // --- Display & View Modes ---
  function setDisplayMode(mode) {
    state.displayMode = mode;
    document.body.dataset.mode = mode;
    localStorage.setItem('biblescroll_mode', mode);

    [el.btnModeTamil, el.btnModeEnglish, el.btnModeParallel].forEach((btn) => {
      if (btn) btn.classList.remove('is-active');
    });

    if (mode === 'tamil' && el.btnModeTamil) el.btnModeTamil.classList.add('is-active');
    if (mode === 'english' && el.btnModeEnglish) el.btnModeEnglish.classList.add('is-active');
    if (mode === 'parallel' && el.btnModeParallel) el.btnModeParallel.classList.add('is-active');

    setTimeout(cacheVerseOffsets, 100);
  }

  function setViewMode(view) {
    state.viewMode = view;
    document.body.dataset.view = view;
    localStorage.setItem('biblescroll_view', view);

    if (el.btnViewScroll) el.btnViewScroll.classList.toggle('is-active', view === 'scroll');
    if (el.btnViewCards) el.btnViewCards.classList.toggle('is-active', view === 'cards');

    setTimeout(cacheVerseOffsets, 100);
    showToast(view === 'scroll' ? 'Cinematic Scroll View' : 'Card Reader View');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        showToast('Fullscreen Mode (Press Esc to exit)');
      }).catch(console.warn);
    } else {
      document.exitFullscreen().catch(console.warn);
    }
  }

  // --- Book Picker Modal (Categorized for all 27 Books) ---
  function buildBookPicker() {
    if (!el.bookCategoryList) return;
    el.bookCategoryList.innerHTML = '';

    const categories = [
      { name_en: "Gospels", name_ta: "சுவிசேஷங்கள்", range: [1, 4] },
      { name_en: "History", name_ta: "சரித்திரம்", range: [5, 5] },
      { name_en: "Pauline Epistles", name_ta: "பவுலின் நிருபங்கள்", range: [6, 18] },
      { name_en: "General Epistles", name_ta: "பொதுவான நிருபங்கள்", range: [19, 26] },
      { name_en: "Prophecy", name_ta: "தீர்க்கதரிசனம்", range: [27, 27] }
    ];

    categories.forEach((cat) => {
      const sec = document.createElement('section');
      sec.className = 'book-cat-section';

      sec.innerHTML = `
        <div class="book-cat-header">
          <span>${cat.name_ta}</span>
          <span style="font-weight:400; opacity:0.7;">• ${cat.name_en}</span>
        </div>
        <div class="book-cat-grid" id="cat-grid-${cat.name_en}"></div>
      `;

      const grid = sec.querySelector('.book-cat-grid');

      for (let id = cat.range[0]; id <= cat.range[1]; id++) {
        const b = window.NT_DATA[String(id)];
        if (!b) continue;

        const tile = document.createElement('div');
        tile.className = `book-tile ${id === state.bookId ? 'is-active' : ''}`;
        tile.dataset.bookId = id;
        tile.innerHTML = `
          <div class="book-tile-ta">${b.name_ta}</div>
          <div class="book-tile-en">${b.name_en}</div>
          <div class="book-tile-meta">${b.total_chapters} Chapters</div>
        `;

        tile.addEventListener('click', () => {
          state.bookId = id;
          state.chapter = 1;
          renderChapter();
          closeModal(el.bookModal);
          if (state.isPlaying) playAudio();
        });

        grid.appendChild(tile);
      }

      el.bookCategoryList.appendChild(sec);
    });
  }

  function updateBookPickerHighlight() {
    if (!el.bookCategoryList) return;
    el.bookCategoryList.querySelectorAll('.book-tile').forEach((tile) => {
      const id = parseInt(tile.dataset.bookId, 10);
      tile.classList.toggle('is-active', id === state.bookId);
    });
  }

  // --- Chapter Picker Modal ---
  function buildChapterPicker() {
    if (!el.chapterGrid) return;
    el.chapterGrid.innerHTML = '';

    const book = getCurrentBook();
    if (!book) return;

    for (let c = 1; c <= book.total_chapters; c++) {
      const tile = document.createElement('div');
      tile.className = `chapter-tile ${c === state.chapter ? 'is-active' : ''}`;
      tile.textContent = c;

      tile.addEventListener('click', () => {
        state.chapter = c;
        renderChapter();
        closeModal(el.chapterModal);
        if (state.isPlaying) playAudio();
      });

      el.chapterGrid.appendChild(tile);
    }
  }

  function updateChapterPickerHighlight() {
    buildChapterPicker();
  }

  // --- Search Feature Across Entire New Testament ---
  function setupSearch() {
    if (!el.searchInput || !el.searchResults) return;

    el.searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      renderSearchResults(q);
    });
  }

  function renderSearchResults(q) {
    if (!el.searchResults) return;
    if (!q || q.length < 2) {
      el.searchResults.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:1.5rem;">Enter at least 2 characters to search across all 260 chapters of the New Testament...</div>';
      return;
    }

    const matches = [];
    for (let bId = 1; bId <= 27; bId++) {
      const b = window.NT_DATA[String(bId)];
      if (!b) continue;

      for (let chId = 1; chId <= b.total_chapters; chId++) {
        const ch = b.chapters[String(chId)];
        if (!ch) continue;

        for (const v of ch.verses) {
          const inTa = v.ta.toLowerCase().includes(q);
          const inEn = v.en.toLowerCase().includes(q);
          if (inTa || inEn) {
            matches.push({
              bookId: bId,
              bookTa: b.name_ta,
              bookEn: b.name_en,
              chapter: chId,
              verse: v.verse,
              ta: v.ta,
              en: v.en
            });
            if (matches.length >= 60) break;
          }
        }
        if (matches.length >= 60) break;
      }
      if (matches.length >= 60) break;
    }

    if (matches.length === 0) {
      el.searchResults.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding:1.5rem;">No verses found matching "<strong>${q}</strong>"</div>`;
      return;
    }

    el.searchResults.innerHTML = '';
    const frag = document.createDocumentFragment();

    matches.forEach((m) => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <div class="search-result-meta">
          <span>${m.bookTa} ${m.chapter}:${m.verse}</span>
          <span>•</span>
          <span>${m.bookEn} ${m.chapter}:${m.verse}</span>
        </div>
        <div class="search-result-text">
          <div style="margin-bottom:3px;">${highlightTerm(m.ta, q)}</div>
          <div style="font-size:0.82rem; color:var(--text-secondary);">${highlightTerm(m.en, q)}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        state.bookId = m.bookId;
        state.chapter = m.chapter;
        renderChapter();
        closeModal(el.searchModal);
        setTimeout(() => {
          seekToVerse(m.verse, true);
        }, 150);
      });

      frag.appendChild(item);
    });

    el.searchResults.appendChild(frag);
  }

  function highlightTerm(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:var(--accent-glow); color:inherit; border-radius:2px; padding:0 2px;">$1</mark>');
  }

  // --- Themes & Appearance ---
  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('biblescroll_theme', theme);

    [el.btnThemeDark, el.btnThemeLight, el.btnThemeSepia].forEach((btn) => {
      if (btn) btn.classList.remove('is-active');
    });

    if (theme === 'dark' && el.btnThemeDark) el.btnThemeDark.classList.add('is-active');
    if (theme === 'light' && el.btnThemeLight) el.btnThemeLight.classList.add('is-active');
    if (theme === 'sepia' && el.btnThemeSepia) el.btnThemeSepia.classList.add('is-active');
  }

  function setFontSize(size) {
    state.fontSize = Math.min(Math.max(size, 16), 34);
    document.documentElement.style.setProperty('--font-size-base', `${state.fontSize}px`);
    if (el.fontSizeValue) el.fontSizeValue.textContent = `${state.fontSize}px`;
    localStorage.setItem('biblescroll_font', state.fontSize);
    setTimeout(cacheVerseOffsets, 100);
  }

  // --- Modal Helpers ---
  function openModal(modal) {
    if (modal) modal.classList.add('is-open');
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove('is-open');
  }

  // --- Keyboard Shortcuts ---
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          el.audio.currentTime = Math.min(el.audio.currentTime + 10, el.audio.duration || 9999);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          el.audio.currentTime = Math.max(el.audio.currentTime - 10, 0);
          break;
        case 'BracketLeft':
          e.preventDefault();
          prevChapter();
          break;
        case 'BracketRight':
          e.preventDefault();
          nextChapter();
          break;
        case 'KeyM':
          e.preventDefault();
          state.isMuted = !state.isMuted;
          el.audio.muted = state.isMuted;
          showToast(state.isMuted ? 'Muted' : 'Unmuted');
          break;
        case 'KeyL':
          e.preventDefault();
          toggleRepeatVerse();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Digit1':
          setDisplayMode('tamil');
          break;
        case 'Digit2':
          setDisplayMode('english');
          break;
        case 'Digit3':
          setDisplayMode('parallel');
          break;
      }
    });
  }

  // --- Event Listeners Initialization ---
  function initEventListeners() {
    // Audio Events
    el.audio.addEventListener('timeupdate', onAudioTimeUpdate);
    el.audio.addEventListener('play', () => {
      state.isPlaying = true;
      updatePlayPauseUI();
    });
    el.audio.addEventListener('pause', () => {
      state.isPlaying = false;
      updatePlayPauseUI();
    });
    el.audio.addEventListener('ended', () => {
      if (state.repeatVerse) {
        seekToVerse(state.activeVerseNum || 1, true);
      } else {
        const book = getCurrentBook();
        if (state.chapter < book.total_chapters || state.bookId < 27) {
          showToast(`Chapter completed. Rolling next chapter...`);
          nextChapter();
        } else {
          pauseAudio();
          showToast('You have completed the entire New Testament!');
        }
      }
    });

    // Detect User Manual Scroll in Viewport
    if (el.scrollViewport) {
      el.scrollViewport.addEventListener('wheel', handleUserScroll, { passive: true });
      el.scrollViewport.addEventListener('touchstart', handleUserScroll, { passive: true });
    }

    function handleUserScroll() {
      state.isUserScrolling = true;
      if (el.resumeRollBanner) el.resumeRollBanner.classList.add('is-visible');

      clearTimeout(state.userScrollTimer);
      state.userScrollTimer = setTimeout(() => {
        state.isUserScrolling = false;
        if (el.resumeRollBanner) el.resumeRollBanner.classList.remove('is-visible');
      }, 3500);
    }

    if (el.btnResumeRoll) {
      el.btnResumeRoll.addEventListener('click', () => {
        state.isUserScrolling = false;
        if (el.resumeRollBanner) el.resumeRollBanner.classList.remove('is-visible');
        showToast('Auto-Roll Resumed');
      });
    }

    // View Modes
    if (el.btnViewScroll) el.btnViewScroll.addEventListener('click', () => setViewMode('scroll'));
    if (el.btnViewCards) el.btnViewCards.addEventListener('click', () => setViewMode('cards'));

    // Language Modes
    if (el.btnModeTamil) el.btnModeTamil.addEventListener('click', () => setDisplayMode('tamil'));
    if (el.btnModeEnglish) el.btnModeEnglish.addEventListener('click', () => setDisplayMode('english'));
    if (el.btnModeParallel) el.btnModeParallel.addEventListener('click', () => setDisplayMode('parallel'));

    // Roll Mode
    if (el.btnRollModeToggle) el.btnRollModeToggle.addEventListener('click', toggleRollMode);
    if (el.btnRollStyleSteady) el.btnRollStyleSteady.addEventListener('click', () => setRollMode('steady'));
    if (el.btnRollStyleGlide) el.btnRollStyleGlide.addEventListener('click', () => setRollMode('glide'));

    // Fullscreen
    if (el.btnFullscreenToggle) el.btnFullscreenToggle.addEventListener('click', toggleFullscreen);

    // Book Modal
    if (el.bookSelectBtn) el.bookSelectBtn.addEventListener('click', () => openModal(el.bookModal));
    if (el.closeBookModalBtn) el.closeBookModalBtn.addEventListener('click', () => closeModal(el.bookModal));
    if (el.bookModal) {
      el.bookModal.addEventListener('click', (e) => {
        if (e.target === el.bookModal) closeModal(el.bookModal);
      });
    }

    // Chapter Modal
    if (el.chapterSelectBtn) el.chapterSelectBtn.addEventListener('click', () => {
      buildChapterPicker();
      openModal(el.chapterModal);
    });
    if (el.closeChapterModalBtn) el.closeChapterModalBtn.addEventListener('click', () => closeModal(el.chapterModal));
    if (el.chapterModal) {
      el.chapterModal.addEventListener('click', (e) => {
        if (e.target === el.chapterModal) closeModal(el.chapterModal);
      });
    }

    // Player Buttons
    if (el.btnPlayPause) el.btnPlayPause.addEventListener('click', togglePlayPause);
    if (el.btnPrevChapter) el.btnPrevChapter.addEventListener('click', prevChapter);
    if (el.btnNextChapter) el.btnNextChapter.addEventListener('click', nextChapter);
    if (el.btnRewind10) el.btnRewind10.addEventListener('click', () => {
      el.audio.currentTime = Math.max(el.audio.currentTime - 10, 0);
    });
    if (el.btnForward10) el.btnForward10.addEventListener('click', () => {
      el.audio.currentTime = Math.min(el.audio.currentTime + 10, el.audio.duration || 9999);
    });
    if (el.btnRepeatVerse) el.btnRepeatVerse.addEventListener('click', toggleRepeatVerse);
    if (el.btnScrollToggle) el.btnScrollToggle.addEventListener('click', toggleAutoRoll);
    if (el.btnSpeed) el.btnSpeed.addEventListener('click', cycleSpeed);

    // Outro Buttons
    if (el.btnOutroPrev) el.btnOutroPrev.addEventListener('click', prevChapter);
    if (el.btnOutroNext) el.btnOutroNext.addEventListener('click', nextChapter);
    if (el.btnOutroReplay) el.btnOutroReplay.addEventListener('click', () => {
      el.audio.currentTime = 0;
      if (el.scrollViewport) el.scrollViewport.scrollTop = 0;
      playAudio();
    });

    // Scrubber Drag & Click
    if (el.playerProgressWrap) {
      el.playerProgressWrap.addEventListener('click', (e) => {
        const rect = el.playerProgressWrap.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const dur = el.audio.duration || getCurrentChapterData().duration;
        if (dur > 0) {
          el.audio.currentTime = (clickX / width) * dur;
          updateContinuousScroll();
        }
      });
    }

    // Volume & Mute
    if (el.volumeSlider) {
      el.volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.volume = val;
        el.audio.volume = val;
        state.isMuted = val === 0;
      });
    }
    if (el.btnMute) {
      el.btnMute.addEventListener('click', () => {
        state.isMuted = !state.isMuted;
        el.audio.muted = state.isMuted;
        showToast(state.isMuted ? 'Muted' : 'Unmuted');
      });
    }

    // Search
    if (el.btnSearchOpen) el.btnSearchOpen.addEventListener('click', () => {
      openModal(el.searchModal);
      if (el.searchInput) {
        el.searchInput.focus();
        renderSearchResults(el.searchInput.value.trim().toLowerCase());
      }
    });
    if (el.closeSearchModalBtn) el.closeSearchModalBtn.addEventListener('click', () => closeModal(el.searchModal));
    if (el.searchModal) {
      el.searchModal.addEventListener('click', (e) => {
        if (e.target === el.searchModal) closeModal(el.searchModal);
      });
    }

    // Settings
    if (el.btnSettingsOpen) el.btnSettingsOpen.addEventListener('click', () => openModal(el.settingsModal));
    if (el.closeSettingsModalBtn) el.closeSettingsModalBtn.addEventListener('click', () => closeModal(el.settingsModal));
    if (el.settingsModal) {
      el.settingsModal.addEventListener('click', (e) => {
        if (e.target === el.settingsModal) closeModal(el.settingsModal);
      });
    }

    // Themes
    if (el.btnThemeDark) el.btnThemeDark.addEventListener('click', () => setTheme('dark'));
    if (el.btnThemeLight) el.btnThemeLight.addEventListener('click', () => setTheme('light'));
    if (el.btnThemeSepia) el.btnThemeSepia.addEventListener('click', () => setTheme('sepia'));

    // Font Stepper
    if (el.btnFontDec) el.btnFontDec.addEventListener('click', () => setFontSize(state.fontSize - 2));
    if (el.btnFontInc) el.btnFontInc.addEventListener('click', () => setFontSize(state.fontSize + 2));

    // Focal Guide Switch
    if (el.toggleFocalGuideSwitch) {
      el.toggleFocalGuideSwitch.addEventListener('change', (e) => {
        state.showFocalGuide = e.target.checked;
        document.body.classList.toggle('show-focal-guide', state.showFocalGuide);
      });
    }

    // Window Resize
    window.addEventListener('resize', () => {
      setTimeout(cacheVerseOffsets, 150);
    });
  }

  // --- Bootstrap ---
  function init() {
    loadPersistedState();
    setTheme(state.theme);
    setFontSize(state.fontSize);
    setDisplayMode(state.displayMode);
    setViewMode(state.viewMode);
    updateRollModeUI();
    buildBookPicker();
    buildChapterPicker();
    renderChapter();
    setupSearch();
    setupKeyboardShortcuts();
    initEventListeners();
    startRollLoop();
    console.log('Bible Scroll App (Full New Testament Edition) initialized.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
