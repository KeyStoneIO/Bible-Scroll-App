# Bible Scroll App (Complete Holy Bible Edition • திருவிவிலியம்)

> **A cinematic, continuous-rolling scripture teleprompter & Tamil Audio Bible web application for the ENTIRE Holy Bible (அனைத்து 66 புத்தகங்கள் • 1,189 அதிகாரங்கள் • 31,102 வசனங்கள்).**

Powered by authentic **Tamil Audio Narration** (Faith Comes By Hearing) for both the **Old Testament (பழைய ஏற்பாடு)** and **New Testament (புதிய ஏற்பாடு)** with **English King James Version (KJV)** reference.

Inspired by [Neethiyin Raja Tamil Audio Bible](https://www.youtube.com/watch?v=cIYwOF-rguY&list=PLCBPaXCvdmRbyartDrm5lnGWsza4hgXh-&index=1).

---

## 🌟 What's Included in the Complete Bible Edition

### 1. 📖 Complete 66 Books of the Bible (1,189 Chapters & 31,102 Verses)
- **பழைய ஏற்பாடு (Old Testament • 39 Books, 929 Chapters)**:
  - **மோசேயின் ஆகமங்கள் (Law / Pentateuch - 5)**: ஆதியாகமம் (Genesis) முதல் உபாகமம் (Deuteronomy) வரை
  - **சரித்திரம் (Historical Books - 12)**: யோசுவா (Joshua) முதல் எஸ்தர் (Esther) வரை
  - **ஞான இலக்கியம் (Poetry & Wisdom - 5)**: யோபு (Job), சங்கீதம் (Psalms - 150), நீதிமொழிகள் (Proverbs), பிரசங்கி (Ecclesiastes), உன்னதப்பாட்டு (Song of Solomon)
  - **பெரிய தீர்க்கதரிசிகள் (Major Prophets - 5)**: ஏசாயா (Isaiah), எரேமியா (Jeremiah), புலம்பல் (Lamentations), எசேக்கியேல் (Ezekiel), தானியேல் (Daniel)
  - **சிறிய தீர்க்கதரிசிகள் (Minor Prophets - 12)**: ஓசியா (Hosea) முதல் மல்கியா (Malachi) வரை
- **புதிய ஏற்பாடு (New Testament • 27 Books, 260 Chapters)**:
  - **சுவிசேஷங்கள் (The Gospels - 4)**: மத்தேயு (Matthew), மாற்கு (Mark), லூக்கா (Luke), யோவான் (John)
  - **சரித்திரம் (History - 1)**: அப்போஸ்தலர் (Acts)
  - **பவுலின் நிருபங்கள் (Pauline Epistles - 14)**: ரோமர் (Romans) முதல் எபிரெயர் (Hebrews) வரை
  - **பொதுவான நிருபங்கள் (General Epistles - 7)**: யாக்கோபு (James) முதல் யூதா (Jude) வரை
  - **தீர்க்கதரிசனம் (Prophecy - 1)**: வெளிப்படுத்தின விசேஷம் (Revelation)

### 2. ⚡ High-Performance Modular Architecture (Instant Load < 100ms)
- **Zero Monolithic Bloat**: Uses a lightweight 15 KB manifest (`js/bible_manifest.js`) and dynamic on-demand book modules (`data/books/b01.js` to `b66.js`).
- **Instant Paint**: The initial book loads in under 50ms without freezing or timing out.
- **100% Offline / Local & GitHub Pages Compatible**: Works seamlessly when run locally via file protocol or served on GitHub Pages.

### 3. 🎙️ Complete Tamil Audio Narration (1,189 MP3 Audio Chapters)
- **Old Testament**: 929 MP3 files extracted and cleanly mapped in `audio_ot/` (`OT01_01.mp3` through `OT39_04.mp3`).
- **New Testament**: 260 MP3 files in `audio_nt/` (`B01_01.mp3` through `B27_22.mp3`).
- **Cloud CDN Switcher**: Built-in option in Settings to point to an external CDN base URL (e.g. Cloudflare R2 or Internet Archive) if you want to stream audio from the cloud.

### 4. 📜 Cinematic Continuous Smooth Rolling (YouTube Video Style)
- **Zero Snapping or Jitter**: Text rolls continuously and smoothly at 60fps matching audio duration.
- **Two Roll Modes**:
  - **Steady Tempo Roll (Default)**: Constant uniform rolling tempo for the entire audio duration (exact YouTube video experience).
  - **Audio-Synced Glide**: Continuous mathematical interpolation with natural cadence.
- **Vignette Fade Masks**: Cinematic top and bottom edge fade masks for immersive reading.
- **Center Reading Horizon Guide**: Subtle center reading focus line (toggleable in Settings).

### 5. 🔀 Multi-Language Modes
- **தமிழ் Mode**: Pure Tamil Scriptures in large, crisp typography ([Mukta Malar](https://fonts.google.com/specimen/Mukta+Malar)).
- **English Reference Mode**: English King James Version verses synced to the Tamil voice!
- **Parallel Mode**: Side-by-side bilingual roll (Tamil + English reference rolling together).

### 6. 🔍 Quick Filter & Search Across All 66 Books
- Filter by Testament: **All (66)** | **பழைய ஏற்பாடு • OT (39)** | **புதிய ஏற்பாடு • NT (27)**.
- Live book name search in Tamil & English (e.g., "ஆதி", "Gen", "சங்", "Psa", "யோவா", "John").
- Verse keyword search across loaded scripture.

---

## 📁 Repository Structure

```
Bible-Scroll-App/
├── index.html                 # Main single-page application
├── css/
│   └── style.css              # Cinematic scroll stage, vignette masks, book grid styles
├── js/
│   ├── bible_manifest.js      # Complete 66 books metadata (categories, chapters, verse counts)
│   └── app.js                 # 60fps continuous rolling animation engine & navigation
├── data/
│   └── books/                 # Modular book data (b01.js to b66.js, 1,189 chapters, 31,102 verses)
│       ├── b01.js             # Genesis (ஆதியாகமம்)
│       ├── b19.js             # Psalms (சங்கீதம்)
│       ├── b40.js             # Matthew (மத்தேயு)
│       └── b66.js             # Revelation (வெளிப்படுத்தின விசேஷம்)
├── audio_ot/                  # 929 Tamil Old Testament MP3 recordings (OT01_01 to OT39_04)
└── audio_nt/                  # 260 Tamil New Testament MP3 recordings (B01_01 to B27_22)
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause narration and rolling |
| <kbd>←</kbd> / <kbd>→</kbd> | Seek backward / forward 10 seconds |
| <kbd>[</kbd> / <kbd>]</kbd> | Previous / Next Chapter (crosses book boundaries) |
| <kbd>L</kbd> | Loop active verse |
| <kbd>M</kbd> | Mute / Unmute audio |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> | Tamil / English / Parallel Mode |
