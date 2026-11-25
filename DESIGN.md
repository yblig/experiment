# Pesta 1234 Pemain — design
Interpretation: koleksi mini game lokal 1–4 pemain di satu HP (HP diletakkan di meja,
tiap pemain pegang satu sisi/sudut), meniru alur & rasa "1 2 3 4 Player Games" tapi
dengan nama, karakter dan art orisinal — dan lebih banyak game (30). Mode 1 pemain =
lawan CPU. Bahasa UI: Indonesia. Portrait.

## Pitch
Buka, pilih 1/2/3/4 pemain, pilih game, langsung main. Kontrol satu tombol per pemain
untuk sebagian besar game sehingga 4 orang muat di satu layar. Mode Turnamen: 5 game
acak, kumpulkan piala.

## Screens & flow
Boot/Loading → Title (logo, tombol 1·2·3·4 PEMAIN, Turnamen, Pengaturan)
→ Pilih Game (grid kartu bergambar, tab kategori, badge jumlah pemain)
→ Info singkat (cara main) → Game (hitung mundur 3-2-1-MULAI → ronde → banner pemenang ronde)
→ Hasil (pemenang, mahkota, konfeti, skor ronde) → Main lagi / Pilih game / Lanjut turnamen.
Pause (tombol ‖ di tepi kiri + tombol Back Android): Lanjut, Ulang, Keluar.
Back: Pilih Game → Title, Title → tekan dua kali keluar.

## Pemain & tempat duduk
Warna: P1 Merah #ff4d5e, P2 Biru #3d8bff, P3 Hijau #2fd27a, P4 Kuning #ffc93c.
2 pemain: tombol panjang di bawah (P1) dan atas (P2, diputar 180°).
3–4 pemain: tombol bulat di sudut: P1 kiri-bawah, P2 kanan-atas, P3 kiri-atas, P4 kanan-bawah.
Slot kosong yang dibutuhkan game diisi CPU (tombol bertuliskan CPU, AI menekan sendiri).

## Ronde
Kebanyakan game: pertama menang 3 ronde. Game panjang (papan, memori, golf, poin) 1 ronde.

## Game (30)
Aksi: Sumo Dorong, Perang Tank, Ular Kurva, Pesawat Angkasa, Hindari Meteor, Lempar Pisau,
Lompat Palang, Burung Terbang, Kumpul Koin, Bom Waktu, Duel Pedang, Tembak Target
Olahraga: Sepak Bola, Hoki Meja, Pingpong 4 Sisi, Balap Mobil, Lari Cepat, Tarik Tambang, Golf Mini
Refleks: Koboi Dor!, Warna Jebakan, Stop 10 Detik, Pukul Tikus, Tumpuk Balok
Otak & Papan: Matematika Kilat, Memori Kartu, XOX, Empat Sejajar, Ular Tangga, Suit (Batu-Gunting-Kertas)

## Art direction
Palette "Pesta Malam": bg #1a1033, surface #2d1b5a, panel #3b2675, accent #ff6b35,
gold #f7c548, cyan #00d1ff, text #ffffff, outline #140b2b.
Gaya: kartun vektor tebal, outline gelap, gradasi + highlight kiri-atas, karakter bulat lucu.
Font: Lilita One (judul/angka), Fredoka 600 (teks).
Aset: karakter bulat ×4 warna, tank/mobil/pesawat/burung ×4 warna, 30 ikon game,
latar berpola, partikel (bintang, debu, konfeti), mahkota, piala.

## Audio
Musik: menu=happy 120bpm seed3, game=upbeat 136 seed7, game2=action 140 seed5, menang=victory.
SFX (audio/sfx.json): tap, back, whoosh, countdown, go, point, gem, hit, punch, boom,
smallboom, win, lose, jump, dash, shoot, laser, bounce, correct, wrong, pop, thud, star,
levelup, splash, tick, break, flip, charge, slide.

## Juice
Hitung mundur dengan pop, screen shake saat tabrakan/ledakan, partikel saat poin,
banner pemenang ronde berputar masuk, konfeti dan mahkota di hasil, tombol pemain
menekan ke dalam + getar, kartu game memantul saat ditekan.

## Save data
Pengaturan (musik, SFX, getar), jumlah main per game, total pertandingan, kemenangan per warna.
