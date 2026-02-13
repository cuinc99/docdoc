# PRD - Product Requirements Document

## DocDoc: Sistem Manajemen Klinik

**Versi:** 1.0.0
**Tanggal:** 2026-02-12
**Status:** Planning

---

## 1. Ringkasan Produk

### 1.1 Deskripsi

DocDoc adalah aplikasi manajemen klinik berbasis web untuk praktik medis di Indonesia. Sistem menangani alur operasional klinik: registrasi pasien, antrian, konsultasi dokter, rekam medis, resep obat, dan pembayaran dalam satu platform.

### 1.2 Target Pengguna

| Pengguna | Deskripsi |
|----------|-----------|
| **Admin** | Pemilik/manajer klinik yang mengelola seluruh operasional dan pengaturan |
| **Dokter** | Tenaga medis yang melakukan konsultasi, diagnosis, dan membuat resep |
| **Resepsionis** | Staf yang menangani registrasi pasien, antrian, tanda vital, dan pembayaran |

### 1.3 Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Backend | Laravel 12 (PHP >= 8.2) |
| Frontend | React 19, TypeScript, Vite 6, Bun |
| Database | PostgreSQL 17 |
| Styling | TailwindCSS 4, shadcn/ui, RetroUI (NeoBrutalism) |
| Autentikasi | Laravel Sanctum (SPA cookie-based auth) |
| API | REST API (JSON) |
| State Management | TanStack Query v5 (React Query) |
| Form | React Hook Form + Zod |
| Tabel | TanStack Table v8 |
| Routing (FE) | React Router v7 |
| Icon | Lucide React |
| PDF | laravel-dompdf |
| Visualisasi | Recharts |
| Notifikasi | Sonner (toast in-app) |
| File Storage | Laravel Storage (local, S3-compatible) |
| Runtime & Package Manager | Bun |
| Deployment | Docker + Docker Compose |
| Dev Server (lokal) | Laravel Herd (backend), Vite dev server (frontend) |
| Testing (BE) | Pest v3 + PHPUnit 11 |
| Testing (FE) | Vitest + Testing Library |
| Dev Tools | Laravel Debugbar, Laravel Pint, PHPStan (Larastan), ESLint, Prettier |

**Catatan Bun:**
- Bun digunakan sebagai runtime JavaScript dan package manager untuk frontend
- Install dependencies: `bun install`
- Run dev server: `bun run dev`
- Lockfile: `bun.lockb`

**Catatan Laravel Herd:**
- Laravel Herd digunakan sebagai local development environment untuk backend
- Herd menyediakan PHP, Nginx, dan database services secara otomatis
- Link project: `herd link docdoc-api` -> akses via `http://docdoc-api.test`
- PostgreSQL dijalankan via Herd atau service lokal
- Docker hanya digunakan untuk production deployment

**Catatan RetroUI:**
- RetroUI adalah library komponen React bergaya NeoBrutalism yang dibangun di atas shadcn/ui + TailwindCSS
- Install komponen via CLI: `bunx shadcn@latest add 'https://retroui.dev/r/{component}.json'`
- Komponen diimpor dari `@/components/retroui/{Component}`
- Menggunakan font Archivo Black (heading) + Space Grotesk (body)
- Mendukung dark mode
- Dokumentasi: https://retroui.dev/docs

---

## 2. Arsitektur Sistem

### 2.1 Arsitektur Umum

Single-tenant (1 instance = 1 klinik). Backend Laravel menyediakan REST API, dikonsumsi oleh frontend React SPA.

```
[React SPA (Vite 6 + Bun)] <──HTTP/JSON──> [Laravel 12 API (Herd)] <──> [PostgreSQL 17]
```

### 2.2 Role-Based Access Control (RBAC)

Tiga role dengan permission berbeda:

| Fitur | Admin | Dokter | Resepsionis |
|-------|-------|--------|-------------|
| Dashboard | Penuh | Medis | Billing & antrian |
| Jadwal Dokter | CRUD penuh | Kelola sendiri | Lihat |
| Antrian | Penuh | Panggil & kelola | Kelola |
| Tanda Vital | Penuh | Lihat | Input & edit |
| Data Pasien | CRUD penuh | Lihat | Registrasi & edit |
| Rekam Medis | Penuh | Buat & edit | — |
| Resep Obat | Penuh | Buat | Tebus |
| Billing | Penuh | — | CRUD penuh |
| Pengaturan | Penuh | — | — |

**Aturan keamanan:**
- Validasi permission di **backend** (Laravel middleware + policies)
- Frontend hanya menyembunyikan elemen UI (UX enhancement)

