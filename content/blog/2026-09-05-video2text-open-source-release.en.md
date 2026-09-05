---
title: "Introducing video2text — A Fully Local, Speaker-Diarized Transcription App"
date: 2026-09-05
author: Murry Jeong
tags: [open source, video2text, speaker diarization, STT, Whisper, macOS, privacy, AppleSilicon, OpenSource]
description: "neurosam.AI releases its second open-source project, video2text — a fully local macOS app that turns an mp4 or audio file into a speaker-diarized transcript. Both speech recognition and speaker diarization run entirely on-device, so meeting content never leaves your machine."
slug: "video2text-open-source-release"
---

## TL;DR
- We're releasing **video2text**, neurosam.AI's **second open-source project**, under the MIT license.
- video2text is a **fully local macOS (Apple Silicon) app that turns an mp4 video or audio file into a speaker-diarized transcript**.
- Both speech recognition and speaker diarization run **entirely on this Mac** — meeting audio, voices, and files never get sent to an external server.
- Register your own voice profile once and it's auto-matched in future transcripts, with **rematch/relabel** support that skips the full pipeline rerun.
- GitHub: [github.com/neurosamAI/video2text](https://github.com/neurosamAI/video2text) / Docs: [video2text.neurosam.ai](https://video2text.neurosam.ai)

---

## Why we built video2text

Whether it's a video call or an in-person meeting recorded with a single camera, the outcome is the same: multiple voices end up mixed into one audio track. Turning that into meeting notes means listening back and writing down who said what.

Cloud transcription services like Otter.ai or the Whisper API are fast, but two things get in the way: cost, and the fact that **the entire meeting — content and voices included — gets uploaded to someone else's server**. That matters more for sensitive conversations: internal meetings, hiring interviews, customer calls.

Fortunately, on-device inference on Apple Silicon has gotten a lot better in the last couple of years. `mlx-whisper` gives Metal-accelerated speech recognition, and `pyannote.audio` runs speaker diarization fast enough locally. So we built a transcription pipeline that **finishes entirely on this laptop — no upload required**.

---

## What video2text does

Feed it one mp4 (or audio) file, and it runs the following pipeline to produce a transcript organized by speaker:

```
Extract audio → Speaker diarization → Transcription → Speaker matching → Render
```

```
[00:12:34] Alex: Hi everyone, let's start today's meeting.
[00:12:41] Jordan: Sure, I'll share last week's issues first.
```

Drag a file into the native macOS window (built with pywebview), or click to select one, and progress shows in real time — extract audio → diarize → transcribe → match speakers → done. Results download in three formats: TXT (an easy-to-read transcript), SRT (for video subtitles), and JSON (raw per-speaker blocks with timestamps).

---

## Core design principles

### 1. Fully local — nothing gets uploaded

Both speech recognition (`mlx-whisper`, `large-v3-turbo`) and speaker diarization (`pyannote/speaker-diarization-3.1`) run on-device with Apple Silicon Metal acceleration. Aside from a one-time model-weight download from HuggingFace / Apple (mlx-community) on first run, no file and no audio ever leaves the machine.

### 2. Automatic voice matching

video2text compares registered voice profiles — built from `speechbrain/spkrec-ecapa-voxceleb` speaker embeddings — against the diarization output, so the transcript shows real names instead of "Speaker 1." Registering a profile takes entering a name and either reading a short prompt aloud for 10–20 seconds, or uploading an existing audio/video file. Register several colleagues and it matches all of them at once.

### 3. Job history & rematch/relabel

Every conversion is kept in a history. If a speaker match is slightly off, or you add a voice profile after the fact, you can **rematch** speakers or manually **relabel** them — without rerunning speech recognition and diarization from scratch. No need to repeat a pipeline that can take tens of minutes.

### 4. A fully self-contained app bundle

`video2text.app` bundles its own Python runtime, ffmpeg, and multi-gigabyte dependencies (torch, mlx-whisper, pyannote.audio, speechbrain) into one independent bundle. Delete the original project folder, move the app to `/Applications`, or AirDrop it to another Apple Silicon Mac — it keeps working (no Homebrew required). The only thing each Mac needs on its own is the user's HuggingFace token.

---

## Install

No build required: grab `video2text-v1.0.1-macos-arm64.zip` from the [latest release](https://github.com/neurosamAI/video2text/releases/latest), unzip it, and double-click `video2text.app`.

To build it from source instead:

```bash
git clone https://github.com/neurosamAI/video2text
cd video2text
./build.sh   # creates the venv, installs deps, and syncs video2text.app in one step
```

`pyannote/speaker-diarization-3.1` is a gated model on HuggingFace, so a one-time free account, license agreement, and access token are required. Paste the token into the Settings card at the top of the app.

On Apple Silicon (M2 Pro), a 2-hour recording takes roughly 15–40 minutes for diarization and 10–20 minutes for transcription — and there's no upload wait to add on top.

---

## License

video2text's own code is [MIT-licensed](https://github.com/neurosamAI/video2text/blob/main/LICENSE). The AI models it downloads at runtime each carry their own license (model weights aren't bundled in the repo — each user downloads them directly):

| Model | Purpose | License |
|---|---|---|
| `pyannote/speaker-diarization-3.1` | Speaker diarization | MIT |
| `mlx-community/whisper-large-v3-turbo` | Speech recognition | MIT |
| `speechbrain/spkrec-ecapa-voxceleb` | Speaker embedding (profile matching) | Apache 2.0 |

---

## neurosam.AI's second open-source project

video2text follows [Tow](/en/blog/2026/03/tow-cli-open-source-release/), the deployment tool we released last March, as neurosam.AI's **second open-source project**.

The principle is the same as with Tow — **we open-source the tools we use every day.** Recording team meetings, hiring interviews, and customer calls, then listening back later to write up notes, is a routine every team has. Founder and developer [Murry Jeong (comchangs)](https://github.com/comchangs) didn't want to upload those recordings to the cloud each time, so he built video2text over a weekend.

A good tool is too useful to keep to yourself. We hope it helps any team that wants a transcript without uploading their recordings.

---

## Contribute & feedback

video2text is released under the MIT license. Issues, PRs, and feedback are all welcome.

- **GitHub**: [github.com/neurosamAI/video2text](https://github.com/neurosamAI/video2text)
- **Docs**: [video2text.neurosam.ai](https://video2text.neurosam.ai)
- **Open-source catalog**: [oss.neurosam.ai](https://oss.neurosam.ai)
- **Email**: [oss@neurosam.ai](mailto:oss@neurosam.ai)

---

*Created by [Murry Jeong (comchangs)](https://github.com/comchangs) — Supported by [neurosam.AI](https://neurosam.ai)*
