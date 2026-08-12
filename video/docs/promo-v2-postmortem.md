# Landing Page Promo Video v2 — Postmortem & Build Plan

## Postmortem: Why v1 Failed

### Root Cause
**v1 was built as a silent text slideshow because the render pipeline never included an audio generation step.** The Remotion composition (`LandingPromo.tsx`) contained only React visual components — no audio tracks, no TTS generation, no music bed, no SFX. The render command (`npx remotion render`) produced exactly what was asked: a video file with silent visual frames.

### Where the Script Was Dropped

| Script Requirement | What v1 Did | Why It Failed |
|---|---|---|
| Voiceover (150 wpm) | No audio generated | No TTS tool call; no audio file created; no `<Audio>` tag in Remotion |
| Music + SFX | Silence (−91 dB) | No music track added; no heartbeat SFX rendered |
| Product UI capture (Scene 3) | Text cards with emojis | No screen capture performed; no actual UI exists for most features |
| Designed scene visuals | Flat text on gradient background | No stock footage, no motion graphics, no camera movement |
| Word-level captions | Static text only | No caption burn-in; no sync to VO (no VO to sync to) |

### Pipeline Gap
The build process was:
1. Write React components → 2. Render with Remotion → 3. Output MP4

Missing steps:
- **Audio generation**: No TTS call for VO script
- **Music/SFX**: No audio assets composed or mixed
- **Visual asset creation**: No stock footage, no UI capture, no motion graphics
- **Caption sync**: No subtitle file generated from VO
- **Quality gates**: No automated checks on output

### Prevention
The acceptance gates in this doc (audio level, frame diversity, VO transcription, spec compliance) will catch this class of failure on every future render. No video ships without all gates passing.

---

## v2 Build Plan

### Features Actually Shipped vs. Script Scene 3

| Script Beat | Status | Action for v2 |
|---|---|---|
| Unfolding case engine (Mr. Alvarez) | **NOT shipped** — `landing/cases/` is empty | **CUT** |
| Drag findings → "Recognize Cues" | **NOT shipped** — no case engine | **CUT** |
| AI rationale panel (conversational) | **NOT shipped** — `tutor.js` is static Q&A | **CUT** |
| Readiness score report (6 dimensions) | **NOT shipped** — no scoring system | **CUT** |
| Spaced-repetition queue auto-filling | **NOT shipped** — no SRS feature | **CUT** |
| 3D Anatomy Lab (heart rotating, disease toggle) | **NOT shipped** — section marked "🚧 Coming Soon" | **CUT** |

**Result**: Scene 3's 6 product beats are ALL cut. v2 Scene 3 will show only what actually exists: the quiz system, study guides, and framework content — with honest framing.

### v2 Scene Structure

| Scene | Time | Content | Audio |
|---|---|---|---|
| Hook | 0:00–0:08 | Question wall + student at 1am (stock/AI imagery) | VO: "You've memorized thousands of facts..." + heartbeat SFX |
| Problem | 0:08–0:20 | Split-screen: static rationale vs. NGN case | VO: "Most prep hands you a question..." |
| Solution (Revised) | 0:20–0:48 | What actually ships: quiz system, 74 study guides, NGN framework, free checklist | VO: "Obioma trains clinical judgment with the NCSBN framework..." (honest, no unshipped features) |
| Proof | 0:48–0:58 | NCSBN framework badge + nurse review badge | VO: "Every case is built on the NCSBN framework..." |
| CTA | 0:58–1:15 | Student closing laptop, daylight, smiling. Logo + URL. | VO: "Stop memorizing. Start thinking like a nurse..." + heartbeat resolves to steady rhythm |

### Audio Pipeline
1. Generate VO per scene using TTS (ElevenLabs-style warm female/male voice)
2. Generate/acquire music bed (soft pulse, royalty-free)
3. Generate heartbeat SFX (hook + CTA)
4. Mix: music ducked under VO, SFX at beats
5. Burn captions synced to VO transcription
6. Output: 1920×1080, 70–80s, stereo audio

### Quality Gates (MUST ALL PASS)
- [ ] `ffmpeg volumedetect`: mean_volume −30 to −12 dB, max_volume > −6 dB
- [ ] `silencedetect`: no silent run > 2 seconds
- [ ] Frame diversity: <40% near-duplicate frames across full video
- [ ] VO transcription: >90% coverage of approved script
- [ ] Spec: 1920×1080, 70–80s, captions visible, CTA correct
