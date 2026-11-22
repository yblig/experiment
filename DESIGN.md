# Layar Pas

**Interpretasi brief:** HP pengguna (Oppo/Vivo/Realme) punya garis putih vertikal di sisi
kanan layar. Garisnya tetap menyala walau layar hitam, jadi ini kerusakan hardware: overlay
hitam tidak bisa menyembunyikannya. Pengguna ingin **seluruh tampilan HP** mengecil supaya
tidak ada isi layar yang tertimpa garis, dengan lebar area yang bisa diatur.

Android tidak mengizinkan aplikasi biasa mengubah ukuran layar sistem. Karena itu aplikasi
punya dua mode, dan hanya satu yang aktif dalam satu waktu:

1. **Kecilkan Layar** (utama): menjalankan `wm size` lewat **Shizuku**, yang disetup sekali
   lewat Wireless debugging tanpa root. Android menaruh layar yang lebih sempit di **tengah**,
   jadi pinggiran hitam muncul di kanan dan kiri dengan lebar yang sama. Pinggiran kanan
   menutupi garis putih.
2. **Tutup Hitam** (cadangan): overlay hitam di sisi kanan, di atas semua aplikasi, tanpa
   setup apa pun. Isi layar tidak bergeser. Overlay ikut berputar ke tepi fisik yang benar
   saat HP dalam posisi landscape.

## Konsep
Satu layar utama yang menampilkan pratinjau HP (area aman, pinggiran hitam, garis putih),
pengatur lebar, dan pilihan mode. Kalibrasi dilakukan dengan menggeser penanda di layar
penuh sampai menempel di garis putih.

## Layar
- **Onboarding** (3 slide, sekali saja): masalahnya, dua mode, ajakan untuk menandai garis.
- **Beranda**: pratinjau HP, kartu lebar (slider, tombol −/+ per 1 px, "Tandai garis"),
  pemilih mode (Kecilkan, Tutup hitam, Mati), status Shizuku/izin overlay, tombol
  Terapkan/Kembalikan.
- **Tandai garis** (layar penuh): latar gelap, penanda merah yang bisa diseret, kaca pembesar
  angka px, tombol halus ‹ ›, Simpan. Mode Kecilkan dijeda dulu agar seluruh lebar layar terlihat.
- **Setup Shizuku** (sheet): 3 langkah dengan status live (terpasang, berjalan, izin)
  dan tombol aksi untuk setiap langkah.
- **Konfirmasi** (dialog): "Layarnya pas?" dengan hitung mundur 15 detik. Kalau tidak dijawab,
  native otomatis mengembalikan layar. Ini jaring pengaman.
- **Pengaturan** (sheet): suara, getar, overlay otomatis setelah restart, reset semua,
  panduan darurat via ADB.

## Native
- `ScreenFixPlugin` (Capacitor): info layar, status Shizuku, apply/confirm/reset shrink,
  overlay start/stop, izin overlay.
- `ScreenSizer`: hitung `wm size` dari lebar strip dalam px fisik. Menyimpan override
  asli dari OEM (misalnya resolusi FHD+) agar reset kembali ke kondisi semula.
- `OverlayService`: foreground service `specialUse`, notifikasi dengan aksi Matikan.
- `BootReceiver`: menyalakan overlay setelah restart kalau diaktifkan.
- `ShrinkTileService`: tile Quick Settings untuk menyalakan/mematikan Kecilkan Layar.

## Arah visual
Gelap, bersih, terasa seperti alat sistem premium.
- Ink `#0A0D12` (latar), Panel `#131922`, Panel-2 `#1B2330`, Garis `#263142`
- Mint `#47E5B4` (aksen/aman), Amber `#FFB547` (peringatan), Coral `#FF5E6C` (garis/bahaya)
- Teks `#E9EEF5`, Redup `#8C99AB`
- Font: Plus Jakarta Sans. Sudut membulat 18–24 px, tombol dengan gradien dan bayangan
  dalam, ikon dari lucide.
- Gerak: transisi sheet slide-up, pratinjau HP menganimasikan perubahan lebar, angka
  count-up, penanda kalibrasi berdenyut.

## Suara dan haptik
tap (tombol), toggle (mode/switch), tick (slider dan −/+ tiap langkah), confirm (diterapkan
atau disimpan), back (kembalikan), whoosh (buka sheet), error (gagal). Tanpa musik karena
ini aplikasi utilitas.

## Disimpan
lebar strip (px fisik), mode, onboarding selesai, suara/getar, overlay saat boot, dan
override asli (di SharedPreferences native).
