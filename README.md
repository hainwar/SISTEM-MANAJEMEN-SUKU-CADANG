# Al-Amin Raoe Motor - Sistem Manajemen Suku Cadang

Aplikasi web untuk mengelola inventori suku cadang motor dengan fitur ROP (Reorder Point) otomatis.

## 🚀 Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Setup Database
\`\`\`bash
# Pastikan MySQL server berjalan
# Update kredensial database di .env.local

# Setup database dan schema
npm run db:setup

# Seed data demo
npm run db:seed

# Test koneksi
npm run db:test
\`\`\`

### 3. Jalankan Aplikasi
\`\`\`bash
npm run dev
\`\`\`

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🔐 Login Demo

- **Admin**: `admin` / `password123`
- **Gudang**: `gudang1` / `password123`  
- **Pimpinan**: `pimpinan` / `password123`

## 📋 Fitur

- ✅ Manajemen suku cadang
- ✅ Tracking stok real-time
- ✅ Sistem ROP otomatis
- ✅ Notifikasi stok rendah
- ✅ Laporan dan analitik
- ✅ Multi-role access
- ✅ Import/Export Excel
- ✅ Dashboard interaktif

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Auth**: JWT dengan bcrypt
- **UI**: Radix UI, Lucide Icons

## 📁 Struktur Project

\`\`\`
├── app/                    # Next.js App Router
├── components/            # React components
├── lib/                   # Utilities & configurations
├── scripts/               # Database scripts
└── public/               # Static assets
\`\`\`

## 🔧 Environment Variables

\`\`\`env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=al_amin_raoe_motor
JWT_SECRET=your-secret-key
\`\`\`

## 📊 Database Schema

Aplikasi menggunakan 7 tabel utama:
- `users` - Data pengguna
- `spare_parts` - Data suku cadang
- `stock_movements` - Transaksi stok
- `daily_demand_logs` - Log permintaan harian
- `notifications` - Notifikasi sistem
- `settings` - Pengaturan aplikasi
- `audit_logs` - Log audit

## 🚨 Troubleshooting

### Error: ER_NOT_SUPPORTED_AUTH_MODE
\`\`\`sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
\`\`\`

### Error: Connection refused
- Pastikan MySQL service berjalan
- Check port 3306 tidak diblokir
- Verify kredensial di .env.local

## 📝 License

Private - Al-Amin Raoe Motor
\`\`\`

Terakhir, tambahkan TypeScript config:
