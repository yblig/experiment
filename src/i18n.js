// App-language switcher. The UI is written in Indonesian; for other languages every visible text node,
// placeholder and aria-label outside the chat screenshots is translated live (MutationObserver), so React
// keeps rendering the original strings and nothing in the chat itself changes.
export const LANGS = [['id', 'Indonesia'], ['en', 'English']];

const EN = {
  'Chat Saya': 'My Chats', 'Preset': 'Presets', 'Pengaturan': 'Settings', 'Bikin chat buat cerita, video & meme': 'Make chats for stories, videos & memes',
  'Belum ada chat': 'No chats yet', 'Tulis percakapan, pilih gaya iMessage, WhatsApp atau X, lalu simpan jadi screenshot.': 'Write a conversation, pick an iMessage, WhatsApp or X style, then save it as a screenshot.',
  'Buat chat baru': 'New chat', 'Pakai preset cerita': 'Use a story preset', 'Chat kamu': 'Your chats', 'Hasil pencarian': 'Search results',
  'Cari judul, nama, atau isi chat': 'Search title, name or messages', 'Belum ada pesan': 'No messages yet', 'baru saja': 'just now', 'pesan': 'messages',
  'Sematkan di atas': 'Pin to top', 'Lepas sematan': 'Unpin', 'Duplikat': 'Duplicate', 'Hapus': 'Delete', 'Chat dihapus': 'Chat deleted', 'URUNGKAN': 'UNDO',
  'Chat diduplikat': 'Chat duplicated', 'Chat disematkan di atas': 'Chat pinned to top', 'Sematan dilepas': 'Unpinned', 'Chat baru': 'New chat',
  'Cerita siap pakai, tinggal edit & simpan': 'Ready-made stories, just edit & save', 'Ide acak': 'Random idea', 'Pakai': 'Use', 'Acak lagi': 'Shuffle',
  'Semua preset': 'All presets', 'Preset saya': 'My presets', 'Hapus preset': 'Delete preset', 'Preset dihapus': 'Preset deleted', 'Cerita acak ditambahkan': 'Random story added',
  'Preset disalin ke "Chat Saya", jadi aslinya tetap utuh. Ganti nama, foto profil, dan template sesukamu.': 'Presets are copied into "My Chats", so the original stays intact. Change names, photos and templates as you like.',
  'Tampilan': 'Appearance', 'Tema aplikasi': 'App theme', 'Ikuti HP': 'System', 'Terang': 'Light', 'Gelap': 'Dark', 'Template default': 'Default template',
  'Untuk chat baru dari tombol +': 'For new chats from the + button', 'Resolusi gambar': 'Image resolution', 'Sedang (2×)': 'Medium (2×)', 'Tajam (3×)': 'Sharp (3×)',
  '1170 px lebar, paling tajam': '1170 px wide, sharpest', '780 px lebar, file lebih kecil': '780 px wide, smaller file', 'Suara & getar': 'Sound & vibration',
  'Efek suara': 'Sound effects', 'Getar': 'Vibration', 'Suara per aplikasi': 'Sounds per app', 'Bawaan · impor suaramu sendiri': 'Default · import your own sounds',
  'Tiap template punya suara kirim/terima khasnya sendiri, dipakai di editor, Mode Putar, dan video MP4. Mau pakai suara lain? Pilih file suaramu sendiri (mp3/ogg/wav/m4a).':
    'Each template has its own send/receive sound, used in the editor, Play mode and MP4 video. Want different sounds? Pick your own audio files (mp3/ogg/wav/m4a).',
  'Data': 'Data', 'Cadangkan semua chat': 'Back up all chats', 'Simpan file .json (termasuk foto) untuk dipindah ke HP lain': 'Save a .json file (photos included) to move to another phone',
  'Pulihkan dari file': 'Restore from file', 'Chat dari cadangan ditambahkan, yang ada tetap aman': 'Chats from the backup are added, existing ones stay', 'Hapus semua chat': 'Delete all chats',
  'Hapus semua chat?': 'Delete all chats?', 'Batal': 'Cancel', 'Semua chat dihapus': 'All chats deleted', 'Tentang': 'About', 'Semua dibuat & disimpan offline di HP kamu': 'Everything is made & stored offline on your phone',
  'ChatSim dibuat untuk cerita fiksi, video, komik, dan meme. Jangan dipakai untuk menipu, memfitnah, atau mengaku-ngaku chat asli orang lain. Template hanya meniru gaya tampilan dan tidak berafiliasi dengan aplikasi mana pun.':
    'ChatSim is for fiction, videos, comics and memes. Do not use it to deceive, defame or pass off fake chats as someone\'s real messages. Templates only imitate a visual style and are not affiliated with any app.',
  'Bahasa aplikasi': 'App language', 'Cadangan siap dibagikan': 'Backup ready to share', 'File diunduh': 'File downloaded',
  'Pilih aplikasi': 'Choose app', 'Template bisa diganti kapan saja lewat tombol pengaturan di editor, isi chat tetap sama.': 'You can switch templates any time from the editor settings; the messages stay the same.',
  'Kembali': 'Back', 'Urungkan': 'Undo', 'Ulangi': 'Redo', 'Daftar pesan': 'Message list', 'Lainnya': 'More', 'Simpan': 'Save', 'Putar': 'Play', 'Video': 'Video',
  'Ketuk gelembung untuk mengedit': 'Tap a bubble to edit', 'Tulis pesan pertama di bawah ↓': 'Write the first message below ↓',
  'Belum ada pesan. Tulis di bawah, atau impor naskah dari menu +.': 'No messages yet. Type below, or import a script from the + menu.',
  'WAKTU': 'TIME', 'INFO': 'INFO', 'BARU': 'NEW', 'AKU': 'ME', 'DIA': 'THEM', 'sedang mengetik…': 'typing…', 'Aku': 'Me', 'Dia': 'Them',
  'Pesan dari aku…': 'Message from me…', 'Kirim': 'Send', 'Tambah': 'Add', 'Foto': 'Photo', 'Stiker': 'Sticker', 'Lokasi': 'Location', 'Kontak': 'Contact',
  'Voice note': 'Voice note', 'Telepon': 'Call', 'Dihapus': 'Deleted', 'Pembatas waktu': 'Time divider', 'Pembatas "belum dibaca"': '"Unread" divider', 'Pesan sistem': 'System message',
  'Impor naskah teks': 'Import text script', 'Tukar semua sisi (aku ↔ dia)': 'Swap all sides (me ↔ them)', 'Hapus semua pesan': 'Delete all messages', 'Semua pesan dihapus': 'All messages deleted',
  'Impor naskah': 'Import script', 'Tempel atau ketik naskahmu di atas.': 'Paste or type your script above.', 'Ganti semua': 'Replace all', 'Tambahkan': 'Add', 'Chat diganti dengan naskah': 'Chat replaced with script',
  'Satu baris satu pesan.': 'One line per message.', 'untuk pesanmu,': 'for your messages,', 'untuk lawan bicara (2 nama atau lebih otomatis jadi grup).': 'for the other person (2+ names become a group).',
  'pembatas waktu ·': 'time divider ·', 'pesan sistem ·': 'system message ·', 'sedang mengetik': 'typing', 'Nama:': 'Name:', 'Aku:': 'Me:', 'Dia: ...': 'Them: ...',
  'Edit pesan': 'Edit message', 'Indikator mengetik': 'Typing indicator', 'Pembatas belum dibaca': 'Unread divider', 'Jenis': 'Type', 'Teks': 'Text', 'Suara': 'Audio',
  'Isi pesan': 'Message', 'Keterangan foto (boleh kosong)': 'Photo caption (optional)', 'Ganti foto': 'Change photo', 'Pilih foto': 'Choose photo', 'Durasi': 'Duration',
  'Jenis panggilan': 'Call type', 'Tak terjawab': 'Missed', 'Video tak terjawab': 'Missed video', 'Dikirim oleh': 'Sent by', 'Jam': 'Time', 'Status': 'Status',
  'Terkirim': 'Sent', 'Diterima': 'Delivered', 'Dibaca': 'Read', 'Reaksi': 'Reaction', 'lain': 'other', 'Membalas pesan': 'Replying to', 'Pilih pesan yang dibalas': 'Choose the message being replied to',
  'Hapus balasan': 'Remove reply', 'Tandai "diedit"': 'Mark as "edited"', 'Naik': 'Up', 'Turun': 'Down', 'Salin': 'Copy', 'Selesai': 'Done', 'Pesan dihapus': 'Message deleted',
  'Nama tempat': 'Place name', 'Alamat': 'Address', 'Nomor': 'Number', 'Judul pratinjau link': 'Link preview title', 'Judul halaman': 'Page title',
  'Ukuran POV': 'POV size', 'TikTok / Reels / Shorts': 'TikTok / Reels / Shorts', 'Instagram feed': 'Instagram feed', 'Kotak': 'Square', 'Layar HP penuh': 'Full phone screen',
  'Seperti screenshot asli': 'Like a real screenshot', 'Panjang (semua pesan)': 'Long (all messages)', 'Tinggi mengikuti isi chat': 'Height follows the chat', 'Layar HP': 'Phone', 'Panjang': 'Long',
  'Mode terang': 'Light mode', 'Mode gelap': 'Dark mode', 'Jam sekarang': 'Current time', 'Jam layar kunci': 'Lock screen time', 'Gaya teks': 'Text style', 'Normal': 'Normal',
  'Tebal': 'Bold', 'Miring': 'Italic', 'Tebal miring': 'Bold italic', 'Ketebalan gelembung': 'Bubble thickness', 'Tipis': 'Thin', 'Original': 'Original', 'Pesan belum dibaca': 'Unread messages',
  'Status obrolan': 'Chat status', 'Gunakan': 'Use', 'default': 'default', 'Bilah status baru': 'New status bar', 'Wallpaper': 'Wallpaper', 'Gunakan default': 'Use default', 'Foto Anda': 'Your photo',
  'Ukuran teks': 'Text size', 'Kecilkan': 'Smaller', 'Besarkan': 'Bigger', 'Profil': 'Profile', 'Judul (hanya di aplikasi)': 'Title (only in the app)', 'Foto profil': 'Profile photo',
  'Foto profil grup': 'Group photo', 'Hapus foto': 'Remove photo', 'Nama kontak': 'Contact name', 'Nama grup': 'Group name', 'Username': 'Username', 'Warna gelembung aku': 'My bubble colour',
  'Chat grup': 'Group chat', 'Banyak anggota dengan nama berwarna': 'Several members with coloured names', 'Anggota (ketuk titik untuk ganti warna)': 'Members (tap the dot to change colour)',
  'Tambah anggota': 'Add member', 'Hapus anggota': 'Remove member', 'Warna': 'Colour', 'Nama aplikasi di notifikasi': 'App name in notifications', 'Warna ikon': 'Icon colour',
  'Pesan tersemat (kosongkan untuk menyembunyikan)': 'Pinned message (leave empty to hide)', 'mis. Jangan lupa bayar kas 20rb': 'e.g. Don\'t forget the meeting at 7',
  'Teks draft di kolom ketik': 'Draft text in the input box', 'Diketik tapi belum dikirim…': 'Typed but not sent…', 'Tampilkan keyboard': 'Show keyboard', 'Notifikasi pop-up': 'Pop-up notification',
  'Banner pesan masuk di atas layar': 'Incoming-message banner at the top', 'Pengirim notifikasi': 'Notification sender', 'Waktu': 'Time', 'Isi notifikasi (kosong = pesan terakhir dia)': 'Notification text (empty = their last message)',
  'Watermark (kosongkan untuk mematikan)': 'Watermark (leave empty to turn off)', '@akunmu': '@youraccount', 'Centang verifikasi': 'Verified badge', 'Jam otomatis naik': 'Auto-advance time',
  'Pesan baru +1 menit dari pesan sebelumnya': 'New messages +1 minute after the previous one', 'Baterai sedang di-cas': 'Battery charging', 'Tampilkan status bar': 'Show status bar', 'Tampilkan kolom ketik': 'Show input bar',
  'Simpan & lainnya': 'Save & more', 'Bingkai video 9:16': '9:16 video frame', '1080×1920 dengan latar gradasi, pas buat TikTok/Reels': '1080×1920 on a gradient background, made for TikTok/Reels',
  'Simpan ke galeri': 'Save to gallery', 'Bagikan': 'Share', 'Kirim ke WhatsApp, TikTok, CapCut, dll.': 'Send to WhatsApp, TikTok, CapCut, etc.', 'Ekspor video MP4': 'Export MP4 video',
  'Animasi mengetik + suara, 1080×1920, siap TikTok': 'Typing animation + sounds, 1080×1920, ready for TikTok', 'Ekspor bertahap untuk video': 'Step-by-step export for video',
  'Mode Putar': 'Play mode', 'Pesan muncul satu-satu, tinggal rekam layar': 'Messages appear one by one, just screen-record', 'Simpan sebagai preset saya': 'Save as my preset',
  'Pakai lagi kapan saja dari tab Preset': 'Reuse it any time from the Presets tab', 'Salin sebagai teks': 'Copy as text', 'Format naskah, bisa diimpor lagi': 'Script format, can be imported again',
  'Naskah chat disalin': 'Chat script copied', 'Gagal menyalin': 'Copy failed', 'Tersimpan di Preset › Preset saya': 'Saved in Presets › My presets', 'Membuat gambar…': 'Rendering image…',
  'Membuka bagikan…': 'Opening share…', 'Menyimpan…': 'Saving…', 'Jangan tutup aplikasi dulu ya.': 'Please keep the app open.', 'Tambahkan pesan dulu': 'Add some messages first',
  'Kecepatan': 'Speed', 'Santai': 'Relaxed', 'Cepat': 'Fast', 'Suara notifikasi': 'Notification sounds', 'Pakai suara pilihanmu': 'Using your sounds', 'Latar': 'Background', 'Buat video': 'Make video',
  'Buat lagi': 'Make another', 'Menyiapkan…': 'Preparing…', 'Menyiapkan suara…': 'Preparing sound…', 'Menyelesaikan video…': 'Finishing video…', 'Menyimpan video…': 'Saving video…',
  'Video dibuat langsung di HP. Jangan tutup aplikasi dulu ya.': 'The video is made right on your phone. Please keep the app open.', 'Video diunduh': 'Video downloaded', 'Dibagikan': 'Shared',
  'HP ini belum mendukung pembuatan video': 'This phone can\'t make videos yet', 'Encoder H.264 tidak tersedia di HP ini': 'No H.264 encoder on this phone',
  ' · ganti di Pengaturan': ' · change in Settings', 'Ketuk layar untuk sembunyikan tombol, lalu rekam layar': 'Tap the screen to hide the buttons, then screen-record',
  'Tutup': 'Close', 'Ulang': 'Restart', 'Putar/Jeda': 'Play/Pause', 'Impor file suara (bisa banyak)': 'Import sound files (multiple)', 'Semua aplikasi': 'All apps',
  'Terima': 'Receive', 'Bawaan': 'Default', 'Dengar': 'Listen', 'Reset': 'Reset', 'Kembali ke suara bawaan template': 'Back to the template\'s default sound', 'File terlalu besar (maks 3 MB)': 'File too large (max 3 MB)',
  'File suara tidak bisa dibuka': 'Could not open the sound file', 'Foto tidak bisa dibuka': 'Could not open the photo', 'File bukan cadangan ChatSim': 'Not a ChatSim backup file',
  'Tekan kembali sekali lagi untuk keluar': 'Press back again to exit', 'Kamu memblokir kontak ini': 'You blocked this contact', 'Gambar diunduh': 'Image downloaded',
  'Gelembung biru/hijau': 'Blue/green bubbles', 'Centang & wallpaper': 'Ticks & wallpaper', 'Android / iPhone': 'Android / iPhone', 'Wallpaper gradasi': 'Gradient wallpaper', 'DM gaya IG': 'IG-style DMs',
  'DM gaya X': 'X-style DMs', 'Gaya Material': 'Material style', 'Notifikasi di lock screen': 'Lock-screen notifications', 'Tanpa gelembung': 'No bubbles', 'Jam di samping': 'Time beside bubble',
  'Chat match': 'Match chat', 'Gradasi biru-ungu': 'Blue-purple gradient', 'Gelembung kuning': 'Yellow bubbles', 'SMS Android': 'Android SMS', 'Layar Kunci': 'Lock screen', 'Grup': 'Group',
  "Selamat datang di ChatSim": "Welcome to ChatSim",
  "Bikin screenshot dan video chat buat cerita, konten TikTok, komik, dan meme. Semua dibuat offline di HP kamu.": "Make chat screenshots and videos for stories, TikTok content, comics and memes. Everything is made offline on your phone.",
  "Pilih aplikasinya": "Pick the app",
  "Ada 12 gaya: WhatsApp, iMessage, Telegram, Instagram, LINE, Messenger, Snapchat, Tinder, KakaoTalk, X, SMS, dan Layar Kunci. Bisa diganti kapan saja.": "12 styles: WhatsApp, iMessage, Telegram, Instagram, LINE, Messenger, Snapchat, Tinder, KakaoTalk, X, SMS and Lock screen. Switch any time.",
  "Tulis percakapannya": "Write the conversation",
  "Ketik pesan sebagai Aku atau Dia, ketuk gelembung untuk mengedit. Ada foto, voice note, polling, reaksi, balasan, grup, dan banyak lagi.": "Type as Me or Them and tap a bubble to edit. Photos, voice notes, polls, reactions, replies, groups and more.",
  "Simpan jadi gambar atau video": "Save as an image or video",
  "Tombol simpan untuk PNG, tombol Video untuk MP4 dengan animasi mengetik, suara notifikasi, dan musik.": "The save button makes a PNG; the Video button makes an MP4 with typing animation, notification sounds and music.",
  "Lewati": "Skip",
  "Lanjut": "Next",
  "Mulai bikin": "Get started",
  "Pilih banyak": "Select",
  "Batal pilih": "Cancel",
  "Pilih semua": "Select all",
  "Tahan ⋮⋮ untuk geser": "Hold ⋮⋮ to drag",
  "→ Aku": "→ Me",
  "→ Dia": "→ Them",
  "Ide": "Idea",
  "lucu": "funny",
  "horor": "horror",
  "romantis": "romantic",
  "drama": "drama",
  "Cari & ganti teks": "Find & replace",
  "Atur jam semua pesan": "Retime all messages",
  "Tandai semua pesanku dibaca": "Mark all my messages read",
  "Pilih banyak pesan": "Select messages",
  "Semua pesanmu ditandai dibaca": "All your messages marked read",
  "Cari & ganti": "Find & replace",
  "Cari": "Find",
  "Ganti dengan": "Replace with",
  "Ketik kata yang mau dicari, misalnya nama orang.": "Type the word to find, e.g. a name.",
  "Jam pesan pertama": "First message time",
  "Terapkan": "Apply",
  "Jam semua pesan diatur ulang": "All message times updated",
  "Video": "Video",
  "Sekali lihat": "View once",
  "Dokumen": "Document",
  "Polling": "Poll",
  "Nama file": "File name",
  "Ukuran": "Size",
  "Halaman": "Pages",
  "Pertanyaan polling": "Poll question",
  "Keterangan (boleh kosong)": "Caption (optional)",
  "Durasi video": "Video length",
  "Sudah dibuka": "Opened",
  "Pilihan (satu per baris, format: pilihan | jumlah suara, tambah * untuk pilihanmu)": "Options (one per line: option | votes, add * for your choice)",
  "Label \"diteruskan\"": "\"Forwarded\" label",
  "Berbintang": "Starred",
  "Balas ini": "Reply to this",
  "Putar dari sini": "Play from here",
  "Warna gelembung aku": "My bubble colour",
  "Font chat": "Chat font",
  "Bulat": "Rounded",
  "Sistem": "System",
  "Status bar HP": "Phone status bar",
  "Tanpa": "None",
  "Jam otomatis": "Auto time",
  "24 jam": "24-hour",
  "12 jam": "12-hour",
  "WiFi": "Wi-Fi",
  "Mode pesawat": "Airplane mode",
  "Gelap/terang otomatis dari jam": "Auto dark/light from the clock",
  "Gelap mulai 18.00 sampai 06.00": "Dark from 6 PM to 6 AM",
  "Format *tebal* _miring_ ~coret~ & @mention": "*bold* _italic_ ~strike~ & @mention formatting",
  "Pratinjau layar penuh": "Full-screen preview",
  "Lihat hasil persis seperti di HP": "See it exactly as on a phone",
  "Teks judul di video (mis. \"POV: kamu pinjam duit ke temen\")": "Title text on the video (e.g. \"POV: you lend a friend money\")",
  "Kosongkan kalau tidak perlu": "Leave empty if not needed",
  "Kotak putih": "White box",
  "Garis tepi": "Outline",
  "Musik latar": "Background music",
  "Lucu": "Funny",
  "Horor": "Horror",
  "Romantis": "Romantic",
  "Drama": "Drama",
  "Semangat": "Upbeat",
  "Kualitas": "Quality",
  "Frame rate": "Frame rate",
  "Suara ketikan keyboard": "Keyboard typing sound",
  "Sebelum pesanmu muncul": "Before your messages appear",
  "Atas": "Top",
  "Tengah": "Middle",
  "Bawah": "Bottom",
  "Pojok": "Corner",
  "Semua": "All",
  "Disematkan": "Pinned",
  "Terbaru": "Newest",
  "Judul A-Z": "Title A–Z",
  "Aplikasi": "App",
  "Label / folder": "Label / folder",
  "mis. Horor, Konten TikTok": "e.g. Horror, TikTok content",
  "Label dihapus": "Label removed",
  "Bagikan file chat (bisa diimpor di HP lain)": "Share chat file (import on another phone)",
  "Impor file chat (.json)": "Import chat file (.json)",
  "Nama acak": "Random name",
  "Nomor acak": "Random number",
  "Avatar emoji": "Emoji avatar",
  "Foto anggota": "Member photo",
  "Emoji & ide": "Emoji & ideas",
  "Batal balas": "Cancel reply",
  'Editor': 'Editor', 'Ganti pengirim otomatis': 'Auto-switch sender', 'Setelah kirim, giliran Aku ↔ Dia berganti sendiri': 'After sending, Me ↔ Them switches automatically', 'Frasa cepat': 'Quick phrases', 'Muncul di baris emoji editor, pisahkan dengan koma': 'Shown in the editor emoji row, separated by commas',
  'Lokasi saya': 'My location', 'Bahasa di dalam chat': 'Language inside the chat', 'Ikuti aplikasi': 'Follow app', 'Tulisan bawaan seperti Dibaca/Read, Hari ini/Today, mengetik/typing, kolom ketik. Isi pesanmu tidak diubah.': 'Built-in texts like Read, Today, typing and the input box. Your messages are not changed.', 'Hari ini': 'Today', 'Sedang (2×) ': 'Medium (2×)'
};

