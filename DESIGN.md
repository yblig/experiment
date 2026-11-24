# ChatSim — chat screenshot simulator

**Interpretation of the brief** ("aplikasi simulasi chat kayak gini, ada WhatsApp dan Twitter juga,
bisa ganti template, pakai preset"): an offline Android app to write a fake conversation and save it
as a realistic phone screenshot for text-story videos, memes and comics. Three switchable templates
(iMessage-style, WhatsApp-style, X/Twitter DM-style), light/dark, ready-made story presets, PNG export
(single image or step-by-step, one image per message, for videos).

## Screens
- **Beranda** — saved chats (card: template badge, title, last line, edited time). Empty state with
  illustration + "Buat chat" + "Lihat preset". FAB "+" → template picker sheet.
- **Preset** — grid of story presets with a live mini preview; tap → copies into your chats → editor.
- **Pengaturan** — app theme (system/light/dark), sound, vibration, default template, export
  resolution (2×/3×), delete all, about + fair-use note.
- **Editor** (stack, full screen) — top bar (back, title, chat settings, export); template chips +
  light/dark toggle; Pratinjau / Daftar segmented view. Preview: tap a bubble to edit. List: rows
  with up/down. Composer: side toggle (Aku/Dia), text field, "+" (time divider, typing indicator), send.
- Sheets: chat settings (name, photo, status/handle, unread badge, bubble colour, clock, battery,
  status bar, input bar, frame size), message edit (text, sender, time, status, move, duplicate,
  delete), export (save, share, step-by-step, progress).

## Data
`chats[]`: `{id,title,template,dark,contact{name,avatar,status,handle,unread},meColor,clock,battery,
showStatusBar,showInput,frame:'phone'|'auto',messages[{id,kind:'msg'|'time'|'typing',from,text,time,status}],updatedAt}`
persisted via `lib/storage.js` (key `chats`, version 1). Avatars resized to 256px JPEG data URLs.

## Art direction
App chrome: "Clean App" palette, accent violet `#7c6cff`, mint `#2fd6a3`, dark bg `#0f1117`, surface
`#1a1d27`, light bg `#f5f6fb`. Font Plus Jakarta Sans. 20px card radius, soft shadows, lucide icons.
Templates use Inter (iMessage, X) and Roboto (WhatsApp) at 390pt phone width; no third-party logos.

## Sound / haptics
tap (buttons), send (whoosh, adding my message), receive (notify, adding their message), delete,
toggle, open (sheets), success (export done), error. Haptics tap/light/success/error. Toggleable.

## v1.1 (40 new features)
Templates: + Telegram, Instagram DM, SMS Android (Material), Lock screen (notifications). Message types: text,
image, sticker, voice, call, location, contact, deleted; reply/quote, reaction, edited, link preview, big emoji.
Group chats (participants with colours), system message, unread divider, pinned bar, notification banner,
on-screen keyboard + draft text, custom wallpaper, verified badge, text size, watermark, charging icon.
Editor: undo/redo, script import (`Aku:` / `Nama:` / `---` / `*`), auto time, Play mode (screen recording),
9:16 frame export, copy as text, save as "Preset saya". Home: search, pin. Presets: random story, 14 stories.
Settings: backup/restore JSON (photos embedded). Photos stored as files in app data (`media/`).

## v1.2 (reference-style UI)
Chat settings follow the user's reference: round app grid (original icons, no logos) → Current time,
Text style, Bubble thickness, Unread count, Chat status + "Gunakan default", New status bar (iOS/Android),
Wallpaper tiles (default / your photo), Text size stepper. Editor is a full-height POV with a floating
Save button, POV size picker (TikTok 9:16 1080×1920, IG 4:5, 1:1, phone, long) and Play.
New templates: WhatsApp iPhone style, LINE, Messenger, Snapchat, Tinder, KakaoTalk (12 total).

## v1.3
MP4 export (src/video.js): scenes from Play mode rendered to PNG, typing dots animated via ph-0/1/2 classes,
H.264 1080x1920 30fps via WebCodecs + AAC (or Opus fallback) notification sounds mixed with OfflineAudioContext,
muxed with mp4-muxer, saved to Movies/ChatSim. Speed: Santai/Normal/Cepat.

## v1.4
Per-template message sounds (public/audio/chat/<template>_send|recv.wav, spec audio/chat_sfx.json), used by the
editor, Play mode and MP4 export. Settings: replace send/receive sound with the user's own audio file (stored in media/).

## v1.5
Per-template sound slots (settings.tplSounds[tpl].send|recv) with multi-file import that matches by file name;
leading silence of imported sounds is trimmed. User sound files stay on the phone (not bundled in the repo).

## v1.6
App language (Indonesia / English) via src/i18n.js: live DOM translation of UI text outside chat screenshots.
File pickers stay attached to the page while open (Android WebView could drop detached inputs).

## v2.0 (overnight)
Fixes: chat sounds use the unlocked audio-manager context and read imported files via Filesystem (Play mode timers and
file URLs were unreliable on Android); Sounds sheet ▶ shows a diagnostic. In-chat texts follow the language
(per chat: Ikuti aplikasi / Indonesia / English) incl. dividers, statuses, placeholders, lock screen.
40 features: drag reorder, multi-select bulk actions, find & replace, reply-to bar, auto-switch sender, emoji row,
quick phrases, retime all, mark all read, reply ideas, member photos, status presets, bubble colour, chat font,
signal/wifi/airplane, network label, 12/24h, forwarded, starred, view once, poll, document, video message,
*rich* text, @mentions, video music (6 tracks in public/audio/music), keyboard sounds, per-message pause,
video title, 720p/1080p + 30/60fps, watermark position/opacity, labels/folders, sorting, onboarding,
share/import one chat, random name/number, emoji avatar, auto dark by clock, play from here, full preview.
