# Air Strum

Interpretation: "an app for playing guitar with the camera, where a hand posture plays a note, and much more".
Air Strum is a camera instrument: MediaPipe hand tracking (fully offline, model bundled) reads your hands
through the front camera. One hand's shape picks the chord, the other hand strums. Plus piano, drums and
theremin modes, a looper, backing beats and a chord challenge game. Everything also works by touch.

## Modes
- **Air Guitar** – chord hand: fist / 1-5 fingers = 6 chords of the chosen set. Strum hand crosses the
  strum line (down / up strokes, speed = loudness). One hand alone does both.
- **Air Piano** – pinch thumb to a finger = a note. Left hand pinky→index = notes 1-4, right hand index→pinky = 5-8.
- **Air Drums** – 6 pads (hi-hat, crash, snare, tom 1, tom 2, kick), hit by flicking a fingertip down onto a pad.
- **Theremin** – right hand height = pitch (2 octaves), left hand height = volume, fist = silence.
- **Chord Challenge** – 45 s round; a target chord appears, show the shape and strum it. Combo multiplier, best saved.

## Feature list (28)
1 Air guitar chords from hand shapes · 2 down/up strum detection · 3 strum speed → volume · 4 six chord sets
5 four guitar tones (acoustic, nylon, electric, overdrive) · 6 air piano pinch notes · 7 four scales + 7 keys
8 octave shift · 9 air drums with 6 pads · 10 theremin with 3 waveforms + scale snap · 11 glowing hand skeleton
12 finger counter HUD · 13 backing beat with 4 grooves · 14 BPM control · 15 looper (record + loop under live play)
16 saved takes library (play / delete) · 17 full touch mode · 18 front/back camera switch · 19 lefty mode
20 sensitivity setting · 21 camera dim slider · 22 note particles + glow · 23 haptics on notes · 24 illustrated how-to
25 persisted settings · 26 reverb control · 27 chord history strip · 28 chord challenge game with best score

## Art direction — "Stage Neon"
bg #0e0a1f, surface #1c1538, surface2 #2a2050, amp orange #ff6a3d, gold #ffc94a, teal #3ef0d0, pink #ff4f9a,
violet #b57cff, text #fff5ea, muted #b6a9d6. Rounded cards with soft inner glow, spotlights on the home screen,
Outfit font. Mode colours: guitar orange, piano teal, drums gold, theremin violet, challenge pink.

## Audio
All instruments synthesised live in Web Audio: Karplus-Strong guitar strings, additive piano, synthesised drum
kit, oscillator theremin, shared reverb + compressor. UI SFX from audio/sfx.json (sfx.mjs). No background
music: the instrument is the music; the backing beat replaces it.

## Saved
settings (volumes, reverb, tone, sensitivity, lefty, skeleton, dim, chord set, scale/key, theremin wave, bpm, groove),
takes (max 12), challenge best score, onboarding seen.
