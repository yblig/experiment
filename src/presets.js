// Story presets + the random story generator. Each becomes a new chat when picked.
const m = (from, text, extra = {}) => ({ kind: 'msg', from, text, ...extra });
const t = text => ({ kind: 'time', text });
const sys = text => ({ kind: 'system', text });
const typing = (from, extra = {}) => ({ kind: 'typing', from, ...extra });
// group helper: g('Dimas', 'text') -> message from participant "Dimas"
const g = (name, text, extra = {}) => ({ kind: 'msg', from: 'them', sender: name, text, ...extra });

export const PRESETS = [
  {
    key: 'kfc', title: 'Ayam Gratis', desc: 'KFC ngasih syarat yang mustahil', lang: 'en',
    template: 'imessage', dark: true, contact: { name: 'KFC', status: 'online', handle: '@kfc', unread: '3' }, clock: '19:32',
    messages: [
      t('Today 7:32 PM'),
      m('them', 'Hey, want some free chicken?', { time: '19:32' }),
      m('me', 'YES PLEASE', { time: '19:32' }),
      m('me', 'Wait fr??', { time: '19:32' }),
      m('them', "For real. But there's one condition.", { time: '19:33' }),
      m('me', "What's the condition?", { time: '19:33' }),
      m('them', 'Easy. Just name all 11 herbs and spices in our secret recipe.', { time: '19:33' }),
      m('me', 'Salt?', { time: '19:34' }),
      m('them', "That's 1. Keep going.", { time: '19:34' }),
      m('me', 'Bro NOBODY knows that recipe', { time: '19:35' }),
      m('them', "Exactly. That's why it's free.", { time: '19:35' }),
      m('me', 'I hate you', { time: '19:36', status: 'read' }),
      typing('them')
    ]
  },
  {
    key: 'horror', title: 'Nomor Tak Dikenal', desc: 'Chat horor tengah malam',
    template: 'whatsapp', dark: true, contact: { name: '+62 812-0000-1313', status: 'online', handle: '@unknown', unread: '1' }, clock: '00:13',
    messages: [
      t('HARI INI'),
      m('them', 'kamu udah tidur?', { time: '00:09' }),
      m('me', 'siapa ya?', { time: '00:10', status: 'read' }),
      m('them', 'kok lampu kamarmu masih nyala', { time: '00:10' }),
      m('me', 'hah? kamu siapa sih', { time: '00:11', status: 'read' }),
      m('me', 'jangan becanda', { time: '00:11', status: 'read' }),
      m('them', 'aku nggak becanda', { time: '00:12' }),
      m('them', 'coba lihat ke jendela', { time: '00:12' }),
      m('me', 'jendela kamarku di lantai 2', { time: '00:13', status: 'read' }),
      m('them', 'iya. aku tahu.', { time: '00:13' }),
      typing('them')
    ]
  },
  {
    key: 'mama', title: 'Mama Nanya Nilai', desc: 'Ngeles dari pertanyaan rapor',
    template: 'whatsapp', dark: false, contact: { name: 'Mama', status: 'online', handle: '@mama', unread: '2' }, clock: '16:05',
    messages: [
      t('HARI INI'),
      m('them', 'Nak, rapor udah dibagi?', { time: '15:58' }),
      m('me', 'Udah ma', { time: '15:59', status: 'read' }),
      m('them', 'Rangking berapa?', { time: '15:59' }),
      m('me', 'Ma, menurut mama yang penting nilai atau kejujuran?', { time: '16:01', status: 'read' }),
      m('them', 'Kejujuran dong', { time: '16:01' }),
      m('me', 'Nah, aku jujur. Rangking 31 dari 32', { time: '16:02', status: 'read' }),
      m('them', 'Pulang.', { time: '16:03' }),
      m('them', 'Bawa sapu.', { time: '16:03' }),
      m('me', 'buat apa ma', { time: '16:04', status: 'read' }),
      m('them', 'Kamu jujur kan? Mama juga mau jujur', { time: '16:05' })
    ]
  },
  {
    key: 'mantan', title: 'Mantan Balik', desc: 'Si dia tiba-tiba chat lagi',
    template: 'x', dark: true, contact: { name: 'mantan', status: 'online', handle: '@sidia_', unread: '1' }, clock: '23:47',
    messages: [
      t('Today'),
      m('them', 'hai', { time: '23:40' }),
      m('them', 'lagi apa?', { time: '23:40' }),
      m('me', 'lagi move on', { time: '23:42' }),
      m('them', 'aku kangen tau', { time: '23:43' }),
      m('me', 'kangen aku apa kangen dibayarin martabak?', { time: '23:44' }),
      m('them', 'dua duanya sih', { time: '23:45' }),
      m('them', 'tapi lebih ke martabak', { time: '23:45' }),
      m('me', 'blokir.', { time: '23:46', status: 'read' })
    ]
  },
  {
    key: 'bos', title: 'Izin ke Bos', desc: 'Alasan nggak masuk kerja',
    template: 'imessage', dark: false, contact: { name: 'Pak Bos', status: 'online', handle: '@pakbos', unread: '12' }, clock: '06:30', meColor: '#30d158',
    messages: [
      t('Today 6:12 AM'),
      m('me', 'Pagi pak, saya izin nggak masuk hari ini', { time: '06:12' }),
      m('them', 'Kenapa?', { time: '06:15' }),
      m('me', 'Nenek saya meninggal pak', { time: '06:16' }),
      m('them', 'Itu nenek yang ke berapa?', { time: '06:20' }),
      m('me', 'Maksudnya pak?', { time: '06:21' }),
      m('them', 'Tahun ini udah 4 kali nenekmu meninggal', { time: '06:22' }),
      m('me', 'Keluarga saya besar pak', { time: '06:25', status: 'read' }),
      typing('them')
    ]
  },
  {
    key: 'salah', title: 'Salah Kirim', desc: 'Curhat malah ke grup kelas',
    template: 'whatsapp', dark: false, group: true, contact: { name: 'XII IPA 2 (Resmi)', status: '', handle: '@kelas', unread: '' }, clock: '21:20',
    participants: ['Bu Rina', 'Dimas', 'Sari'],
    messages: [
      t('HARI INI'),
      g('Bu Rina', 'Besok ulangan fisika bab 3 ya anak-anak', { time: '21:02' }),
      g('Dimas', 'siap bu', { time: '21:03' }),
      m('me', 'aduh males bgt sama bu rina, ngajarnya bikin ngantuk', { time: '21:15', status: 'read' }),
      m('me', 'EH SALAH GRUP', { time: '21:15', status: 'read' }),
      { kind: 'msg', from: 'me', type: 'deleted', text: '', time: '21:16' },
      g('Sari', '💀💀💀', { time: '21:16' }),
      g('Bu Rina', 'Bab 3 dan bab 4 ya.', { time: '21:17' }),
      g('Bu Rina', 'Khusus kamu bab 1 sampai 10.', { time: '21:17', reaction: '😂' }),
      typing('them', { sender: 'Dimas' })
    ]
  },
  // ---- new in 1.1 ----
  {
    key: 'keluarga', title: 'Grup Keluarga', desc: 'Om kirim hoaks, semua heboh',
    template: 'whatsapp', dark: true, group: true, contact: { name: 'Keluarga Besar 🏠', status: '', handle: '@keluarga', unread: '' }, clock: '07:45',
    participants: ['Om Budi', 'Tante Lina', 'Mama'],
    messages: [
      t('HARI INI'),
      g('Om Budi', 'BREAKING NEWS!!! Mulai besok matahari terbit dari barat. Sebarkan!!!', { time: '07:30' }),
      g('Tante Lina', 'Astaga beneran om?', { time: '07:31' }),
      g('Mama', 'Nak, ini bener?', { time: '07:33' }),
      m('me', 'Ma itu hoaks', { time: '07:35', status: 'read', replyToIdx: 1 }),
      g('Om Budi', 'Kamu tahu apa, om dapet dari grup sebelah', { time: '07:36' }),
      m('me', 'Om, grup sebelah itu grup om sendiri', { time: '07:38', status: 'read' }),
      sys('Om Budi keluar'),
      g('Mama', '😭😭', { time: '07:44' })
    ]
  },
  {
    key: 'ojol', title: 'Driver Nyasar', desc: 'Ojol muter-muter cari alamat',
    template: 'telegram', dark: false, contact: { name: 'Pak Driver', status: 'online', handle: '@driver', unread: '' }, clock: '12:20',
    messages: [
      t('Hari ini'),
      m('them', 'Selamat siang kak, saya sudah di titik jemput', { time: '12:10' }),
      m('me', 'Saya di depan alfamart pak, baju merah', { time: '12:11', status: 'read' }),
      m('them', 'Alfamart yang mana kak, di sini ada 3', { time: '12:13' }),
      m('me', 'Yang sebelahnya indomaret', { time: '12:14', status: 'read' }),
      m('them', 'Indomaretnya juga ada 3 kak', { time: '12:15' }),
      { kind: 'msg', from: 'them', type: 'voice', duration: '0:47', time: '12:17' },
      m('me', 'Pak saya lihat bapak muter 4 kali', { time: '12:19', status: 'read' }),
      m('them', 'Iya kak, saya juga lihat kakak 4 kali', { time: '12:20', edited: true })
    ]
  },
  {
    key: 'crush', title: 'Crush Salah Paham', desc: 'Niat ngajak jalan, malah…',
    template: 'instagram', dark: true, contact: { name: 'nadia', status: 'online', handle: '@nadia.rr', unread: '' }, clock: '20:14',
    messages: [
      t('Today 8:01 PM'),
      m('me', 'nad, sabtu ini kosong ga?', { time: '20:01', status: 'read' }),
      m('them', 'kosong kok, kenapa?', { time: '20:05' }),
      m('me', 'mau nonton bareng ga?', { time: '20:06' }),
      m('them', 'MAU BANGET', { time: '20:06', reaction: '❤️' }),
      m('them', 'aku ajak temen-temen ya biar rame', { time: '20:07' }),
      m('me', 'oh', { time: '20:09' }),
      m('me', 'iya boleh', { time: '20:09' }),
      m('them', 'sekalian ajak kakakmu dong, dia lucu', { time: '20:12' }),
      m('me', '🙂', { time: '20:14', status: 'read' })
    ]
  },
  {
    key: 'pinjam', title: 'Teman Pinjam Duit', desc: 'Janji balikin "besok"',
    template: 'whatsapp', dark: false, contact: { name: 'Rizky (Bestie)', status: 'terakhir dilihat hari ini pukul 03.12', handle: '@rizky', unread: '' }, clock: '10:30',
    messages: [
      t('3 BULAN LALU'),
      m('them', 'bro pinjem 200 dulu, besok gw balikin sumpah', { time: '19:02' }),
      m('me', 'oke, besok ya', { time: '19:05', status: 'read' }),
      t('HARI INI'),
      m('me', 'bro, "besok" lu kapan?', { time: '10:21', status: 'read' }),
      { kind: 'msg', from: 'them', type: 'call', call: 'missed-voice', time: '10:22' },
      m('them', 'eh maaf tadi kepencet', { time: '10:24' }),
      m('them', 'btw bisa pinjem 300 lagi ga? biar sekalian', { time: '10:25' }),
      m('me', 'sekalian apa?', { time: '10:26', status: 'read' }),
      m('them', 'sekalian ga gw balikin', { time: '10:30' })
    ]
  },
  {
    key: 'dosen', title: 'Chat Dosen', desc: 'Telat kirim tugas jam 23:59',
    template: 'telegram', dark: true, contact: { name: 'Dr. Hendra, M.Kom', status: 'terakhir dilihat baru saja', handle: '@hendra', unread: '' }, clock: '00:03', verified: false,
    messages: [
      t('Hari ini'),
      m('me', 'Selamat malam pak, mohon maaf saya ingin mengirim tugas', { time: '23:58', status: 'read' }),
      m('me', 'Tadi wifi kos saya mati pak', { time: '23:59', status: 'read' }),
      m('them', 'Batasnya jam berapa?', { time: '00:01' }),
      m('me', '23.59 pak', { time: '00:01', status: 'read' }),
      m('them', 'Sekarang jam berapa?', { time: '00:02' }),
      m('me', 'Di hati saya masih 23.59 pak', { time: '00:02', status: 'read' }),
      m('them', 'Di nilai kamu sudah E.', { time: '00:03' })
    ]
  },
  {
    key: 'kucing', title: 'Kucing Punya HP', desc: 'Kucingmu tiba-tiba bisa chat',
    template: 'imessage', dark: true, contact: { name: 'Oyen 🐱', status: 'online', handle: '@oyen', unread: '9' }, clock: '03:12',
    messages: [
      t('Today 3:02 AM'),
      m('them', 'bangun', { time: '03:02' }),
      m('them', 'BANGUN', { time: '03:02' }),
      m('me', 'oyen?? kamu bisa ngetik???', { time: '03:05' }),
      m('them', 'mangkuk makan kosong. ini darurat', { time: '03:05' }),
      m('me', 'jam 3 pagi yen', { time: '03:06' }),
      m('them', 'aku tunggu 5 menit. kalau tidak, vas bunga mama jatuh', { time: '03:07' }),
      m('them', '"jatuh sendiri"', { time: '03:07', reaction: '‼️' }),
      m('me', 'otw', { time: '03:12', status: 'read' })
    ]
  },
  {
    key: 'lockscreen', title: 'Notif Jam 3 Pagi', desc: 'Layar kunci penuh chat misterius',
    template: 'lock', dark: true, contact: { name: 'Nomor Tidak Dikenal', status: '', handle: '@unknown', unread: '' }, clock: '03:00',
    messages: [
      m('them', 'kamu udah tidur?', { time: '02:51' }),
      m('them', 'aku di depan', { time: '02:55' }),
      m('them', 'bukain pintunya', { time: '02:58' }),
      m('them', 'aku tahu kamu belum tidur. layar HPmu nyala.', { time: '03:00' })
    ]
  },
  {
    key: 'kurir', title: 'Kurir Paket', desc: 'Paket dititip di tempat aneh',
    template: 'sms', dark: false, contact: { name: 'Kurir Ekspres', status: '', handle: '@kurir', unread: '' }, clock: '14:22',
    messages: [
      t('Hari ini'),
      m('them', 'Selamat siang, paket atas nama Anda sudah sampai', { time: '14:05' }),
      m('me', 'Saya lagi di kantor pak, bisa dititip?', { time: '14:06', status: 'read' }),
      m('them', 'Bisa kak, saya titip di tempat aman', { time: '14:08' }),
      m('me', 'Di mana pak?', { time: '14:15', status: 'read' }),
      { kind: 'msg', from: 'them', type: 'location', place: 'Di atas genteng', address: 'Biar aman dari maling kak', time: '14:20' },
      m('me', 'PAK', { time: '14:22', status: 'read' })
    ]
  }
];

