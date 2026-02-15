# Phase 4: Jadwal Dokter & Sistem Antrian

**Estimasi:** 3-4 hari
**Prasyarat:** Phase 3 selesai
**Status:** Selesai
**Output:** Jadwal dokter per hari + sistem antrian walk-in number-based berfungsi penuh.

---

## 4.1 Backend - Jadwal Dokter

### Migration & Model:
- [x] Buat migration tabel `schedules`:
  ```
  id, doctor_id (FK users), date, start_time, end_time,
  is_available (default true), notes (nullable, text),
  created_at, updated_at
  ```
  - Constraint: unique `(doctor_id, date)` - satu jadwal per dokter per hari
  - **Catatan:** `slot_duration` dihapus untuk fleksibilitas
- [x] Buat Model `Schedule` dengan relasi `doctor` (belongsTo User), `@property` PHPDoc annotations
- [x] Buat `ScheduleFactory`

### API Endpoints:
- [x] Buat `ScheduleController`:
  - `GET /api/schedules` - List jadwal (filter by doctor_id, date range)
  - `POST /api/schedules` - Buat jadwal baru
  - `PUT /api/schedules/{id}` - Update jadwal (dengan constraint antrian)
  - `PATCH /api/schedules/{id}/toggle` - Toggle available/unavailable (dengan constraint antrian)
  - `DELETE /api/schedules/{id}` - Hapus jadwal
- [x] Buat `StoreScheduleRequest` dan `UpdateScheduleRequest` dengan validasi:
  - Doctor ID: required, exists
  - Date: required, date
  - Start/end time: required, format H:i, end > start
  - Unique doctor+date (via `withValidator` + `whereDate` untuk kompatibilitas SQLite)
- [x] Buat `SchedulePolicy`:
  - Admin: CRUD penuh semua jadwal
  - Dokter: CRUD hanya jadwal sendiri
  - Resepsionis: viewAny saja
- [x] Buat `ScheduleResource` (menggunakan pola `$this->resource` untuk kompatibilitas Larastan)
- [x] Tulis Pest test (23 test cases)

### Aturan Bisnis Jadwal vs Antrian:
- [x] **Edit diblokir** jika ada antrian dengan status selain "waiting" (vitals, in_consultation, dll.) — return 422
- [x] **Edit diizinkan** jika semua antrian masih "waiting"; jika tanggal diubah, semua antrian waiting otomatis cascade mengikuti tanggal baru (dalam DB transaction)
- [x] **Toggle diblokir** jika ada antrian terdaftar apapun statusnya — return 422

### Endpoint:
```
GET    /api/schedules              (auth, ?doctor_id=, ?date_from=, ?date_to=)
POST   /api/schedules              (auth, admin|doctor)
PUT    /api/schedules/{id}         (auth, admin|own doctor)
PATCH  /api/schedules/{id}/toggle  (auth, admin|own doctor)
DELETE /api/schedules/{id}         (auth, admin|own doctor)
GET    /api/doctors                (auth, list dokter aktif)
```

---

## 4.2 Frontend - Halaman Jadwal

### Task:
- [x] Buat API functions (`src/api/schedules.ts`, `src/api/doctors.ts`)
- [x] Buat halaman `/schedules`:
  - Filter dokter (dropdown) - Admin melihat semua, Dokter melihat sendiri
  - Tampilan list mingguan dengan navigasi prev/next week
  - Untuk setiap jadwal tampilkan: tanggal, jam mulai-selesai, status (available/unavailable)
  - Tombol tambah jadwal (Admin & Dokter)
- [x] Buat form tambah/edit jadwal (modal `ScheduleDialog`):
  - Pilih dokter (Admin), auto-fill (Dokter)
  - Tanggal, jam mulai, jam selesai, catatan
  - Edit default values menggunakan `useEffect` + `reset()` pattern (bukan `defaultValues`)