### 2.3 Alur Autentikasi

```
Register/Login (email + password)
    ↓
Laravel Sanctum issue cookie session
    ↓
User mendapat role dari database
    ↓
Dashboard adaptif sesuai role
```

- Default role user baru: `receptionist`
- Role diupdate oleh Admin via halaman pengaturan
- Auth method: Email/password

---

## 3. Data Model

### 3.1 Entity Relationship

```
users (staff klinik, 3 role)

patients (1) ──── (N) queues
patients (1) ──── (N) vital_signs
patients (1) ──── (N) medical_records
patients (1) ──── (N) prescriptions
patients (1) ──── (N) invoices

users/doctor (1) ──── (N) schedules
users/doctor (1) ──── (N) queues
users/doctor (1) ──── (N) medical_records
users/doctor (1) ──── (N) prescriptions

medical_records (1) ──── (N) addendums
medical_records (1) ──── (0..1) prescriptions

invoices (1) ──── (N) payments

queues (1) ──── (0..1) vital_signs
queues (1) ──── (0..1) medical_records
```

### 3.2 Tabel

#### users
Staff klinik. Field: email, password, name, phone, role (admin/doctor/receptionist), specialization (nullable), sip_number (nullable), avatar (nullable), is_active.

#### patients
Pasien klinik. Field: mr_number (auto: MR{YY}{MM}{COUNT}), nik, name, gender, birth_date, phone, email (nullable), address, blood_type (nullable), allergies (nullable, text), emergency_contact_name (nullable), emergency_contact_phone (nullable).

#### schedules
Jadwal praktik dokter. Field: doctor_id, date, start_time, end_time, slot_duration (menit), is_available, notes (nullable). Constraint: satu jadwal per dokter per hari.

#### queues
Antrian pasien (number-based, walk-in). Field: doctor_id, patient_id, queue_number, date, status (waiting/vitals/in_consultation/completed/cancelled), priority (normal/urgent), called_at (nullable), started_at (nullable), completed_at (nullable).

#### vital_signs
Tanda vital. Field: patient_id, queue_id, recorded_by (user_id), systolic, diastolic, heart_rate, temperature, respiratory_rate, oxygen_saturation (nullable), weight, height, bmi (auto-calculated), chief_complaint (text), notes (nullable).

#### medical_records
Rekam medis format SOAP. Field: patient_id, doctor_id, queue_id, vital_sign_id (nullable), subjective (text), objective (text), assessment (text), plan (text), diagnoses (jsonb, array of {code, description, is_primary}), is_locked (default false), locked_at (nullable). Terkunci otomatis setelah 24 jam.

#### addendums
Amandemen rekam medis (setelah terkunci). Field: medical_record_id, doctor_id, content (text).

#### prescriptions
Resep obat. Field: prescription_number (auto: RX{YY}{MM}{DD}{COUNT}), patient_id, doctor_id, medical_record_id, items (jsonb, array of {drug_name, dosage, frequency, duration, quantity, instructions}), notes (nullable), is_dispensed (default false), dispensed_at (nullable), dispensed_by (nullable, user_id).

#### invoices
Tagihan. Field: invoice_number (auto: INV{YY}{MM}{COUNT}), patient_id, items (jsonb, array of {description, quantity, unit_price, total}), subtotal, discount (default 0), tax (default 0), total, paid_amount (default 0), status (pending/partial/paid/cancelled).

#### payments
Pembayaran. Field: invoice_id, amount, method (cash/transfer), reference (nullable), received_by (user_id).

#### services
Daftar layanan klinik. Field: name, price, is_active.

---

## 4. Fitur & Alur Kerja

### 4.1 Manajemen Pasien

**Registrasi Pasien Baru:**
1. Resepsionis mengisi data: NIK, nama, tanggal lahir, gender, telepon, alamat
2. Sistem generate nomor rekam medis otomatis (format: MR{YY}{MM}{COUNT})
3. Data opsional: email, golongan darah, alergi, kontak darurat

**Pencarian:**
- Search berdasarkan nama, MR number, NIK, telepon

**Akses:**
- Admin & Resepsionis: CRUD penuh
- Dokter: Lihat saja
- Hapus: Hanya Admin (soft delete)

---

### 4.2 Jadwal Dokter

**Pembuatan Jadwal:**
1. Admin/Dokter membuat jadwal per hari
2. Field: tanggal, jam mulai, jam selesai, durasi slot
3. Satu jadwal per dokter per hari

