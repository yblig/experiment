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