- [x] Buat dialog hapus jadwal (`DeleteScheduleDialog`)
- [x] Toggle ketersediaan jadwal (button)
- [x] Tambah route `/schedules` di `routes/index.tsx`

---

## 4.3 Backend - Sistem Antrian

### Migration & Model:
- [x] Buat migration tabel `queues`:
  ```
  id, doctor_id (FK users), patient_id (FK patients), queue_number (integer),
  date, status (enum: waiting/vitals/in_consultation/completed/cancelled),
  priority (enum: normal/urgent, default normal),
  called_at (nullable), started_at (nullable), completed_at (nullable),
  created_at, updated_at
  ```
  - Index: `(doctor_id, date)` untuk query per dokter per hari
- [x] Buat Model `Queue` dengan:
  - Relasi: `doctor`, `patient`
  - Auto-assign `queue_number` (increment per doctor+date) di event `creating`
  - Scope: `today()`, `byDoctor()`, `active()` (exclude completed/cancelled)
  - `$attributes` defaults untuk status (`waiting`) dan priority (`normal`)
  - `@property` PHPDoc annotations

### API Endpoints:
- [x] Buat `QueueController`:
  - `GET /api/queues` - List antrian (filter by doctor_id, status, date; default hari ini)
  - `POST /api/queues` - Tambah pasien ke antrian (mendukung parameter `date` opsional)
  - `PATCH /api/queues/{id}/status` - Update status antrian
  - `PATCH /api/queues/{id}/call` - Dokter panggil pasien (set called_at, started_at, status -> in_consultation)
  - `PATCH /api/queues/{id}/complete` - Selesai konsultasi (set completed_at, status -> completed)
  - `PATCH /api/queues/{id}/cancel` - Batalkan antrian
- [x] Buat `StoreQueueRequest` dengan validasi:
  - Patient: required, exists
  - Doctor: required, exists, harus punya jadwal pada tanggal tersebut (via `withValidator`)
  - Date: optional, date, `after_or_equal:yesterday`
  - Cek pasien belum ada di antrian aktif dokter yang sama pada tanggal tersebut
- [x] Buat `QueuePolicy`:
  - Admin: penuh
  - Dokter: call, complete antrian sendiri
  - Resepsionis: tambah, cancel, update status
- [x] Buat `QueueResource` (menggunakan pola `$this->resource`)
- [x] Tulis Pest test (21 test cases)

### Endpoint:
```
GET    /api/queues                    (auth, ?doctor_id=, ?date=, ?status=)
POST   /api/queues                    (auth, admin|receptionist)
PATCH  /api/queues/{id}/status        (auth)
PATCH  /api/queues/{id}/call          (auth, admin|own doctor)
PATCH  /api/queues/{id}/complete      (auth, admin|own doctor)
PATCH  /api/queues/{id}/cancel        (auth, admin|receptionist)
```

---

## 4.4 Frontend - Halaman Antrian

### Task:
- [x] Buat API functions (`src/api/queues.ts`)
- [x] Buat halaman `/queue` - Antrian:
  - **Navigasi tanggal:** prev/next day buttons, date input (min kemarin), tombol "Hari Ini"
  - **Timezone:** Asia/Makassar (WITA, UTC+8) — konsisten dengan backend
  - **Label tanggal:** format Indonesia (contoh: "Hari Ini - Sabtu, 15 Februari 2026")
  - Filter dokter (dropdown)
  - List antrian dikelompokkan per status:
    - Menunggu (waiting) - dengan nomor antrian, nama pasien, prioritas
    - Tanda Vital (vitals) - sedang input vital signs
    - Dalam Konsultasi (in_consultation) - sedang ditangani dokter
    - Selesai (completed)
    - Dibatalkan (cancelled)
  - Badge prioritas urgent (warna merah)
  - Tombol aksi per item sesuai role:
    - Resepsionis: "Input Vital", "Batalkan"
    - Dokter: "Panggil Pasien", "Selesai Konsultasi"
    - Admin: semua aksi
  - **Auto-refresh** setiap 30 detik (hanya pada tanggal hari ini)
