# Phase 2: Autentikasi & Layout

**Estimasi:** 2-3 hari
**Prasyarat:** Phase 1 selesai
**Output:** Sistem login/register berfungsi, layout responsif (sidebar desktop + bottom nav mobile) siap.

---

## 2.1 Backend - Model User & Migration

### Task:
- [ ] Buat/update migration tabel `users`:
  ```
  id, email (unique), password, name, phone, role (enum: admin/doctor/receptionist),
  specialization (nullable), sip_number (nullable), avatar (nullable),
  is_active (default true), created_at, updated_at
  ```
- [ ] Buat Model `User` dengan fillable, hidden, casts
- [ ] Buat seeder `AdminSeeder` (user admin default untuk pertama kali)

---

## 2.2 Backend - Auth API (Sanctum)

### Task:
- [ ] Buat `AuthController` dengan endpoint:
  - `POST /api/register` - Register user baru (default role: receptionist)
  - `POST /api/login` - Login, return user data + set cookie session
  - `POST /api/logout` - Logout, hapus session
  - `GET /api/user` - Get current authenticated user
- [ ] Buat `LoginRequest` & `RegisterRequest` (Form Request validation)
- [ ] Konfigurasi Sanctum middleware di `api.php`
- [ ] Buat middleware `CheckRole` untuk validasi role di route
- [ ] Tulis Pest test untuk auth flow (register, login, logout, get user)

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
- [ ] Buat halaman `/login` dengan form:
  - Email, Password, tombol Login
  - Link ke Register
  - Validasi dengan React Hook Form + Zod
- [ ] Buat halaman `/register` dengan form:
  - Nama, Email, Password, Konfirmasi Password, Telepon
  - Link ke Login
  - Validasi dengan React Hook Form + Zod
- [ ] Buat `useAuth` hook:
  - `login()`, `register()`, `logout()`, `user` (current user data)
  - Menggunakan TanStack Query untuk fetch `/api/user`
- [ ] Buat `ProtectedRoute` component (redirect ke `/login` jika belum auth)
- [ ] Buat `GuestRoute` component (redirect ke `/dashboard` jika sudah auth)
- [ ] Setup Axios interceptor: redirect ke `/login` jika response 401

---

## 2.4 Frontend - Layout Responsif

### Task:
- [ ] Buat komponen `AppShell` (layout wrapper untuk halaman authenticated):
  - Desktop (>= 1024px): Sidebar kiri + area konten
  - Mobile/Tablet (< 1024px): Konten full-width + bottom nav
- [ ] Buat komponen `Sidebar` (desktop):
  - Logo klinik di atas
  - Menu grup: Dashboard, Pelayanan, Data, Transaksi, Pengaturan
  - Highlight item aktif (warna primary)
  - User info + logout di bawah
  - Menu item disesuaikan per role (sembunyikan yang tidak berhak)
- [ ] Buat komponen `BottomNav` (mobile/tablet):
  - 5 item: Home, Antrian, Pasien, Medis, Lainnya
  - Fixed di bawah layar
  - Highlight item aktif
  - Icon menggunakan Lucide React
- [ ] Buat komponen `MoreDrawer` (drawer dari bawah untuk menu "Lainnya"):
  - Berisi menu tambahan: Jadwal, Resep, Billing, Pengaturan
  - Disesuaikan per role
- [ ] Tambahkan `padding-bottom` pada konten di mobile agar tidak tertutup bottom nav
- [ ] Buat halaman `/dashboard` placeholder (menampilkan "Selamat datang, {nama}")

---

## 2.5 Verifikasi

- [ ] Register user baru -> otomatis role receptionist
- [ ] Login -> redirect ke dashboard
- [ ] Akses halaman protected tanpa login -> redirect ke login
- [ ] Sidebar tampil di desktop, tersembunyi di mobile
- [ ] Bottom nav tampil di mobile/tablet, tersembunyi di desktop
- [ ] Menu "Lainnya" membuka drawer dengan menu tambahan
- [ ] Logout -> redirect ke login
- [ ] Pest test auth semua pass

---

## Deliverables

| Item | Status |
|------|--------|
| Auth API (register, login, logout, get user) | - |
| Middleware CheckRole | - |
| Halaman Login & Register | - |
| useAuth hook + protected routes | - |
| Layout AppShell (Sidebar + BottomNav) | - |
| MoreDrawer untuk menu tambahan mobile | - |
| Pest test auth | - |
