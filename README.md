# Password Generator Pro 🔐

Aplikasi web edukasi untuk mempelajari **algoritma pembentukan password yang aman**, mengukur kekuatan password, dan memahami konsep dasar entropy/keamanan siber.

Dibangun 100% dengan **HTML5, CSS3, dan Vanilla JavaScript** — tanpa framework, tanpa backend, tanpa database. Semua proses (generate, analisis, riwayat) berjalan langsung di browser pengguna, sehingga aman untuk dipelajari maupun dideploy.

> Proyek ini ditujukan untuk pembelajaran mahasiswa Informatika tingkat awal dan programmer pemula yang ingin memahami cara kerja password generator secara langsung dari kode sumbernya.

---

## ✨ Fitur

- **Generate Password** — panjang 8–64 karakter, dengan pilihan huruf besar/kecil, angka, simbol, dan opsi menyertakan/menyaring karakter ambigu (`i l 1 I O 0`).
- **Password Strength Checker** — skor 0–100 dengan 5 kategori: Weak, Fair, Good, Strong, Very Strong, lengkap dengan progress bar berwarna.
- **Entropy Estimation** — estimasi sederhana `panjang × log2(ukuran character set)` dalam satuan bits.
- **Copy Password** — satu klik untuk menyalin ke clipboard, dengan notifikasi toast.
- **Riwayat Password** — menyimpan 10 password terakhir di `localStorage`, lengkap dengan tanggal dibuat.
- **Password Analyzer** — masukkan password milikmu sendiri dan dapatkan rekomendasi konkret untuk memperkuatnya.

## 🧠 Algoritma Inti

Logika utama berada di `assets/js/app.js`, dipisah menjadi beberapa bagian:

1. **Charset** — kumpulan karakter per kategori (`a-z`, `A-Z`, `0-9`, simbol).
2. **buildCharacterPool()** — menggabungkan kategori yang dipilih user, lalu menyaring karakter ambigu jika diminta.
3. **generatePassword()** — memilih karakter secara acak dari pool menggunakan `Math.random()`, sebanyak panjang yang diminta.
4. **calculateStrengthScore()** — menilai variasi karakter + panjang password menjadi skor 0–100.
5. **calculateEntropy()** — menghitung estimasi entropy dalam bits.
6. **analyzePassword()** — memeriksa password input user terhadap 5 kriteria dasar dan menyusun rekomendasi.

Setiap fungsi diberi komentar dalam Bahasa Indonesia agar mudah diikuti langkah demi langkah.

> **Catatan:** `Math.random()` digunakan di sini untuk tujuan pembelajaran karena sederhana dan mudah dipahami. Untuk kebutuhan produksi/keamanan nyata, generator password sebaiknya menggunakan sumber acak kriptografis seperti `crypto.getRandomValues()`.

## 📁 Struktur Folder

```
password-generator/
│
├── index.html
│
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── icons/
│       └── favicon.svg
│
├── README.md
└── vercel.json
```

## 🚀 Menjalankan Secara Lokal

Karena tidak ada backend, cukup buka `index.html` langsung di browser, atau jalankan server statis sederhana, misalnya:

```bash
npx serve .
```

lalu buka `http://localhost:3000` (atau port yang ditampilkan).

## ☁️ Deploy ke Vercel

1. Push folder ini ke repository GitHub.
2. Buka [vercel.com](https://vercel.com) → **New Project** → import repository tersebut.
3. Vercel akan otomatis mendeteksi proyek statis (tidak perlu build command, tidak perlu environment variable).
4. Klik **Deploy** — selesai.

File `vercel.json` yang disertakan hanya berisi konfigurasi minimal (clean URL) dan tidak memerlukan penyesuaian tambahan.

## 🎨 Tema Visual

Cyber Security Dashboard, dark mode default:

| Token | Warna |
|---|---|
| Primary | `#2563EB` |
| Accent | `#06B6D4` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |
| Background | `#0F172A` |
| Surface | `#1E293B` |
| Text | `#F8FAFC` |

## ⚠️ Disclaimer

Aplikasi ini dibuat untuk **tujuan studi dan pembelajaran**. Meskipun menghasilkan password yang fungsional, selalu gunakan penilaian sendiri sebelum memakai password yang digenerate untuk akun penting, dan pertimbangkan password manager khusus untuk kebutuhan produksi.

## 📄 Lisensi

Bebas digunakan, dimodifikasi, dan dipelajari untuk tujuan edukasi.