- [x] Buat dialog "Tambah ke Antrian" (`AddQueueDialog`):
  - Pilih pasien (search dengan debounce)
  - Pilih dokter
  - Pilih prioritas (normal/urgent)
  - Menerima prop `date` dari QueuePage, menampilkan label tanggal
  - Menggunakan `mutation.mutate()` (bukan `mutateAsync`) untuk error handling yang benar
- [x] Tampilkan ringkasan antrian: menunggu, dilayani, selesai, total (4 kartu statistik)
- [x] Tambah route `/queue` di `routes/index.tsx`

---

## 4.5 Data Pendukung

- [x] Buat `DoctorSeeder` dengan 3 dokter dummy (Dr. Budi Santoso/Umum, Dr. Siti Rahayu/Gigi, Dr. Andi Pratama/Anak)
- [x] Update `DatabaseSeeder` untuk memanggil `DoctorSeeder`

---

## 4.6 Konfigurasi

- [x] Set timezone aplikasi ke `Asia/Makassar` (WITA, UTC+8) di `backend/config/app.php`
- [x] Frontend menggunakan `Asia/Makassar` timezone untuk semua kalkulasi tanggal di QueuePage

---

## 4.7 Verifikasi

- [x] Buat jadwal dokter -> constraint 1 jadwal/dokter/hari berfungsi
- [x] Dokter hanya bisa kelola jadwal sendiri
- [x] Jadwal tidak bisa diedit jika ada antrian yang sedang diproses
- [x] Jadwal tidak bisa dinonaktifkan jika ada antrian terdaftar
- [x] Ubah tanggal jadwal -> antrian waiting cascade mengikuti
- [x] Tambah pasien ke antrian -> nomor antrian auto-increment per dokter per hari
- [x] Alur status: waiting -> vitals -> in_consultation -> completed berfungsi
- [x] Pasien urgent ditampilkan di atas
- [x] Pembatalan antrian berfungsi
- [x] Dokter hanya bisa panggil/selesaikan antrian sendiri
- [x] Pest test semua pass (77 tests, 161 assertions)
- [x] Larastan: 0 errors
- [x] TypeScript: no errors
- [x] Frontend build: success (546 KB / ~165 KB gzipped)

---

## Deliverables

| Item | Status |
|------|--------|
| Migration & Model Schedule + Queue | Selesai |
| API jadwal (CRUD + toggle + constraint antrian) | Selesai |
| API antrian (CRUD + status transitions + date support) | Selesai |
| Policy jadwal & antrian (RBAC) | Selesai |
| Halaman jadwal dokter (weekly view, filter, toggle) | Selesai |
| Halaman antrian (date picker, grouped by status, aksi per role, auto-refresh) | Selesai |
| Dialog tambah antrian (search pasien, date prop) | Selesai |
| Doctor seeder (3 dummy doctors) | Selesai |
| Pest test jadwal & antrian (77 total) | Selesai |
| Timezone Asia/Makassar (backend + frontend) | Selesai |

---

## Catatan Teknis

| Issue | Solusi |
|-------|--------|
| `Rule::unique` gagal dengan SQLite datetime | Ganti dengan `withValidator` + `whereDate` |
| Queue default status null via Eloquent | Tambah `$attributes` array di model |
| Larastan `@mixin` type errors di Resource | Gunakan `$this->resource` dengan `@var` cast + `@property` PHPDoc |
| `z.coerce.number()` type mismatch react-hook-form | Ganti ke `z.number()` dengan `{ valueAsNumber: true }` |
| `useForm` defaultValues tidak update saat edit | Ganti ke `useEffect` + `reset()` pattern |
| `mutateAsync` uncaught promise pada 422 | Ganti ke `mutation.mutate()` untuk error handling via `onError` |
| `toISOString()` timezone shift di UTC+8 | Ganti ke `toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })` |
| Schedule factory unique constraint collision | Gunakan explicit distinct dates di test |
