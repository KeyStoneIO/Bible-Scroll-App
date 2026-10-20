/**
 * Tamil Hebrews Audiobook WebApp
 * Complete Interactive Audio-Synced Reader
 * Compatible with GitHub Pages, Mobile & Desktop
 */

(function () {
  'use strict';

  // --- State ---
  const state = {
    chapter: 1,
    activeVerseNum: null,
    isPlaying: false,
    displayMode: 'tamil', // 'tamil' | 'english' | 'parallel'
    audioTrack: 'ta',     // 'ta' (Tamil narration) | 'en' (English narration)
    playbackRate: 1.0,
    volume: 1.0,
    isMuted: false,
    autoScroll: true,
    repeatVerse: false,
    theme: 'dark',
    fontSize: 18,
    bookmarks: [],
    searchQuery: '',
    isUserScrolling: false
  };

  // --- DOM Elements ---
  const el = {
    audio: new Audio(),
    versesStream: document.getElementById('versesStream'),
    chapterSelectBtn: document.getElementById('chapterSelectBtn'),
    chapterSelectLabel: document.getElementById('chapterSelectLabel'),
    chapterModal: document.getElementById('chapterModal'),
    chapterGrid: document.getElementById('chapterGrid'),
    closeChapterModalBtn: document.getElementById('closeChapterModalBtn'),
    
    // Mode Buttons
    btnModeTamil: document.getElementById('btnModeTamil'),
    btnModeEnglish: document.getElementById('btnModeEnglish'),
    btnModeParallel: document.getElementById('btnModeParallel'),
    
    // Audio Track Switchers
    btnTrackTamil: document.getElementById('btnTrackTamil'),
    btnTrackEnglish: document.getElementById('btnTrackEnglish'),
    audioTrackBanner: document.getElementById('audioTrackBanner'),
    
    // Hero Elements
    heroChapterBadge: document.getElementById('heroChapterBadge'),
    heroTitleTa: document.getElementById('heroTitleTa'),
    heroTitleEn: document.getElementById('heroTitleEn'),
    heroVerseCount: document.getElementById('heroVerseCount'),
    heroDuration: document.getElementById('heroDuration'),
    heroPlayBtn: document.getElementById('heroPlayBtn'),
    heroPrevBtn: document.getElementById('heroPrevBtn'),
    heroNextBtn: document.getElementById('heroNextBtn'),
    audioSourceDot: document.getElementById('audioSourceDot'),
    audioSourceText: document.getElementById('audioSourceText'),
    
    // Player Bar
    playerProgressWrap: document.getElementById('playerProgressWrap'),
    playerProgressBar: document.getElementById('playerProgressBar'),
    playerBufferedBar: document.getElementById('playerBufferedBar'),
    playerTrackNum: document.getElementById('playerTrackNum'),
    playerTrackTitle: document.getElementById('playerTrackTitle'),
    playerVersePill: document.getElementById('playerVersePill'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    btnPrevVerse: document.getElementById('btnPrevVerse'),
    btnNextVerse: document.getElementById('btnNextVerse'),
    btnRewind10: document.getElementById('btnRewind10'),
    btnForward10: document.getElementById('btnForward10'),
    btnRepeatVerse: document.getElementById('btnRepeatVerse'),
    btnAutoScroll: document.getElementById('btnAutoScroll'),
    btnSpeed: document.getElementById('btnSpeed'),
    btnMute: document.getElementById('btnMute'),
    volumeSlider: document.getElementById('volumeSlider'),
    playerCurTime: document.getElementById('playerCurTime'),
    playerTotTime: document.getElementById('playerTotTime'),
    
    // Modals & Panels
    btnSearchOpen: document.getElementById('btnSearchOpen'),
    searchModal: document.getElementById('searchModal'),
    closeSearchModalBtn: document.getElementById('closeSearchModalBtn'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    
    btnBookmarksOpen: document.getElementById('btnBookmarksOpen'),
    bookmarksModal: document.getElementById('bookmarksModal'),
    closeBookmarksModalBtn: document.getElementById('closeBookmarksModalBtn'),
    bookmarksList: document.getElementById('bookmarksList'),
    
    btnSettingsOpen: document.getElementById('btnSettingsOpen'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
    btnThemeDark: document.getElementById('btnThemeDark'),
    btnThemeLight: document.getElementById('btnThemeLight'),
    btnThemeSepia: document.getElementById('btnThemeSepia'),
    btnFontDec: document.getElementById('btnFontDec'),
    btnFontInc: document.getElementById('btnFontInc'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    toggleAutoScrollSwitch: document.getElementById('toggleAutoScrollSwitch'),
    
    toast: document.getElementById('toastNotice')
  };

  // --- Helper Functions ---
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
      const savedTheme = localStorage.getItem('hebrews_theme');
      if (savedTheme) state.theme = savedTheme;

      const savedMode = localStorage.getItem('hebrews_mode');
      if (savedMode) state.displayMode = savedMode;

      const savedTrack = localStorage.getItem('hebrews_track');
      if (savedTrack) state.audioTrack = savedTrack;

      const savedChapter = localStorage.getItem('hebrews_ch');
      if (savedChapter && window.HEBREWS_DATA[savedChapter]) {
        state.chapter = parseInt(savedChapter, 10);
      }

      const savedScroll = localStorage.getItem('hebrews_autoscroll');
      if (savedScroll !== null) state.autoScroll = savedScroll === 'true';

      const savedFont = localStorage.getItem('hebrews_fontsize');
      if (savedFont) state.fontSize = parseInt(savedFont, 10);

      const savedBookmarks = localStorage.getItem('hebrews_bookmarks');
      if (savedBookmarks) state.bookmarks = JSON.parse(savedBookmarks);
    } catch (e) {
      console.warn('Storage read warning:', e);
    }
  }

  function saveBookmarks() {
    try {
      localStorage.setItem('hebrews_bookmarks', JSON.stringify(state.bookmarks));
    } catch (e) {
      console.warn('Bookmark save failed:', e);
    }
  }

  // --- Audio Loading & Sources ---
  function getCurrentChapterData() {
    return window.HEBREWS_DATA[String(state.chapter)];
  }

  function getAudioUrl() {
    const chData = getCurrentChapterData();
    if (!chData) return '';
    
    if (state.audioTrack === 'en') {
      return chData.audio_en_cdn;
    }
    
    // For Tamil, use local path first, fallback to CDN handled on error
    return chData.audio_ta;
  }

  function setupAudio() {
    const audioUrl = getAudioUrl();
    const chData = getCurrentChapterData();
    
    el.audio.src = audioUrl;
    el.audio.playbackRate = state.playbackRate;
    el.audio.volume = state.volume;

    if (el.audioSourceText) {
      el.audioSourceText.textContent = state.audioTrack === 'ta' ? 'Tamil Audio (WordProject)' : 'English Audio (KJV)';
    }

    // Audio error fallback: if local audio fails, try CDN
    el.audio.onerror = () => {
      console.warn('Audio load error for:', el.audio.src);
      if (state.audioTrack === 'ta' && el.audio.src !== chData.audio_ta_cdn) {
        console.log('Falling back to Tamil CDN audio:', chData.audio_ta_cdn);
        el.audio.src = chData.audio_ta_cdn;
        if (state.isPlaying) el.audio.play().catch(console.error);
        if (el.audioSourceText) el.audioSourceText.textContent = 'Tamil CDN Stream';
      }
    };
  }

  // --- Render Chapter UI ---
  function renderChapter() {
    const chData = getCurrentChapterData();
    if (!chData) return;

    // Header & Meta
    if (el.chapterSelectLabel) el.chapterSelectLabel.textContent = `Hebrews ${chData.chapter} (${chData.book_ta} ${chData.chapter})`;
    if (el.heroChapterBadge) el.heroChapterBadge.textContent = `Hebrews / எபிரெயர் ${chData.chapter}`;
    if (el.heroTitleTa) el.heroTitleTa.textContent = chData.title_ta;
    if (el.heroTitleEn) el.heroTitleEn.textContent = chData.title_en;
    if (el.heroVerseCount) el.heroVerseCount.textContent = `${chData.total_verses} Verses`;
    if (el.heroDuration) el.heroDuration.textContent = `${Math.round(chData.duration / 60)} min (${formatTime(chData.duration)})`;

    // Player Track Meta
    if (el.playerTrackNum) el.playerTrackNum.textContent = `Heb ${chData.chapter}`;
    if (el.playerTrackTitle) el.playerTrackTitle.textContent = `${chData.book_ta} ${chData.chapter} - ${chData.title_ta}`;
    if (el.playerVersePill) el.playerVersePill.textContent = 'Verse 1';
    if (el.playerTotTime) el.playerTotTime.textContent = formatTime(chData.duration);

    // Prev / Next button states
    if (el.heroPrevBtn) el.heroPrevBtn.disabled = chData.chapter <= 1;
    if (el.heroNextBtn) el.heroNextBtn.disabled = chData.chapter >= 13;

    // Render Verses
    el.versesStream.innerHTML = '';
    const fragment = document.createDocumentFragment();

    chData.verses.forEach((v) => {
      const card = document.createElement('article');
      card.className = 'verse-card';
      card.id = `verse-${v.verse}`;
      card.dataset.verse = v.verse;
      card.dataset.start = v.start;
      card.dataset.end = v.end;

      const isBookmarked = state.bookmarks.some((b) => b.chapter === chData.chapter && b.verse === v.verse);

      card.innerHTML = `
        <div class="verse-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="verse-num-badge">${v.verse}</span>
            <button class="play-verse-btn" title="Play from verse ${v.verse}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Play
            </button>
            <div class="active-wave-indicator" aria-hidden="true">
              <span class="active-wave-bar"></span>
              <span class="active-wave-bar"></span>
              <span class="active-wave-bar"></span>
            </div>
          </div>
          <div class="verse-card-actions">
            <button class="verse-action-btn btn-repeat-single" title="Repeat only this verse">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 1l4 4-4 4"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <path d="M7 23l-4-4 4-4"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
            </button>
            <button class="verse-action-btn btn-bookmark ${isBookmarked ? 'is-bookmarked' : ''}" title="Bookmark verse">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <button class="verse-action-btn btn-copy" title="Copy verse text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="verse-content">
          <div class="verse-text-ta">${v.ta}</div>
          <div class="verse-text-en">${v.en}</div>
        </div>
      `;

      // Click card to jump audio to verse
      card.addEventListener('click', (e) => {
        // Prevent if clicked action button
        if (e.target.closest('.verse-card-actions')) return;
        seekToVerse(v.verse, true);
      });

      // Actions inside card
      const bookmarkBtn = card.querySelector('.btn-bookmark');
      bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBookmark(chData.chapter, v.verse, v.ta, v.en);
        const nowBookmarked = state.bookmarks.some((b) => b.chapter === chData.chapter && b.verse === v.verse);
        bookmarkBtn.classList.toggle('is-bookmarked', nowBookmarked);
        bookmarkBtn.querySelector('svg').setAttribute('fill', nowBookmarked ? 'currentColor' : 'none');
      });

      const copyBtn = card.querySelector('.btn-copy');
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyVerseText(chData.chapter, v.verse, v.ta, v.en);
      });

      const repeatSingleBtn = card.querySelector('.btn-repeat-single');
      repeatSingleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        seekToVerse(v.verse, true);
        state.repeatVerse = true;
        updatePlayerControls();
        showToast(`Looping Verse ${v.verse}`);
      });

      fragment.appendChild(card);
    });

    el.versesStream.appendChild(fragment);

    // Prepare audio track
    setupAudio();
    updateChapterPickerHighlight();
    localStorage.setItem('hebrews_ch', state.chapter);
  }

  // --- Verse Syncing Engine ---
  function findActiveVerse(time) {
    const chData = getCurrentChapterData();
    if (!chData || !chData.verses.length) return null;

    // Check before verse 1 (intro announcement)
    if (time < chData.verses[0].start) {
      return null;
    }

    // Binary search for matching verse
    let low = 0;
    let high = chData.verses.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const v = chData.verses[mid];
      if (time >= v.start && time < v.end) {
        return v;
      }
      if (time < v.start) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    // If beyond last verse end
    const last = chData.verses[chData.verses.length - 1];
    if (time >= last.start) return last;

    return null;
  }

  function onAudioTimeUpdate() {
    const curTime = el.audio.currentTime;
    const dur = el.audio.duration || getCurrentChapterData().duration;

    // Progress bar
    if (dur > 0 && el.playerProgressBar) {
      const pct = (curTime / dur) * 100;
      el.playerProgressBar.style.width = `${pct}%`;
    }

    if (el.playerCurTime) {
      el.playerCurTime.textContent = formatTime(curTime);
    }

    // Buffered progress
    if (el.audio.buffered.length > 0 && el.playerBufferedBar) {
      const bufferedEnd = el.audio.buffered.end(el.audio.buffered.length - 1);
      const bufPct = (bufferedEnd / dur) * 100;
      el.playerBufferedBar.style.width = `${Math.min(bufPct, 100)}%`;
    }

    // Verse sync detection
    const activeVerse = findActiveVerse(curTime);

    if (activeVerse) {
      // Loop verse logic
      if (state.repeatVerse && curTime >= activeVerse.end - 0.25) {
        el.audio.currentTime = activeVerse.start;
        return;
      }

      if (state.activeVerseNum !== activeVerse.verse) {
        setActiveVerseCard(activeVerse.verse);
      }
    } else {
      if (state.activeVerseNum !== null) {
        // Intro reading or transition
        clearActiveVerseCard();
      }
      if (el.playerVersePill) {
        el.playerVersePill.textContent = 'Intro Announcement';
      }
    }
  }

  function setActiveVerseCard(verseNum) {
    state.activeVerseNum = verseNum;

    // Clear previous active card
    document.querySelectorAll('.verse-card.is-active').forEach((card) => {
      card.classList.remove('is-active');
    });

    const activeCard = document.getElementById(`verse-${verseNum}`);
    if (activeCard) {
      activeCard.classList.add('is-active');

      if (el.playerVersePill) {
        el.playerVersePill.textContent = `Verse ${verseNum}`;
      }

      // Smooth auto-scroll if enabled and user isn't currently scrolling manually
      if (state.autoScroll && !state.isUserScrolling) {
        activeCard.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }

  function clearActiveVerseCard() {
    state.activeVerseNum = null;
    document.querySelectorAll('.verse-card.is-active').forEach((card) => {
      card.classList.remove('is-active');
    });
  }

  function seekToVerse(verseNum, andPlay = true) {
    const chData = getCurrentChapterData();
    const v = chData.verses.find((item) => item.verse === verseNum);
    if (!v) return;

    el.audio.currentTime = v.start;
    setActiveVerseCard(verseNum);

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
    const playIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    const pauseIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    if (el.btnPlayPause) {
      el.btnPlayPause.innerHTML = state.isPlaying ? pauseIcon : playIcon;
      el.btnPlayPause.setAttribute('title', state.isPlaying ? 'Pause (Space)' : 'Play (Space)');
    }

    if (el.heroPlayBtn) {
      el.heroPlayBtn.innerHTML = state.isPlaying
        ? `${pauseIcon} Pause Chapter`
        : `${playIcon} Play Chapter from Start`;
    }
  }

  function nextChapter() {
    if (state.chapter < 13) {
      state.chapter++;
      renderChapter();
      if (state.isPlaying) playAudio();
    }
  }

  function prevChapter() {
    if (state.chapter > 1) {
      state.chapter--;
      renderChapter();
      if (state.isPlaying) playAudio();
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
    updatePlayerControls();
    showToast(state.repeatVerse ? 'Looping current verse ON' : 'Verse loop OFF');
  }

  function toggleAutoScroll() {
    state.autoScroll = !state.autoScroll;
    updatePlayerControls();
    localStorage.setItem('hebrews_autoscroll', state.autoScroll);
    showToast(state.autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF');
  }

  function updatePlayerControls() {
    if (el.btnRepeatVerse) {
      el.btnRepeatVerse.classList.toggle('is-active', state.repeatVerse);
    }
    if (el.btnAutoScroll) {
      el.btnAutoScroll.classList.toggle('is-active', state.autoScroll);
    }
    if (el.toggleAutoScrollSwitch) {
      el.toggleAutoScrollSwitch.checked = state.autoScroll;
    }
  }

  // --- Display Mode & Audio Track Management ---
  function setDisplayMode(mode) {
    state.displayMode = mode;
    document.body.dataset.mode = mode;
    localStorage.setItem('hebrews_mode', mode);

    [el.btnModeTamil, el.btnModeEnglish, el.btnModeParallel].forEach((btn) => {
      if (btn) btn.classList.remove('is-active');
    });

    if (mode === 'tamil' && el.btnModeTamil) el.btnModeTamil.classList.add('is-active');
    if (mode === 'english' && el.btnModeEnglish) el.btnModeEnglish.classList.add('is-active');
    if (mode === 'parallel' && el.btnModeParallel) el.btnModeParallel.classList.add('is-active');

    // Update banner message
    if (el.audioTrackBanner) {
      let desc = '';
      if (mode === 'tamil') desc = 'Displaying Tamil Scriptures with synchronized audio reading.';
      if (mode === 'english') desc = 'Displaying English Scriptures (KJV). You can use the Tamil audio narration simultaneously!';
      if (mode === 'parallel') desc = 'Bilingual Mode: Tamil & English side-by-side with synchronized audio.';
      const descEl = el.audioTrackBanner.querySelector('.mode-explanation-text span');
      if (descEl) descEl.textContent = desc;
    }
  }

  function setAudioTrack(track) {
    if (state.audioTrack === track) return;
    state.audioTrack = track;
    localStorage.setItem('hebrews_track', track);

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
          matches.push({ chapter: c, verse: v.verse, ta: v.ta, en: v.en, inTa, inEn });
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

  // --- Bookmarks Feature ---
  function toggleBookmark(chapter, verse, ta, en) {
    const idx = state.bookmarks.findIndex((b) => b.chapter === chapter && b.verse === verse);
    if (idx !== -1) {
      state.bookmarks.splice(idx, 1);
      showToast(`Removed Bookmark: Hebrews ${chapter}:${verse}`);
    } else {
      state.bookmarks.push({ chapter, verse, ta, en, date: new Date().toLocaleDateString() });
      showToast(`Saved Bookmark: Hebrews ${chapter}:${verse}`);
    }
    saveBookmarks();
  }

  function renderBookmarksList() {
    if (!el.bookmarksList) return;
    if (state.bookmarks.length === 0) {
      el.bookmarksList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:1.5rem;">No bookmarked verses yet. Click the bookmark icon on any verse card to save it here!</div>';
      return;
    }

    el.bookmarksList.innerHTML = '';
    const frag = document.createDocumentFragment();

    state.bookmarks.forEach((b) => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="search-result-meta">Hebrews ${b.chapter}:${b.verse} • எபிரெயர் ${b.chapter}:${b.verse}</div>
          <button class="verse-action-btn btn-del-bm" title="Delete Bookmark" style="color:var(--text-muted);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="search-result-text" style="margin-top:4px;">
          <div>${b.ta}</div>
          <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:2px;">${b.en}</div>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-del-bm')) {
          e.stopPropagation();
          toggleBookmark(b.chapter, b.verse, b.ta, b.en);
          renderBookmarksList();
          renderChapter();
          return;
        }
        state.chapter = b.chapter;
        renderChapter();
        closeModal(el.bookmarksModal);
        setTimeout(() => {
          seekToVerse(b.verse, true);
        }, 150);
      });

      frag.appendChild(item);
    });

    el.bookmarksList.appendChild(frag);
  }

  // --- Copy Verse ---
  function copyVerseText(chapter, verse, ta, en) {
    const text = `எபிரெயர் ${chapter}:${verse} - ${ta}\nHebrews ${chapter}:${verse} - ${en}`;
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Copied Hebrews ${chapter}:${verse} to clipboard!`);
    }).catch(() => {
      showToast('Copy failed, please copy manually');
    });
  }

  // --- Theme & Appearance ---
  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hebrews_theme', theme);

    [el.btnThemeDark, el.btnThemeLight, el.btnThemeSepia].forEach((btn) => {
      if (btn) btn.classList.remove('is-active');
    });

    if (theme === 'dark' && el.btnThemeDark) el.btnThemeDark.classList.add('is-active');
    if (theme === 'light' && el.btnThemeLight) el.btnThemeLight.classList.add('is-active');
    if (theme === 'sepia' && el.btnThemeSepia) el.btnThemeSepia.classList.add('is-active');
  }

  function setFontSize(size) {
    state.fontSize = Math.min(Math.max(size, 14), 28);
    document.documentElement.style.setProperty('--font-size-base', `${state.fontSize}px`);
    if (el.fontSizeValue) el.fontSizeValue.textContent = `${state.fontSize}px`;
    localStorage.setItem('hebrews_fontsize', state.fontSize);
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
      // Don't intercept when user is typing in search input
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
        showToast(`Chapter ${state.chapter} completed. Playing Chapter ${state.chapter + 1}...`);
        nextChapter();
      } else {
        pauseAudio();
        showToast('You have completed the Book of Hebrews!');
      }
    });

    // Detect user manual scroll to temporarily pause auto-scroll fighting
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      state.isUserScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        state.isUserScrolling = false;
      }, 1800);
    }, { passive: true });

    // Mode Buttons
    if (el.btnModeTamil) el.btnModeTamil.addEventListener('click', () => setDisplayMode('tamil'));
    if (el.btnModeEnglish) el.btnModeEnglish.addEventListener('click', () => setDisplayMode('english'));
    if (el.btnModeParallel) el.btnModeParallel.addEventListener('click', () => setDisplayMode('parallel'));

    // Audio Track Switchers
    if (el.btnTrackTamil) el.btnTrackTamil.addEventListener('click', () => setAudioTrack('ta'));
    if (el.btnTrackEnglish) el.btnTrackEnglish.addEventListener('click', () => setAudioTrack('en'));

    // Chapter Modal
    if (el.chapterSelectBtn) el.chapterSelectBtn.addEventListener('click', () => openModal(el.chapterModal));
    if (el.closeChapterModalBtn) el.closeChapterModalBtn.addEventListener('click', () => closeModal(el.chapterModal));
    if (el.chapterModal) {
      el.chapterModal.addEventListener('click', (e) => {
        if (e.target === el.chapterModal) closeModal(el.chapterModal);
      });
    }

    // Hero Buttons
    if (el.heroPlayBtn) el.heroPlayBtn.addEventListener('click', () => {
      if (el.audio.paused) {
        if (el.audio.currentTime > 5 && !confirm('Play from beginning of chapter?')) {
          playAudio();
          return;
        }
        el.audio.currentTime = 0;
        playAudio();
      } else {
        pauseAudio();
      }
    });
    if (el.heroPrevBtn) el.heroPrevBtn.addEventListener('click', prevChapter);
    if (el.heroNextBtn) el.heroNextBtn.addEventListener('click', nextChapter);

    // Player Controls
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
    if (el.btnAutoScroll) el.btnAutoScroll.addEventListener('click', toggleAutoScroll);
    if (el.btnSpeed) el.btnSpeed.addEventListener('click', cycleSpeed);

    // Progress Bar Scrubber Click
    if (el.playerProgressWrap) {
      el.playerProgressWrap.addEventListener('click', (e) => {
        const rect = el.playerProgressWrap.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const dur = el.audio.duration || getCurrentChapterData().duration;
        if (dur > 0) {
          el.audio.currentTime = (clickX / width) * dur;
        }
      });
    }

    // Volume Slider & Mute
    if (el.volumeSlider) {
      el.volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.volume = val;
        el.audio.volume = val;
        if (val === 0) state.isMuted = true;
        else state.isMuted = false;
      });
    }
    if (el.btnMute) {
      el.btnMute.addEventListener('click', () => {
        state.isMuted = !state.isMuted;
        el.audio.muted = state.isMuted;
        showToast(state.isMuted ? 'Muted' : 'Unmuted');
      });
    }

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

    // Bookmarks Modal
    if (el.btnBookmarksOpen) el.btnBookmarksOpen.addEventListener('click', () => {
      renderBookmarksList();
      openModal(el.bookmarksModal);
    });
    if (el.closeBookmarksModalBtn) el.closeBookmarksModalBtn.addEventListener('click', () => closeModal(el.bookmarksModal));
    if (el.bookmarksModal) {
      el.bookmarksModal.addEventListener('click', (e) => {
        if (e.target === el.bookmarksModal) closeModal(el.bookmarksModal);
      });
    }

    // Settings Modal
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
    if (el.btnFontDec) el.btnFontDec.addEventListener('click', () => setFontSize(state.fontSize - 1));
    if (el.btnFontInc) el.btnFontInc.addEventListener('click', () => setFontSize(state.fontSize + 1));

    // Settings Auto-scroll switch
    if (el.toggleAutoScrollSwitch) {
      el.toggleAutoScrollSwitch.addEventListener('change', (e) => {
        state.autoScroll = e.target.checked;
        updatePlayerControls();
        localStorage.setItem('hebrews_autoscroll', state.autoScroll);
      });
    }
  }

  // --- App Initialization ---
  function init() {
    loadPersistedState();
    setTheme(state.theme);
    setFontSize(state.fontSize);
    setDisplayMode(state.displayMode);
    setAudioTrack(state.audioTrack);
    buildChapterPicker();
    renderChapter();
    setupSearch();
    setupKeyboardShortcuts();
    initEventListeners();
    updatePlayerControls();
    console.log('Hebrews Audio App initialized successfully. Chapters loaded:', Object.keys(window.HEBREWS_DATA).length);
  }

  // Bootstrap when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
