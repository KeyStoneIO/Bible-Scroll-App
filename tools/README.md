# Audio Alignment Tool

`align_audio.py` replaces the estimated verse timestamps in `js/nt_data.js` with real ones measured from the Tamil chapter recordings in `audio_nt/`.

## Why it exists

The `start` / `end` times shipped in `js/nt_data.js` are estimates. Each chapter's audio was divided between its verses in proportion to their Tamil text length. They are not taken from the recordings, so anything that depends on them can drift from the narrator:

- verse highlighting
- **Audio-Synced Glide** roll mode
- verse looping
- tapping a verse, and jumping to a search result

**Steady Tempo Roll** doesn't use verse times and is unaffected.

The tool uses forced alignment with Meta's MMS model via PyTorch `torchaudio`. The model listens to each MP3 alongside the known Tamil verse text and finds when each verse actually begins. The app reads these timestamps as-is, so no app code changes are needed.

## Requirements

- Python 3.9 or newer (developed with 3.11)
- About 4 GB of free disk space: ~2.5 GB for PyTorch, ~1.2 GB for the model
- An NVIDIA GPU is strongly recommended. The tool falls back to CPU, which works but is much slower.

You don't need to install anything by hand. The first run:

1. Creates a private virtual environment in `tools/.venv`. Your system Python is left untouched.
2. Installs PyTorch 2.5.1: the CUDA build if `nvidia-smi` finds a GPU, otherwise the CPU build. It also installs `uroman` (Tamil → Latin romanization) and `soundfile` (MP3 decoding).
3. Downloads the MMS alignment model the first time it's needed.

Later runs reuse all of this.

> PyTorch is pinned to 2.5.1 on purpose. Newer `torchaudio` releases are removing the forced-alignment APIs this tool relies on.

## Usage

Run from the repository root.

### 1. Test mode (default): changes nothing

```bash
python tools/align_audio.py
```

This aligns three sample chapters: Matthew 1, John 3 and Hebrews 1. For each one it prints:

- **confidence**: the model's average certainty for the aligned words (0–1)
- when verse 1 really starts, compared with the current estimate
- the mean and maximum shift between the new times and the old estimates
- a table of the first 10 verses' old and new start times

Full per-verse results are saved to `tools/align_output/test_report.json`. **`js/nt_data.js` is not modified.**

To test other chapters, pass USFM book codes (`MAT`, `MRK`, `LUK`, `JHN`, `ACT`, `ROM`, … `REV`; see the `code` field in `js/nt_manifest.js`):

```bash
python tools/align_audio.py --chapters MAT:5,ROM:8,REV:22
```

**Check the results by ear before going further.** Open a test chapter in the app, play it, and confirm that the "new start" times match when the narrator begins each verse.

### 2. Full run: rewrites `js/nt_data.js`

```bash
python tools/align_audio.py --full
```

- **Backs up** `js/nt_data.js` to `tools/backups/nt_data.<timestamp>.js` before changing anything.
- Aligns all 260 chapters, printing a confidence score for each.
- **Resumable.** Progress is saved after every chapter to `tools/align_output/full_results.json`. If the run is interrupted, run the same command again and it continues where it stopped. Delete that file to start over.
- Chapters scoring below `--min-confidence`, or failing to align, **keep their old estimates**. They are listed at the end.
- Writes the file back in exactly its original format: comment line, `window.NT_DATA = {...};`, LF line endings.

For each aligned chapter it updates:

| Field | New value |
|---|---|
| `verses[].start` | when the verse's first word is spoken |
| `verses[].end` | the next verse's start (last verse: end of the audio) |
| `intro_end` | verse 1's start |
| `duration` | the decoded audio length |

### Options

| Option | Default | Meaning |
|---|---|---|
| `--full` | off | Align every chapter and rewrite `js/nt_data.js` |
| `--chapters` | `MAT:1,JHN:3,HEB:1` | Chapters for test mode |
| `--min-confidence` | `0.3` | In full mode, chapters scoring below this keep their old estimates |

The `0.3` default is a starting point, not a calibrated value. Look at the scores test mode reports for chapters that sound right, and set the threshold just below them.

## Undo

Copy the backup over the data file:

```bash
cp tools/backups/nt_data.<timestamp>.js js/nt_data.js
```

On Windows PowerShell, use `Copy-Item` with the same paths. Or restore it with Git: `git checkout -- js/nt_data.js`.

## Files it creates

All of these are git-ignored:

| Path | Contents |
|---|---|
| `tools/.venv/` | Private Python environment with PyTorch etc. Delete it to force a clean reinstall. |
| `tools/align_output/test_report.json` | Test-mode results |
| `tools/align_output/full_results.json` | Full-run progress and results (used for resuming) |
| `tools/backups/` | Copies of `js/nt_data.js` taken before each full run |

## Troubleshooting

**Low confidence on every chapter, or verse times clearly wrong.**
The narration probably isn't reading the same Tamil text that's in `js/nt_data.js`, for example because the recording uses a different translation. Alignment only works when the text matches what is spoken.

**Verse 1 starts a little early or late.**
Narrators often announce the book and chapter before verse 1. The tool aligns a leading wildcard token to absorb that announcement. If verse 1 still looks off, spot-check it by ear; the other verses are unaffected.

**It says it's running on CPU although the machine has a GPU.**
PyTorch was installed as the CPU build, which happens if `nvidia-smi` wasn't available during setup. Delete `tools/.venv` and run again.

**Out of GPU memory.**
Audio is processed in 30-second pieces. Lower `CHUNK_SECONDS` near the top of `align_audio.py` if your GPU has very little memory.

**Setup fails while installing PyTorch.**
Check your internet connection and free disk space, delete `tools/.venv`, and run again. PyTorch 2.5.1 wheels exist for Python 3.9–3.12 on Windows, macOS and Linux.

## How it works

For each chapter:

1. Decode the MP3, convert it to mono and resample it to 16 kHz.
2. Run the MMS model over the audio in 30-second pieces to get per-frame character probabilities.
3. Romanize each verse's Tamil text with `uroman` (e.g. `ஆபிரகாமின்` → `aapirakaamin`) and keep only `a–z` and `'`, the characters the model knows.
4. Force-align the whole chapter's text to the audio in one pass, with a leading wildcard token for the spoken announcement.
5. Take each verse's start as the start of its first aligned word.
   - **Verses with nothing alignable** (e.g. only numerals) are placed midway between their neighbours.
   - **Confidence** is the average probability over all aligned characters.
