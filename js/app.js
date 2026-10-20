/**
 * Bible Scroll App - Version 2 (Cinematic Video Scroll Edition)
 * Continuous Smooth Rolling Scripture Reader synced with Tamil & English Audio
 */

(function () {
  'use strict';

  // --- State Configuration ---
  const state = {
    chapter: 1,
    activeVerseNum: null,
    isPlaying: false,
    viewMode: 'scroll',       // 'scroll' (Cinematic Roll) | 'cards' (Cards View)
    displayMode: 'tamil',     // 'tamil' | 'english' | 'parallel'
    audioTrack: 'ta',         // 'ta' (Tamil narration) | 'en' (English narration)
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
    
    // Header & Modals
    chapterSelectBtn: document.getElementById('chapterSelectBtn'),
    chapterSelectLabel: document.getElementById('chapterSelectLabel'),
    chapterModal: document.getElementById('chapterModal'),
    chapterGrid: document.getElementById('chapterGrid'),
    closeChapterModalBtn: document.getElementById('closeChapterModalBtn'),
    
    btnViewScroll: document.getElementById('btnViewScroll'),
    btnViewCards: document.getElementById('btnViewCards'),
    btnModeTamil: document.getElementById('btnModeTamil'),
    btnModeEnglish: document.getElementById('btnModeEnglish'),
    btnModeParallel: document.getElementById('btnModeParallel'),
    btnFullscreenToggle: document.getElementById('btnFullscreenToggle'),
    fullscreenIcon: document.getElementById('fullscreenIcon'),
    
    // Subheader Banner
    bannerAudioLabel: document.getElementById('bannerAudioLabel'),
    btnTrackTamil: document.getElementById('btnTrackTamil'),
    btnTrackEnglish: document.getElementById('btnTrackEnglish'),
    btnRollModeToggle: document.getElementById('btnRollModeToggle'),
    rollModeLabel: document.getElementById('rollModeLabel'),
    
    // Scroll Titles
    scrollTitleTa: document.getElementById('scrollTitleTa'),
    scrollSubTa: document.getElementById('scrollSubTa'),
    scrollTitleEn: document.getElementById('scrollTitleEn'),
    
    // Resume Roll Pill
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
    playerTrackNum: document.getElementById('playerTrackNum'),
    playerTrackTitle: document.getElementById('playerTrackTitle'),
    playerVersePill: document.getElementById('playerVersePill'),
    playerCurTime: document.getElementById('playerCurTime'),
    playerTotTime: document.getElementById('playerTotTime'),
    
    btnScrollToggle: document.getElementById('btnScrollToggle'),
    btnPrevVerse: document.getElementById('btnPrevVerse'),
    btnNextVerse: document.getElementById('btnNextVerse'),
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

  // --- Utilities ---
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

  // --- Storage ---
  function loadPersistedState() {
    try {
      const savedTheme = localStorage.getItem('biblescroll_theme');
      if (savedTheme) state.theme = savedTheme;

      const savedMode = localStorage.getItem('biblescroll_mode');
      if (savedMode) state.displayMode = savedMode;

      const savedTrack = localStorage.getItem('biblescroll_track');
      if (savedTrack) state.audioTrack = savedTrack;

      const savedRoll = localStorage.getItem('biblescroll_rollmode');
      if (savedRoll) state.rollMode = savedRoll;

      const savedView = localStorage.getItem('biblescroll_view');
      if (savedView) state.viewMode = savedView;

      const savedChapter = localStorage.getItem('biblescroll_ch');
      if (savedChapter && window.HEBREWS_DATA[savedChapter]) {
        state.chapter = parseInt(savedChapter, 10);
      }

      const savedFont = localStorage.getItem('biblescroll_font');
      if (savedFont) state.fontSize = parseInt(savedFont, 10);
    } catch (e) {
      console.warn('Storage read failed:', e);
    }
  }

  function getCurrentChapterData() {
    return window.HEBREWS_DATA[String(state.chapter)];
  }

  // --- Audio Track Setup ---
  function getAudioUrl() {
    const chData = getCurrentChapterData();
    if (!chData) return '';
    if (state.audioTrack === 'en') {
      return chData.audio_en_cdn;
    }
    return chData.audio_ta;
  }

  function setupAudio() {
    const audioUrl = getAudioUrl();
    const chData = getCurrentChapterData();

    el.audio.src = audioUrl;
    el.audio.playbackRate = state.playbackRate;
    el.audio.volume = state.volume;

    if (el.bannerAudioLabel) {
      el.bannerAudioLabel.textContent = state.audioTrack === 'ta'
        ? `Tamil Narration (WordProject) — Ch ${chData.chapter}`
        : `English Narration (KJV) — Ch ${chData.chapter}`;
    }

    // Audio error fallback
    el.audio.onerror = () => {
      console.warn('Local audio error, switching to CDN stream:', el.audio.src);
      if (state.audioTrack === 'ta' && el.audio.src !== chData.audio_ta_cdn) {
        el.audio.src = chData.audio_ta_cdn;
        if (state.isPlaying) el.audio.play().catch(console.error);
        if (el.bannerAudioLabel) el.bannerAudioLabel.textContent = `Tamil CDN Audio — Ch ${chData.chapter}`;
      }
    };
  }

  // --- Render Chapter Verses ---
  function renderChapter() {
    const chData = getCurrentChapterData();
    if (!chData) return;

    // Update Headers
    if (el.chapterSelectLabel) el.chapterSelectLabel.textContent = `Hebrews ${chData.chapter} (${chData.book_ta} ${chData.chapter})`;
    if (el.scrollTitleTa) el.scrollTitleTa.textContent = `எபிரெயர் ${chData.chapter}`;
    if (el.scrollSubTa) el.scrollSubTa.textContent = chData.title_ta;
    if (el.scrollTitleEn) el.scrollTitleEn.textContent = `Hebrews ${chData.chapter} — ${chData.title_en}`;
    
    // Player Meta
    if (el.playerTrackNum) el.playerTrackNum.textContent = `Heb ${chData.chapter}`;
    if (el.playerTrackTitle) el.playerTrackTitle.textContent = `${chData.book_ta} ${chData.chapter} - ${chData.title_ta}`;
    if (el.playerVersePill) el.playerVersePill.textContent = 'Verse 1';
    if (el.playerTotTime) el.playerTotTime.textContent = formatTime(chData.duration);

    // Prev / Next button states
    if (el.btnOutroPrev) el.btnOutroPrev.disabled = chData.chapter <= 1;
    if (el.btnOutroNext) el.btnOutroNext.disabled = chData.chapter >= 13;

    // Render Verse Roll Items
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

      // Clicking any verse seeks audio and scroll directly to it
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
    updateChapterPickerHighlight();
    localStorage.setItem('biblescroll_ch', state.chapter);

    // Recalculate verse offsets after DOM layout
    setTimeout(cacheVerseOffsets, 150);
  }

  // --- Cache Geometric Offsets for Continuous Interpolation ---
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
        // Calculate the scrollTop needed so the verse is centered in the reading zone (42% from top)
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

  // --- The Continuous Smooth Rolling Animation Engine ---
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
      // Steady Tempo Roll: continuous uniform rolling speed for the entire duration (YouTube video style)
      const chData = getCurrentChapterData();
      const intro = chData.intro_end || 6.5;
      const outro = dur - 2.0;

      if (curTime < intro) {
        targetScroll = 0;
      } else if (curTime >= outro) {
        targetScroll = maxScroll;
      } else {
        const progress = (curTime - intro) / (outro - intro);
        targetScroll = progress * maxScroll;
      }
    } else {
      // Audio-Synced Glide: Continuous piecewise interpolation through verse positions
      const offsets = state.verseOffsets;
      if (offsets.length > 0) {
        const first = offsets[0];
        const last = offsets[offsets.length - 1];

        if (curTime <= first.start) {
          targetScroll = 0;
        } else if (curTime >= last.end) {
          targetScroll = maxScroll;
        } else {
          // Find enclosing interval
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

    // Apply ultra-smooth exponential damping to glide gracefully without jitter
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
      // Loop verse feature
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

    // Remove previous active
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

  // --- Seek To Verse ---
  function seekToVerse(verseNum, andPlay = true) {
    const chData = getCurrentChapterData();
    const v = chData.verses.find((item) => item.verse === verseNum);
    if (!v) return;

    el.audio.currentTime = v.start;
    setActiveVerse(verseNum);

    // Instantly align scroll to verse
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

  function nextChapter() {
    if (state.chapter < 13) {
      state.chapter++;
      renderChapter();
      if (state.isPlaying) playAudio();
      showToast(`Chapter ${state.chapter} Loaded`);
    }
  }

  function prevChapter() {
    if (state.chapter > 1) {
      state.chapter--;
      renderChapter();
      if (state.isPlaying) playAudio();
      showToast(`Chapter ${state.chapter} Loaded`);
    }
  }

  function nextVerse() {
    const chData = getCurrentChapterData();
    const curIdx = state.activeVerseNum || 1;
    if (curIdx < chData.total_verses) {
      seekToVerse(curIdx + 1, true);
    } else if (state.chapter < 13) {
      nextChapter();
    }
  }

  function prevVerse() {
    const curIdx = state.activeVerseNum || 1;
    if (curIdx > 1) {
      seekToVerse(curIdx - 1, true);
    } else if (state.chapter > 1) {
      prevChapter();
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

  function setAudioTrack(track) {
    if (state.audioTrack === track) return;
    state.audioTrack = track;
    localStorage.setItem('biblescroll_track', track);

    [el.btnTrackTamil, el.btnTrackEnglish].forEach((btn) => {
      if (btn) btn.classList.remove('is-active');
    });

    if (track === 'ta' && el.btnTrackTamil) el.btnTrackTamil.classList.add('is-active');
    if (track === 'en' && el.btnTrackEnglish) el.btnTrackEnglish.classList.add('is-active');

    const curTime = el.audio.currentTime;
    const wasPlaying = state.isPlaying;

    setupAudio();
    el.audio.currentTime = curTime;
    if (wasPlaying) playAudio();

    showToast(track === 'ta' ? 'Audio: Tamil Narration (WordProject)' : 'Audio: English Narration (KJV)');
  }

  // --- Fullscreen Toggle ---
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        showToast('Fullscreen Mode (Press Esc to exit)');
      }).catch(console.warn);
    } else {
      document.exitFullscreen().catch(console.warn);
    }
  }

  // --- Chapter Picker Modal ---
  function buildChapterPicker() {
    if (!el.chapterGrid) return;
    el.chapterGrid.innerHTML = '';

    for (let c = 1; c <= 13; c++) {
      const data = window.HEBREWS_DATA[String(c)];
      const tile = document.createElement('div');
      tile.className = `chapter-tile ${c === state.chapter ? 'is-active' : ''}`;
      tile.innerHTML = `
        <div class="chapter-tile-num">${c}</div>
        <div class="chapter-tile-sub">${data ? data.title_ta.slice(0, 18) + '...' : ''}</div>
        <div style="font-size:0.7rem; color:var(--text-muted);">${data ? data.total_verses : 0} Verses</div>
      `;

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
    if (!el.chapterGrid) return;
    el.chapterGrid.querySelectorAll('.chapter-tile').forEach((tile, idx) => {
      tile.classList.toggle('is-active', idx + 1 === state.chapter);
    });
  }

  // --- Search Feature ---
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
      el.searchResults.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:1.5rem;">Enter at least 2 characters to search across all 13 chapters of Hebrews...</div>';
      return;
    }

    const matches = [];
    for (let c = 1; c <= 13; c++) {
      const chData = window.HEBREWS_DATA[String(c)];
      if (!chData) continue;
      chData.verses.forEach((v) => {
        const inTa = v.ta.toLowerCase().includes(q);
        const inEn = v.en.toLowerCase().includes(q);
        if (inTa || inEn) {
          matches.push({ chapter: c, verse: v.verse, ta: v.ta, en: v.en });
        }
      });
    }

    if (matches.length === 0) {
      el.searchResults.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding:1.5rem;">No verses found matching "<strong>${q}</strong>"</div>`;
      return;
    }

    el.searchResults.innerHTML = '';
    const frag = document.createDocumentFragment();

    matches.slice(0, 50).forEach((m) => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <div class="search-result-meta">
          <span>Hebrews ${m.chapter}:${m.verse}</span>
          <span>•</span>
          <span>எபிரெயர் ${m.chapter}:${m.verse}</span>
        </div>
        <div class="search-result-text">
          <div style="margin-bottom:3px;">${highlightTerm(m.ta, q)}</div>
          <div style="font-size:0.82rem; color:var(--text-secondary);">${highlightTerm(m.en, q)}</div>
        </div>
      `;

      item.addEventListener('click', () => {
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

  // --- Themes & Font Size ---
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
        case 'KeyJ':
          e.preventDefault();
          prevVerse();
          break;
        case 'KeyK':
          e.preventDefault();
          nextVerse();
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
      } else if (state.chapter < 13) {
        showToast(`Chapter ${state.chapter} completed. Rolling Chapter ${state.chapter + 1}...`);
        nextChapter();
      } else {
        pauseAudio();
        showToast('You have reached the end of Hebrews!');
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

    // Audio Track Switchers
    if (el.btnTrackTamil) el.btnTrackTamil.addEventListener('click', () => setAudioTrack('ta'));
    if (el.btnTrackEnglish) el.btnTrackEnglish.addEventListener('click', () => setAudioTrack('en'));

    // Roll Mode
    if (el.btnRollModeToggle) el.btnRollModeToggle.addEventListener('click', toggleRollMode);
    if (el.btnRollStyleSteady) el.btnRollStyleSteady.addEventListener('click', () => setRollMode('steady'));
    if (el.btnRollStyleGlide) el.btnRollStyleGlide.addEventListener('click', () => setRollMode('glide'));

    // Fullscreen
    if (el.btnFullscreenToggle) el.btnFullscreenToggle.addEventListener('click', toggleFullscreen);

    // Chapter Modal
    if (el.chapterSelectBtn) el.chapterSelectBtn.addEventListener('click', () => openModal(el.chapterModal));
    if (el.closeChapterModalBtn) el.closeChapterModalBtn.addEventListener('click', () => closeModal(el.chapterModal));
    if (el.chapterModal) {
      el.chapterModal.addEventListener('click', (e) => {
        if (e.target === el.chapterModal) closeModal(el.chapterModal);
      });
    }

    // Player Buttons
    if (el.btnPlayPause) el.btnPlayPause.addEventListener('click', togglePlayPause);
    if (el.btnPrevVerse) el.btnPrevVerse.addEventListener('click', prevVerse);
    if (el.btnNextVerse) el.btnNextVerse.addEventListener('click', nextVerse);
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

    // Window Resize -> recache offsets
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
    buildChapterPicker();
    renderChapter();
    setupSearch();
    setupKeyboardShortcuts();
    initEventListeners();
    startRollLoop();
    console.log('Bible Scroll App V2 initialized. Ready for continuous YouTube-style rolling.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
