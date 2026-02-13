# Phase 7: Dashboard & Pengaturan

**Estimasi:** 2-3 hari
**Prasyarat:** Phase 6 selesai
**Output:** Dashboard adaptif per role dengan statistik, manajemen pengaturan klinik & staff.

---

## 7.1 Backend - Dashboard API

### Task:
- [ ] Buat `DashboardController` dengan endpoint:
  - `GET /api/dashboard` - Return statistik sesuai role user yang login
- [ ] Data statistik per role:

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

- [ ] Tulis Pest test

### Endpoint:
```
GET    /api/dashboard    (auth)
```

---

## 7.2 Frontend - Halaman Dashboard

### Task:
- [ ] Buat API function (`src/api/dashboard.ts`)
- [ ] Buat halaman `/dashboard` - Dashboard Adaptif:
  - Detect role user -> render komponen yang sesuai
- [ ] Komponen dashboard **Admin**:
  - 4 kartu statistik (Total Pasien, Kunjungan Hari Ini, Revenue Bulan Ini, Antrian Aktif)
  - Line chart kunjungan 30 hari (Recharts)
  - List antrian aktif hari ini (ringkasan)
- [ ] Komponen dashboard **Dokter**:
  - 4 kartu statistik (Pasien Hari Ini, Antrian Aktif, Rekam Medis Terbaru, Resep Belum Ditebus)
  - List antrian saya hari ini dengan aksi cepat (Panggil, Selesai)
- [ ] Komponen dashboard **Resepsionis**:
  - 4 kartu statistik (Antrian Hari Ini, Invoice Tertunda, Pasien Baru, Pembayaran Hari Ini)
  - List antrian hari ini dengan aksi cepat (Tambah Antrian, Input Vital)
- [ ] Semua kartu statistik menggunakan RetroUI Card component
- [ ] Responsif: kartu 2 kolom di mobile, 4 kolom di desktop

---

## 7.3 Backend - Pengaturan Klinik & Staff

### Migration & Model:
- [ ] Buat migration tabel `clinic_settings`:
  ```
  id, key (unique), value (text), created_at, updated_at
  ```
  - Keys: clinic_name, clinic_address, clinic_phone, clinic_email, clinic_logo
- [ ] Buat Model `ClinicSetting` (key-value store)
- [ ] Buat seeder default clinic settings

### API Endpoints:
- [ ] Buat `ClinicSettingController`:
  - `GET /api/settings/clinic` - Get semua setting klinik
  - `PUT /api/settings/clinic` - Update setting klinik (admin only)
  - `POST /api/settings/clinic/logo` - Upload logo klinik (admin only)
- [ ] Buat `UserManagementController` (untuk admin kelola staff):
  - `GET /api/users` - List staff (paginated)
  - `POST /api/users` - Tambah staff baru
  - `PUT /api/users/{id}` - Update staff (termasuk role)
  - `PATCH /api/users/{id}/toggle-active` - Aktifkan/nonaktifkan staff
- [ ] Buat `ProfileController`:
  - `GET /api/profile` - Get profil sendiri
  - `PUT /api/profile` - Update profil (nama, telepon)
  - `PUT /api/profile/password` - Ganti password
- [ ] Semua endpoint pengaturan klinik & user management: admin only
- [ ] Tulis Pest test

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
- [ ] Buat API functions (`src/api/settings.ts`, `src/api/users.ts`)
- [ ] Buat halaman `/settings` - Pengaturan Klinik (admin only):
  - Form: Nama Klinik, Alamat, Telepon, Email
  - Upload logo klinik (preview image)
  - Tombol Simpan
- [ ] Buat halaman `/settings/staff` - Manajemen Staff (admin only):
  - Tabel: Nama, Email, Telepon, Role, Status (Aktif/Nonaktif), Aksi
  - Tombol "Tambah Staff"
  - Aksi per row: Edit, Toggle Aktif/Nonaktif
- [ ] Buat form tambah/edit staff (modal):
  - Nama, Email, Password (hanya saat tambah), Telepon, Role (dropdown), Spesialisasi (jika dokter), Nomor SIP (jika dokter)
- [ ] Buat halaman `/settings/services` - Manajemen Layanan (admin only):
  - Tabel: Nama Layanan, Harga, Status, Aksi
  - Tombol "Tambah Layanan"
  - Aksi: Edit, Toggle Aktif/Nonaktif
- [ ] Tambahkan menu profil user di sidebar/bottom nav:
  - Edit Nama, Telepon
  - Ganti Password (old password, new password, confirm)

---

## 7.5 Verifikasi

- [ ] Dashboard admin menampilkan semua statistik + chart
- [ ] Dashboard dokter menampilkan data hanya milik dokter tersebut
- [ ] Dashboard resepsionis menampilkan data antrian & billing
- [ ] Update pengaturan klinik berhasil (nama, alamat, logo)
- [ ] Tambah staff baru -> bisa login dengan role yang ditentukan
- [ ] Toggle aktif/nonaktif staff -> staff nonaktif tidak bisa login
- [ ] Ganti password berhasil
- [ ] Non-admin tidak bisa akses halaman pengaturan (403 / redirect)
- [ ] CRUD layanan berfungsi
- [ ] Pest test semua pass

---

## Deliverables

| Item | Status |
|------|--------|
| API dashboard (statistik per role) | - |
| Halaman dashboard adaptif (Admin, Dokter, Resepsionis) | - |
| Chart kunjungan bulanan (Recharts) | - |
| Migration & Model ClinicSetting | - |
| API pengaturan klinik + upload logo | - |
| API manajemen staff (CRUD + toggle active) | - |
| API profil (update + ganti password) | - |
| Halaman pengaturan klinik | - |
| Halaman manajemen staff | - |
| Halaman manajemen layanan | - |
| Form profil & ganti password | - |
| Pest test dashboard & pengaturan | - |