const EN_RX = [
  [/^1 chat$/, '1 chat'], [/^(\d+) chat$/, '$1 chats'], [/^1 pesan$/, '1 message'], [/^Daftar \((\d+)\)$/, 'List ($1)'], [/^Tambah \(dari Aku\)$/, 'Add (from me)'], [/^Tambah \(dari (.+)\)$/, 'Add (from $1)'],
  [/^Pesan dari (.+)…$/, 'Message from $1…'], [/^(.+) sedang mengetik…$/, '$1 is typing…'], [/^Membuat adegan (\d+) dari (\d+)$/, 'Rendering scene $1 of $2'],
  [/^Membuat gambar (\d+) dari (\d+)$/, 'Rendering image $1 of $2'], [/^"(.+)" ditambahkan$/, '"$1" added'], [/^Gaya (.+) · (\d+) pesan$/, '$1 style · $2 messages'],
  [/^Gaya (.+)$/, '$1 style'], [/^(\d+) pesan$/, '$1 messages'], [/^(\d+) menit lalu$/, '$1 min ago'], [/^(\d+) jam lalu$/, '$1 h ago'], [/^(\d+) cerita$/, '$1 stories'],
  [/^(\d+) item terbaca(.*)$/, '$1 items read$2'], [/^(\d+) chat dipulihkan$/, '$1 chats restored'], [/^(\d+) chat tersimpan di HP ini$/, '$1 chats saved on this phone'],
  [/^(\d+) pesan ditambahkan$/, '$1 messages added'], [/^(\d+) gambar · (.+)$/, '$1 images · $2'], [/^Video tersimpan di Galeri › (.+)$/, 'Video saved to Gallery › $1'],
  [/^Video tersimpan di (.+)$/, 'Video saved to $1'], [/^Tersimpan di Galeri › (.+)$/, 'Saved to Gallery › $1'], [/^Tersimpan di (.+)$/, 'Saved to $1'],
  [/^Terpasang: (.+)$/, m => 'Assigned: ' + m[1].replace(/\(kirim\)/g, '(send)').replace(/\(terima\)/g, '(receive)').replace(/Semua aplikasi/g, 'All apps')],
  [/^Baterai: (\d+)%$/, 'Battery: $1%'], [/^Kamu: ([\s\S]*)$/, 'You: $1'], [/^1 gambar tiap pesan baru \((\d+) gambar\)$/, '1 image per new message ($1 images)'],
  [/^1 gambar PNG (.+)$/, m => '1 PNG image, ' + ({ 'berbingkai 9:16': '9:16 framed', panjang: 'long', 'seukuran layar HP': 'phone-screen size' }[m[1]] || m[1])],
  [/^Resolusi: (\d+) px lebar\. Ubah di Pengaturan\.$/, 'Resolution: $1 px wide. Change it in Settings.'], [/^(\d+) suara pilihanmu terpasang$/, '$1 custom sounds set'],
  [/^Suara khas (.+)$/, '$1 sounds'], [/^Gagal: (.+)$/, 'Failed: $1'], [/^Gagal membuat video: (.+)$/, 'Could not make the video: $1'], [/^Suara diganti: (.+)$/, 'Sound changed: $1'],
  [/^ · (\d+) detik · (.+)$/, ' · $1 s · $2'], [/^Sedang \(2×\)$/, 'Medium (2×)'], [/^(.+) \(kanan\)$/, '$1 (right)'], [/^(.+) \(kiri\)$/, '$1 (left)'], [/^Aku \(kanan\)$/, 'Me (right)'],
  [/^Latar (\d+)$/, 'Background $1'], [/^(\d+) dipilih$/, '$1 selected'], [/^(\d+) ditemukan$/, '$1 found'], [/^(\d+) diganti$/, '$1 replaced'], [/^(\d+) pesan dihapus$/, '$1 messages deleted'], [/^Label: (.+)$/, 'Label: $1'],
  [/^Jarak antar pesan: (\d+) menit$/, 'Gap between messages: $1 min'], [/^Jeda sebelum pesan ini di video\/Mode Putar: (.+)$/, m => 'Pause before this message in video/Play mode: ' + m[1].replace('otomatis', 'auto').replace('detik', 's')], [/^Pesan dari aku…$/, 'Message from me…'], [/^(\d+) chat ditambahkan$/, '$1 chats added'],
  [/^Teks di bawah nama grup$/, 'Text under the group name'], [/^Status di bawah nama$/, 'Status under the name']
];

