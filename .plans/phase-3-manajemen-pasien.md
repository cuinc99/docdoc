# Phase 3: Manajemen Pasien

**Estimasi:** 2-3 hari
**Prasyarat:** Phase 2 selesai
**Output:** CRUD pasien lengkap dengan pencarian, auto-generate nomor MR, soft delete.
**Status:** ✅ COMPLETE

---

## 3.1 Backend - Migration & Model

### Task:
- [x] Buat migration tabel `patients`:
  ```
  id, mr_number (unique), nik (unique), name, gender (enum: male/female),
  birth_date (date), phone, email (nullable), address (text),
  blood_type (nullable, enum: A/B/AB/O), allergies (nullable, text),
  emergency_contact_name (nullable), emergency_contact_phone (nullable),
  deleted_at (soft delete), created_at, updated_at
  ```
- [x] Buat Model `Patient` dengan:
  - `SoftDeletes` trait
  - Auto-generate `mr_number` format `MR{YY}{MM}{COUNT}` di event `creating`
  - Query scope `search()` (nama, mr_number, nik, telepon) case-insensitive
- [x] Buat `PatientFactory` untuk testing

### File:
- `backend/database/migrations/2026_02_14_102758_create_patients_table.php`
- `backend/app/Models/Patient.php`
- `backend/database/factories/PatientFactory.php`

---

## 3.2 Backend - API Endpoints

### Task:
- [x] Buat `PatientController` (API Resource Controller):
  - `GET /api/patients` - List pasien (paginated, searchable)
  - `GET /api/patients/{id}` - Detail pasien
  - `POST /api/patients` - Tambah pasien baru
  - `PUT /api/patients/{id}` - Update pasien
  - `DELETE /api/patients/{id}` - Soft delete pasien
- [x] Buat `StorePatientRequest` & `UpdatePatientRequest` dengan validasi + pesan error bahasa Indonesia
- [x] Buat `PatientResource` (API Resource untuk format response)
- [x] Buat `PatientPolicy`:
  - Admin & Resepsionis: CRUD penuh
  - Dokter: viewAny, view saja
  - Delete: hanya Admin
- [x] Implementasi pencarian (query scope) case-insensitive via `LOWER() LIKE`
- [x] Tulis Pest test untuk semua endpoint + policy (19 tests)
- [x] Larastan level 5: 0 errors

### Endpoint:
```
GET    /api/patients          (auth, paginated, ?search=)
GET    /api/patients/{id}     (auth)
POST   /api/patients          (auth, admin|receptionist)
PUT    /api/patients/{id}     (auth, admin|receptionist)
DELETE /api/patients/{id}     (auth, admin only)
```

### File:
- `backend/app/Http/Controllers/Api/PatientController.php`
- `backend/app/Http/Requests/StorePatientRequest.php`
- `backend/app/Http/Requests/UpdatePatientRequest.php`
- `backend/app/Http/Resources/PatientResource.php`
- `backend/app/Policies/PatientPolicy.php`
- `backend/routes/api.php` (updated)
- `backend/tests/Feature/PatientTest.php`

---

## 3.3 Frontend - Halaman Pasien

### Task:
- [x] Buat API functions (`src/api/patients.ts`):
  - `getPatients(params)`, `getPatient(id)`, `createPatient(data)`, `updatePatient(id, data)`, `deletePatient(id)`
- [x] Buat halaman `/patients` - Daftar Pasien:
  - Tabel dengan TanStack Table (kolom: No MR, Nama, NIK, Gender, Telepon, Aksi)
  - Search bar di atas tabel
  - Tombol "Tambah Pasien" (tampil hanya untuk Admin & Resepsionis)
  - Pagination dengan ellipsis
  - Aksi per row: Lihat Detail, Edit, Hapus (sesuai permission role)
  - Action buttons dengan border-2 neobrutalism style
- [x] Buat modal/dialog "Tambah Pasien":
  - Form fields: NIK, Nama, Gender (select), Tanggal Lahir (date), Telepon, Alamat, Email, Golongan Darah, Alergi, Kontak Darurat
  - Validasi dengan Zod
  - Notifikasi via custom RetroUI Snackbar (menggantikan Sonner)
- [x] Buat modal/dialog "Edit Pasien" (reuse PatientFormFields component)
  - Fix: `key` prop untuk remount form, `normalizeDateToInput()` untuk birth_date
- [x] Buat halaman `/patients/:id` - Detail Pasien:
  - Info pasien lengkap (pribadi, kontak, alergi, kontak darurat)
  - Tab/section: Riwayat Kunjungan (placeholder)
- [x] Buat konfirmasi dialog untuk hapus pasien (soft delete)
- [x] Custom RetroUI Snackbar component (context-based, 4 variants, auto-dismiss, slide-in animation)

### File:
- `frontend/src/api/patients.ts`
- `frontend/src/components/patients/PatientFormFields.tsx`
- `frontend/src/components/patients/PatientDialog.tsx`
- `frontend/src/components/patients/DeletePatientDialog.tsx`
- `frontend/src/components/retroui/Snackbar.tsx`
- `frontend/src/pages/PatientsPage.tsx`
- `frontend/src/pages/PatientDetailPage.tsx`
- `frontend/src/routes/index.tsx` (updated)
- `frontend/src/App.tsx` (updated: SnackbarProvider replaces Sonner Toaster)
- `frontend/src/hooks/useAuth.tsx` (updated: useSnackbar replaces toast)

---

## 3.4 Verifikasi

- [x] Tambah pasien baru -> nomor MR auto-generate
- [x] Search pasien by nama/NIK/MR/telepon berfungsi
- [x] Edit data pasien berhasil (termasuk tanggal lahir)
- [x] Hapus pasien (soft delete) -> tidak tampil di list
- [x] Dokter tidak bisa tambah/edit/hapus pasien (403)
- [x] Resepsionis tidak bisa hapus pasien (403)
- [x] Pagination berfungsi
- [x] Form validation menampilkan error bahasa Indonesia
- [x] Pest test semua pass (33 total: 14 auth + 19 patient)
- [x] Larastan level 5: 0 errors
- [x] Tampilan responsif (tabel scroll horizontal di mobile)
- [x] Frontend build sukses (512 KB, ~158 KB gzipped)
- [x] RetroUI neobrutalism style aligned (border-2, solid shadows, zero radius)
- [x] React best practices applied (useMemo, useCallback, aria-labels, stable refs)

---

## Deliverables

| Item | Status |
|------|--------|
| Migration & Model Patient (soft delete, auto MR number) | ✅ |
| API CRUD + search + pagination | ✅ |
| PatientPolicy (RBAC) | ✅ |
| Halaman list pasien (tabel, search, pagination) | ✅ |
| Form tambah/edit pasien (modal) | ✅ |
| Halaman detail pasien | ✅ |
| Pest test patient CRUD (19 tests) | ✅ |
| Custom RetroUI Snackbar (replaces Sonner) | ✅ |
