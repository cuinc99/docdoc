# Phase 7: Dashboard & Pengaturan

**Estimasi:** 2-3 hari
**Prasyarat:** Phase 6 selesai
**Output:** Dashboard adaptif per role dengan statistik, manajemen pengaturan klinik & staff.
**Status:** ✅ Complete

---

## 7.1 Backend - Dashboard API

### Task:
- [x] Buat `DashboardController` dengan endpoint:
  - `GET /api/dashboard` - Return statistik sesuai role user yang login
- [x] Data statistik per role:

  **Admin:**
  - Total pasien terdaftar
  - Kunjungan hari ini (total antrian completed)
  - Revenue bulan ini (sum invoices paid)
  - Antrian aktif saat ini (waiting + vitals + in_consultation)
  - Grafik kunjungan 30 hari terakhir (array {date, count})

  **Dokter:**
  - Pasien saya hari ini (antrian dokter tersebut)
  - Antrian saya aktif (waiting + vitals)
  - Rekam medis terbaru (5 terakhir oleh dokter ini)
  - Resep belum ditebus (oleh dokter ini)

  **Resepsionis:**
  - Antrian hari ini (semua dokter)
  - Invoice tertunda (status pending + partial)
  - Pasien baru hari ini (registered today)
  - Total pembayaran hari ini

- [x] Tulis Pest test (5 tests)

### Endpoint:
```
GET    /api/dashboard    (auth)
```

---

## 7.2 Frontend - Halaman Dashboard

### Task:
- [x] Buat API function (`src/api/dashboard.ts`)
- [x] Buat halaman `/dashboard` - Dashboard Adaptif:
  - Detect role user -> render komponen yang sesuai
- [x] Komponen dashboard **Admin**:
  - 4 kartu statistik (Total Pasien, Kunjungan Hari Ini, Revenue Bulan Ini, Antrian Aktif)
  - Line chart kunjungan 30 hari (Recharts)
- [x] Komponen dashboard **Dokter**:
  - 4 kartu statistik (Pasien Hari Ini, Antrian Aktif, Rekam Medis Terbaru, Resep Belum Ditebus)
  - List rekam medis terbaru dengan link ke detail
- [x] Komponen dashboard **Resepsionis**:
  - 4 kartu statistik (Antrian Hari Ini, Invoice Tertunda, Pasien Baru, Pembayaran Hari Ini)
- [x] Semua kartu statistik menggunakan border-2 border-border shadow-md pattern
- [x] Responsif: kartu 2 kolom di mobile, 4 kolom di desktop

---

## 7.3 Backend - Pengaturan Klinik & Staff

### Migration & Model:
- [x] Buat migration tabel `clinic_settings`:
  ```
  id, key (unique), value (text), created_at, updated_at
  ```
  - Keys: clinic_name, clinic_address, clinic_phone, clinic_email, clinic_logo
- [x] Buat Model `ClinicSetting` (key-value store dengan static get/set methods)

### API Endpoints:
- [x] Buat `ClinicSettingController`:
  - `GET /api/settings/clinic` - Get semua setting klinik (logo dikembalikan sebagai full URL)
  - `PUT /api/settings/clinic` - Update setting klinik (admin only)
  - `POST /api/settings/clinic/logo` - Upload logo klinik (admin only, return full URL)
- [x] Buat `UserManagementController` (untuk admin kelola staff):
  - `GET /api/users` - List staff (paginated, search by name/email, filter by role)
  - `POST /api/users` - Tambah staff baru
  - `PUT /api/users/{id}` - Update staff (termasuk role)
  - `PATCH /api/users/{id}/toggle-active` - Aktifkan/nonaktifkan staff (self-deactivation prevented)
- [x] Buat `ProfileController`:
  - `GET /api/profile` - Get profil sendiri
  - `PUT /api/profile` - Update profil (nama, telepon)
  - `PUT /api/profile/password` - Ganti password (validasi current password)
- [x] Semua endpoint pengaturan klinik & user management: admin only
- [x] Tulis Pest test (15 tests)

### Endpoint:
```
GET    /api/settings/clinic           (auth)
PUT    /api/settings/clinic           (auth, admin)
POST   /api/settings/clinic/logo      (auth, admin)

GET    /api/users                     (auth, admin)
POST   /api/users                     (auth, admin)
PUT    /api/users/{id}                (auth, admin)
PATCH  /api/users/{id}/toggle-active  (auth, admin)

GET    /api/profile                   (auth)
PUT    /api/profile                   (auth)
PUT    /api/profile/password          (auth)
```

---

## 7.4 Frontend - Halaman Pengaturan