**Manajemen:**
- Toggle ketersediaan (available/unavailable)
- Dokter hanya kelola jadwal sendiri
- Admin dapat override semua jadwal

---

### 4.3 Sistem Antrian

**Prinsip:** Berbasis nomor urut, bukan time slot. Per-dokter, per-hari. Walk-in only.

**Alur:**
```
Resepsionis tambah pasien ke antrian
    ↓
Sistem assign nomor antrian berikutnya
    ↓
Pasien menunggu (status: waiting)
    ↓
Resepsionis input tanda vital (status: vitals)
    ↓
Dokter panggil pasien (status: in_consultation)
    ↓
Konsultasi selesai (status: completed)
```

**Fitur:**
- Prioritas urgent (dipanggil duluan)
- Pembatalan antrian oleh Resepsionis

---

### 4.4 Tanda Vital

**Pengumpulan Data:**
- Dicatat oleh: Resepsionis (sebelum konsultasi)
- Terhubung ke: antrian dan rekam medis

**Parameter:**
- Tekanan darah (sistolik/diastolik)
- Detak jantung, suhu tubuh, frekuensi napas
- Saturasi oksigen (SpO2)
- Berat badan, tinggi badan, BMI (auto-calculated)
- Keluhan utama (naratif)

---

### 4.5 Konsultasi & Rekam Medis

**Format SOAP:**

| Bagian | Isi |
|--------|-----|
| **Subjective** | Anamnesis, keluhan utama, riwayat penyakit |
| **Objective** | Pemeriksaan fisik, tanda vital, hasil lab |
| **Assessment** | Diagnosis dengan kode ICD-10 |
| **Plan** | Terapi, edukasi pasien, rencana tindak lanjut |

**Diagnosis ICD-10:**
- Disimpan sebagai JSON array: `{code, description, is_primary}`
- Selector dengan fitur pencarian

**Mekanisme Penguncian:**
- Rekam medis terkunci otomatis 24 jam setelah dibuat
- Setelah terkunci hanya bisa menambahkan addendum

**Akses:**
- Buat & edit: Dokter dan Admin
- Resepsionis: Tidak ada akses

---

### 4.6 Resep Obat

**Alur:**
1. Dokter buat resep selama konsultasi
2. Item resep: nama obat, dosis, frekuensi, durasi, jumlah, instruksi
3. Nomor resep auto-generate: RX{YY}{MM}{DD}{COUNT}
4. Resepsionis menebus resep (mark as dispensed)

**Aturan:**
- Tidak dapat diedit/dihapus setelah ditebus
- Output: Print + PDF download (via DomPDF)

---

### 4.7 Billing & Pembayaran

**Pembuatan Invoice:**
- Generate dari layanan yang diberikan
- Manual line items
- Formula: subtotal + pajak - diskon = total

**Metode Pembayaran:**
- Tunai
- Transfer bank (konfirmasi manual)

**Status:** pending -> partial -> paid | cancelled

**Fitur:**
- Partial payment (bayar sebagian)
- Riwayat pembayaran per invoice
- Print invoice (PDF)

---

### 4.8 Dashboard

**Dashboard Adaptif per Role:**
- **Admin:** Total pasien, kunjungan hari ini, revenue bulan ini, antrian aktif
- **Dokter:** Pasien hari ini, antrian saya, rekam medis terbaru
- **Resepsionis:** Antrian hari ini, invoice tertunda, pasien baru hari ini

**Komponen:**
- Kartu statistik ringkasan
- Daftar antrian hari ini
- Grafik kunjungan bulanan (line chart sederhana)

---

### 4.9 Manajemen Layanan

- Admin mengelola daftar layanan klinik (nama, harga)
- Digunakan saat membuat invoice

---

### 4.10 Pengaturan

- Profil klinik (nama, alamat, telepon, logo)
- Manajemen user/staff (CRUD, assign role)
- Profil user (edit nama, password)

---

## 5. Navigasi & Route

### 5.1 Layout Responsif

**Desktop (>= 1024px):** Sidebar tetap di kiri + area konten utama.

**Tablet & Mobile (< 1024px):** Sidebar disembunyikan, diganti **bottom navigation bar** fixed di bawah layar.

**Bottom Navigation (5 item):**

```
┌──────────────────────────────────────────────┐
│                                              │
│             Area Konten Utama                │
│                                              │
├──────┬──────┬──────┬──────┬──────────────────┤
│  🏠  │  📋  │  👥  │  💊  │       ⚙️        │
│ Home │Antrian│Pasien│ Medis│      Lainnya     │
└──────┴──────┴──────┴──────┴──────────────────┘
```

