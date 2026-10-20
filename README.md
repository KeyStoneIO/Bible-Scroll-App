# Bible Scroll App (Version 2 — Cinematic Video Scroll Edition)

> **A YouTube-style rolling scripture teleprompter & Tamil Audio Bible web application for the Book of Hebrews (எபிரெயர் 1–13), featuring continuous smooth rolling without pinpointing lag.**

Inspired by [Neethiyin Raja Tamil Audio Bible](https://www.youtube.com/watch?v=cIYwOF-rguY&list=PLCBPaXCvdmRbyartDrm5lnGWsza4hgXh-&index=1).

---

## 🌟 What's New in Version 2

### 1. 📜 Continuous Smooth Roll (YouTube Video Style)
- **Eliminated Rigid Pinpointing & Lag**: Instead of discrete, jumpy verse highlighting, verses roll continuously and gracefully upward across the screen at a steady, relaxing tempo.
- **Two Rolling Modes**:
  - **Steady Tempo Roll (Default)**: A uniform, constant rolling speed spanning the entire duration of the audio, just like a video reel or teleprompter.
  - **Audio-Synced Glide**: Continuous piecewise interpolation through verse positions matching the narrator's natural rhythm with zero lag or stutter.
- **Vignette Fade Masks**: Cinematic top and bottom gradient masks so scriptures smoothly fade in from the bottom and fade out at the top.
- **Optional Reading Horizon**: A subtle central reading focus line that can be toggled on/off in Settings.

### 2. 🔀 Flexible View & Language Modes
- **View Toggle**: Switch between **📜 Scroll Roll** (video teleprompter style) and **📖 Cards View** (classic study reader).
- **Language Modes**:
  - **தமிழ் Mode**: Pure Tamil Scriptures in large, readable font ([Mukta Malar](https://fonts.google.com/specimen/Mukta+Malar)).
  - **English Mode**: English KJV Scriptures.
  - **Parallel Mode**: Side-by-side bilingual roll (Tamil & English rolling together in sync).
- **Dual Audio Narration**:
  - **WordProject Tamil Narration** (Primary, with bundled offline MP3s + CDN fallback).
  - **WordProject English KJV Narration**.
  - Read in English while listening to Tamil audio (or vice-versa)!

### 3. 🎯 Seamless Interaction
- **Instant Seek on Scrub**: Dragging or clicking the player progress bar smoothly glides the scroll position instantly to match the audio time.
- **Manual Scroll Override**: Touch or mouse-wheel scrolling gracefully pauses auto-rolling and displays a floating **"▶ Resume Roll"** button.
- **Fullscreen Mode (⛶)**: Immersive distraction-free reading, ideal for monitors, TVs, and tablets.

---

## 📁 Repository Structure

```
tamil-hebrews-audiobook/
├── index.html                 # Version 2 single-page application
├── css/
│   └── style.css              # Cinematic scroll stage, vignette masks, responsive themes
├── js/
│   ├── hebrews_data.js        # Complete 13 chapters (Tamil & English) + exact verse timestamps
│   └── app.js                 # 60fps continuous rolling animation engine & audio sync
├── audio/                     # Local MP3 recordings for Hebrews 1–13 (offline capable)
│   ├── ta_58_1.mp3
│   ├── ta_58_2.mp3
│   └── ... ta_58_13.mp3
└── README.md                  # Complete documentation
```

---

## 🚀 How to Commit and Push to GitHub

To push this Version 2 into your repository [`https://github.com/Saranmurthy/Bible-Scroll-App`](https://github.com/Saranmurthy/Bible-Scroll-App):

Open **PowerShell** or **Command Prompt** on your computer and run:

```powershell
cd "C:\Users\saran\.gemini\antigravity\scratch\tamil-hebrews-audiobook"
git add .
git commit -m "Version 2: Cinematic continuous roll synced to Tamil audio without pinpoint lag"
git push -u origin main --force
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause (Starts & pauses continuous roll) |
| <kbd>→</kbd> (Right Arrow) | Seek forward 10 seconds |
| <kbd>←</kbd> (Left Arrow) | Seek backward 10 seconds |
| <kbd>J</kbd> | Previous verse |
| <kbd>K</kbd> | Next verse |
| <kbd>L</kbd> | Loop current verse |
| <kbd>M</kbd> | Mute / Unmute audio |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>1</kbd> | **தமிழ் Mode** |
| <kbd>2</kbd> | **English Mode** |
| <kbd>3</kbd> | **Parallel Mode** |

---

## 🛠️ Credits & Attribution

- **Reference Video**: [Neethiyin Raja YouTube Tamil Audio Bible](https://www.youtube.com/watch?v=cIYwOF-rguY&list=PLCBPaXCvdmRbyartDrm5lnGWsza4hgXh-&index=1)
- **Audio Source**: [WordProject Tamil Audio Bible](https://www.wordproject.org/bibles/audio/30_tamil/b58.htm)
- **Scriptures**: Tamil Bible (பரிசுத்த வேதாகமம்) & King James Version (KJV)
- **Typography**: Google Fonts ([Mukta Malar](https://fonts.google.com/specimen/Mukta+Malar) & [Noto Sans Tamil](https://fonts.google.com/specimen/Noto+Sans+Tamil))
