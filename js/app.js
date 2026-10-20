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
    loopVerseNum: null,       // Verse being looped while repeatVerse is on
    isScrubbing: false,       // True while dragging the progress bar
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

  let toastTimer = null;

  function showToast(message, duration = 2200) {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove('is-visible');
    }, duration);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Scroll writes made by the app are recorded so a 'scroll' event that
  // doesn't match can be attributed to the user (scrollbar drag, keys, flings).
  let lastProgrammaticScrollTop = 0;

  function setScroll(y) {
    if (!el.scrollViewport) return;
    el.scrollViewport.scrollTop = y;
    lastProgrammaticScrollTop = el.scrollViewport.scrollTop;
  }

  // --- State Persistence ---
  const VALID = {
    theme: ['dark', 'light', 'sepia'],
    displayMode: ['tamil', 'english', 'parallel'],
    rollMode: ['steady', 'glide'],
    viewMode: ['scroll', 'cards']
  };

  function save(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Storage can be unavailable (private mode, quota); persistence is best-effort
    }
  }

  function loadPersistedState() {
    try {
      const savedTheme = localStorage.getItem('biblescroll_theme');
      if (VALID.theme.includes(savedTheme)) state.theme = savedTheme;

      const savedMode = localStorage.getItem('biblescroll_mode');
      if (VALID.displayMode.includes(savedMode)) state.displayMode = savedMode;

      const savedRoll = localStorage.getItem('biblescroll_rollmode');
      if (VALID.rollMode.includes(savedRoll)) state.rollMode = savedRoll;

      const savedView = localStorage.getItem('biblescroll_view');
      if (VALID.viewMode.includes(savedView)) state.viewMode = savedView;

      const savedBook = localStorage.getItem('biblescroll_book');
      if (savedBook && window.NT_DATA[savedBook]) {
        state.bookId = parseInt(savedBook, 10);
      }

      const savedChapter = parseInt(localStorage.getItem('biblescroll_ch'), 10);
      if (savedChapter >= 1 && savedChapter <= getCurrentBook().total_chapters) {
        state.chapter = savedChapter;
      }

      const savedFont = parseInt(localStorage.getItem('biblescroll_font'), 10);
      if (!isNaN(savedFont)) state.fontSize = savedFont;
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

    updateMediaSession();
  }

  // --- Lock Screen / Notification Controls (Media Session API) ---
  function updateMediaSession() {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    const book = getCurrentBook();
    const chData = getCurrentChapterData();
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${book.name_ta} ${chData.chapter}`,
      artist: `${book.name_en} ${chData.chapter}`,
      album: 'Tamil New Testament • புதிய ஏற்பாடு'
    });
  }

  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const handlers = {
      play: playAudio,
      pause: pauseAudio,
      previoustrack: () => prevChapter(),
      nexttrack: () => nextChapter(),
      seekbackward: () => seekBy(-10),
      seekforward: () => seekBy(10),
      seekto: (details) => { el.audio.currentTime = details.seekTime; }
    };
    Object.keys(handlers).forEach((action) => {
      try {
        navigator.mediaSession.setActionHandler(action, handlers[action]);
      } catch (e) {
        // Action not supported by this browser
      }
    });
  }

  // --- Render Chapter Verses ---
  function renderChapter() {
    const book = getCurrentBook();
    const chData = getCurrentChapterData();
    if (!book || !chData) return;

    // Header Selectors
    // The .label-long parts are hidden on narrow screens
    if (el.bookSelectLabel) el.bookSelectLabel.innerHTML = `${book.name_ta}<span class="label-long"> • ${book.name_en}</span>`;
    if (el.chapterSelectLabel) el.chapterSelectLabel.innerHTML = `<span class="label-long">அதிகாரம் ${chData.chapter} (</span>Ch ${chData.chapter}<span class="label-long">)</span>`;

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
    setScroll(0);
    state.activeVerseNum = null;
    state.loopVerseNum = null;

    setupAudio();
    updateBookPickerHighlight();
    updateChapterPickerHighlight();

    save('biblescroll_book', state.bookId);
    save('biblescroll_ch', state.chapter);

    // Recalculate geometric offsets for smooth roll interpolation
    cacheVerseOffsets();
  }

  // Layout can change after render (web fonts arriving, resizes, mode switches);
  // coalesce those into one offset recalculation per frame.
  let offsetCacheFrame = null;

  function scheduleOffsetCache() {
    if (offsetCacheFrame) return;
    offsetCacheFrame = requestAnimationFrame(() => {
      offsetCacheFrame = null;
      cacheVerseOffsets();
    });
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
        const targetScroll = currentScroll + (rect.top - vpRect.top) - (vpRect.height * 0.42);
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
      if (state.isPlaying) {
        enforceVerseLoop();
        if (state.autoRoll && !state.isUserScrolling) {
          updateContinuousScroll();
        }
      }
      animFrameId = requestAnimationFrame(tick);
    }

    animFrameId = requestAnimationFrame(tick);
  }

  function updateContinuousScroll() {
    const targetScroll = computeTargetScroll(el.audio.currentTime);
    if (targetScroll === null) return;

    // Apply exponential smoothing
    const curScroll = el.scrollViewport.scrollTop;
    const diff = targetScroll - curScroll;

    if (Math.abs(diff) > 0.4) {
      setScroll(curScroll + diff * 0.12);
    }
  }

  // Where the viewport should be scrolled for a given audio time, or null if unknown
  function computeTargetScroll(curTime) {
    const dur = el.audio.duration || getCurrentChapterData().duration;
    if (!dur || dur <= 0 || !el.scrollViewport) return null;

    const maxScroll = el.scrollViewport.scrollHeight - el.scrollViewport.clientHeight;
    if (maxScroll <= 0) return null;

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

    return Math.min(targetScroll, maxScroll);
  }

  // --- Verse Looping ---
  function findVerseAt(time) {
    const chData = getCurrentChapterData();
    return chData.verses.find((v) => time >= v.start && time < v.end) || null;
  }

  // Runs every frame and on timeupdate (which keeps firing in background tabs),
  // so the jump back happens even when timeupdate events are 250ms apart.
  function enforceVerseLoop() {
    if (!state.repeatVerse || el.audio.paused) return;
    const chData = getCurrentChapterData();
    const curTime = el.audio.currentTime;

    let loopV = chData.verses.find((v) => v.verse === state.loopVerseNum);
    if (!loopV) {
      loopV = findVerseAt(curTime);
      if (!loopV) return;
      state.loopVerseNum = loopV.verse;
    }

    if (curTime >= loopV.end - 0.05 && curTime < loopV.end + 1.0) {
      el.audio.currentTime = loopV.start;
    } else if (curTime < loopV.start - 0.25 || curTime >= loopV.end + 1.0) {
      // The user seeked elsewhere: loop the verse they moved to instead
      const moved = findVerseAt(curTime);
      state.loopVerseNum = moved ? moved.verse : null;
    }
  }

  // --- Active Verse Focus & Audio Time Updates ---
  function updateProgressUI(curTime, dur) {
    if (dur > 0 && el.playerProgressBar) {
      const pct = Math.min((curTime / dur) * 100, 100);
      el.playerProgressBar.style.width = `${pct}%`;
    }

    if (el.playerCurTime) {
      el.playerCurTime.textContent = formatTime(curTime);
    }
  }

  function onAudioTimeUpdate() {
    enforceVerseLoop();

    const curTime = el.audio.currentTime;
    const dur = el.audio.duration || getCurrentChapterData().duration;

    // Progress Bar (left alone while the user is dragging it)
    if (!state.isScrubbing) {
      updateProgressUI(curTime, dur);
    }

    // Buffered Bar
    if (el.audio.buffered.length > 0 && el.playerBufferedBar) {
      const bufEnd = el.audio.buffered.end(el.audio.buffered.length - 1);
      el.playerBufferedBar.style.width = `${Math.min((bufEnd / dur) * 100, 100)}%`;
    }

    // Find Active Verse
    const chData = getCurrentChapterData();
    if (!chData) return;

    const matchedVerse = findVerseAt(curTime);

    if (matchedVerse) {
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
    if (state.repeatVerse) state.loopVerseNum = verseNum;

    // Jump to where the roll engine itself would put this moment, so it doesn't
    // drift back afterwards. With auto-roll off, just center the verse.
    resumeAutoRoll();
    cacheVerseOffsets();
    const rollTarget = state.autoRoll ? computeTargetScroll(v.start) : null;
    if (rollTarget !== null) {
      setScroll(rollTarget);
    } else {
      const offset = state.verseOffsets.find((o) => o.verse === verseNum);
      if (offset) setScroll(offset.targetY);
    }

    if (andPlay && el.audio.paused) {
      playAudio();
    }
  }

  function seekBy(seconds) {
    const dur = el.audio.duration || getCurrentChapterData().duration;
    el.audio.currentTime = Math.min(Math.max(el.audio.currentTime + seconds, 0), dur);
  }

  // --- Audio Control Functions ---
  function playAudio() {
    el.audio.play().then(() => {
      state.isPlaying = true;
      updatePlayPauseUI();
    }).catch((err) => {
      // AbortError just means the source changed before playback began
      if (err.name === 'AbortError') return;
      console.warn('Playback error:', err);
      showToast('Tap play to start playback');
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
  // forcePlay is needed on 'ended': the browser fires 'pause' just before it,
  // so state.isPlaying is already false by then.
  function nextChapter(forcePlay) {
    const shouldPlay = forcePlay === true || state.isPlaying;
    const book = getCurrentBook();
    if (state.chapter < book.total_chapters) {
      state.chapter++;
      renderChapter();
      if (shouldPlay) playAudio();
      showToast(`${book.name_ta} ${state.chapter}`);
    } else if (state.bookId < 27) {
      state.bookId++;
      state.chapter = 1;
      const nextBook = getCurrentBook();
      renderChapter();
      if (shouldPlay) playAudio();
      showToast(`Next Book: ${nextBook.name_ta} 1`);
    }
  }

  function prevChapter() {
    const shouldPlay = state.isPlaying;
    if (state.chapter > 1) {
      state.chapter--;
      const book = getCurrentBook();
      renderChapter();
      if (shouldPlay) playAudio();
      showToast(`${book.name_ta} ${state.chapter}`);
    } else if (state.bookId > 1) {
      state.bookId--;
      const prevBook = getCurrentBook();
      state.chapter = prevBook.total_chapters;
      renderChapter();
      if (shouldPlay) playAudio();
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
    // Loop the verse being heard now; during the intro, loop verse 1
    const current = findVerseAt(el.audio.currentTime);
    state.loopVerseNum = state.repeatVerse
      ? (current ? current.verse : (state.activeVerseNum || 1))
      : null;
    if (el.btnRepeatVerse) el.btnRepeatVerse.classList.toggle('is-active', state.repeatVerse);
    showToast(state.repeatVerse ? 'Looping Current Verse' : 'Verse Looping Off');
  }

  // --- Volume & Mute ---
  const ICON_VOLUME = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
  const ICON_MUTED = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

  function isSilent() {
    return state.isMuted || state.volume === 0;
  }

  function setMuted(muted) {
    state.isMuted = muted;
    el.audio.muted = muted;
    // Unmuting with the slider at zero would still be silent, so restore volume
    if (!muted && state.volume === 0) {
      state.volume = 1;
      el.audio.volume = 1;
      if (el.volumeSlider) el.volumeSlider.value = 1;
    }
    updateMuteUI();
  }

  function toggleMute() {
    setMuted(!isSilent());
    showToast(isSilent() ? 'Muted' : 'Unmuted');
  }

  function updateMuteUI() {
    if (!el.btnMute) return;
    el.btnMute.innerHTML = isSilent() ? ICON_MUTED : ICON_VOLUME;
    el.btnMute.classList.toggle('is-active', isSilent());
  }

  function toggleRollMode() {
    state.rollMode = state.rollMode === 'steady' ? 'glide' : 'steady';
    updateRollModeUI();
    save('biblescroll_rollmode', state.rollMode);
    showToast(state.rollMode === 'steady' ? 'Mode: Steady Tempo Roll (YouTube Style)' : 'Mode: Audio-Synced Glide');
  }

  function setRollMode(mode) {
    state.rollMode = mode;
    updateRollModeUI();
    save('biblescroll_rollmode', mode);
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
    save('biblescroll_mode', mode);

    [el.btnModeTamil, el.btnModeEnglish, el.btnModeParallel].forEach((btn) => {
      if (btn) btn.classList.remove('is-active');
    });

    if (mode === 'tamil' && el.btnModeTamil) el.btnModeTamil.classList.add('is-active');
    if (mode === 'english' && el.btnModeEnglish) el.btnModeEnglish.classList.add('is-active');
    if (mode === 'parallel' && el.btnModeParallel) el.btnModeParallel.classList.add('is-active');

    scheduleOffsetCache();
  }

  function setViewMode(view, silent) {
    state.viewMode = view;
    document.body.dataset.view = view;
    save('biblescroll_view', view);

    if (el.btnViewScroll) el.btnViewScroll.classList.toggle('is-active', view === 'scroll');
    if (el.btnViewCards) el.btnViewCards.classList.toggle('is-active', view === 'cards');

    scheduleOffsetCache();
    if (!silent) showToast(view === 'scroll' ? 'Cinematic Scroll View' : 'Card Reader View');
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

        const tile = document.createElement('button');
        tile.type = 'button';
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
      const tile = document.createElement('button');
      tile.type = 'button';
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
      el.searchResults.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding:1.5rem;">No verses found matching "<strong>${escapeHtml(q)}</strong>"</div>`;
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
        seekToVerse(m.verse, true);
      });

      frag.appendChild(item);
    });

    el.searchResults.appendChild(frag);
  }

  // Returns HTML: both text and term are escaped before the <mark> is added
  function highlightTerm(text, term) {
    text = escapeHtml(text);
    if (!term) return text;
    term = escapeHtml(term);
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:var(--accent-glow); color:inherit; border-radius:2px; padding:0 2px;">$1</mark>');
  }

  // --- Themes & Appearance ---
  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    save('biblescroll_theme', theme);

    // Match the mobile browser chrome to the header color
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim());
    }

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
    save('biblescroll_font', state.fontSize);
    scheduleOffsetCache();
  }

  // --- Modal Helpers ---
  function openModal(modal) {
    if (modal) modal.classList.add('is-open');
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove('is-open');
  }

  function getOpenModal() {
    return document.querySelector('.modal-overlay.is-open');
  }

  // --- Keyboard Shortcuts ---
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      const openModalEl = getOpenModal();
      if (e.code === 'Escape' && openModalEl) {
        closeModal(openModalEl);
        return;
      }
      // Player shortcuts are off while a dialog is open or a field has focus
      if (openModalEl) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekBy(10);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekBy(-10);
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
          toggleMute();
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
        seekToVerse(state.loopVerseNum || state.activeVerseNum || 1, true);
      } else {
        const book = getCurrentBook();
        if (state.chapter < book.total_chapters || state.bookId < 27) {
          showToast(`Chapter completed. Rolling next chapter...`);
          nextChapter(true);
        } else {
          pauseAudio();
          showToast('You have completed the entire New Testament!');
        }
      }
    });

    // Detect User Manual Scroll in Viewport. touchmove rather than touchstart,
    // so tapping a verse doesn't pause the roll.
    if (el.scrollViewport) {
      el.scrollViewport.addEventListener('wheel', handleUserScroll, { passive: true });
      el.scrollViewport.addEventListener('touchmove', handleUserScroll, { passive: true });
      // Catches scrollbar drags, keyboard scrolling and touch momentum
      el.scrollViewport.addEventListener('scroll', () => {
        if (Math.abs(el.scrollViewport.scrollTop - lastProgrammaticScrollTop) > 2) {
          handleUserScroll();
        }
      }, { passive: true });
    }

    if (el.btnResumeRoll) {
      el.btnResumeRoll.addEventListener('click', () => {
        resumeAutoRoll();
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
    // Wrapped so the click event isn't passed as nextChapter's forcePlay argument
    if (el.btnPrevChapter) el.btnPrevChapter.addEventListener('click', () => prevChapter());
    if (el.btnNextChapter) el.btnNextChapter.addEventListener('click', () => nextChapter());
    if (el.btnRewind10) el.btnRewind10.addEventListener('click', () => seekBy(-10));
    if (el.btnForward10) el.btnForward10.addEventListener('click', () => seekBy(10));
    if (el.btnRepeatVerse) el.btnRepeatVerse.addEventListener('click', toggleRepeatVerse);
    if (el.btnScrollToggle) el.btnScrollToggle.addEventListener('click', toggleAutoRoll);
    if (el.btnSpeed) el.btnSpeed.addEventListener('click', cycleSpeed);

    // Outro Buttons
    if (el.btnOutroPrev) el.btnOutroPrev.addEventListener('click', () => prevChapter());
    if (el.btnOutroNext) el.btnOutroNext.addEventListener('click', () => nextChapter());
    if (el.btnOutroReplay) el.btnOutroReplay.addEventListener('click', () => {
      el.audio.currentTime = 0;
      resumeAutoRoll();
      setScroll(0);
      playAudio();
    });

    // Scrubber: tap or drag (mouse and touch). The bar previews while dragging;
    // the audio seeks once on release.
    if (el.playerProgressWrap) {
      const timeAtPointer = (e) => {
        const rect = el.playerProgressWrap.getBoundingClientRect();
        const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        const dur = el.audio.duration || getCurrentChapterData().duration;
        return { time: ratio * dur, dur };
      };

      el.playerProgressWrap.addEventListener('pointerdown', (e) => {
        state.isScrubbing = true;
        el.playerProgressWrap.classList.add('is-scrubbing');
        try {
          el.playerProgressWrap.setPointerCapture(e.pointerId);
        } catch (err) {
          // Pointer already released; the drag still works without capture
        }
        const { time, dur } = timeAtPointer(e);
        updateProgressUI(time, dur);
      });

      el.playerProgressWrap.addEventListener('pointermove', (e) => {
        if (!state.isScrubbing) return;
        const { time, dur } = timeAtPointer(e);
        updateProgressUI(time, dur);
      });

      const endScrub = (e, commit) => {
        if (!state.isScrubbing) return;
        state.isScrubbing = false;
        el.playerProgressWrap.classList.remove('is-scrubbing');
        if (!commit) return;
        const { time, dur } = timeAtPointer(e);
        if (dur > 0) {
          el.audio.currentTime = time;
          resumeAutoRoll();
          const target = computeTargetScroll(time);
          if (target !== null && state.autoRoll) setScroll(target);
        }
      };
      el.playerProgressWrap.addEventListener('pointerup', (e) => endScrub(e, true));
      el.playerProgressWrap.addEventListener('pointercancel', (e) => endScrub(e, false));
    }

    // Volume & Mute
    if (el.volumeSlider) {
      el.volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.volume = val;
        el.audio.volume = val;
        if (val > 0 && state.isMuted) {
          state.isMuted = false;
          el.audio.muted = false;
        }
        updateMuteUI();
      });
    }
    if (el.btnMute) el.btnMute.addEventListener('click', toggleMute);

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

    // Layout changes: window/viewport resizes (incl. mobile address bar),
    // verse text reflowing (web fonts loading, font size, display mode)
    window.addEventListener('resize', scheduleOffsetCache);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleOffsetCache);
    }
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(scheduleOffsetCache).observe(el.versesStream);

      // Keep toasts just above the player bar, whose height varies by screen size
      const playerBar = document.querySelector('.player-bar-container');
      if (playerBar) {
        new ResizeObserver(() => {
          document.documentElement.style.setProperty('--player-offset', `${playerBar.offsetHeight}px`);
        }).observe(playerBar);
      }
    }
  }

  // --- Manual Scroll Handling ---
  function handleUserScroll() {
    state.isUserScrolling = true;
    if (el.resumeRollBanner) el.resumeRollBanner.classList.add('is-visible');

    clearTimeout(state.userScrollTimer);
    state.userScrollTimer = setTimeout(resumeAutoRoll, 3500);
  }

  function resumeAutoRoll() {
    clearTimeout(state.userScrollTimer);
    state.isUserScrolling = false;
    if (el.resumeRollBanner) el.resumeRollBanner.classList.remove('is-visible');
  }

  // --- Bootstrap ---
  function init() {
    loadPersistedState();
    setTheme(state.theme);
    setFontSize(state.fontSize);
    setDisplayMode(state.displayMode);
    setViewMode(state.viewMode, true);
    updateRollModeUI();
    buildBookPicker();
    buildChapterPicker();
    renderChapter();
    setupSearch();
    setupKeyboardShortcuts();
    initEventListeners();
    setupMediaSession();
    updateMuteUI();
    startRollLoop();
    console.log('Bible Scroll App (Full New Testament Edition) initialized.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
