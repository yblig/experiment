// Story presets. Each becomes a new chat when picked.
const m = (from, text, extra = {}) => ({ kind: 'msg', from, text, ...extra });
const t = text => ({ kind: 'time', text });
const typing = from => ({ kind: 'typing', from });

export const PRESETS = [
  {
    key: 'kfc', title: 'Ayam Gratis', emoji: 'KFC', desc: 'KFC ngasih syarat yang mustahil',
    template: 'imessage', dark: true, contact: { name: 'KFC', status: 'online', handle: '@kfc', unread: '3' },
    clock: '19:32',
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
    key: 'horror', title: 'Nomor Tak Dikenal', emoji: '?', desc: 'Chat horor tengah malam',
    template: 'whatsapp', dark: true, contact: { name: '+62 812-0000-1313', status: 'online', handle: '@unknown', unread: '1' },
    clock: '00:13',
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
    key: 'mama', title: 'Mama Nanya Nilai', emoji: 'M', desc: 'Ngeles dari pertanyaan rapor',
    template: 'whatsapp', dark: false, contact: { name: 'Mama', status: 'online', handle: '@mama', unread: '2' },
    clock: '16:05',
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
    key: 'mantan', title: 'Mantan Balik', emoji: 'EX', desc: 'Si dia tiba-tiba chat lagi',
    template: 'x', dark: true, contact: { name: 'mantan', status: 'online', handle: '@sidia_', unread: '1' },
    clock: '23:47',
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
    key: 'bos', title: 'Izin ke Bos', emoji: 'B', desc: 'Alasan nggak masuk kerja',
    template: 'imessage', dark: false, contact: { name: 'Pak Bos', status: 'online', handle: '@pakbos', unread: '12' },
    clock: '06:30', meColor: '#30d158',
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
    key: 'salah', title: 'Salah Kirim', emoji: 'SK', desc: 'Curhat malah ke grup kelas',
    template: 'whatsapp', dark: false, contact: { name: 'XII IPA 2 (Resmi)', status: 'Bu Rina, Dimas, Sari, Kamu', handle: '@kelas', unread: '' },
    clock: '21:20',
    messages: [
      t('HARI INI'),
      m('them', 'Besok ulangan fisika bab 3 ya anak-anak', { time: '21:02' }),
      m('me', 'aduh males bgt sama bu rina, ngajarnya bikin ngantuk', { time: '21:15', status: 'read' }),
      m('me', 'eh', { time: '21:15', status: 'read' }),
      m('me', 'EH SALAH GRUP', { time: '21:15', status: 'read' }),
      m('them', 'Bab 3 dan bab 4 ya.', { time: '21:17' }),
      m('them', 'Khusus kamu bab 1 sampai 10.', { time: '21:17' }),
      typing('them')
    ]
  }
];

export function presetToChat(p, uid) {
  return {
    title: p.title,
    template: p.template,
    dark: p.dark,
    contact: { avatar: null, ...p.contact },
    meColor: p.meColor || '#0a84ff',
    clock: p.clock,
    messages: p.messages.map(x => ({ from: 'them', text: '', time: p.clock, status: 'sent', ...x, id: uid() }))
  };
}
