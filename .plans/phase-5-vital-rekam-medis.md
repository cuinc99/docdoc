# Phase 5: Tanda Vital & Rekam Medis

**Estimasi:** 3-4 hari
**Prasyarat:** Phase 4 selesai
**Output:** Input tanda vital sebelum konsultasi, rekam medis SOAP dengan ICD-10, locking 24 jam, addendum.

---

## 5.1 Backend - Tanda Vital

### Migration & Model:
- [ ] Buat migration tabel `vital_signs`:
  ```
  id, patient_id (FK), queue_id (FK, unique), recorded_by (FK users),
  systolic (integer), diastolic (integer), heart_rate (integer),
  temperature (decimal 3,1), respiratory_rate (integer),
  oxygen_saturation (nullable, integer), weight (decimal 5,2),
  height (decimal 5,2), bmi (decimal 4,1), chief_complaint (text),
  notes (nullable, text), created_at, updated_at
  ```
- [ ] Buat Model `VitalSign` dengan:
  - Auto-calculate BMI di event `saving` (weight / (height/100)^2)
  - Relasi: `patient`, `queue`, `recordedBy`
- [ ] Buat `VitalSignFactory`

### API Endpoints:
- [ ] Buat `VitalSignController`:
  - `GET /api/vital-signs` - List vital signs (filter by patient_id, queue_id)
  - `GET /api/vital-signs/{id}` - Detail
  - `POST /api/vital-signs` - Input vital signs (terhubung ke queue)
  - `PUT /api/vital-signs/{id}` - Update vital signs
- [ ] Buat `VitalSignRequest` dengan validasi:
  - Semua field numerik: required, range yang wajar (mis. systolic 60-300)
  - Queue ID: required, exists, belum punya vital signs
  - Chief complaint: required
- [ ] Saat vital signs dibuat, update status queue -> `vitals`
- [ ] Buat `VitalSignPolicy`:
  - Admin & Resepsionis: create, update
  - Dokter: view saja
- [ ] Tulis Pest test

### Endpoint:
```
GET    /api/vital-signs              (auth, ?patient_id=, ?queue_id=)
GET    /api/vital-signs/{id}         (auth)
POST   /api/vital-signs              (auth, admin|receptionist)
PUT    /api/vital-signs/{id}         (auth, admin|receptionist)
```

---

## 5.2 Frontend - Input Tanda Vital

### Task:
- [ ] Buat API functions (`src/api/vitalSigns.ts`)
- [ ] Buat halaman `/queue/:id/vitals` - Input Tanda Vital:
  - Info pasien & nomor antrian di atas
  - Form fields:
    - Tekanan Darah: Sistolik / Diastolik (2 input bersebelahan)
    - Detak Jantung (bpm)
    - Suhu Tubuh (C)
    - Frekuensi Napas (/menit)
    - Saturasi Oksigen / SpO2 (%)
    - Berat Badan (kg) & Tinggi Badan (cm) -> BMI auto-calculated & ditampilkan
    - Keluhan Utama (textarea)
    - Catatan tambahan (textarea, opsional)
  - Validasi Zod
  - Tombol Simpan -> toast sukses -> redirect ke halaman antrian
- [ ] Tampilkan BMI auto-calculate saat user mengisi berat & tinggi badan

---

## 5.3 Backend - Rekam Medis & Addendum

### Migration & Model:
- [ ] Buat migration tabel `medical_records`:
  ```
  id, patient_id (FK), doctor_id (FK users), queue_id (FK, unique),
  vital_sign_id (nullable, FK), subjective (text), objective (text),
  assessment (text), plan (text),
  diagnoses (jsonb, default '[]'), -- array of {code, description, is_primary}
  is_locked (boolean, default false), locked_at (nullable, timestamp),
  created_at, updated_at
  ```
- [ ] Buat migration tabel `addendums`:
  ```
  id, medical_record_id (FK), doctor_id (FK users),
  content (text), created_at, updated_at
  ```
- [ ] Buat Model `MedicalRecord` dengan:
  - Relasi: `patient`, `doctor`, `queue`, `vitalSign`, `addendums`, `prescription`
  - Cast `diagnoses` sebagai array
  - Method `isEditable()`: return `!is_locked`
  - Method `lock()`: set `is_locked = true`, `locked_at = now()`
- [ ] Buat Model `Addendum` dengan relasi `medicalRecord`, `doctor`
- [ ] Buat Laravel Scheduled Command: auto-lock rekam medis yang berusia > 24 jam
  ```php
  // app/Console/Commands/LockMedicalRecords.php
  // Jalankan setiap jam: MedicalRecord::where('is_locked', false)
  //   ->where('created_at', '<', now()->subHours(24))->update(...)
  ```
- [ ] Buat `MedicalRecordFactory`

