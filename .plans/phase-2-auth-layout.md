# Phase 2: Autentikasi & Layout

**Estimasi:** 2-3 hari
**Prasyarat:** Phase 1 selesai
**Output:** Sistem login/register berfungsi, layout responsif (sidebar desktop + bottom nav mobile) siap.

---

## 2.1 Backend - Model User & Migration

### Task:
- [x] Buat/update migration tabel `users`:
  ```
  id, email (unique), password, name, phone, role (enum: admin/doctor/receptionist),
  specialization (nullable), sip_number (nullable), avatar (nullable),
  is_active (default true), created_at, updated_at
  ```
- [x] Buat Model `User` dengan fillable, hidden, casts
- [x] Buat seeder `AdminSeeder` (user admin default untuk pertama kali)

---

## 2.2 Backend - Auth API (Sanctum)

### Task:
- [x] Buat `AuthController` dengan endpoint:
  - `POST /api/register` - Register user baru (default role: receptionist)
  - `POST /api/login` - Login, return user data + set cookie session
  - `POST /api/logout` - Logout, hapus session
  - `GET /api/user` - Get current authenticated user
- [x] Buat `LoginRequest` & `RegisterRequest` (Form Request validation)
- [x] Konfigurasi Sanctum middleware di `api.php`
- [x] Buat middleware `CheckRole` untuk validasi role di route
- [x] Tulis Pest test untuk auth flow (register, login, logout, get user)

### Endpoint:
```
POST   /api/register        (public)
POST   /api/login           (public)
POST   /api/logout          (auth)
GET    /api/user             (auth)
```

---

## 2.3 Frontend - Halaman Auth

### Task:
- [x] Buat halaman `/login` dengan form:
  - Email, Password, tombol Login
  - Link ke Register
  - Validasi dengan React Hook Form + Zod
- [x] Buat halaman `/register` dengan form:
  - Nama, Email, Password, Konfirmasi Password, Telepon
  - Link ke Login
  - Validasi dengan React Hook Form + Zod
- [x] Buat `useAuth` hook:
  - `login()`, `register()`, `logout()`, `user` (current user data)
  - Menggunakan TanStack Query untuk fetch `/api/user`
- [x] Buat `ProtectedRoute` component (redirect ke `/login` jika belum auth)
- [x] Buat `GuestRoute` component (redirect ke `/dashboard` jika sudah auth)
- [x] Setup Axios interceptor: redirect ke `/login` jika response 401

---

## 2.4 Frontend - Layout Responsif

### Task:
- [x] Buat komponen `AppShell` (layout wrapper untuk halaman authenticated):
  - Desktop (>= 1024px): Sidebar kiri + area konten
  - Mobile/Tablet (< 1024px): Konten full-width + bottom nav
- [x] Buat komponen `Sidebar` (desktop):
  - Logo klinik di atas
  - Menu grup: Dashboard, Pelayanan, Data, Transaksi, Pengaturan
  - Highlight item aktif (warna primary)
  - User info + logout di bawah
  - Menu item disesuaikan per role (sembunyikan yang tidak berhak)
- [x] Buat komponen `BottomNav` (mobile/tablet):
  - 5 item: Home, Antrian, Pasien, Medis, Lainnya
  - Fixed di bawah layar
  - Highlight item aktif
  - Icon menggunakan Lucide React
- [x] Buat komponen `MoreDrawer` (drawer dari bawah untuk menu "Lainnya"):
  - Berisi menu tambahan: Jadwal, Resep, Billing, Pengaturan
  - Disesuaikan per role
- [x] Tambahkan `padding-bottom` pada konten di mobile agar tidak tertutup bottom nav
- [x] Buat halaman `/dashboard` placeholder (menampilkan "Selamat datang, {nama}")

---

## 2.5 Verifikasi

- [x] Register user baru -> otomatis role receptionist
- [x] Login -> redirect ke dashboard
- [x] Akses halaman protected tanpa login -> redirect ke login
- [x] Sidebar tampil di desktop, tersembunyi di mobile
- [x] Bottom nav tampil di mobile/tablet, tersembunyi di desktop
- [x] Menu "Lainnya" membuka drawer dengan menu tambahan
- [x] Logout -> redirect ke login
- [x] Pest test auth semua pass

---

## Deliverables

| Item | Status |
|------|--------|
| Auth API (register, login, logout, get user) | ✅ |
| Middleware CheckRole | ✅ |
| Halaman Login & Register | ✅ |
| useAuth hook + protected routes | ✅ |
| Layout AppShell (Sidebar + BottomNav) | ✅ |
| MoreDrawer untuk menu tambahan mobile | ✅ |
| Pest test auth | ✅ |