export function presetToChat(p, uid) {
  const parts = (p.participants || []).map((name, i) => ({ id: uid(), name, color: ['#ff6b6b', '#20c997', '#4dabf7', '#ffa94d', '#b197fc'][i % 5], avatar: null }));
  const pid = name => parts.find(x => x.name === name)?.id;
  const ids = p.messages.map(() => uid());
  return {
    title: p.title,
    template: p.template,
    dark: p.dark,
    group: !!p.group,
    lang: p.lang || 'auto',
    verified: !!p.verified,
    participants: parts,
    contact: { avatar: null, ...p.contact },
    meColor: p.meColor || '#0a84ff',
    clock: p.clock,
    messages: p.messages.map((x, i) => {
      const { replyToIdx, ...rest } = x;
      const out = { from: 'them', text: '', time: p.clock, status: 'sent', ...rest, id: ids[i] };
      if (x.sender) out.sender = pid(x.sender);
      if (replyToIdx != null) out.replyTo = ids[replyToIdx];
      return out;
    })
  };
}

// ---------- random story generator ----------
const pick = a => a[Math.floor(Math.random() * a.length)];
const NAMES = ['Dimas', 'Sari', 'Bayu', 'Putri', 'Raka', 'Nabila', 'Fajar', 'Ayu', 'Kevin', 'Tasya', 'Unknown', 'Mama', 'Pak RT', 'Bestie'];
const STORIES = [
  // [genre, lines...] — 'A' = me, 'B' = them
  ['Lucu', [['B', 'kamu lagi di mana?'], ['A', 'di rumah, kenapa?'], ['B', 'aku di depan rumahmu'], ['A', 'serius??'], ['B', 'iya, bukain pintu'], ['A', 'aku nggak punya pintu warna hijau'], ['B', 'eh berarti aku salah rumah'], ['B', 'pantes yang bukain bapak-bapak']]],
  ['Lucu', [['A', 'aku diet mulai hari ini'], ['B', 'semangat!'], ['A', 'udah 3 jam nggak makan'], ['B', 'hebat'], ['A', 'karena tidur'], ['B', '...']]],
  ['Lucu', [['B', 'pinjem charger dong'], ['A', 'punyaku type C'], ['B', 'hpku juga'], ['A', 'tapi charger ku tinggal kabel'], ['B', 'kepalanya?'], ['A', 'dipinjem kamu minggu lalu'], ['B', 'oh iya hehe']]],
  ['Horor', [['B', 'jangan nengok ke belakang'], ['A', 'siapa ini?'], ['B', 'aku bilang jangan nengok'], ['A', 'aku sendirian di kamar'], ['B', 'yakin?'], ['A', 'berhenti ya, nggak lucu'], ['B', 'kenapa kamu matiin lampu?'], ['A', 'aku nggak matiin lampu']]],
  ['Horor', [['B', 'kamu udah pulang?'], ['A', 'udah dari tadi'], ['B', 'terus yang di sebelahku di kelas siapa?'], ['A', 'jangan becanda'], ['B', 'dia pakai baju kamu'], ['B', 'dia senyum ke aku']]],
  ['Romantis', [['A', 'aku mau ngomong sesuatu'], ['B', 'apa?'], ['A', 'dari dulu aku suka sama kamu'], ['B', 'serius?'], ['A', 'serius'], ['B', 'aku juga'], ['A', 'beneran??'], ['B', 'iya, aku juga suka sama aku']]],
  ['Romantis', [['B', 'kamu tau nggak bedanya kamu sama jam?'], ['A', 'apa?'], ['B', 'jam muter terus'], ['B', 'kamu muter di kepalaku terus'], ['A', 'gombal'], ['B', 'tapi berhasil kan?'], ['A', 'dikit']]],
  ['Drama', [['B', 'kita perlu bicara'], ['A', 'kenapa?'], ['B', 'aku lihat story kamu tadi'], ['A', 'yang mana?'], ['B', 'kamu makan bakso tanpa aku'], ['A', 'cuma bakso'], ['B', 'BAKSO ITU JANJI KITA'], ['A', 'oke aku beliin sekarang']]]
];
const TPLS = ['imessage', 'whatsapp', 'telegram', 'instagram', 'x', 'sms'];

export function randomPreset() {
  const [genre, lines] = pick(STORIES);
  const name = pick(NAMES);
  const tpl = pick(TPLS);
  let h = 19 + Math.floor(Math.random() * 5), mm = Math.floor(Math.random() * 40);
  const clock = () => `${String(h % 24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  const msgs = [{ kind: 'time', text: tpl === 'whatsapp' ? 'HARI INI' : tpl === 'telegram' ? 'Hari ini' : 'Today' }];
  lines.forEach(([who, text]) => {
    if (Math.random() < 0.5) mm++;
    if (mm > 59) { mm = 0; h++; }
    msgs.push({ kind: 'msg', from: who === 'A' ? 'me' : 'them', text, time: clock(), status: 'read' });
  });
  if (Math.random() < 0.5) msgs.push({ kind: 'typing', from: 'them' });
  return {
    key: 'rnd', title: `${genre}: ${name}`, template: tpl, dark: Math.random() < 0.65,
    contact: { name, status: 'online', handle: '@' + name.toLowerCase().replace(/\s+/g, ''), unread: String(1 + Math.floor(Math.random() * 9)) },
    clock: clock(), messages: msgs
  };
}