### API Endpoints:
- [ ] Buat `MedicalRecordController`:
  - `GET /api/medical-records` - List (paginated, filter by patient_id, doctor_id)
  - `GET /api/medical-records/{id}` - Detail (include addendums, vital signs)
  - `POST /api/medical-records` - Buat rekam medis (saat konsultasi)
  - `PUT /api/medical-records/{id}` - Update (hanya jika belum terkunci)
  - `POST /api/medical-records/{id}/addendums` - Tambah addendum (setelah terkunci)
- [ ] Buat `MedicalRecordRequest` dengan validasi:
  - SOAP fields: required (subjective, objective, assessment, plan)
  - Diagnoses: required, array, min 1 item, setiap item harus punya code & description
  - Queue ID: required, exists, belum punya rekam medis
- [ ] Buat `MedicalRecordPolicy`:
  - Admin & Dokter: create, update (jika belum locked)
  - Resepsionis: tidak ada akses
  - Addendum: hanya Dokter & Admin
- [ ] Tulis Pest test (termasuk test locking & addendum)

### Endpoint:
```
GET    /api/medical-records                     (auth, admin|doctor)
GET    /api/medical-records/{id}                (auth, admin|doctor)
POST   /api/medical-records                     (auth, admin|doctor)
PUT    /api/medical-records/{id}                (auth, admin|doctor, not locked)
POST   /api/medical-records/{id}/addendums      (auth, admin|doctor)
```

---

## 5.4 Backend - Data ICD-10

### Task:
- [ ] Buat seeder/file JSON berisi data ICD-10 yang umum digunakan di klinik umum
  - Minimal 100-200 kode ICD-10 terpopuler (mis. J06.9 ISPA, K30 Dyspepsia, dll.)
  - Format: `{ code: "J06.9", description: "Infeksi Saluran Pernapasan Atas Akut" }`
- [ ] Buat endpoint `GET /api/icd10?search=` untuk pencarian kode ICD-10
  - Bisa berupa file statis JSON yang di-search di backend
  - Atau tabel database jika datanya besar

---

## 5.5 Frontend - Halaman Konsultasi & Rekam Medis

### Task:
- [ ] Buat API functions (`src/api/medicalRecords.ts`, `src/api/icd10.ts`)
- [ ] Buat halaman `/queue/:id/consultation` - Konsultasi:
  - Info pasien & tanda vital (dari vital signs yang sudah diinput)
  - Form SOAP:
    - Subjective (textarea)
    - Objective (textarea, pre-fill dari vital signs)
    - Assessment (textarea) + ICD-10 selector (search & select multiple)
    - Plan (textarea)
  - ICD-10 Selector:
    - Search input dengan autocomplete
    - Bisa pilih multiple diagnosis
    - Tandai satu sebagai diagnosis primer (is_primary)
    - Tampilkan kode + deskripsi
  - Tombol Simpan Rekam Medis
  - Setelah simpan, redirect ke detail rekam medis / kembali ke antrian
- [ ] Buat halaman `/medical-records` - Daftar Rekam Medis:
  - Tabel: Tanggal, Pasien, Dokter, Diagnosis Utama, Status (terkunci/terbuka)
  - Filter: pencarian pasien, rentang tanggal
  - Badge status locked/unlocked
- [ ] Buat halaman `/medical-records/:id` - Detail Rekam Medis:
  - Info pasien & dokter
  - Tanda vital (jika ada)
  - SOAP lengkap
  - Daftar diagnosis ICD-10
  - Daftar addendum (jika ada)
  - Tombol "Edit" (hanya jika belum terkunci)
  - Tombol "Tambah Addendum" (jika sudah terkunci, hanya dokter/admin)
  - Status: Terbuka / Terkunci (dengan waktu terkunci)
- [ ] Buat form addendum (modal):
  - Textarea konten
  - Info: "Rekam medis ini sudah terkunci. Anda hanya bisa menambah addendum."

---

## 5.6 Verifikasi

- [ ] Input tanda vital -> status antrian berubah ke "vitals"
- [ ] BMI auto-calculate berfungsi
- [ ] Buat rekam medis SOAP -> tersimpan dengan diagnosis ICD-10
- [ ] Pencarian ICD-10 berfungsi
- [ ] Rekam medis terkunci otomatis setelah 24 jam (via scheduled command)
- [ ] Rekam medis terkunci tidak bisa diedit (403)
- [ ] Addendum bisa ditambahkan pada rekam medis terkunci
- [ ] Resepsionis tidak bisa akses rekam medis (403)
- [ ] Pest test semua pass

---

## Deliverables

| Item | Status |
|------|--------|
| Migration & Model VitalSign (auto BMI) | - |
| API vital signs (CRUD) | - |
| Halaman input tanda vital | - |
| Migration & Model MedicalRecord + Addendum | - |
| API rekam medis (CRUD + addendum + locking) | - |
| Scheduled command auto-lock 24 jam | - |
| Data ICD-10 + endpoint search | - |
| Halaman konsultasi (form SOAP + ICD-10 selector) | - |
| Halaman list & detail rekam medis | - |
| Form addendum | - |
| Pest test vital signs & rekam medis | - |
