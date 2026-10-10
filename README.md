# CerminSaku (versi siap Vercel)

Frontend (React + Vite) dan backend (Express) dalam **satu proyek**. Di Vercel, frontend disajikan sebagai situs statis dan backend berjalan sebagai Serverless Function di alamat yang sama (`/api/...`), jadi tidak perlu hosting backend terpisah dan tidak ada masalah CORS.

```
api/index.js        pintu masuk backend untuk Vercel
server/             kode backend (routes, controllers, koneksi database)
src/                kode frontend (pages, components, style)
db/schema.sql       skema tabel PostgreSQL
scripts/setup-db.js membuat tabel lewat `npm run db:setup`
vercel.json         pengaturan routing Vercel
```

## Deploy ke Vercel

### 1. Siapkan database PostgreSQL (gratis)
1. Daftar di [neon.tech](https://neon.tech), buat project baru.
2. Salin **connection string** (bentuknya `postgresql://user:pass@host/db?sslmode=require`).
3. Buka **SQL Editor** di Neon, tempel seluruh isi `db/schema.sql`, lalu **Run**.
   (Alternatif: isi `.env` lokal lalu jalankan `npm run db:setup`.)

### 2. Siapkan email untuk OTP
Akun Google > aktifkan verifikasi 2 langkah > buat **App Password** (16 karakter). Dipakai untuk `MAIL_PASS`.

### 3. Taruh proyek ini di GitHub
Ganti isi folder `FS` di repo CerminSaku dengan isi folder ini (file `package.json` harus berada langsung di dalam `FS`), lalu commit dan push.

### 4. Import di Vercel
1. **Add New > Project**, pilih repo CerminSaku.
2. **Root Directory**: `FS`. **Framework Preset**: Vite (biasanya terdeteksi otomatis).
3. Buka **Environment Variables**, isi:

| Nama | Isi |
|---|---|
| `DATABASE_URL` | connection string dari Neon |
| `JWT_SECRET` | string acak panjang |
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `465` |
| `MAIL_USER` | alamat Gmail pengirim |
| `MAIL_PASS` | App Password Gmail |
| `ANTHROPIC_API_KEY` | (opsional) untuk insight AI |
| `AI_SERVICE_URL` | (opsional) URL model ML, kosongkan jika tidak ada |

4. Klik **Deploy**.

### 5. Cek hasilnya
Buka `https://NAMA-PROYEK.vercel.app/api/health`. Jika muncul `"database": "terhubung"`, backend dan database sudah beres. Setelah itu coba daftar, verifikasi OTP, lalu login.

## Menjalankan di komputer sendiri
Butuh Node.js 20+.
```
npm install
copy .env.example .env      (isi nilainya)
npm run db:setup            (sekali saja, membuat tabel)
npm run dev                 (buka http://localhost:5173)
```

## Yang diubah dari versi sebelumnya
- Frontend memanggil `/api/...` (bukan `http://localhost:3000`), jadi jalan di domain mana pun.
- Backend dijadikan satu fungsi Vercel; koneksi database dibuat hemat untuk serverless.
- File `package.json`, `index.html`, dan `vite.config.js` yang sebelumnya tidak ada sudah ditambahkan.
- Nama file disamakan dengan import-nya (`App.jsx`, `Register.jsx`, `transaction.css`, dst.).
- `profileRoutes` yang hilang dibuat ulang (profil dan ganti password).
- Skema database dilengkapi: kolom `phone`, `otp`, `is_verified`, `user_id`, `created_at`, dan tabel `dream_goals` (di kode lama tabelnya bernama `savings_goals` padahal kodenya memakai `dream_goals`).
- Semua endpoint data kini wajib login dan memakai id dari token, bukan `userId` kiriman browser (sebelumnya orang bisa membaca data user lain dengan mengganti angka `userId`).
- Reset password kini mewajibkan OTP yang valid (sebelumnya siapa pun yang tahu email bisa mengganti password).
- Ganti password di profil memakai bcrypt (sebelumnya membandingkan teks biasa, padahal password disimpan ter-hash).
- Log yang mencetak `MAIL_PASS` dihapus. Model Claude yang sudah usang diganti, dan bisa diatur lewat `ANTHROPIC_MODEL`.
- `src/asset/Dashboard.png` hanya gambar sementara karena file aslinya tidak ada di repo. Ganti dengan screenshot dashboard kamu.

## Catatan
- Fitur prediksi kategori (`AI_SERVICE_URL`) memakai model di Google Colab lewat Ngrok yang URL-nya berubah-ubah. Jika kosong, aplikasi tetap jalan dan kategori dipilih manual.
- Paket gratis Vercel membatasi lama eksekusi fungsi; panggilan AI sudah diberi batas waktu.
