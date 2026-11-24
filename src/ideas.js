// Canned reply ideas (offline) and random names / numbers.
export const IDEAS = {
  lucu: ['wkwkwk', 'HAH', 'serius lu?', 'aku ketawa tapi sedih', 'bentar aku mikir dulu', 'ga gitu konsepnya', 'astaga naga', 'ini beneran apa prank?', 'aku butuh penjelasan', 'kok bisa sih', 'yaudah deh', 'gas', 'ngakak parah', 'gimana gimana?', 'otw kabur'],
  horor: ['kamu siapa?', 'jangan bercanda', 'kok kamu tau?', 'aku di rumah sendirian', 'lampunya mati sendiri', 'barusan ada yang ketuk jendela', 'tolong jawab', 'aku takut', 'coba lihat ke belakang', 'itu bukan aku'],
  romantis: ['kangen', 'udah makan belum?', 'jangan lupa istirahat ya', 'aku seneng banget hari ini', 'kamu lucu deh', 'besok ketemu yuk', 'makasih ya', 'hati-hati di jalan', 'aku tunggu', '❤️'],
  drama: ['oh gitu', 'terserah', 'kamu berubah', 'aku capek', 'yaudah', 'kita perlu bicara', 'jadi selama ini kamu bohong?', 'aku kecewa', 'gapapa kok', 'serius kamu tega?']
};
export const randomIdea = (mood = 'lucu') => { const a = IDEAS[mood] || IDEAS.lucu; return a[Math.floor(Math.random() * a.length)]; };

const FIRST = ['Dimas', 'Sari', 'Bayu', 'Putri', 'Raka', 'Nabila', 'Fajar', 'Ayu', 'Kevin', 'Tasya', 'Rizky', 'Intan', 'Gilang', 'Nadia', 'Bima', 'Citra', 'Yoga', 'Dewi', 'Arif', 'Salsa'];
const LAST = ['Pratama', 'Saputra', 'Lestari', 'Wijaya', 'Hidayat', 'Permata', 'Nugroho', 'Kusuma', 'Maharani', 'Santoso'];
const pick = a => a[Math.floor(Math.random() * a.length)];
export const randomName = () => (Math.random() < 0.6 ? pick(FIRST) : `${pick(FIRST)} ${pick(LAST)}`);
export const randomPhone = () => `+62 8${pick(['11', '12', '13', '21', '22', '52', '53', '57', '78', '81', '95', '96'])}-${String(Math.floor(1000 + Math.random() * 9000))}-${String(Math.floor(1000 + Math.random() * 9000))}`;
export const STATUS_PRESETS = {
  id: ['online', 'terakhir dilihat baru saja', 'terakhir dilihat hari ini pukul 19.30', 'terakhir dilihat kemarin', 'ketuk di sini untuk info kontak'],
  en: ['online', 'last seen recently', 'last seen today at 7:30 PM', 'last seen yesterday', 'tap here for contact info']
};