| Item | Label | Aksi |
|------|-------|------|
| Home | Dashboard | Navigasi ke `/dashboard` |
| Antrian | Antrian | Navigasi ke `/queue` |
| Pasien | Pasien | Navigasi ke `/patients` |
| Medis | Medis | Navigasi ke `/medical-records` |
| Lainnya | Menu | Buka drawer/sheet berisi menu lengkap (Jadwal, Resep, Billing, Pengaturan) |

**Aturan:**
- Bottom nav selalu terlihat di tablet/mobile (kecuali halaman login/register)
- Item aktif diberi highlight (warna primary)
- Menu "Lainnya" membuka drawer dari bawah berisi menu tambahan yang disesuaikan per role
- Konten halaman diberi padding-bottom agar tidak tertutup bottom nav

### 5.2 Sidebar Menu (Desktop)

```
Menu Utama
├── Dashboard

Pelayanan
├── Jadwal Dokter
├── Antrian Pasien

Data
├── Data Pasien
├── Rekam Medis

Transaksi
├── Resep Obat
├── Billing

Pengaturan
├── Profil Klinik
├── Manajemen Staff
├── Layanan
```

### 5.3 Route Structure

```
/login ........................ Login
/register ..................... Register

/dashboard .................... Dashboard (adaptif per role)
/schedule ..................... Jadwal Dokter
/queue ........................ Antrian Pasien
/queue/:id/vitals ............. Input Tanda Vital
/queue/:id/consultation ....... Konsultasi (SOAP + Resep)
/patients ..................... Data Pasien
/patients/:id ................. Detail Pasien
/medical-records .............. Rekam Medis
/medical-records/:id .......... Detail Rekam Medis
/prescriptions ................ Resep Obat
/billing ...................... Billing
/billing/:id .................. Detail Invoice
/settings ..................... Pengaturan Klinik
/settings/staff ............... Manajemen Staff
/settings/services ............ Layanan
```

---

## 6. Aturan Bisnis

| Aturan | Detail |
|--------|--------|
| Antrian walk-in | Berdasarkan nomor urut, bukan time slot |
| Rekam medis terkunci 24 jam | Setelah terkunci hanya bisa addendum |
| Resep tidak bisa diedit setelah ditebus | Integritas data |
| Satu jadwal per dokter per hari | Tidak ada recurring schedule |
| Partial payment | Invoice bisa dibayar bertahap |
| Permission di backend | Laravel middleware + policies, frontend hanya UX |
| Soft delete | Data pasien tidak dihapus permanen |

---

## 7. Konvensi

| Aspek | Standar |
|-------|---------|
| Bahasa UI | Indonesia |
| Nama variabel/kode | English (camelCase di JS, snake_case di PHP) |
| Terminologi medis | Indonesia |
| Design System | RetroUI NeoBrutalism (bold borders, solid shadows, playful colors) |
| Font | Archivo Black (heading), Space Grotesk (body) |
| Tema warna | Primary kuning (#ffdb33), dark mode supported |
| Layout Desktop | Sidebar kiri + konten utama |
| Layout Tablet/Mobile | Bottom navigation bar (5 item) + konten utama |
| Breakpoint | Mobile < 768px, Tablet 768-1023px, Desktop >= 1024px |
| Pesan error | Bahasa Indonesia |
| API response | `{ data, message, errors }` format konsisten |

---

## 8. Roadmap (Post-MVP)

| Prioritas | Fitur |
|-----------|-------|
| Tinggi | Multi-tenant (arsitektur SaaS) |
| Tinggi | Portal Pasien (booking, riwayat medis, resep digital) |
| Tinggi | Display Antrian TV Mode |
| Tinggi | Notifikasi WhatsApp |
| Sedang | Surat Rujukan |
| Sedang | Audit Trail / Log Aktivitas |
| Sedang | Sistem Laboratorium |
| Sedang | Manajemen Inventaris Farmasi |
| Sedang | Laporan & Analytics lanjutan |
| Rendah | Integrasi BPJS |
| Rendah | Payment Gateway (QRIS) |
| Rendah | Chat Konsultasi |
| Rendah | Mode Offline |

---

## 9. Limitasi

1. **Online-only** — Membutuhkan koneksi internet
2. **Single-tenant** — Satu instance untuk satu klinik
3. **Database obat manual** — Input nama obat manual, belum integrasi API
4. **Single timezone** — WIB (UTC+7)
5. **Pembayaran manual** — Belum ada payment gateway
