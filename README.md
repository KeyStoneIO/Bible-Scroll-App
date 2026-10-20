# Bible Scroll App (Full Tamil New Testament Edition)

> **A cinematic, continuous-rolling scripture teleprompter & Tamil Audio Bible web application for the ENTIRE New Testament (அனைத்து 27 புத்தகங்கள் • 260 அதிகாரங்கள் • 7,957 வசனங்கள்).**

Powered by the authentic **Tamil New Testament Audio Narration** (Faith Comes By Hearing / Bible.is) with **English King James Version (KJV)** reference.

Inspired by [Neethiyin Raja Tamil Audio Bible](https://www.youtube.com/watch?v=cIYwOF-rguY&list=PLCBPaXCvdmRbyartDrm5lnGWsza4hgXh-&index=1).

---

## 🌟 What's New in this Upgrade

### 1. 📖 Scaled to the Entire New Testament (27 Books & 260 Chapters)
- **All 27 New Testament Books**:
  - **சுவிசேஷங்கள் (The Gospels)**: மத்தேயு (Matthew), மாற்கு (Mark), லூக்கா (Luke), யோவான் (John)
  - **சரித்திரம் (Church History)**: அப்போஸ்தலர் (Acts)
  - **பவுலின் நிருபங்கள் (Pauline Epistles)**: ரோமர் (Romans), 1 & 2 கொரிந்தியர் (Corinthians), கலாத்தியர் (Galatians), எபேசியர் (Ephesians), பிலிப்பியர் (Philippians), கொலோசெயர் (Colossians), 1 & 2 தெசலோனிக்கேயர் (Thessalonians), 1 & 2 தீமோத்தேயு (Timothy), தீத்து (Titus), பிலேமோன் (Philemon)
  - **பொதுவான நிருபங்கள் (General Epistles)**: எபிரெயர் (Hebrews), யாக்கோபு (James), 1 & 2 பேதுரு (Peter), 1, 2 & 3 யோவான் (John), யூதா (Jude)
  - **தீர்க்கதரிசனம் (Prophecy)**: வெளிப்படுத்தின விசேஷம் (Revelation)
- **Categorized Book Selector Modal**: Quickly browse and pick any of the 27 books with Tamil names, English names, and chapter counts.
- **Chapter Grid Picker**: Quick-select any chapter in the current book.
- **Cross-Book Navigation**: Previous / Next Chapter seamlessly transitions from the end of one book to the start of the next (e.g., Matthew 28 ➔ Mark 1).

### 2. 🎙️ High-Quality Tamil Audio Narration (Faith Comes By Hearing)
- Extracted and bundled **all 260 MP3 audio chapters** from the Tamil New Testament audio archive.
- Clean, URL-safe audio filenames (`audio_nt/B01_01.mp3` through `audio_nt/B27_22.mp3`).
- Fully local and offline capable — zero dependence on third-party CDNs.

### 3. 📜 Continuous Smooth Roll (No Pinpointing, No Lag)
- **Eliminated Hard Verse Snapping**: The text rolls continuously and smoothly upward across the screen in real-time, just like in the YouTube reference video.
- **Two Rolling Styles**:
  - **Steady Tempo Roll (Default)**: A uniform, constant rolling speed calibrated across the entire chapter duration for a calm, video-like reading experience.
  - **Audio-Synced Glide**: Continuous mathematical interpolation through verse timestamps that glides with the narrator's natural cadence without sudden jumps.
- **Vignette Fade Masks**: Cinematic top and bottom gradient masks so scriptures gracefully fade in from the bottom and fade out at the top.
- **Optional Reading Horizon**: A subtle central reading focus line that can be toggled on/off in Settings.

### 4. 🔀 Display Modes with English KJV Reference
- **தமிழ் Mode**: Pure Tamil Scriptures in large, crisp typography ([Mukta Malar](https://fonts.google.com/specimen/Mukta+Malar)).
- **English Reference Mode**: English King James Version verses synced to the Tamil voice!
- **Parallel Mode**: Side-by-side bilingual roll (Tamil + English reference rolling together in sync).

### 5. 🔍 Global Search Across All 7,957 Verses
- Instant keyword search across all 27 books and 260 chapters in both Tamil and English.
- Clicking any search result opens the book and chapter, seeks the audio to that verse, and rolls straight to it!

---

## 📁 Repository Structure

```
tamil-hebrews-audiobook/
├── index.html                 # Main single-page application
├── css/
│   └── style.css              # Cinematic scroll stage, vignette masks, book grid styles
├── js/
│   ├── nt_manifest.js         # Metadata for all 27 books (id, names, categories, chapters)
│   ├── nt_data.js             # Full text for all 260 chapters (Tamil + English KJV + timestamps)
│   └── app.js                 # 60fps continuous rolling animation engine & audio navigation
├── audio_nt/                  # Complete 260 Tamil New Testament MP3 recordings
│   ├── B01_01.mp3             # Matthew 1
│   ├── B01_02.mp3             # Matthew 2
│   └── ... B27_22.mp3         # Revelation 22
└── README.md                  # Documentation
```

---

## 🚀 How to Commit and Push to GitHub

To push the complete New Testament app into your repository [`https://github.com/Saranmurthy/Bible-Scroll-App`](https://github.com/Saranmurthy/Bible-Scroll-App):

Open **PowerShell** or **Command Prompt** on your computer and run:

```powershell
cd "C:\Users\saran\.gemini\antigravity\scratch\tamil-hebrews-audiobook"
git add .
git commit -m "Upgrade: Complete Tamil New Testament with 27 books, 260 audio chapters and continuous smooth scroll"
git push -u origin main --force
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause (Starts & pauses continuous roll) |
| <kbd>→</kbd> (Right Arrow) | Seek forward 10 seconds |
| <kbd>←</kbd> (Left Arrow) | Seek backward 10 seconds |
| <kbd>[</kbd> | Previous Chapter |
| <kbd>]</kbd> | Next Chapter |
| <kbd>L</kbd> | Loop current verse |
| <kbd>M</kbd> | Mute / Unmute audio |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>1</kbd> | **தமிழ் Mode** |
| <kbd>2</kbd> | **English Mode** |
| <kbd>3</kbd> | **Parallel Mode** |

---

## 🛠️ Credits & Attribution

- **Tamil Audio Narration**: Faith Comes By Hearing / Bible.is Tamil New Testament
- **Scripture Text**: Tamil Bible (பரிசுத்த வேதாகமம்) & King James Version (KJV)
- **Typography**: Google Fonts ([Mukta Malar](https://fonts.google.com/specimen/Mukta+Malar) & [Noto Sans Tamil](https://fonts.google.com/specimen/Noto+Sans+Tamil))
- **Reference Video**: [Neethiyin Raja Tamil Audio Bible](https://www.youtube.com/watch?v=cIYwOF-rguY&list=PLCBPaXCvdmRbyartDrm5lnGWsza4hgXh-&index=1)
