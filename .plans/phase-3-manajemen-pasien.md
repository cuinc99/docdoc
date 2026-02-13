# Phase 3: Manajemen Pasien

**Estimasi:** 2-3 hari
**Prasyarat:** Phase 2 selesai
**Output:** CRUD pasien lengkap dengan pencarian, auto-generate nomor MR, soft delete.

---

## 3.1 Backend - Migration & Model

### Task:
- [ ] Buat migration tabel `patients`:
  ```
  id, mr_number (unique), nik (unique), name, gender (enum: male/female),
  birth_date (date), phone, email (nullable), address (text),
  blood_type (nullable, enum: A/B/AB/O), allergies (nullable, text),
  emergency_contact_name (nullable), emergency_contact_phone (nullable),
  deleted_at (soft delete), created_at, updated_at
  ```
- [ ] Buat Model `Patient` dengan:
  - `SoftDeletes` trait
  - Auto-generate `mr_number` format `MR{YY}{MM}{COUNT}` di event `creating`
  - Relasi: `queues`, `vitalSigns`, `medicalRecords`, `prescriptions`, `invoices`
- [ ] Buat `PatientFactory` untuk testing

---

## 3.2 Backend - API Endpoints

### Task:
- [ ] Buat `PatientController` (API Resource Controller):
  - `GET /api/patients` - List pasien (paginated, searchable)
  - `GET /api/patients/{id}` - Detail pasien
  - `POST /api/patients` - Tambah pasien baru
  - `PUT /api/patients/{id}` - Update pasien
  - `DELETE /api/patients/{id}` - Soft delete pasien
- [ ] Buat `PatientRequest` (Store & Update) dengan validasi:
  - NIK: required, 16 digit, unique
  - Nama: required, min 2 karakter
  - Gender: required, enum
  - Tanggal lahir: required, date, before today
  - Telepon: required
  - Alamat: required
- [ ] Buat `PatientResource` (API Resource untuk format response)
- [ ] Buat `PatientPolicy`:
  - Admin & Resepsionis: CRUD penuh
  - Dokter: viewAny, view saja
  - Delete: hanya Admin
- [ ] Implementasi pencarian (query scope):
  - Search by: nama, mr_number, nik, telepon
  - Parameter: `?search=keyword`
- [ ] Tulis Pest test untuk semua endpoint + policy

### Endpoint:
```
GET    /api/patients          (auth, paginated, ?search=)
GET    /api/patients/{id}     (auth)
POST   /api/patients          (auth, admin|receptionist)
PUT    /api/patients/{id}     (auth, admin|receptionist)
DELETE /api/patients/{id}     (auth, admin only)
```

---

## 3.3 Frontend - Halaman Pasien

### Task:
- [ ] Buat API functions (`src/api/patients.ts`):
  - `getPatients(params)`, `getPatient(id)`, `createPatient(data)`, `updatePatient(id, data)`, `deletePatient(id)`
- [ ] Buat halaman `/patients` - Daftar Pasien:
  - Tabel dengan TanStack Table (kolom: No MR, Nama, NIK, Gender, Telepon, Aksi)
  - Search bar di atas tabel
  - Tombol "Tambah Pasien" (tampil hanya untuk Admin & Resepsionis)
  - Pagination
  - Aksi per row: Lihat Detail, Edit, Hapus (sesuai permission role)
- [ ] Buat modal/dialog "Tambah Pasien":
  - Form fields: NIK, Nama, Gender (select), Tanggal Lahir (date picker), Telepon, Alamat, Email, Golongan Darah, Alergi, Kontak Darurat
  - Validasi dengan Zod
  - Toast sukses/error via Sonner
- [ ] Buat modal/dialog "Edit Pasien" (reuse form component)
- [ ] Buat halaman `/patients/:id` - Detail Pasien:
  - Info pasien lengkap
  - Tab/section: Riwayat Kunjungan, Rekam Medis, Resep (placeholder dulu)
- [ ] Buat konfirmasi dialog untuk hapus pasien (soft delete)

---

## 3.4 Verifikasi

- [ ] Tambah pasien baru -> nomor MR auto-generate
- [ ] Search pasien by nama/NIK/MR/telepon berfungsi
- [ ] Edit data pasien berhasil
- [ ] Hapus pasien (soft delete) -> tidak tampil di list
- [ ] Dokter tidak bisa tambah/edit/hapus pasien (403)
- [ ] Resepsionis tidak bisa hapus pasien (403)
- [ ] Pagination berfungsi
- [ ] Form validation menampilkan error bahasa Indonesia
- [ ] Pest test semua pass
- [ ] Tampilan responsif (tabel scroll horizontal di mobile)

---

## Deliverables

| Item | Status |
|------|--------|
| Migration & Model Patient (soft delete, auto MR number) | - |
| API CRUD + search + pagination | - |
| PatientPolicy (RBAC) | - |
| Halaman list pasien (tabel, search, pagination) | - |
| Form tambah/edit pasien (modal) | - |
| Halaman detail pasien | - |
| Pest test patient CRUD | - |
