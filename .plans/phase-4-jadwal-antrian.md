# Phase 4: Jadwal Dokter & Sistem Antrian

**Estimasi:** 3-4 hari
**Prasyarat:** Phase 3 selesai
**Output:** Jadwal dokter per hari + sistem antrian walk-in number-based berfungsi penuh.

---

## 4.1 Backend - Jadwal Dokter

### Migration & Model:
- [ ] Buat migration tabel `schedules`:
  ```
  id, doctor_id (FK users), date, start_time, end_time,
  slot_duration (integer, menit), is_available (default true),
  notes (nullable, text), created_at, updated_at
  ```
  - Constraint: unique `(doctor_id, date)` - satu jadwal per dokter per hari
- [ ] Buat Model `Schedule` dengan relasi `doctor` (belongsTo User)
- [ ] Buat `ScheduleFactory`

### API Endpoints:
- [ ] Buat `ScheduleController`:
  - `GET /api/schedules` - List jadwal (filter by doctor_id, date range)
  - `POST /api/schedules` - Buat jadwal baru
  - `PUT /api/schedules/{id}` - Update jadwal
  - `PATCH /api/schedules/{id}/toggle` - Toggle available/unavailable
  - `DELETE /api/schedules/{id}` - Hapus jadwal
- [ ] Buat `ScheduleRequest` dengan validasi:
  - Doctor ID: required, exists
  - Date: required, date
  - Start/end time: required, format H:i, end > start
  - Unique doctor+date
- [ ] Buat `SchedulePolicy`:
  - Admin: CRUD penuh semua jadwal
  - Dokter: CRUD hanya jadwal sendiri
  - Resepsionis: viewAny saja
- [ ] Tulis Pest test

### Endpoint:
```
GET    /api/schedules              (auth, ?doctor_id=, ?date_from=, ?date_to=)
POST   /api/schedules              (auth, admin|doctor)
PUT    /api/schedules/{id}         (auth, admin|own doctor)
PATCH  /api/schedules/{id}/toggle  (auth, admin|own doctor)
DELETE /api/schedules/{id}         (auth, admin|own doctor)
```

---

## 4.2 Frontend - Halaman Jadwal

### Task:
- [ ] Buat API functions (`src/api/schedules.ts`)
- [ ] Buat halaman `/schedule`:
  - Filter dokter (dropdown) - Admin melihat semua, Dokter melihat sendiri
  - Tampilan list/kalender mingguan sederhana
  - Untuk setiap jadwal tampilkan: tanggal, jam mulai-selesai, durasi slot, status (available/unavailable)
  - Tombol tambah jadwal (Admin & Dokter)
- [ ] Buat form tambah/edit jadwal (modal):
  - Pilih dokter (Admin), auto-fill (Dokter)
  - Tanggal, jam mulai, jam selesai, durasi slot, catatan
- [ ] Toggle ketersediaan jadwal (switch/button)

---

## 4.3 Backend - Sistem Antrian

### Migration & Model:
- [ ] Buat migration tabel `queues`:
  ```
  id, doctor_id (FK users), patient_id (FK patients), queue_number (integer),
  date, status (enum: waiting/vitals/in_consultation/completed/cancelled),
  priority (enum: normal/urgent, default normal),
  called_at (nullable), started_at (nullable), completed_at (nullable),
  created_at, updated_at
  ```
  - Index: `(doctor_id, date)` untuk query per dokter per hari
- [ ] Buat Model `Queue` dengan:
  - Relasi: `doctor`, `patient`, `vitalSign`, `medicalRecord`
  - Auto-assign `queue_number` (increment per doctor+date) di event `creating`
  - Scope: `today()`, `byDoctor()`, `active()` (exclude completed/cancelled)

### API Endpoints:
- [ ] Buat `QueueController`:
  - `GET /api/queues` - List antrian hari ini (filter by doctor_id, status, date)
  - `POST /api/queues` - Tambah pasien ke antrian
  - `PATCH /api/queues/{id}/status` - Update status antrian
  - `PATCH /api/queues/{id}/call` - Dokter panggil pasien (set called_at, status -> in_consultation)
  - `PATCH /api/queues/{id}/complete` - Selesai konsultasi (set completed_at, status -> completed)
  - `PATCH /api/queues/{id}/cancel` - Batalkan antrian
- [ ] Buat `QueueRequest` dengan validasi:
  - Patient: required, exists
  - Doctor: required, exists, harus punya jadwal hari ini
  - Cek pasien belum ada di antrian aktif dokter yang sama hari ini
- [ ] Buat `QueuePolicy`:
  - Admin: penuh
  - Dokter: call, complete antrian sendiri
  - Resepsionis: tambah, cancel, update status
- [ ] Tulis Pest test

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
- [ ] Buat API functions (`src/api/queues.ts`)
- [ ] Buat halaman `/queue` - Antrian Hari Ini:
  - Filter dokter (dropdown/tabs)
  - List antrian dikelompokkan per status:
    - Menunggu (waiting) - dengan nomor antrian, nama pasien, prioritas
    - Tanda Vital (vitals) - sedang input vital signs
    - Dalam Konsultasi (in_consultation) - sedang ditangani dokter
    - Selesai (completed)
  - Badge prioritas urgent (warna merah)
  - Tombol aksi per item sesuai role:
    - Resepsionis: "Tambah ke Antrian", "Input Vital", "Batalkan"
    - Dokter: "Panggil Pasien", "Selesai Konsultasi"
- [ ] Buat dialog "Tambah ke Antrian":
  - Pilih pasien (search/select)
  - Pilih dokter
  - Pilih prioritas (normal/urgent)
- [ ] Tampilkan ringkasan antrian: total menunggu, sedang dilayani, selesai
- [ ] Auto-refresh data antrian (TanStack Query refetch interval atau manual refresh)

---

## 4.5 Verifikasi

- [ ] Buat jadwal dokter -> constraint 1 jadwal/dokter/hari berfungsi
- [ ] Dokter hanya bisa kelola jadwal sendiri
- [ ] Tambah pasien ke antrian -> nomor antrian auto-increment per dokter per hari
- [ ] Alur status: waiting -> vitals -> in_consultation -> completed berfungsi
- [ ] Pasien urgent ditampilkan di atas
- [ ] Pembatalan antrian berfungsi
- [ ] Dokter hanya bisa panggil/selesaikan antrian sendiri
- [ ] Pest test semua pass
- [ ] Tampilan responsif di mobile

---

## Deliverables

| Item | Status |
|------|--------|
| Migration & Model Schedule + Queue | - |
| API jadwal (CRUD + toggle) | - |
| API antrian (CRUD + status transitions) | - |
| Policy jadwal & antrian (RBAC) | - |
| Halaman jadwal dokter | - |
| Halaman antrian (grouped by status, aksi per role) | - |
| Dialog tambah antrian (search pasien) | - |
| Pest test jadwal & antrian | - |
