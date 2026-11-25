import { Sumo, Coins, Soccer, Meteor, JumpBar } from './arena.js';
import { Tanks, Ships, Curve, Knife, Target, Bomb } from './battle.js';
import { Hockey, Pong, Race, Run, Tug, Golf } from './sports.js';
import { Cowboy, ColorTrap, MathQuick, Stop10, Mole, Stack } from './reflex.js';
import { Memory, XO, Connect4, Ladder, RPS } from './board.js';
import { Flappy, Sword } from './more.js';

// controls: 'button' (one button per player, default) | 'custom' (game handles touches)
// min/max: player slots; solo: total slots when only 1 human; wins: rounds to win (1 = one-off)
const A = 'music_game2';
export const GAMES = [
  // ---- Aksi
  { id: 'sumo', cls: Sumo, name: 'Sumo Dorong', icon: 'gi_sumo', cat: 'aksi', min: 2, max: 4, solo: 4, wins: 3, music: A,
    how: 'Panah berputar terus. Tekan tombolmu untuk menyeruduk! Dorong lawan keluar ring.' },
  { id: 'tank', cls: Tanks, name: 'Perang Tank', icon: 'gi_tank', cat: 'aksi', min: 2, max: 4, solo: 4, wins: 3, music: A,
    how: 'Tank berputar sendiri. Tekan = tembak, tahan = maju. Peluru memantul di dinding!' },
  { id: 'ship', cls: Ships, name: 'Pesawat Angkasa', icon: 'gi_ship', cat: 'aksi', min: 2, max: 4, solo: 3, wins: 3, music: A,
    how: 'Tekan = tembak laser, tahan = terbang maju. Hindari batu meteor dan tembak lawan!' },
  { id: 'snake', cls: Curve, name: 'Ular Kurva', icon: 'gi_snake', cat: 'aksi', min: 2, max: 4, solo: 4, wins: 3, music: A,
    how: 'Ularmu terus maju. Tahan tombol untuk belok. Jangan tabrak garis atau dinding!' },
  { id: 'meteor', cls: Meteor, name: 'Hujan Meteor', icon: 'gi_meteor', cat: 'aksi', min: 2, max: 4, solo: 4, wins: 3, music: A,
    how: 'Kamu terus berjalan. Tekan untuk belok. Jauhi lingkaran merah sebelum meteor jatuh!' },
  { id: 'knife', cls: Knife, name: 'Lempar Pisau', icon: 'gi_knife', cat: 'aksi', min: 2, max: 4, solo: 4, wins: 3,
    how: 'Tekan untuk melempar pisau ke kayu. Kena pisau lain = kalah! Jangan diam terlalu lama.' },
  { id: 'bomb', cls: Bomb, name: 'Bom Waktu', icon: 'gi_bomb', cat: 'aksi', min: 2, max: 4, solo: 4, wins: 2, music: A,
    how: 'Pegang bom? Tekan tombolmu untuk melempar ke orang lain sebelum meledak!' },
  { id: 'sword', cls: Sword, name: 'Duel Pedang', icon: 'gi_sword', cat: 'aksi', min: 2, max: 2, solo: 2, wins: 3, music: A,
    how: 'Ketuk = serang. Tahan = tangkis (perisai bisa pecah). Tangkis serangan lawan agar dia pusing!' },
  { id: 'coins', cls: Coins, name: 'Kumpul Koin', icon: 'gi_coins', cat: 'aksi', min: 2, max: 4, solo: 3, wins: 2,
    how: 'Tekan untuk meluncur ke arah panah. Ambil 6 koin duluan, hindari bom!' },
  { id: 'target', cls: Target, name: 'Tembak Target', icon: 'gi_target', cat: 'aksi', min: 2, max: 4, solo: 3, wins: 2,
    how: 'Meriammu bergoyang. Tekan untuk menembak. Kena target 5 kali duluan!' },
  { id: 'flappy', cls: Flappy, name: 'Burung Terbang', icon: 'gi_flappy', cat: 'aksi', min: 2, max: 4, solo: 2, wins: 3, controls: 'custom',
    how: 'Ketuk area warnamu untuk mengepak. Lewati pipa. Yang bertahan paling lama menang!' },
  // ---- Olahraga
  { id: 'soccer', cls: Soccer, name: 'Sepak Bola', icon: 'gi_soccer', cat: 'olahraga', min: 2, max: 4, even: true, solo: 2, wins: 3, team: true,
    how: 'Tekan untuk menendang ke arah panah. Masukkan bola ke gawang lawan! 4 pemain = 2 lawan 2.' },
  { id: 'hockey', cls: Hockey, name: 'Hoki Meja', icon: 'gi_hockey', cat: 'olahraga', min: 2, max: 2, solo: 2, wins: 1, controls: 'custom',
    how: 'Geser pemukul di sisimu. Masukkan keping ke gawang lawan. 7 gol menang!' },
  { id: 'pong', cls: Pong, name: 'Pingpong 4 Sisi', icon: 'gi_pong', cat: 'olahraga', min: 2, max: 4, solo: 4, wins: 2, controls: 'custom',
    how: 'Geser jari di sisimu untuk menggerakkan papan. Jangan biarkan bola lewat! 3 nyawa.' },
  { id: 'race', cls: Race, name: 'Balap Mobil', icon: 'gi_race', cat: 'olahraga', min: 2, max: 4, solo: 4, wins: 2, music: A,
    how: 'Tahan = gas, lepas = rem. Terlalu kencang di tikungan? Mobil selip! 3 putaran.' },
  { id: 'run', cls: Run, name: 'Lari Cepat', icon: 'gi_run', cat: 'olahraga', min: 2, max: 4, solo: 4, wins: 3, music: A,
    how: 'Tekan tombolmu secepat mungkin untuk berlari! Sampai garis finis duluan.' },
  { id: 'tug', cls: Tug, name: 'Tarik Tambang', icon: 'gi_tug', cat: 'olahraga', min: 2, max: 4, even: true, solo: 2, wins: 3, team: true,
    how: 'Tekan secepat mungkin untuk menarik tali ke sisimu! 4 pemain = 2 lawan 2.' },
  { id: 'golf', cls: Golf, name: 'Golf Mini', icon: 'gi_golf', cat: 'olahraga', min: 2, max: 4, solo: 2, wins: 1, controls: 'custom',
    how: 'Bergiliran. Tarik mundur dari mana saja lalu lepas untuk memukul. Pukulan paling sedikit menang!' },
  // ---- Refleks
  { id: 'cowboy', cls: Cowboy, name: 'Koboi Dor!', icon: 'gi_cowboy', cat: 'refleks', min: 2, max: 4, solo: 3, wins: 3,
    how: 'Tunggu tulisan DOR! lalu tekan secepatnya. Tekan terlalu cepat = gugur!' },
  { id: 'color', cls: ColorTrap, name: 'Warna Jebakan', icon: 'gi_color', cat: 'refleks', min: 2, max: 4, solo: 2, wins: 2,
    how: 'Tekan HANYA jika warna tulisan sama dengan katanya. Salah tekan = poin dikurangi!' },
  { id: 'stop10', cls: Stop10, name: 'Stop 10 Detik', icon: 'gi_stop10', cat: 'refleks', min: 2, max: 4, solo: 3, wins: 2,
    how: 'Jam akan hilang setelah 3 detik. Tekan tepat di detik ke-10. Paling dekat menang!' },
  { id: 'mole', cls: Mole, name: 'Pukul Tikus', icon: 'gi_mole', cat: 'refleks', min: 2, max: 4, solo: 2, wins: 1, controls: 'custom',
    how: 'Ketuk tikus di areamu! Tikus emas = +3, bom = -3. Poin terbanyak dalam 30 detik menang.' },
  { id: 'stack', cls: Stack, name: 'Tumpuk Balok', icon: 'gi_stack', cat: 'refleks', min: 2, max: 4, solo: 3, wins: 2,
    how: 'Bergiliran. Tekan untuk menjatuhkan balok tepat di atas menara. Meleset = gugur!' },
  { id: 'jump', cls: JumpBar, name: 'Lompat Palang', icon: 'gi_jump', cat: 'refleks', min: 2, max: 4, solo: 4, wins: 3,
    how: 'Palang berputar makin cepat. Tekan untuk melompat tepat waktu!' },
  // ---- Otak & papan
  { id: 'math', cls: MathQuick, name: 'Matematika Kilat', icon: 'gi_math', cat: 'otak', min: 2, max: 4, solo: 2, wins: 2,
    how: 'Tekan HANYA jika hitungannya BENAR. Salah tekan = poin dikurangi. 5 poin menang!' },
  { id: 'memory', cls: Memory, name: 'Memori Kartu', icon: 'gi_memory', cat: 'otak', min: 2, max: 4, solo: 2, wins: 1, controls: 'custom',
    how: 'Bergiliran membuka 2 kartu. Pasangan cocok = poin dan main lagi!' },
  { id: 'xo', cls: XO, name: 'XOX', icon: 'gi_xo', cat: 'otak', min: 2, max: 2, solo: 2, wins: 3, controls: 'custom',
    how: 'Bergiliran mengisi kotak. Tiga sejajar menang!' },
  { id: 'connect4', cls: Connect4, name: 'Empat Sejajar', icon: 'gi_connect4', cat: 'otak', min: 2, max: 2, solo: 2, wins: 2, controls: 'custom',
    how: 'Ketuk kolom untuk menjatuhkan koin. Empat sejajar (mendatar, tegak, miring) menang!' },
  { id: 'ladder', cls: Ladder, name: 'Ular Tangga', icon: 'gi_ladder', cat: 'otak', min: 2, max: 4, solo: 2, wins: 1,
    how: 'Bergiliran tekan tombolmu untuk melempar dadu. Naik tangga, awas ular! Sampai 100 menang.' },
  { id: 'rps', cls: RPS, name: 'Batu Gunting Kertas', icon: 'gi_rps', cat: 'otak', min: 2, max: 4, solo: 3, wins: 3, controls: 'custom',
    how: 'Pilih diam-diam: batu, kertas, atau gunting. Batu > gunting > kertas > batu.' }
];
export const byId = Object.fromEntries(GAMES.map(g => [g.id, g]));
export const CATS = [
  { id: 'all', name: 'Semua' }, { id: 'aksi', name: 'Aksi' }, { id: 'olahraga', name: 'Olahraga' },
  { id: 'refleks', name: 'Refleks' }, { id: 'otak', name: 'Otak & Papan' }
];
