<h1 align="center">
  <a href="https://mapsy-eight.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Mapsy-v1.0-blue?style=for-the-badge&logo=map&logoColor=white" alt="Mapsy Badge"/>
  </a>
</h1>

<h3 align="center">🗺️ Smart Student Location Discovery Platform</h3>
<p align="center">Platform peta geospasial hiper-lokal yang dirancang khusus untuk membantu mahasiswa menemukan tempat sesuai kebutuhan situasi mereka.</p>

<p align="center">
  <a href="#-fitur-utama">Fitur</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-cara-menjalankan-lokal">Cara Jalankan</a> •
  <a href="#-struktur-proyek">Struktur</a>
</p>

---

## 🌟 Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🔍 **Smart Search by Situation** | Ketik secara natural: *"kafe tenang ada colokan"* — sistem otomatis mengekstrak tag pencarian |
| 📍 **Peta Geospasial Interaktif** | Pin lokasi animasi dengan peta Leaflet.js, terfokus di area kampus |
| 👍 **Community Tag Validation** | Upvote/Downvote tag (Wi-Fi kencang, colokan banyak, buka 24 jam) secara kolaboratif |
| ⭐ **Weighted Rating System** | Ulasan terbaru berbobot 2x lebih tinggi (Temporal Decay Algorithm) |
| ➕ **Kontribusi Lokasi (UGC)** | Mahasiswa login bisa tambahkan spot baru langsung ke peta |
| 💾 **Zero-Cost Cache Strategy** | Backend cache data Google Places API secara lokal untuk meminimalisasi biaya |

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5, Vanilla JavaScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Leaflet.js](https://leafletjs.com/) (Interactive Mapping)
- [Lucide Icons](https://lucide.dev/)

**Backend:**
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- Supabase (PostgreSQL + PostGIS) / Local JSON Mock DB (fallback)
- JWT Authentication via Supabase Auth

**Deployment:**
- [Vercel](https://vercel.com/) (Serverless Functions + Static)

---

## 🚀 Cara Menjalankan Lokal

### Prasyarat
- Node.js v18+
- npm

### Langkah-langkah

1. **Clone repositori ini**
   ```bash
   git clone https://github.com/[USERNAME]/Mapsy.git
   cd Mapsy
   ```

2. **Install dependensi backend**
   ```bash
   cd backend
   npm install
   ```

3. **Konfigurasi environment variable** *(opsional, bisa skip untuk mode Mock DB)*
   ```bash
   # Salin contoh konfigurasi
   cp .env.example .env
   # Edit .env dan isi kredensial Supabase kamu (atau biarkan kosong untuk Mock DB)
   ```

4. **Jalankan server**
   ```bash
   npm run dev
   ```

5. **Buka di browser**
   ```
   http://localhost:3000
   ```

> 💡 **Catatan**: Jika tidak ada kredensial Supabase, server otomatis menggunakan **Local Mock Database** yang sudah berisi 20+ tempat di sekitar Bandung (BINUS, ITB, UNPAD).

---

## 📁 Struktur Proyek

```
Mapsy/
├── backend/
│   ├── data/
│   │   └── mockDb.json      # Mock database lokal (JSON)
│   ├── db.js                # Unified DB provider (Supabase / Mock)
│   ├── queryParser.js       # Smart Search keyword parser
│   ├── server.js            # Express API server
│   └── .env.example         # Template konfigurasi environment
├── database/
│   └── schema.sql           # Skema database PostgreSQL + PostGIS
├── frontend/
│   ├── app.js               # Logika aplikasi SPA
│   ├── index.html           # Template halaman utama
│   └── styles.css           # Tailwind CSS compiled
├── seed.sql                 # Data awal 20+ lokasi Bandung
├── vercel.json              # Konfigurasi deployment Vercel
├── laporanakhir.md          # Laporan akhir format IEEE
└── .gitignore
```

---

## 👥 Tim Pengembang

| Nama | NIM | Peran |
|---|---|---|
| **Daffa Adira Pratama** | 2802498204 | Backend API, Database, Deployment |
| **Samuel Handyanto Ongko Saputra** | 2802408871 | Frontend UI/UX, Tailwind CSS |
| **Nicholas** | 2802491740 | Smart Search Parser, Dokumentasi |
| **Christian Devinchie** | 2802396764 | Data Seeding, Pengujian, Referensi |

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan tugas akademik mata kuliah Rekayasa Perangkat Lunak, **Bina Nusantara University**.
