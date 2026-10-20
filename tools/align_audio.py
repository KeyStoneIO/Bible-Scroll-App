"""
Real verse timestamps for js/nt_data.js via forced alignment.

Meta's MMS aligner (torchaudio) listens to each chapter MP3 alongside the
Tamil verse text and finds when each verse actually starts, replacing the
current estimates (which were spread by character count).

Usage (from the repo root):
    python tools/align_audio.py                 # test mode: 3 chapters, changes nothing
    python tools/align_audio.py --chapters MAT:5,ROM:8
    python tools/align_audio.py --full          # all 260 chapters, rewrites js/nt_data.js

First run sets itself up: it creates tools/.venv and installs PyTorch
(CUDA build if an NVIDIA GPU is present, ~2.5 GB) plus the other packages.
The alignment model (~1.2 GB) downloads on first use.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
VENV_DIR = TOOLS / ".venv"
OUTPUT_DIR = TOOLS / "align_output"
BACKUP_DIR = TOOLS / "backups"
DATA_FILE = ROOT / "js" / "nt_data.js"

TORCH_VERSION = "2.5.1"  # newer torchaudio releases are removing forced_align / MMS_FA
TEST_CHAPTERS = "MAT:1,JHN:3,HEB:1"
CHUNK_SECONDS = 30       # model runs on 30 s pieces so long chapters fit in GPU memory


# ---------------------------------------------------------------------------
# Self-setup: private virtual environment + dependencies
# ---------------------------------------------------------------------------

def venv_python():
    return VENV_DIR / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def running_in_venv():
    return Path(sys.prefix).resolve() == VENV_DIR.resolve()


def has_nvidia_gpu():
    if not shutil.which("nvidia-smi"):
        return False
    try:
        return subprocess.run(["nvidia-smi"], capture_output=True, timeout=20).returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


def pip_install(*args):
    cmd = [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", *args]
    print("  >", " ".join(cmd[2:]))
    subprocess.check_call(cmd)


def missing_modules():
    missing = []
    for name in ("torch", "torchaudio", "uroman", "soundfile"):
        try:
            __import__(name)
        except ImportError:
            missing.append(name)
    return missing


def ensure_environment():
    """Re-run this script inside tools/.venv, installing whatever is missing."""
    if not running_in_venv():
        if not venv_python().exists():
            print(f"[setup] Creating virtual environment in {VENV_DIR.relative_to(ROOT)} ...")
            subprocess.check_call([sys.executable, "-m", "venv", str(VENV_DIR)])
        result = subprocess.call([str(venv_python()), str(Path(__file__).resolve()), *sys.argv[1:]])
        sys.exit(result)

    missing = missing_modules()
    if not missing:
        return

    print(f"[setup] Installing missing packages: {', '.join(missing)}")
    if "torch" in missing or "torchaudio" in missing:
        gpu = has_nvidia_gpu()
        index = "https://download.pytorch.org/whl/" + ("cu121" if gpu else "cpu")
        print(f"[setup] {'NVIDIA GPU found: CUDA' if gpu else 'No NVIDIA GPU: CPU'} build of PyTorch "
              f"{TORCH_VERSION} (large download, please wait)")
        pip_install(f"torch=={TORCH_VERSION}", f"torchaudio=={TORCH_VERSION}", "--index-url", index)
    pip_install("uroman", "soundfile")

    still_missing = missing_modules()
    if still_missing:
        sys.exit(f"[setup] Could not install: {', '.join(still_missing)}")
    print("[setup] Done.\n")


# ---------------------------------------------------------------------------
# nt_data.js read / write (keeps the file's exact layout)
# ---------------------------------------------------------------------------

def load_nt_data():
    raw = DATA_FILE.read_text(encoding="utf-8")
    start = raw.index("{", raw.index("window.NT_DATA"))
    end = raw.rindex("}") + 1
    return raw[:start], json.loads(raw[start:end]), raw[end:]


def save_nt_data(prefix, data, suffix):
    body = json.dumps(data, ensure_ascii=False)
    with open(DATA_FILE, "w", encoding="utf-8", newline="\n") as f:
        f.write(prefix + body + suffix)


def chapter_list(data, spec):
    """'MAT:1,JHN:3' -> [(book_id, chapter), ...]; spec=None -> every chapter."""
    by_code = {book["code"]: book_id for book_id, book in data.items()}
    if spec is None:
        return [(b, c) for b in data for c in data[b]["chapters"]]
    chapters = []
    for item in spec.split(","):
        code, _, ch = item.strip().upper().partition(":")
        if code not in by_code or ch not in data[by_code[code]]["chapters"]:
            sys.exit(f"Unknown chapter '{item}'. Use book codes like MAT, MRK, JHN, ROM, HEB, REV.")
        chapters.append((by_code[code], ch))
    return chapters


# ---------------------------------------------------------------------------
# Alignment
# ---------------------------------------------------------------------------

class Aligner:
    def __init__(self):
        import torch
        import uroman
        from torchaudio.pipelines import MMS_FA

        self.torch = torch
        self.bundle = MMS_FA
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Device: {self.device}" + (f" ({torch.cuda.get_device_name(0)})" if self.device == "cuda" else ""))
        if self.device == "cpu" and has_nvidia_gpu():
            print("  Note: a GPU exists but PyTorch is CPU-only. Delete tools/.venv and rerun to reinstall.")
        print("Loading alignment model (downloads ~1.2 GB the first time)...")
        # The "*" wildcard token soaks up the spoken book/chapter announcement
        # before verse 1, which isn't in the verse text
        self.use_star = "*" in MMS_FA.get_dict()
        self.model = MMS_FA.get_model(with_star=self.use_star).to(self.device).eval()
        self.tokenizer = MMS_FA.get_tokenizer()
        self.aligner = MMS_FA.get_aligner()
        self.uroman = uroman.Uroman()

    def words(self, tamil_text):
        # The model aligns romanized lowercase text, e.g. "ஆபிரகாமின்" -> "aapirakaamin"
        roman = self.uroman.romanize_string(tamil_text).lower()
        return re.sub(r"[^a-z']", " ", roman).split()

    def load_audio(self, path):
        import soundfile
        import torchaudio

        samples, sr = soundfile.read(str(path), dtype="float32", always_2d=True)
        wave = self.torch.from_numpy(samples.T).mean(0, keepdim=True)
        return torchaudio.functional.resample(wave, sr, self.bundle.sample_rate)

    def emission(self, wave):
        rate = self.bundle.sample_rate
        size = CHUNK_SECONDS * rate
        chunks = list(wave.split(size, dim=1))
        if len(chunks) > 1 and chunks[-1].size(1) < rate:  # too short for the model alone
            chunks[-2] = self.torch.cat([chunks[-2], chunks.pop()], dim=1)
        with self.torch.inference_mode():
            parts = [self.model(c.to(self.device))[0] for c in chunks]
        return self.torch.cat(parts, dim=1)

    def align_chapter(self, chapter):
        """Return (verse_starts_seconds, audio_duration, confidence)."""
        wave = self.load_audio(ROOT / chapter["audio_url"])
        duration = wave.size(1) / self.bundle.sample_rate
        emission = self.emission(wave)

        verse_words = [self.words(v["ta"]) for v in chapter["verses"]]
        lead = ["*"] if self.use_star else []
        transcript = lead + [w for vw in verse_words for w in vw]
        with self.torch.inference_mode():
            spans = self.aligner(emission[0], self.tokenizer(transcript))
        sec_per_frame = duration / emission.size(1)

        starts, i = [], len(lead)  # skip the leading wildcard's span
        for vw in verse_words:
            if vw:
                starts.append(spans[i][0].start * sec_per_frame)
                i += len(vw)
            else:  # verse with nothing alignable: fill in afterwards
                starts.append(None)
        starts = fill_gaps(starts, duration)

        word_spans = spans[len(lead):]
        confidence = sum(s.score for w in word_spans for s in w) / max(1, sum(len(w) for w in word_spans))
        return starts, duration, confidence


def fill_gaps(starts, duration):
    out = list(starts)
    for i, s in enumerate(out):
        if s is None:
            prev = out[i - 1] if i > 0 else 0.0
            nxt = next((x for x in out[i + 1:] if x is not None), duration)
            out[i] = (prev + nxt) / 2
    return out


def timings_from_starts(starts, duration):
    """Verse start/end pairs: each verse ends where the next begins."""
    ends = starts[1:] + [duration]
    return [(round(s, 2), round(e, 2)) for s, e in zip(starts, ends)]


# ---------------------------------------------------------------------------
# Modes
# ---------------------------------------------------------------------------

def describe(book, ch_key, chapter, starts, duration, confidence):
    old = [v["start"] for v in chapter["verses"]]
    diffs = [abs(n - o) for n, o in zip(starts, old)]
    return {
        "chapter": f"{book['code']} {ch_key}",
        "confidence": round(confidence, 3),
        "verses": len(starts),
        "audio_seconds": round(duration, 2),
        "intro_end_old": chapter["intro_end"],
        "intro_end_new": round(starts[0], 2),
        "mean_shift_seconds": round(sum(diffs) / len(diffs), 2),
        "max_shift_seconds": round(max(diffs), 2),
        "verse_starts": [
            {"verse": v["verse"], "old": o, "new": round(n, 2)}
            for v, o, n in zip(chapter["verses"], old, starts)
        ],
    }


def print_summary(r, show_verses):
    print(f"\n{r['chapter']}: confidence {r['confidence']:.3f}, {r['verses']} verses, "
          f"{r['audio_seconds']}s audio")
    print(f"  verse 1 starts at {r['intro_end_new']}s (estimate was {r['intro_end_old']}s)")
    print(f"  shift vs. estimates: mean {r['mean_shift_seconds']}s, max {r['max_shift_seconds']}s")
    if show_verses:
        print("  verse   old start   new start")
        for v in r["verse_starts"][:show_verses]:
            print(f"  {v['verse']:>5}   {v['old']:>9.2f}   {v['new']:>9.2f}")


def run_test(data, spec):
    aligner = Aligner()
    reports = []
    for book_id, ch_key in chapter_list(data, spec):
        book, chapter = data[book_id], data[book_id]["chapters"][ch_key]
        t0 = time.time()
        starts, duration, conf = aligner.align_chapter(chapter)
        r = describe(book, ch_key, chapter, starts, duration, conf)
        r["seconds_to_align"] = round(time.time() - t0, 1)
        reports.append(r)
        print_summary(r, show_verses=10)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUTPUT_DIR / "test_report.json"
    out.write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nTest mode: js/nt_data.js was NOT changed. Full details: {out.relative_to(ROOT)}")
    print("Next: play a test chapter in the app and compare against the 'new start' times above.\n"
          "If they match the narrator, run with --full.")


def run_full(data, prefix, suffix, min_conf):
    # Results are cached per chapter so an interrupted run resumes where it stopped
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = OUTPUT_DIR / "full_results.json"
    cache = json.loads(cache_file.read_text(encoding="utf-8")) if cache_file.exists() else {}

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup = BACKUP_DIR / f"nt_data.{datetime.now():%Y%m%d-%H%M%S}.js"
    shutil.copy2(DATA_FILE, backup)
    print(f"Backed up js/nt_data.js -> {backup.relative_to(ROOT)}")

    aligner = Aligner()
    chapters = chapter_list(data, None)
    for n, (book_id, ch_key) in enumerate(chapters, 1):
        key = f"{book_id}:{ch_key}"
        label = f"{data[book_id]['code']} {ch_key}"
        if key in cache:
            continue
        try:
            starts, duration, conf = aligner.align_chapter(data[book_id]["chapters"][ch_key])
            cache[key] = {"starts": starts, "duration": duration, "confidence": conf}
            print(f"[{n}/{len(chapters)}] {label}: confidence {conf:.3f}")
        except Exception as e:  # keep going; the chapter keeps its old estimates
            cache[key] = {"error": str(e)}
            print(f"[{n}/{len(chapters)}] {label}: FAILED ({e})")
        cache_file.write_text(json.dumps(cache), encoding="utf-8")

    updated, kept = 0, []
    for book_id, ch_key in chapters:
        res = cache[f"{book_id}:{ch_key}"]
        label = f"{data[book_id]['code']} {ch_key}"
        if "error" in res:
            kept.append(f"{label} (failed: {res['error']})")
            continue
        if res["confidence"] < min_conf:
            kept.append(f"{label} (confidence {res['confidence']:.3f})")
            continue
        chapter = data[book_id]["chapters"][ch_key]
        for verse, (s, e) in zip(chapter["verses"], timings_from_starts(res["starts"], res["duration"])):
            verse["start"], verse["end"] = s, e
        chapter["intro_end"] = round(res["starts"][0], 2)
        chapter["duration"] = round(res["duration"], 2)
        updated += 1

    save_nt_data(prefix, data, suffix)
    print(f"\nUpdated {updated}/{len(chapters)} chapters in js/nt_data.js.")
    if kept:
        print(f"Kept old estimates for {len(kept)} chapter(s) (below --min-confidence {min_conf}):")
        for k in kept:
            print("  -", k)
    print(f"To undo: copy {backup.relative_to(ROOT)} back to js/nt_data.js")


def main():
    parser = argparse.ArgumentParser(description="Align verse timestamps to the Tamil chapter audio.")
    parser.add_argument("--full", action="store_true", help="align all 260 chapters and rewrite js/nt_data.js")
    parser.add_argument("--chapters", default=TEST_CHAPTERS, help=f"test-mode chapters (default {TEST_CHAPTERS})")
    parser.add_argument("--min-confidence", type=float, default=0.3,
                        help="full mode: chapters scoring below this keep their old estimates (default 0.3)")
    args = parser.parse_args()

    ensure_environment()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    prefix, data, suffix = load_nt_data()
    if args.full:
        run_full(data, prefix, suffix, args.min_confidence)
    else:
        run_test(data, args.chapters)


if __name__ == "__main__":
    main()
