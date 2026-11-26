# StrukKu — design
Interpretation: "aplikasi pembuat resep/receipt" = aplikasi **kasir & struk** untuk warung/toko kecil,
dicetak ke printer thermal Bluetooth (58/80 mm, ESC/POS, Bluetooth Classic SPP), plus pembukuan
pemasukan & pengeluaran. Harus mudah untuk ibu-ibu pemilik usaha tanpa terlihat "kekanak-kanakan":
tulisan besar & jelas, tombol besar, label kata + ikon, tanpa istilah teknis — tapi tampilannya
rapi seperti aplikasi bisnis profesional.

## Pitch
Kasir di HP: pilih barang → bayar → struk tercetak. Semua penjualan, pemasukan, dan pengeluaran
tercatat otomatis, laporan laba langsung jadi. Pengeluaran & laporan dikunci PIN.

## Navigasi
Tab bawah: Beranda · Riwayat · **Kasir** (tombol tengah besar) · Keuangan (PIN) · Menu
Stack di atas tab untuk detail/form. Tombol Back Android: tutup sheet/dialog → pop stack → ke Beranda → tekan 2x keluar.

## 40+ fitur
Kasir & struk
1. Kasir cepat: grid produk dengan kategori, ketuk = tambah
2. Item manual (nama + harga tanpa katalog)
3. Cari produk
4. Ubah jumlah, harga & diskon per item
5. Diskon total (% atau Rp)
6. Pajak/PPN % dan biaya layanan % (opsional)
7. Metode bayar: Tunai, QRIS, Transfer, E-Wallet
8. Hitung kembalian otomatis + tombol uang cepat (Uang pas, 10rb … 100rb)
9. Kasbon/utang (bayar nanti) dan pelunasan
10. Simpan pesanan (tahan/park) lalu lanjutkan nanti
11. Nama pelanggan & catatan pada transaksi
12. Nomor struk otomatis dengan awalan yang bisa diatur
13. Pratinjau struk mirip kertas thermal
14. Cetak struk via Bluetooth (ESC/POS)
15. Kertas 58 mm / 80 mm
16. Logo toko tercetak di struk (dithering hitam-putih)
17. Nama toko, alamat, telepon, teks header & footer bisa diubah
18. QR code di struk (mis. Instagram/WA/QRIS teks)
19. Jumlah salinan cetak (1–3) & potong kertas otomatis (80 mm)
20. Cetak ulang struk dari riwayat
21. Bagikan struk sebagai gambar (WhatsApp, dll)
22. Batalkan (void) transaksi dengan PIN, stok dikembalikan
Produk
23. Produk dengan kategori, warna & emoji
24. Stok + peringatan stok menipis
25. Harga modal → hitung laba
26. Kategori bisa ditambah/diubah
Keuangan
27. Catat pemasukan lain (bukan penjualan)
28. Catat pengeluaran berkategori (Bahan, Gaji, Listrik, Sewa, Transport, …)
29. PIN untuk membuka Keuangan/Pengeluaran
30. Pilihan kunci tambahan: Laporan, Pengaturan, Batal transaksi, saat buka aplikasi
31. Pertanyaan pemulihan jika lupa PIN
32. Ringkasan hari ini di Beranda (penjualan, pengeluaran, laba)
33. Grafik penjualan 7 hari
34. Laporan periode (hari ini, 7 hari, bulan ini, bulan lalu, semua)
35. Laba rugi (omzet − modal − pengeluaran + pemasukan lain)
36. Produk terlaris & rincian metode bayar
37. Cetak laporan / tutup kasir ke printer
38. Ekspor CSV (bisa dibuka di Excel/Sheets)
39. Backup & pulihkan data (file JSON)
40. Riwayat transaksi dengan cari & filter
41. Daftar pelanggan + total belanja & utang
Kenyamanan
42. Tulisan besar (mode mudah dibaca)
43. Mode gelap / terang / ikut sistem
44. Suara & getar bisa dimatikan
45. Sambung otomatis ke printer terakhir
46. Data contoh untuk mencoba

## Art direction
Palette "Kasir Hangat" (light): bg #F4F2ED, surface #FFFFFF, primary #0E7C66, primary-dark #095A4A,
accent #F2A93B, income #17A34A, expense #DC4B3E, text #1B2320, muted #6A7470, line #E6E2DA.
Dark: bg #0F1312, surface #19201E, primary #34C3A2, text #EEF2F0.
Font: Plus Jakarta Sans (UI, buatan Indonesia), JetBrains Mono (pratinjau struk).
Shapes: kartu radius 20, tombol radius 16, tinggi tombol ≥ 56 px, bayangan lembut.

## Audio
SFX: tap, add (pop), remove, cash (bayar), success, print, error, toggle, whoosh. Tanpa musik (aplikasi kerja).

## Save data
storage key `db` (versi skema 1): settings, products, categories, sales, finance, customers, held, counters.
