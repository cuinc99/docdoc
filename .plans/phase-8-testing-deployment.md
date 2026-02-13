# Phase 8: Testing, Polish & Deployment

**Estimasi:** 3-4 hari
**Prasyarat:** Phase 7 selesai
**Output:** Aplikasi production-ready dengan test coverage, error handling, dan Docker deployment.

---

## 8.1 Backend - Testing & Quality

### Task:
- [ ] Review & lengkapi semua Pest test yang belum dibuat:
  - Auth flow (register, login, logout, unauthorized access)
  - CRUD semua entity (patients, schedules, queues, vital_signs, medical_records, prescriptions, invoices)
  - Policy/authorization test per role per endpoint
  - Business logic: auto-lock rekam medis, partial payment, dispense resep
  - Edge cases: duplikasi antrian, jadwal duplikat, tebus resep 2x, dll.
- [ ] Jalankan `php artisan test` - pastikan semua pass
- [ ] Jalankan Larastan (`./vendor/bin/phpstan analyse`) - perbaiki semua error
- [ ] Jalankan Laravel Pint (`./vendor/bin/pint`) - format semua kode
- [ ] Review semua API response format konsisten (`{ data, message, errors }`)
- [ ] Pastikan semua error message dalam Bahasa Indonesia
- [ ] Review validasi: semua input user di-validasi di backend

---

## 8.2 Frontend - Testing & Quality

### Task:
- [ ] Tulis test untuk komponen kritis:
  - `useAuth` hook (login, logout, redirect)
  - Form components (validasi, submit, error display)
  - Layout components (Sidebar render di desktop, BottomNav di mobile)
  - Dashboard components (render sesuai role)
- [ ] Jalankan `bun run test` (Vitest) - pastikan semua pass
- [ ] Jalankan ESLint + Prettier - perbaiki semua warning/error
- [ ] Review TypeScript: pastikan tidak ada `any` type yang tidak perlu
- [ ] Pastikan semua teks UI dalam Bahasa Indonesia

---

## 8.3 Error Handling & UX Polish

### Task:
- [ ] Backend:
  - Buat exception handler global (format error response konsisten)
  - Handle 404, 403, 422, 500 dengan pesan Bahasa Indonesia
  - Validasi error return field-level errors
- [ ] Frontend:
  - Buat error boundary component (catch React errors)
  - Halaman 404 (route tidak ditemukan)
  - Loading states: skeleton/spinner pada semua halaman yang fetch data
  - Empty states: pesan ketika data kosong (mis. "Belum ada pasien terdaftar")
  - Toast notification konsisten (sukses: hijau, error: merah, warning: kuning)
  - Konfirmasi dialog untuk aksi destruktif (hapus, batalkan, tebus)
- [ ] Responsive check:
  - Test semua halaman di mobile (375px), tablet (768px), desktop (1280px)
  - Tabel: horizontal scroll di mobile
  - Form: single column di mobile, multi column di desktop
  - Modal/dialog: full-screen di mobile, centered di desktop
  - Bottom nav: tidak overlap konten

---

## 8.4 Seeder Data Demo

### Task:
- [ ] Buat `DatabaseSeeder` lengkap untuk demo:
  - 1 Admin (admin@docdoc.id / password)
  - 2 Dokter (dengan spesialisasi berbeda)
  - 2 Resepsionis
  - 20-30 pasien dummy
  - Jadwal dokter untuk minggu ini
  - 10-15 antrian hari ini (berbagai status)
  - 10 rekam medis (beberapa terkunci, beberapa terbuka)
  - 5-10 resep (beberapa sudah ditebus)
  - 5-10 invoice (pending, partial, paid)
  - Beberapa pembayaran
  - 5-10 layanan klinik
  - Setting klinik default
- [ ] Buat command `php artisan db:seed --class=DemoSeeder`

---

## 8.5 Docker Production Setup

### Task:
- [ ] Update `Dockerfile` backend untuk production:
  - Multi-stage build (composer install -> production image)
  - PHP-FPM + Nginx (atau Octane jika perlu)
  - Optimize autoloader, cache config/routes/views
- [ ] Update `Dockerfile` frontend untuk production:
  - Multi-stage build (bun build -> serve static via Nginx)
- [ ] Update `docker-compose.yml` untuk production:
  - Environment variables via `.env`
  - Volume untuk PostgreSQL data persistence
  - Volume untuk Laravel storage (uploads)
  - Restart policy: always
  - Health checks
- [ ] Buat `docker-compose.prod.yml` (production override)
- [ ] Buat script `deploy.sh`:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
  docker compose exec backend php artisan migrate --force
  docker compose exec backend php artisan config:cache
  docker compose exec backend php artisan route:cache
  docker compose exec backend php artisan view:cache
  ```
- [ ] Buat `.env.example` lengkap untuk production

---

## 8.6 Final Checklist

### Fungsional:
- [ ] Register & login berfungsi
- [ ] RBAC: setiap role hanya bisa akses fitur yang sesuai
- [ ] Alur lengkap: Registrasi pasien -> Antrian -> Vital -> Konsultasi -> Resep -> Billing -> Pembayaran
- [ ] Rekam medis terkunci setelah 24 jam
- [ ] Resep tidak bisa diedit setelah ditebus
- [ ] Partial payment berfungsi
- [ ] PDF resep & invoice bisa di-download
- [ ] Dashboard menampilkan data yang benar per role
- [ ] Pengaturan klinik & staff berfungsi

### Teknis:
- [ ] Semua Pest test pass
- [ ] Semua Vitest pass
- [ ] Larastan: 0 error
- [ ] ESLint: 0 error
- [ ] Tidak ada credential/secret yang ter-commit
- [ ] Docker Compose production berjalan lancar
- [ ] Database migration berjalan di fresh database

### UX:
- [ ] Responsif di mobile, tablet, desktop
- [ ] Bottom nav berfungsi di mobile/tablet
- [ ] Sidebar berfungsi di desktop
- [ ] Loading states di semua halaman
- [ ] Empty states di semua list kosong
- [ ] Error handling user-friendly (Bahasa Indonesia)
- [ ] Dark mode berfungsi

---

## Deliverables

| Item | Status |
|------|--------|
| Test coverage backend (Pest) - semua pass | - |
| Test coverage frontend (Vitest) - semua pass | - |
| Larastan & ESLint - 0 error | - |
| Error handling & UX polish (loading, empty, 404) | - |
| Responsive check semua halaman | - |
| Seeder data demo | - |
| Docker production setup | - |
| Deploy script | - |
| Final checklist verified | - |