### Task:
- [x] Buat API functions (`src/api/settings.ts`, `src/api/users.ts`)
- [x] Buat halaman `/settings/clinic` - Pengaturan Klinik (admin only):
  - Form: Nama Klinik, Alamat (textarea), Telepon, Email
  - Upload logo klinik (preview image setelah disimpan via full URL)
  - Tombol Simpan + Reset
- [x] Buat halaman `/settings/staff` - Manajemen Staff (admin only):
  - List staff dengan search (nama/email) dan filter role (side by side)
  - Setiap staff menampilkan: nama, email, phone, role badge, status badge
  - Tombol "Tambah Staff"
  - Aksi per row: Edit, Toggle Aktif/Nonaktif
  - Pagination
- [x] Buat form tambah/edit staff (dialog):
  - Nama, Email, Password (hanya saat tambah), Telepon, Role (dropdown), Spesialisasi (jika dokter), No. SIP (jika dokter)
- [x] Buat halaman `/settings/services` - Manajemen Layanan (admin only):
  - List layanan: nama, harga (Rupiah), status badge
  - Aksi: Edit, Toggle Aktif/Nonaktif
  - Tombol "Tambah Layanan"
  - Form dialog: Nama, Harga (number input dengan valueAsNumber)
- [x] Buat halaman `/profile` - Profil User (semua role):
  - Update profil: Nama, Telepon
  - Ganti password: Password Lama, Password Baru, Konfirmasi Password

### Navigasi:
- [x] Hapus menu "Dokter" dari sidebar (sudah terwakilkan oleh Staff)
- [x] Rename item "Pengaturan" menjadi "Klinik" dengan icon Building2 (menghindari keambiguan dengan nama group)
- [x] URL pengaturan klinik: `/settings/clinic` (bukan `/settings`)
- [x] Icon "Layanan" menggunakan Briefcase (bukan Receipt, agar tidak sama dengan Billing)
- [x] Tambah menu Staff, Layanan, Profil di sidebar dan drawer

---

## 7.5 Verifikasi

- [x] Dashboard admin menampilkan semua statistik + chart
- [x] Dashboard dokter menampilkan data hanya milik dokter tersebut
- [x] Dashboard resepsionis menampilkan data antrian & billing
- [x] Update pengaturan klinik berhasil (nama, alamat, logo)
- [x] Logo klinik preview tampil setelah disimpan (full URL dari backend)
- [x] Tambah staff baru -> bisa login dengan role yang ditentukan
- [x] Toggle aktif/nonaktif staff -> staff nonaktif tidak bisa login
- [x] Filter staff berdasarkan role berfungsi
- [x] Ganti password berhasil
- [x] Non-admin tidak bisa akses halaman pengaturan (403 / redirect)
- [x] CRUD layanan berfungsi (harga menggunakan valueAsNumber)
- [x] Pest test semua pass: 173 tests (415 assertions)
- [x] Larastan: 0 errors
- [x] TypeScript: clean
- [x] Build: success

---

## 7.6 Post-Implementation Fixes

- [x] Hapus menu "Dokter" (redundan dengan Staff)
- [x] Icon "Layanan" diganti dari Receipt ke Briefcase
- [x] Logo preview: backend mengembalikan full URL via `asset('storage/' . $path)` di index() dan update()
- [x] Rename nav item "Pengaturan" → "Klinik" (Building2 icon) untuk menghindari keambiguan dengan group name
- [x] URL pengaturan klinik diubah dari `/settings` ke `/settings/clinic`
- [x] Fix layanan: tambah `valueAsNumber` pada input harga untuk mengatasi error "expected number, received string"
- [x] Tambah filter role pada halaman Staff (backend + frontend)
- [x] Search dan filter di halaman Staff dibuat side by side (flex-row di desktop, flex-col di mobile)
- [x] Label dan dropdown "Pilih Layanan" di CreateInvoicePage diperbaiki (font-medium, w-full)

---

## Deliverables

| Item | Status |
|------|--------|
| API dashboard (statistik per role) | ✅ |
| Halaman dashboard adaptif (Admin, Dokter, Resepsionis) | ✅ |
| Chart kunjungan bulanan (Recharts) | ✅ |
| Migration & Model ClinicSetting | ✅ |
| API pengaturan klinik + upload logo (full URL) | ✅ |
| API manajemen staff (CRUD + toggle active + filter role) | ✅ |
| API profil (update + ganti password) | ✅ |
| Halaman pengaturan klinik (`/settings/clinic`) | ✅ |
| Halaman manajemen staff (search + filter side by side) | ✅ |
| Halaman manajemen layanan | ✅ |
| Form profil & ganti password | ✅ |
| Pest test dashboard & pengaturan (20 tests) | ✅ |
