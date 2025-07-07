# 🛠️ Al-Amin Raoe Motor - Sistem Manajemen Suku Cadang

Aplikasi web modern untuk mengelola inventori suku cadang motor secara efisien, dilengkapi dengan sistem **Reorder Point (ROP)** otomatis untuk mencegah *stockout* dan *overstock*.

---

## 🚀 Quick Start

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Setup Database

```bash
# Pastikan MySQL server berjalan
# Update kredensial database di .env.local

# Setup database dan schema
npm run db:setup

# Seed data demo
npm run db:seed

# Test koneksi
npm run db:test
```

### 3️⃣ Jalankan Aplikasi

```bash
npm run dev
```

🌐 Buka aplikasi di [http://localhost:3000](http://localhost:3000)

---

## 🔐 Login Demo

* 👤 **Admin**: `admin` / `password123`
* 🏷️ **Gudang**: `gudang1` / `password123`
* 📊 **Pimpinan**: `pimpinan` / `password123`

---

## 📋 Fitur Utama

* ✅ CRUD Manajemen Suku Cadang
* 📦 Tracking Stok Real-Time
* 📉 Sistem ROP Otomatis
* 🔔 Notifikasi Stok Rendah
* 📑 Laporan & Analitik
* 👥 Akses Multi-Role
* 📤 Import/Export Excel
* 📊 Dashboard Interaktif

---

## 🧰 Tech Stack

* ⚛️ **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
* 🔌 **Backend**: Next.js API Routes
* 🗃️ **Database**: MySQL
* 🔐 **Auth**: JWT + bcrypt
* 🎨 **UI**: Radix UI, Lucide Icons

---

## 📁 Struktur Project

```bash
├── app/              # Next.js App Router
├── components/       # Komponen UI
├── lib/              # Konfigurasi & utilitas
├── scripts/          # Script setup database
└── public/           # Aset statis
```

---

## 🔧 Environment Variables

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=al_amin_raoe_motor
JWT_SECRET=your-secret-key
```

---

## 🗃️ Database Schema

Aplikasi menggunakan 7 tabel utama:

* `users` – Data pengguna
* `spare_parts` – Master suku cadang
* `stock_movements` – Riwayat transaksi stok
* `daily_demand_logs` – Log permintaan harian
* `notifications` – Notifikasi sistem
* `settings` – Pengaturan umum
* `audit_logs` – Catatan aktivitas sistem

---

## 🛠️ TypeScript Config (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## 🚨 Troubleshooting

### ❗ ER\_NOT\_SUPPORTED\_AUTH\_MODE

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```

### ❗ Connection refused

* Pastikan MySQL service aktif
* Periksa port `3306` tidak diblokir
* Cek ulang `.env.local` dan kredensial

---

## 📝 License

📌 **Private Use Only** – Hak cipta milik Al-Amin Raoe Motor
