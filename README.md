# எபிரெயர் | Hebrews — Tamil Audio Bible & Synced Audiobook WebApp

> **A modern, responsive, synchronized Tamil Audio Bible reader for the entire Book of Hebrews (எபிரெயர் 1–13), ready for one-click hosting on GitHub Pages.**

---

## 🌟 Highlights

- 🎙️ **Full Audio & Text for Hebrews 1–13**: Complete Scripture text in Tamil (பரிசுத்த வேதாகமம்) and English (King James Version), paired with high-quality Tamil audio recordings from [WordProject](https://www.wordproject.org/bibles/audio/30_tamil/b58.htm).
- ⚡ **Precision Verse Synchronization**: Verse-by-verse timestamps calibrated with audio silence detection and speech alignment. Each verse highlights in real time with an active waveform pulse as the narrator reads it.
- 🔀 **Flexible Dual-Language Modes**:
  - **தமிழ் Mode**: Pure Tamil reading experience with authentic Tamil typography.
  - **English Mode**: Read the English KJV text while listening to the Tamil audio narration (or toggle to English audio).
  - **Parallel Mode**: Side-by-side bilingual view (Tamil on the left, English on the right) for in-depth comparative study and language learning.
- 🎧 **Dual Audio Narration**:
  - **Tamil Audio Narration**: WordProject official Tamil recording.
  - **English Audio Narration**: WordProject English KJV recording.
  - Switch freely between Tamil audio and English audio in any display mode!
- 🎯 **Interactive Click-to-Seek**: Tap or click any verse in the stream to jump the audio directly to that verse.
- 🔁 **Verse Looper**: Repeat a single verse continuously — perfect for meditation and scripture memorization.
- 🔍 **Global Instant Search**: Search for keywords in both Tamil and English across all 303 verses of Hebrews with highlighted results.
- 🔖 **Bookmarks & Copy**: Save favorite verses to your personal bookmarks drawer (persisted in `localStorage`) and copy verses with a single tap.
- 🎨 **Reading Customization**: Dark (OLED / Midnight Slate), Light, and Sepia themes, along with font size adjustments and smooth auto-scroll.

---

## 📁 Repository Structure

```
tamil-hebrews-audiobook/
├── index.html                 # Main single-page application
├── css/
│   └── style.css              # Custom styling, themes, and responsive layout
├── js/
│   ├── hebrews_data.js        # Chapters 1-13 text (Tamil & English) + exact verse timestamps
│   └── app.js                 # Complete audio engine, syncing, search, and UI state
├── audio/                     # Local MP3 recordings for Hebrews 1–13 (offline capable)
│   ├── ta_58_1.mp3
│   ├── ta_58_2.mp3
│   └── ... ta_58_13.mp3
└── README.md                  # Documentation & GitHub Pages deployment guide
```

---

## 🚀 How to Host on GitHub Pages (Step-by-Step)

This application is 100% static HTML/CSS/JavaScript. It requires **no server, build tools, or database**.

### Step 1: Initialize Git and Commit
Open a terminal in the project directory:

```bash
cd "C:\Users\saran\.gemini\antigravity\scratch\tamil-hebrews-audiobook"
git init
git add .
git commit -m "Initial commit: Tamil Hebrews Synced Audiobook WebApp"
```

### Step 2: Push to GitHub
Create a new public repository on GitHub named `tamil-hebrews-audiobook` (or any name you prefer), then link and push:

```bash
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/tamil-hebrews-audiobook.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Open your repository on GitHub.
2. Go to **Settings** > **Pages** (under "Code and automation" in the left sidebar).
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` and folder `/ (root)`.
4. Click **Save**.
5. After 1–2 minutes, your live webapp will be available at:
   ```
   https://<YOUR_GITHUB_USERNAME>.github.io/tamil-hebrews-audiobook/
   ```

> [!TIP]
> The app features automatic fallback: if local audio files take time to load on slower connections, it automatically streams directly from WordProject's high-speed CDN without interruption!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause |
| <kbd>→</kbd> (Right Arrow) | Seek forward 10 seconds |
| <kbd>←</kbd> (Left Arrow) | Seek backward 10 seconds |
| <kbd>J</kbd> | Previous verse |
| <kbd>K</kbd> | Next verse |
| <kbd>L</kbd> | Toggle loop/repeat current verse |
| <kbd>M</kbd> | Mute / Unmute audio |
| <kbd>1</kbd> | Switch to **தமிழ் Mode** |
| <kbd>2</kbd> | Switch to **English Mode** |
| <kbd>3</kbd> | Switch to **Parallel Mode** |

---

## 📊 Chapter Details & Verse Counts

| Chapter | Tamil Title | English Title | Verses | Audio Duration |
| :---: | :--- | :--- | :---: | :---: |
| **1** | தேவன் குமாரன் மூலமாய்த் திருவுளம்பற்றுதல் | God's Supreme Revelation in His Son | 14 | 2m 45s |
| **2** | பெரிய இரட்சிப்பு மற்றும் இயேசுவின் உபாதைகள் | The Great Salvation and Jesus' Suffering | 18 | 3m 45s |
| **3** | மோசேயைப்பார்க்கிலும் கிறிஸ்து மேன்மையானவர் | Jesus Greater than Moses | 19 | 3m 16s |
| **4** | விசுவாசிகளுக்கான தேவனுடைய இளைப்பாறுதல் | The Promised Rest for God's People | 16 | 3m 29s |
| **5** | மெல்கிசேதேக்கின் முறைமையிலான பிரதான ஆசாரியர் | Christ the High Priest Forever | 14 | 2m 41s |
| **6** | பக்குவமடைதலும் தேவனுடைய வாக்குத்தத்தமும் | Moving Forward to Maturity | 20 | 3m 49s |
| **7** | மெல்கிசேதேக்கும் இயேசுவின் நித்திய ஆசாரியத்துவமும் | Melchizedek & Superior Priesthood | 28 | 5m 35s |
| **8** | புது உடன்படிக்கையின் பிரதான ஆசாரியர் | Mediator of a Better Covenant | 13 | 3m 09s |
| **9** | பூமிக்குரிய ஆசரிப்புக்கூடமும் கிறிஸ்துவின் இரத்தமும் | Earthly Tabernacle & Blood Sacrifice | 28 | 6m 15s |
| **10** | ஒரேமுறை செலுத்தப்பட்ட பரிபூரண பலி | Christ's One Sacrifice Once for All | 39 | 6m 47s |
| **11** | விசுவாசத்தின் மாபெரும் சாட்சிகள் | The Great Hall of Faith | 40 | 7m 28s |
| **12** | விசுவாசத்தை துவக்குகிறவரும் முடிக்கிறவருமான இயேசு | Fixing Eyes on Jesus & Heavenly Zion | 29 | 5m 57s |
| **13** | சகோதர சிநேகம், ஆராதனை மற்றும் இறுதி ஆசீர்வாதம் | Concluding Exhortations & Benediction | 25 | 4m 28s |
| **Total** | **எபிரெயர் முழுவதும்** | **Entire Book of Hebrews** | **303 Verses** | **~59 Minutes** |

---

## 🛠️ Credits & Attribution

- **Tamil Audio Narration**: [WordProject Audio Bible](https://www.wordproject.org/bibles/audio/30_tamil/b58.htm)
- **Tamil Scripture Text**: Tamil Bible (பரிசுத்த வேதாகமம்)
- **English Scripture Text & Narration**: King James Version (KJV) via WordProject
- **Typography**: Google Fonts ([Noto Sans Tamil](https://fonts.google.com/specimen/Noto+Sans+Tamil) & [Mukta Malar](https://fonts.google.com/specimen/Mukta+Malar))

---

*Made with dedication for Tamil Scripture listening and study.*