const DICTS = { en: [EN, EN_RX] };
let lang = 'id';
const orig = new WeakMap(); // node -> { src, out }
const ATTRS = ['placeholder', 'aria-label', 'title'];
const SKIP = '.shot, .offscreen, .player-stage, textarea, script, style';

function tr(src) {
  const d = DICTS[lang];
  if (!d) return src;
  const m = src.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const core = m[2];
  if (!core) return src;
  let out = d[0][core];
  if (out == null) {
    for (const [re, rep] of d[1]) {
      const mm = core.match(re);
      if (mm) { out = typeof rep === 'function' ? rep(mm) : core.replace(re, rep); break; }
    }
  }
  return out == null ? src : m[1] + out + m[3];
}

const SKIP_ATTR = '.shot, .offscreen, .player-stage';
function skip(el) { return !el || (el.closest && el.closest(SKIP)); }
function skipAttr(el) { return !el || (el.closest && el.closest(SKIP_ATTR)); }

function doText(node) {
  if (skip(node.parentElement)) return;
  const rec = orig.get(node);
  const cur = node.nodeValue;
  const src = rec && cur === rec.out ? rec.src : cur;
  const out = tr(src);
  orig.set(node, { src, out });
  if (out !== cur) node.nodeValue = out;
}
function doAttrs(el) {
  if (skipAttr(el)) return;
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const key = '__i18n_' + a;
    const cur = el.getAttribute(a);
    const src = el[key] && cur === el[key].out ? el[key].src : cur;
    const out = tr(src);
    el[key] = { src, out };
    if (out !== cur) el.setAttribute(a, out);
  }
}
function walk(root) {
  if (root.nodeType === 3) return doText(root);
  if (root.nodeType !== 1 || skipAttr(root)) return;
  doAttrs(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: n => (n.nodeType === 1 && n.matches(SKIP_ATTR) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
  });
  let n;
  while ((n = w.nextNode())) n.nodeType === 3 ? doText(n) : doAttrs(n);
}

let obs = null;
export function setLang(l) {
  lang = l || 'id';
  document.documentElement.lang = lang;
  if (!obs) {
    obs = new MutationObserver(list => {
      for (const m of list) {
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doAttrs(m.target);
        else m.addedNodes.forEach(walk);
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  walk(document.body);
}
export const getLang = () => lang;
