/**
 * Bible Scroll App - Complete Holy Bible Edition (66 Books: 39 OT + 27 NT)
 * Continuous Smooth Rolling Scripture Reader (1,189 Chapters • 31,102 Verses)
 * Powered by Tamil Narration & English KJV Reference
 * Fully Optimized for Mobile View & Desktop (Touch Dragging, MediaSession, Reflow Observers)
 */

(function () {
  'use strict';

  // Global cache initialization
  window.BIBLE_CACHE = window.BIBLE_CACHE || {};
  window.registerBibleBook = function(id, data) {
    window.BIBLE_CACHE[String(id)] = data;
  };

  // --- SVG Icons ---
  const ICON_VOLUME = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
  const ICON_MUTED = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

  // --- State Configuration ---
  const state = {
    bookId: 1,                // 1 to 66 (1 = Genesis ... 66 = Revelation)
    chapter: 1,               // 1 to currentBook.chapters
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
    audioCdnBase: '',         // Optional custom CDN Base URL
    testamentFilter: 'all',   // 'all' | 'OT' | 'NT'
    bookSearchTerm: '',
    isUserScrolling: false,
    userScrollTimer: null,
    isScrubbing: false,
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
    bookSearchInput: document.getElementById('bookSearchInput'),
    tabTestamentAll: document.getElementById('tabTestamentAll'),
    tabTestamentOT: document.getElementById('tabTestamentOT'),
    tabTestamentNT: document.getElementById('tabTestamentNT'),
    
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
    cdnBaseInput: document.getElementById('cdnBaseInput'),
    
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

  // --- Metadata & Data Accessors ---
  function getManifestList() {
    return window.BIBLE_MANIFEST || [];
  }

  function getCurrentBookMeta() {
    const list = getManifestList();
    return list.find((b) => b.id === state.bookId) || list[0] || {
      id: 1,
      code: "GEN",
      name_en: "Genesis",
      name_ta: "ஆதியாகமம்",
      category: "Law",
      category_ta: "மோசேயின் ஆகமங்கள்",
      chapters: 50
    };
  }

  function getCurrentBookData() {
    return (window.BIBLE_CACHE && window.BIBLE_CACHE[String(state.bookId)]) || null;
  }

  function getCurrentChapterData() {
    const book = getCurrentBookData();
    if (!book || !book.chapters) return null;
    return book.chapters[String(state.chapter)] || book.chapters["1"] || null;
  }

  // --- Dynamic Book Loading ---
  function ensureBookLoaded(bookId, callback) {
    const strId = String(bookId);
    if (window.BIBLE_CACHE && window.BIBLE_CACHE[strId]) {
      callback(window.BIBLE_CACHE[strId]);
      return;
    }

    const pad = String(bookId).padStart(2, '0');
    const script = document.createElement('script');
    script.src = `data/books/b${pad}.js?v=3.1`;
    script.async = true;

    script.onload = () => {
      const loaded = window.BIBLE_CACHE && window.BIBLE_CACHE[strId];
      if (loaded) {
        callback(loaded);
      } else {
        console.error('Book payload missing in cache after load:', bookId);
        showToast('Error reading book data');
      }
    };

    script.onerror = () => {
      console.error('Failed to load book data script:', script.src);
      showToast(`Could not load data/books/b${pad}.js`);
    };

    document.head.appendChild(script);
  }

  // --- State Persistence & Validation ---
  const VALID = {
    theme: ['dark', 'light', 'sepia'],
    displayMode: ['tamil', 'english', 'parallel'],
    rollMode: ['steady', 'glide'],
    viewMode: ['scroll', 'cards']
  };

  function save(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
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
      if (savedBook) {
        const parsed = parseInt(savedBook, 10);
        if (parsed >= 1 && parsed <= 66) state.bookId = parsed;
      }

      const savedChapter = localStorage.getItem('biblescroll_ch');
      if (savedChapter) {
        state.chapter = parseInt(savedChapter, 10);
      }

      const savedFont = localStorage.getItem('biblescroll_font');
      if (savedFont) state.fontSize = parseInt(savedFont, 10);

      const savedCdn = localStorage.getItem('biblescroll_cdn');
      if (savedCdn) state.audioCdnBase = savedCdn;

      const savedGuide = localStorage.getItem('biblescroll_guide');
      if (savedGuide !== null) state.showFocalGuide = (savedGuide === 'true');
    } catch (e) {
      console.warn('Storage read warning:', e);
    }
  }

  // --- MediaSession Setup (Lockscreen & Mobile Notifications) ---
  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', playAudio);
      navigator.mediaSession.setActionHandler('pause', pauseAudio);
      navigator.mediaSession.setActionHandler('previoustrack', prevChapter);
      navigator.mediaSession.setActionHandler('nexttrack', nextChapter);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          el.audio.currentTime = details.seekTime;
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        el.audio.currentTime = Math.max(0, el.audio.currentTime - (details.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        el.audio.currentTime = Math.min((el.audio.duration || 9999), el.audio.currentTime + (details.seekOffset || 10));
      });
    } catch (err) {
      console.warn('MediaSession handler warning:', err);
    }
  }

  function updateMediaSessionMetadata() {
    if (!('mediaSession' in navigator)) return;
    const meta = getCurrentBookMeta();
    const chData = getCurrentChapterData();
    if (!chData) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${meta.name_ta} (${meta.name_en}) ${chData.chapter}`,
        artist: 'Tamil Audio Bible • தமிழ் வேதாகமம்',
        album: meta.testament === 'OT' ? 'Old Testament • பழைய ஏற்பாடு' : 'New Testament • புதிய ஏற்பாடு'
      });
    } catch (err) {}
  }

  // --- Audio Track Setup ---
  function setupAudio() {
    const chData = getCurrentChapterData();
    const meta = getCurrentBookMeta();
    if (!chData) return;

    let targetAudioUrl = chData.audio_url;
    if (state.audioCdnBase && state.audioCdnBase.trim() !== '') {
      const base = state.audioCdnBase.trim().replace(/\/+$/, '');
      targetAudioUrl = `${base}/${chData.audio_url}`;
    }

    el.audio.src = targetAudioUrl;
    el.audio.playbackRate = state.playbackRate;
    el.audio.volume = state.volume;

    const testamentLabel = meta.testament === 'OT' ? 'பழைய ஏற்பாடு • OT' : 'புதிய ஏற்பாடு • NT';
    if (el.bannerAudioLabel) {
      el.bannerAudioLabel.textContent = `Tamil Narration • ${meta.name_ta} (${meta.name_en}) ${chData.chapter} • ${testamentLabel}`;
    }

    updateMediaSessionMetadata();

    el.audio.onerror = () => {
      console.warn('Audio load error for:', el.audio.src);
      showToast('Audio loading, please check file/CDN connection');
    };
  }

  // --- Render Chapter Verses ---
  function renderChapter() {
    const meta = getCurrentBookMeta();
    
    // Ensure book is loaded
    ensureBookLoaded(state.bookId, (bookData) => {
      // Validate chapter bound
      if (state.chapter > meta.chapters) {
        state.chapter = meta.chapters;
      }
      if (state.chapter < 1) {
        state.chapter = 1;
      }

      const chData = bookData.chapters[String(state.chapter)] || bookData.chapters["1"];
      if (!chData) return;

      // Header Selectors
      if (el.bookSelectLabel) el.bookSelectLabel.textContent = `${meta.name_ta} • ${meta.name_en}`;
      if (el.chapterSelectLabel) el.chapterSelectLabel.textContent = `அதிகாரம் ${chData.chapter} (Ch ${chData.chapter})`;

      // Scroll Header
      if (el.scrollTitleTa) el.scrollTitleTa.textContent = `${meta.name_ta} ${chData.chapter}`;
      if (el.scrollSubTa) el.scrollSubTa.textContent = `${meta.category_ta} • ${meta.name_en} ${chData.chapter}`;
      if (el.scrollTitleEn) el.scrollTitleEn.textContent = `${meta.name_en} Chapter ${chData.chapter} (King James Version)`;

      // Player Track Meta
      if (el.playerTrackArt) el.playerTrackArt.textContent = meta.code || 'BIB';
      if (el.playerTrackTitle) el.playerTrackTitle.textContent = `${meta.name_ta} ${chData.chapter} — ${meta.name_en} ${chData.chapter}`;
      if (el.playerVersePill) el.playerVersePill.textContent = 'Verse 1';
      if (el.playerTotTime) el.playerTotTime.textContent = formatTime(chData.duration);

      // Prev / Next button states across 66 books
      const isFirstChapterOverall = (state.bookId === 1 && state.chapter === 1);
      const isLastChapterOverall = (state.bookId === 66 && state.chapter === meta.chapters);

      if (el.btnOutroPrev) el.btnOutroPrev.disabled = isFirstChapterOverall;
      if (el.btnOutroNext) el.btnOutroNext.disabled = isLastChapterOverall;
      if (el.btnPrevChapter) el.btnPrevChapter.disabled = isFirstChapterOverall;
      if (el.btnNextChapter) el.btnNextChapter.disabled = isLastChapterOverall;

      // Render Verses
      if (el.versesStream) {
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
      }

      // Reset scroll position
      setScroll(0);

      setupAudio();
      updateBookPickerHighlight();
      updateChapterPickerHighlight();

      save('biblescroll_book', state.bookId);
      save('biblescroll_ch', state.chapter);

      // Recalculate geometric offsets for smooth roll interpolation
      scheduleOffsetCache();
    });
  }

  // --- Cache Geometric Offsets for Continuous Rolling ---
  function cacheVerseOffsets() {
    if (!el.scrollViewport) return;
    const chData = getCurrentChapterData();
    if (!chData) return;

    const viewportRect = el.scrollViewport.getBoundingClientRect();
    const focalY = viewportRect.height * 0.40; // 40% height golden focal line

    state.verseOffsets = chData.verses.map((v) => {
      const node = document.getElementById(`verse-${v.verse}`);
      if (!node) return { verse: v.verse, top: 0, height: 50, targetY: 0 };

      const itemTopRelativeToViewport = node.offsetTop;
      const targetScrollTop = Math.max(0, itemTopRelativeToViewport - focalY);

      return {
        verse: v.verse,
        start: v.start,
        end: v.end,
        targetY: targetScrollTop,
        nodeHeight: node.offsetHeight
      };
    });
  }

  function scheduleOffsetCache() {
    setTimeout(cacheVerseOffsets, 100);
  }

  // --- Continuous Rolling Animation Engine (60fps requestAnimationFrame) ---
  let lastFrameTime = performance.now();

  function startRollLoop() {
    function rollStep(now) {
      if (state.isPlaying && state.autoRoll && !state.isUserScrolling && !state.isScrubbing && el.scrollViewport) {
        updateRollPosition(now);
      }
      lastFrameTime = now;
      requestAnimationFrame(rollStep);
    }
    requestAnimationFrame(rollStep);
  }

  function updateRollPosition(now) {
    const curTime = el.audio.currentTime;
    const dur = el.audio.duration || (getCurrentChapterData() ? getCurrentChapterData().duration : 0);
    if (!dur || dur <= 0) return;

    const maxScroll = el.scrollViewport.scrollHeight - el.scrollViewport.clientHeight;
    if (maxScroll <= 0) return;

    let targetScroll = 0;

    if (state.rollMode === 'steady') {
      // YouTube Mode: Linear constant tempo for the entire chapter
      const progress = Math.min(Math.max(curTime / dur, 0), 1);
      targetScroll = progress * maxScroll;
    } else {
      // Synced Glide: Proportional continuous glide between verses
      if (state.verseOffsets.length === 0) {
        targetScroll = (curTime / dur) * maxScroll;
      } else {
        const first = state.verseOffsets[0];
        const last = state.verseOffsets[state.verseOffsets.length - 1];

        if (curTime <= first.start) {
          const introProgress = Math.max(0, curTime / Math.max(first.start, 0.1));
          targetScroll = introProgress * first.targetY;
        } else if (curTime >= last.end) {
          const outroDuration = Math.max(dur - last.end, 1.0);
          const outroProgress = Math.min(Math.max((curTime - last.end) / outroDuration, 0), 1);
          targetScroll = last.targetY + outroProgress * (maxScroll - last.targetY);
        } else {
          let currIdx = 0;
          for (let i = 0; i < state.verseOffsets.length; i++) {
            if (curTime >= state.verseOffsets[i].start && curTime < state.verseOffsets[i].end) {
              currIdx = i;
              break;
            }
          }
          const curr = state.verseOffsets[currIdx];
          const next = state.verseOffsets[currIdx + 1] || curr;
          const verseDur = Math.max(curr.end - curr.start, 0.1);
          const verseProgress = Math.min(Math.max((curTime - curr.start) / verseDur, 0), 1);
          targetScroll = curr.targetY + verseProgress * (next.targetY - curr.targetY);
        }
      }
    }

    // Critical: Lerp for fluid camera-like rolling (no sudden jumps or stutter)
    const curScroll = el.scrollViewport.scrollTop;
    const diff = targetScroll - curScroll;
    if (Math.abs(diff) > 0.4) {
      setScroll(curScroll + diff * 0.12);
    }
  }

  // --- Active Verse Focus & Audio Time Updates ---
  function updateProgressUI(time, dur) {
    if (dur > 0 && el.playerProgressBar) {
      const pct = (time / dur) * 100;
      el.playerProgressBar.style.width = `${pct}%`;
    }
    if (el.playerCurTime) {
      el.playerCurTime.textContent = formatTime(time);
    }
  }

  function onAudioTimeUpdate() {
    if (state.isScrubbing) return;
    const curTime = el.audio.currentTime;
    const dur = el.audio.duration || (getCurrentChapterData() ? getCurrentChapterData().duration : 0);

    updateProgressUI(curTime, dur);

    // Buffered Bar
    if (el.audio.buffered && el.audio.buffered.length > 0 && el.playerBufferedBar) {
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
      if (state.activeVerseNum !== null && chData.verses.length > 0 && curTime < chData.verses[0].start) {
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
    if (!chData) return;
    const v = chData.verses.find((item) => item.verse === verseNum);
    if (!v) return;

    el.audio.currentTime = v.start;
    setActiveVerse(verseNum);

    const offset = state.verseOffsets.find((o) => o.verse === verseNum);
    if (offset && el.scrollViewport) {
      setScroll(offset.targetY);
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
      if (err.name !== 'AbortError') {
        console.warn('Playback notice:', err);
        showToast('Tap play to start audio narration');
      }
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
    const playIcons = document.querySelectorAll('.play-icon-shape');
    const pauseIcons = document.querySelectorAll('.pause-icon-shape');

    if (state.isPlaying) {
      playIcons.forEach((el) => (el.style.display = 'none'));
      pauseIcons.forEach((el) => (el.style.display = 'block'));
    } else {
      playIcons.forEach((el) => (el.style.display = 'block'));
      pauseIcons.forEach((el) => (el.style.display = 'none'));
    }
  }

  // --- Chapter Navigation Crossing All 66 Books ---
  function prevChapter() {
    if (state.chapter > 1) {
      state.chapter--;
      renderChapter();
      if (state.isPlaying) playAudio();
    } else if (state.bookId > 1) {
      state.bookId--;
      const prevMeta = getCurrentBookMeta();
      state.chapter = prevMeta.chapters;
      renderChapter();
      if (state.isPlaying) playAudio();
    }
  }

  function nextChapter() {
    const meta = getCurrentBookMeta();
    if (state.chapter < meta.chapters) {
      state.chapter++;
      renderChapter();
      if (state.isPlaying) playAudio();
    } else if (state.bookId < 66) {
      state.bookId++;
      state.chapter = 1;
      renderChapter();
      if (state.isPlaying) playAudio();
    }
  }

  function replayChapter() {
    el.audio.currentTime = 0;
    setScroll(0);
    clearActiveVerse();
    playAudio();
  }

  // --- Speed & Volume Controls ---
  function cycleSpeed() {
    const speeds = [0.75, 1.0, 1.25, 1.5];
    const idx = speeds.indexOf(state.playbackRate);
    const nextSpeed = speeds[(idx + 1) % speeds.length];
    state.playbackRate = nextSpeed;
    el.audio.playbackRate = nextSpeed;
    if (el.btnSpeed) el.btnSpeed.textContent = `${nextSpeed}x`;
    showToast(`Speed: ${nextSpeed}x`);
  }

  function isSilent() {
    return state.isMuted || state.volume === 0;
  }

  function setMuted(muted) {
    state.isMuted = muted;
    el.audio.muted = muted;
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

  function toggleRepeatVerse() {
    state.repeatVerse = !state.repeatVerse;
    if (el.btnRepeatVerse) {
      el.btnRepeatVerse.classList.toggle('is-active', state.repeatVerse);
    }
    showToast(state.repeatVerse ? 'Looping Active Verse' : 'Continuous Narration');
  }

  function toggleAutoRoll() {
    state.autoRoll = !state.autoRoll;
    if (el.btnScrollToggle) {
      el.btnScrollToggle.classList.toggle('is-active', state.autoRoll);
    }
    showToast(state.autoRoll ? 'Auto Rolling Enabled' : 'Auto Rolling Paused');
  }

  function toggleRollMode() {
    state.rollMode = state.rollMode === 'steady' ? 'glide' : 'steady';
    updateRollModeUI();
    save('biblescroll_rollmode', state.rollMode);
    showToast(state.rollMode === 'steady' ? 'Steady Tempo Roll Activated' : 'Audio-Synced Glide Activated');
  }

  function updateRollModeUI() {
    const isSteady = (state.rollMode === 'steady');
    if (el.rollModeLabel) {
      el.rollModeLabel.textContent = isSteady ? 'Steady Tempo Roll' : 'Synced Glide';
    }
    if (el.btnRollStyleSteady) {
      el.btnRollStyleSteady.classList.toggle('is-active', isSteady);
    }
    if (el.btnRollStyleGlide) {
      el.btnRollStyleGlide.classList.toggle('is-active', !isSteady);
    }
  }

  // --- Display & View Modes ---
  function setDisplayMode(mode) {
    state.displayMode = mode;
    document.body.setAttribute('data-mode', mode);

    if (el.btnModeTamil) el.btnModeTamil.classList.toggle('is-active', mode === 'tamil');
    if (el.btnModeEnglish) el.btnModeEnglish.classList.toggle('is-active', mode === 'english');
    if (el.btnModeParallel) el.btnModeParallel.classList.toggle('is-active', mode === 'parallel');

    save('biblescroll_mode', mode);
    scheduleOffsetCache();
  }

  function setViewMode(view) {
    state.viewMode = view;
    document.body.setAttribute('data-view', view);

    if (el.btnViewScroll) el.btnViewScroll.classList.toggle('is-active', view === 'scroll');
    if (el.btnViewCards) el.btnViewCards.classList.toggle('is-active', view === 'cards');

    save('biblescroll_view', view);
    scheduleOffsetCache();
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    if (el.btnThemeDark) el.btnThemeDark.classList.toggle('is-active', theme === 'dark');
    if (el.btnThemeLight) el.btnThemeLight.classList.toggle('is-active', theme === 'light');
    if (el.btnThemeSepia) el.btnThemeSepia.classList.toggle('is-active', theme === 'sepia');

    save('biblescroll_theme', theme);
  }

  function setFontSize(size) {
    state.fontSize = Math.min(Math.max(size, 16), 34);
    document.documentElement.style.setProperty('--font-size-base', `${state.fontSize}px`);
    if (el.fontSizeValue) el.fontSizeValue.textContent = `${state.fontSize}px`;

    save('biblescroll_font', state.fontSize);
    scheduleOffsetCache();
  }

  // --- Book Picker Modal (All 66 Holy Bible Books) ---
  function buildBookPicker() {
    if (!el.bookCategoryList) return;
    el.bookCategoryList.innerHTML = '';

    const list = getManifestList();
    if (list.length === 0) return;

    // Filter by testament and search term
    const term = state.bookSearchTerm.toLowerCase();
    const filtered = list.filter((b) => {
      const matchTestament = (state.testamentFilter === 'all') || (b.testament === state.testamentFilter);
      if (!matchTestament) return false;
      if (!term) return true;
      return b.name_ta.toLowerCase().includes(term) ||
             b.name_en.toLowerCase().includes(term) ||
             b.code.toLowerCase().includes(term);
    });

    if (filtered.length === 0) {
      el.bookCategoryList.innerHTML = `
        <div style="color:var(--text-muted); text-align:center; padding:2rem;">
          பொருத்தமான புத்தகங்கள் காணப்படவில்லை / No matching books found.
        </div>
      `;
      return;
    }

    // Group filtered books by category
    const categoriesMap = new Map();
    filtered.forEach((b) => {
      const catKey = `${b.testament}_${b.category}`;
      if (!categoriesMap.has(catKey)) {
        categoriesMap.set(catKey, {
          testament: b.testament,
          name_en: b.category,
          name_ta: b.category_ta,
          books: []
        });
      }
      categoriesMap.get(catKey).books.push(b);
    });

    categoriesMap.forEach((catGroup) => {
      const sec = document.createElement('section');
      sec.className = 'book-cat-section';

      const testamentBadge = catGroup.testament === 'OT' ? 'பழைய ஏற்பாடு (OT)' : 'புதிய ஏற்பாடு (NT)';
      sec.innerHTML = `
        <div class="book-cat-header">
          <span>${catGroup.name_ta}</span>
          <span style="font-weight:400; opacity:0.7;">• ${catGroup.name_en}</span>
          <span style="font-size:0.7rem; margin-left:auto; opacity:0.6; text-transform:none;">${testamentBadge}</span>
        </div>
        <div class="book-cat-grid"></div>
      `;

      const grid = sec.querySelector('.book-cat-grid');

      catGroup.books.forEach((b) => {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = `book-tile ${b.id === state.bookId ? 'is-active' : ''}`;
        tile.dataset.bookId = b.id;
        tile.innerHTML = `
          <div class="book-tile-ta">${b.name_ta}</div>
          <div class="book-tile-en">${b.name_en}</div>
          <div class="book-tile-meta">${b.chapters} Chapters • ${b.total_verses} Verses</div>
        `;

        tile.addEventListener('click', () => {
          state.bookId = b.id;
          state.chapter = 1;
          renderChapter();
          closeModal(el.bookModal);
          if (state.isPlaying) playAudio();
        });

        grid.appendChild(tile);
      });

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

    const meta = getCurrentBookMeta();
    if (!meta) return;

    for (let c = 1; c <= meta.chapters; c++) {
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

  // --- Quick Search Across Scripture ---
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
      el.searchResults.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:1.5rem;">Enter at least 2 characters to search (e.g. இயேசு, Jesus, விசுவாசம், faith, பலி, அன்பின்)...</div>';
      return;
    }

    const matches = [];

    // Search in currently loaded books in cache
    Object.keys(window.BIBLE_CACHE || {}).forEach((bId) => {
      const b = window.BIBLE_CACHE[bId];
      if (!b || !b.chapters) return;

      Object.keys(b.chapters).forEach((chId) => {
        const ch = b.chapters[chId];
        if (!ch || !ch.verses) return;

        ch.verses.forEach((v) => {
          const inTa = v.ta && v.ta.toLowerCase().includes(q);
          const inEn = v.en && v.en.toLowerCase().includes(q);
          if (inTa || inEn) {
            matches.push({
              bookId: b.id,
              bookNameTa: b.name_ta,
              bookNameEn: b.name_en,
              chapter: ch.chapter,
              verse: v.verse,
              ta: v.ta,
              en: v.en
            });
          }
        });
      });
    });

    if (matches.length === 0) {
      el.searchResults.innerHTML = `
        <div style="color:var(--text-muted); text-align:center; padding:1.5rem;">
          No matches found in currently loaded books for "<strong>${escapeHtml(q)}</strong>".
        </div>
      `;
      return;
    }

    el.searchResults.innerHTML = '';
    const slice = matches.slice(0, 50);

    slice.forEach((m) => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `
        <div class="search-item-ref">${escapeHtml(m.bookNameTa)} (${escapeHtml(m.bookNameEn)}) ${m.chapter}:${m.verse}</div>
        <div class="search-item-text">${escapeHtml(m.ta)}</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(m.en)}</div>
      `;

      item.addEventListener('click', () => {
        state.bookId = m.bookId;
        state.chapter = m.chapter;
        renderChapter();
        closeModal(el.searchModal);
        setTimeout(() => {
          seekToVerse(m.verse, true);
        }, 300);
      });

      el.searchResults.appendChild(item);
    });
  }

  // --- Modal Helpers ---
  function getOpenModal() {
    return document.querySelector('.modal-overlay.is-open');
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('is-open');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
  }

  // --- Keyboard Shortcuts ---
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      const openModalEl = getOpenModal();
      if (e.code === 'Escape' && openModalEl) {
        closeModal(openModalEl);
        return;
      }
      if (openModalEl) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          el.audio.currentTime = Math.max(0, el.audio.currentTime - 10);
          showToast('⏪ -10s');
          break;
        case 'ArrowRight':
          e.preventDefault();
          el.audio.currentTime = Math.min((el.audio.duration || 9999), el.audio.currentTime + 10);
          showToast('⏩ +10s');
          break;
        case 'BracketLeft':
          e.preventDefault();
          prevChapter();
          break;
        case 'BracketRight':
          e.preventDefault();
          nextChapter();
          break;
        case 'KeyL':
          toggleRepeatVerse();
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
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

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  // --- Manual Scroll Handling ---
  function handleUserScroll() {
    if (!state.isPlaying) return;
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

  // --- Attach All Event Listeners ---
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
      state.isPlaying = false;
      updatePlayPauseUI();
      // Auto-advance to next chapter and auto-play
      nextChapter();
      playAudio();
    });

    // Detect user manual scroll vs auto-roll
    if (el.scrollViewport) {
      el.scrollViewport.addEventListener('wheel', handleUserScroll, { passive: true });
      el.scrollViewport.addEventListener('touchmove', handleUserScroll, { passive: true });
      // Catches scrollbar drags, keyboard scrolling, and touch momentum
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

    // Scrubber: Tap or Drag (Mouse and Touch) with Pointer Capture
    if (el.playerProgressWrap) {
      const timeAtPointer = (e) => {
        const rect = el.playerProgressWrap.getBoundingClientRect();
        const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        const dur = el.audio.duration || (getCurrentChapterData() ? getCurrentChapterData().duration : 0);
        return { time: ratio * dur, dur };
      };

      el.playerProgressWrap.addEventListener('pointerdown', (e) => {
        state.isScrubbing = true;
        el.playerProgressWrap.classList.add('is-scrubbing');
        try {
          el.playerProgressWrap.setPointerCapture(e.pointerId);
        } catch (err) {}
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
        }
      };
      el.playerProgressWrap.addEventListener('pointerup', (e) => endScrub(e, true));
      el.playerProgressWrap.addEventListener('pointercancel', (e) => endScrub(e, false));
    }

    // Header Navigation
    if (el.bookSelectBtn) el.bookSelectBtn.addEventListener('click', () => openModal(el.bookModal));
    if (el.closeBookModalBtn) el.closeBookModalBtn.addEventListener('click', () => closeModal(el.bookModal));
    if (el.bookModal) {
      el.bookModal.addEventListener('click', (e) => {
        if (e.target === el.bookModal) closeModal(el.bookModal);
      });
    }

    // Book search filter in Book Modal
    if (el.bookSearchInput) {
      el.bookSearchInput.addEventListener('input', (e) => {
        state.bookSearchTerm = e.target.value.trim();
        buildBookPicker();
      });
    }

    // Testament Tabs in Book Modal
    if (el.tabTestamentAll) {
      el.tabTestamentAll.addEventListener('click', () => {
        state.testamentFilter = 'all';
        el.tabTestamentAll.classList.add('is-active');
        if (el.tabTestamentOT) el.tabTestamentOT.classList.remove('is-active');
        if (el.tabTestamentNT) el.tabTestamentNT.classList.remove('is-active');
        buildBookPicker();
      });
    }
    if (el.tabTestamentOT) {
      el.tabTestamentOT.addEventListener('click', () => {
        state.testamentFilter = 'OT';
        el.tabTestamentOT.classList.add('is-active');
        if (el.tabTestamentAll) el.tabTestamentAll.classList.remove('is-active');
        if (el.tabTestamentNT) el.tabTestamentNT.classList.remove('is-active');
        buildBookPicker();
      });
    }
    if (el.tabTestamentNT) {
      el.tabTestamentNT.addEventListener('click', () => {
        state.testamentFilter = 'NT';
        el.tabTestamentNT.classList.add('is-active');
        if (el.tabTestamentAll) el.tabTestamentAll.classList.remove('is-active');
        if (el.tabTestamentOT) el.tabTestamentOT.classList.remove('is-active');
        buildBookPicker();
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

    // View & Language Controls
    if (el.btnViewScroll) el.btnViewScroll.addEventListener('click', () => setViewMode('scroll'));
    if (el.btnViewCards) el.btnViewCards.addEventListener('click', () => setViewMode('cards'));
    if (el.btnModeTamil) el.btnModeTamil.addEventListener('click', () => setDisplayMode('tamil'));
    if (el.btnModeEnglish) el.btnModeEnglish.addEventListener('click', () => setDisplayMode('english'));
    if (el.btnModeParallel) el.btnModeParallel.addEventListener('click', () => setDisplayMode('parallel'));
    if (el.btnFullscreenToggle) el.btnFullscreenToggle.addEventListener('click', toggleFullscreen);
    if (el.btnRollModeToggle) el.btnRollModeToggle.addEventListener('click', toggleRollMode);

    // Player Bar Controls
    if (el.btnPlayPause) el.btnPlayPause.addEventListener('click', togglePlayPause);
    if (el.btnPrevChapter) el.btnPrevChapter.addEventListener('click', prevChapter);
    if (el.btnNextChapter) el.btnNextChapter.addEventListener('click', nextChapter);
    if (el.btnRewind10) el.btnRewind10.addEventListener('click', () => {
      el.audio.currentTime = Math.max(0, el.audio.currentTime - 10);
    });
    if (el.btnForward10) el.btnForward10.addEventListener('click', () => {
      el.audio.currentTime = Math.min((el.audio.duration || 9999), el.audio.currentTime + 10);
    });
    if (el.btnRepeatVerse) el.btnRepeatVerse.addEventListener('click', toggleRepeatVerse);
    if (el.btnScrollToggle) el.btnScrollToggle.addEventListener('click', toggleAutoRoll);
    if (el.btnSpeed) el.btnSpeed.addEventListener('click', cycleSpeed);
    if (el.btnMute) el.btnMute.addEventListener('click', toggleMute);

    // Volume Slider
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

    // Outro Buttons
    if (el.btnOutroPrev) el.btnOutroPrev.addEventListener('click', prevChapter);
    if (el.btnOutroReplay) el.btnOutroReplay.addEventListener('click', replayChapter);
    if (el.btnOutroNext) el.btnOutroNext.addEventListener('click', nextChapter);

    // Search Modal
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

    // Settings Modal
    if (el.btnSettingsOpen) el.btnSettingsOpen.addEventListener('click', () => {
      if (el.cdnBaseInput) el.cdnBaseInput.value = state.audioCdnBase || '';
      openModal(el.settingsModal);
    });
    if (el.closeSettingsModalBtn) el.closeSettingsModalBtn.addEventListener('click', () => closeModal(el.settingsModal));
    if (el.settingsModal) {
      el.settingsModal.addEventListener('click', (e) => {
        if (e.target === el.settingsModal) closeModal(el.settingsModal);
      });
    }

    if (el.cdnBaseInput) {
      el.cdnBaseInput.addEventListener('change', (e) => {
        state.audioCdnBase = e.target.value.trim();
        save('biblescroll_cdn', state.audioCdnBase);
        setupAudio();
        showToast('Audio source updated');
      });
    }

    if (el.btnRollStyleSteady) el.btnRollStyleSteady.addEventListener('click', () => {
      state.rollMode = 'steady';
      updateRollModeUI();
      save('biblescroll_rollmode', 'steady');
    });
    if (el.btnRollStyleGlide) el.btnRollStyleGlide.addEventListener('click', () => {
      state.rollMode = 'glide';
      updateRollModeUI();
      save('biblescroll_rollmode', 'glide');
    });

    if (el.btnThemeDark) el.btnThemeDark.addEventListener('click', () => setTheme('dark'));
    if (el.btnThemeLight) el.btnThemeLight.addEventListener('click', () => setTheme('light'));
    if (el.btnThemeSepia) el.btnThemeSepia.addEventListener('click', () => setTheme('sepia'));

    if (el.btnFontDec) el.btnFontDec.addEventListener('click', () => setFontSize(state.fontSize - 1));
    if (el.btnFontInc) el.btnFontInc.addEventListener('click', () => setFontSize(state.fontSize + 1));

    if (el.toggleFocalGuideSwitch) {
      el.toggleFocalGuideSwitch.checked = state.showFocalGuide;
      el.toggleFocalGuideSwitch.addEventListener('change', (e) => {
        state.showFocalGuide = e.target.checked;
        if (el.focalReadingGuide) el.focalReadingGuide.classList.toggle('is-visible', state.showFocalGuide);
        save('biblescroll_guide', state.showFocalGuide);
      });
      if (el.focalReadingGuide) el.focalReadingGuide.classList.toggle('is-visible', state.showFocalGuide);
    }

    // Dynamic Layout Reflow Observers
    window.addEventListener('resize', scheduleOffsetCache);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleOffsetCache);
    }
    if (typeof ResizeObserver !== 'undefined' && el.versesStream) {
      new ResizeObserver(scheduleOffsetCache).observe(el.versesStream);

      const playerBar = document.querySelector('.player-bar-container');
      if (playerBar) {
        new ResizeObserver(() => {
          document.documentElement.style.setProperty('--player-offset', `${playerBar.offsetHeight}px`);
        }).observe(playerBar);
      }
    }
  }

  // --- Bootstrap Engine ---
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
    setupMediaSession();
    updateMuteUI();
    startRollLoop();
    console.log('Bible Scroll App (Complete 66 Books Edition) successfully initialized.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
