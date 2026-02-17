# Phase 6: Resep Obat & Billing

**Estimasi:** 3-4 hari
**Prasyarat:** Phase 5 selesai
**Status:** Selesai
**Output:** Resep obat + tebus + PDF, invoice + pembayaran (partial payment) + PDF, edit invoice, edit resep di rekam medis, search & filter konsisten.

---

## 6.1 Backend - Resep Obat

### Migration & Model:
- [x] Buat migration tabel `prescriptions`:
  ```
  id, prescription_number (unique), patient_id (FK), doctor_id (FK users),
  medical_record_id (FK, unique), items (jsonb),
  -- items: [{drug_name, dosage, frequency, duration, quantity, instructions}]
  notes (nullable, text), is_dispensed (boolean, default false),
  dispensed_at (nullable, timestamp), dispensed_by (nullable, FK users),
  created_at, updated_at
  ```
- [x] Buat Model `Prescription` dengan:
  - Auto-generate `prescription_number` format `RX{YY}{MM}{DD}{COUNT}` di event `creating`
  - Cast `items` sebagai array
  - Relasi: `patient`, `doctor`, `medicalRecord`, `dispensedByUser`
  - Method `isEditable()`: return `!is_dispensed`
  - Method `dispense(userId)`: set is_dispensed, dispensed_at, dispensed_by
- [x] Buat `PrescriptionFactory` (dengan state `dispensed()`)

### API Endpoints:
- [x] Buat `PrescriptionController`:
  - `GET /api/prescriptions` - List (paginated, filter by patient_id, medical_record_id, is_dispensed, search)
  - `GET /api/prescriptions/{id}` - Detail
  - `POST /api/prescriptions` - Buat resep (saat konsultasi)
  - `PUT /api/prescriptions/{id}` - Update (hanya jika belum ditebus)
  - `PATCH /api/prescriptions/{id}/dispense` - Tebus resep
  - `GET /api/prescriptions/{id}/pdf` - Download PDF resep
- [x] Buat `StorePrescriptionRequest` & `UpdatePrescriptionRequest` dengan validasi
- [x] Buat `PrescriptionPolicy`:
  - Admin & Dokter: create, update (jika belum dispensed)
  - Resepsionis: dispense saja
- [x] Buat PDF template resep (DomPDF, ukuran A5)
- [x] Tulis Pest test (16 tests)

### Endpoint:
```
GET    /api/prescriptions                    (auth, filter: patient_id, medical_record_id, is_dispensed, search)
GET    /api/prescriptions/{id}               (auth)
POST   /api/prescriptions                    (auth, admin|doctor)
PUT    /api/prescriptions/{id}               (auth, admin|doctor, not dispensed)
PATCH  /api/prescriptions/{id}/dispense      (auth, admin|receptionist)
GET    /api/prescriptions/{id}/pdf           (auth)
```

---

## 6.2 Frontend - Halaman Resep Obat

### Task:
- [x] Buat API functions (`src/api/prescriptions.ts`)
- [x] Integrasikan form resep ke halaman konsultasi (`/queue/:id/consultation`):
  - Section "Resep Obat" di bawah form SOAP
  - Dynamic form: tambah/hapus item obat
  - Per item: Nama Obat, Dosis, Frekuensi, Durasi, Jumlah, Instruksi
  - Catatan tambahan
  - Resep dibuat bersamaan saat menyimpan rekam medis
  - Tombol hapus item: icon Trash2 + teks "Hapus" (konsisten dengan invoice)
  - Input jumlah: string state (mencegah masalah default value)
- [x] Buat halaman `/prescriptions` - Daftar Resep:
  - List card: Nomor Resep, Tanggal, Pasien, Dokter, Status
  - Search: nama pasien / nomor resep (server-side)
  - Filter: status (semua/belum/sudah ditebus)
  - Aksi: Lihat Detail, Tebus (untuk Resepsionis), Download PDF
- [x] Buat dialog detail resep
- [x] Konfirmasi dialog sebelum tebus resep
- [x] Integrasikan edit resep di halaman Edit Rekam Medis (`/medical-records/:id/edit`):
  - Fetch resep existing via `medical_record_id`
  - Tampilkan form edit jika belum ditebus
  - Tampilkan badge "Sudah Ditebus" jika sudah ditebus
  - Simpan perubahan resep bersamaan dengan rekam medis

---

## 6.3 Backend - Billing & Pembayaran

### Migration & Model:
- [x] Buat migration tabel `services`:
  ```
  id, name, price (decimal 12,2), is_active (default true),
  created_at, updated_at
  ```
- [x] Buat migration tabel `invoices`:
  ```
  id, invoice_number (unique), patient_id (FK),
  items (jsonb), -- [{description, quantity, unit_price, total}]
  subtotal (decimal 12,2), discount (decimal 12,2, default 0),
  tax (decimal 12,2, default 0), total (decimal 12,2),
  paid_amount (decimal 12,2, default 0),
  status (enum: pending/partial/paid/cancelled),
  created_at, updated_at
  ```
- [x] Buat migration tabel `payments`:
  ```
  id, invoice_id (FK), amount (decimal 12,2),
  method (enum: cash/transfer), reference (nullable),
  received_by (FK users), created_at, updated_at
  ```
- [x] Buat Model `Service` (CRUD sederhana)
- [x] Buat Model `Invoice` dengan:
  - Auto-generate `invoice_number` format `INV{YY}{MM}{COUNT}`
  - Cast `items` sebagai array
  - Default `$attributes` untuk mencegah null status
  - Relasi: `patient`, `payments`
  - Method `recalculateStatus()`: update status berdasarkan paid_amount vs total
  - Method `addPayment(amount, method, reference, userId)`: buat payment + update paid_amount + recalculate status
- [x] Buat Model `Payment` dengan relasi `invoice`, `receivedBy`
- [x] Buat Factory untuk Service, Invoice

### API Endpoints:
- [x] Buat `ServiceController` (CRUD sederhana, admin only)
- [x] Buat `InvoiceController`:
  - `GET /api/invoices` - List (paginated, filter by patient_id, status, search)
  - `GET /api/invoices/{id}` - Detail (include payments)
  - `POST /api/invoices` - Buat invoice (pajak dihitung sebagai persentase)
  - `PUT /api/invoices/{id}` - Update invoice (hanya jika status pending)
  - `POST /api/invoices/{id}/payments` - Tambah pembayaran
  - `PATCH /api/invoices/{id}/cancel` - Batalkan invoice
  - `GET /api/invoices/{id}/pdf` - Download PDF invoice
- [x] Buat `StoreInvoiceRequest` (dengan `tax_percent` max:100) & `StorePaymentRequest` dengan validasi
- [x] Buat `InvoicePolicy`:
  - Admin & Resepsionis: CRUD penuh
  - Dokter: tidak ada akses
- [x] Buat `ServicePolicy`: Admin only untuk CUD
- [x] Buat PDF template invoice (DomPDF, ukuran A4, dengan riwayat pembayaran)
- [x] Tulis Pest test (25 tests)

### Endpoint:
```
GET    /api/services                    (auth)
POST   /api/services                    (auth, admin)
PUT    /api/services/{id}               (auth, admin)
DELETE /api/services/{id}               (auth, admin)

GET    /api/invoices                    (auth, admin|receptionist, filter: patient_id, status, search)
GET    /api/invoices/{id}               (auth, admin|receptionist)
POST   /api/invoices                    (auth, admin|receptionist)
PUT    /api/invoices/{id}               (auth, admin|receptionist, pending only)
POST   /api/invoices/{id}/payments      (auth, admin|receptionist)
PATCH  /api/invoices/{id}/cancel        (auth, admin|receptionist)
GET    /api/invoices/{id}/pdf           (auth, admin|receptionist)
```

---

## 6.4 Frontend - Halaman Billing

### Task:
- [x] Buat API functions (`src/api/invoices.ts`, `src/api/services.ts`)
- [x] Buat halaman `/billing` - Daftar Invoice:
  - List card: Nomor Invoice, Tanggal, Pasien, Total, Dibayar, Sisa, Status
  - Search: nama pasien / nomor invoice (server-side)
  - Filter: status (semua/pending/partial/paid/cancelled)
  - Badge status berwarna
  - Tombol "Buat Invoice"
- [x] Buat halaman `/billing/create` - Buat Invoice:
  - Pilih pasien (search/select)
  - Dynamic items (string state untuk number inputs):
    - Pilih dari daftar layanan (auto-fill harga) atau input manual
    - Deskripsi, Jumlah, Harga Satuan -> Total per item auto-calculate
    - Tombol hapus item: icon Trash2 + teks "Hapus"
  - Subtotal (auto), Diskon (input Rp), Pajak (input %, auto-calculate amount), Total (auto)
  - Tombol Simpan
- [x] Buat halaman `/billing/:id` - Detail Invoice:
  - Info pasien, nomor invoice, tanggal
  - Tabel item
  - Summary: subtotal, diskon, pajak, total, sudah dibayar, sisa
  - Riwayat pembayaran
  - Tombol "Tambah Pembayaran" (jika belum lunas)
  - Tombol "Edit" (jika status pending)
  - Tombol "Download PDF"
  - Tombol "Batalkan" (jika masih pending)
- [x] Buat halaman `/billing/:id/edit` - Edit Invoice:
  - Pre-populate items, diskon, reverse-calculate pajak %
  - Hanya untuk invoice dengan status pending
- [x] Buat dialog "Tambah Pembayaran":
  - Jumlah (max = sisa tagihan)
  - Tombol "Bayar Semua" (auto-fill sisa tagihan)
  - Metode: Tunai / Transfer
  - Referensi (untuk transfer)
  - Setelah bayar -> status auto-update (partial/paid)

---

## 6.5 Perbaikan Tambahan (Post-Implementation)

### UI Consistency:
- [x] Tombol hapus item ICD-10 & resep: icon Trash2 + teks "Hapus" dengan border destructive (konsisten di ConsultationPage, EditMedicalRecordPage, CreateInvoicePage, EditInvoicePage)
- [x] Input number default value: gunakan string state untuk semua input number di form dinamis (resep quantity, invoice items)
- [x] Search/filter UI diseragamkan di semua halaman:
  - Search icon di dalam input (`absolute left-3`, `pl-10`)
  - Tombol "Cari" dengan `variant="outline" size="sm"`
  - Filter icon + select dropdown
  - Container: `flex flex-col sm:flex-row gap-3 mb-4`
  - Halaman yang diupdate: PatientsPage, MedicalRecordsPage, PrescriptionsPage, BillingPage, SchedulesPage, QueuePage

### Backend Search:
- [x] Tambah search parameter di `PrescriptionController` (prescription_number, patient name/mr_number)
- [x] Tambah search parameter di `InvoiceController` (invoice_number, patient name/mr_number)
- [x] Tambah search parameter di `MedicalRecordController` (patient name/mr_number)
- [x] Tambah filter `medical_record_id` di `PrescriptionController`
- [x] MedicalRecordsPage diubah dari client-side filter ke server-side search

### Fitur Tambahan:
- [x] Edit resep di halaman Edit Rekam Medis (fetch existing prescription, edit jika belum ditebus)
- [x] Edit invoice (halaman terpisah `/billing/:id/edit`, hanya untuk pending)
- [x] Tombol "Bayar Semua" di dialog pembayaran

---

## 6.6 Verifikasi

- [x] Buat resep saat konsultasi -> nomor resep auto-generate
- [x] Tebus resep -> status berubah, tidak bisa edit lagi
- [x] Download PDF resep berfungsi
- [x] Buat invoice dengan item layanan
- [x] Partial payment: bayar sebagian -> status "partial", bayar sisa -> status "paid"
- [x] Download PDF invoice berfungsi
- [x] Batalkan invoice berfungsi
- [x] Dokter tidak bisa akses billing (403)
- [x] Edit resep dari halaman edit rekam medis
- [x] Edit invoice dari halaman detail (pending only)
- [x] Search & filter berfungsi di semua halaman
- [x] Pest test semua pass (153 tests, 352 assertions)
- [x] Larastan: 0 errors
- [x] TypeScript: clean, no errors
- [x] Frontend build: success

---

## Deliverables

| Item | Status |
|------|--------|
| Migration & Model Prescription + auto number | Selesai |
| API resep (CRUD + dispense + PDF + search) | Selesai |
| Form resep di halaman konsultasi | Selesai |
| Edit resep di halaman edit rekam medis | Selesai |
| Halaman list resep + detail + tebus + search | Selesai |
| PDF resep (DomPDF, A5) | Selesai |
| Migration & Model Service, Invoice, Payment | Selesai |
| API invoice (CRUD + payment + cancel + PDF + search) | Selesai |
| Halaman list invoice + detail + pembayaran + search | Selesai |
| Form buat invoice (dynamic items + layanan) | Selesai |
| Edit invoice (pending only) | Selesai |
| Partial payment flow + tombol "Bayar Semua" | Selesai |
| PDF invoice (DomPDF, A4) | Selesai |
| Pest test resep (16 tests) & billing (25 tests) | Selesai |
| UI consistency pass (delete buttons, number inputs, search/filter) | Selesai |
| Backend search (prescriptions, invoices, medical records) | Selesai |

---

## File yang Dibuat/Diubah

### Backend (baru):
- `database/migrations/2026_02_17_100000_create_prescriptions_table.php`
- `database/migrations/2026_02_17_100001_create_services_table.php`
- `database/migrations/2026_02_17_100002_create_invoices_table.php`
- `app/Models/Prescription.php`
- `app/Models/Service.php`
- `app/Models/Invoice.php`
- `app/Models/Payment.php`
- `database/factories/PrescriptionFactory.php`
- `database/factories/ServiceFactory.php`
- `database/factories/InvoiceFactory.php`
- `app/Http/Requests/StorePrescriptionRequest.php`
- `app/Http/Requests/UpdatePrescriptionRequest.php`
- `app/Http/Requests/StoreInvoiceRequest.php`
- `app/Http/Requests/StorePaymentRequest.php`
- `app/Policies/PrescriptionPolicy.php`
- `app/Policies/InvoicePolicy.php`
- `app/Policies/ServicePolicy.php`
- `app/Http/Resources/PrescriptionResource.php`
- `app/Http/Resources/InvoiceResource.php`
- `app/Http/Controllers/Api/PrescriptionController.php`
- `app/Http/Controllers/Api/ServiceController.php`
- `app/Http/Controllers/Api/InvoiceController.php`
- `resources/views/pdf/prescription.blade.php`
- `resources/views/pdf/invoice.blade.php`
- `tests/Feature/PrescriptionTest.php`
- `tests/Feature/InvoiceTest.php`

### Backend (diubah):
- `routes/api.php` (tambah routes resep, service, invoice)
- `app/Http/Controllers/Api/MedicalRecordController.php` (tambah search)

### Frontend (baru):
- `src/api/prescriptions.ts`
- `src/api/services.ts`
- `src/api/invoices.ts`
- `src/pages/PrescriptionsPage.tsx`
- `src/pages/BillingPage.tsx`
- `src/pages/CreateInvoicePage.tsx`
- `src/pages/InvoiceDetailPage.tsx`
- `src/pages/EditInvoicePage.tsx`

### Frontend (diubah):
- `src/pages/ConsultationPage.tsx` (tambah form resep, fix delete buttons & number inputs)
- `src/pages/EditMedicalRecordPage.tsx` (tambah edit resep, fix delete buttons)
- `src/pages/PatientsPage.tsx` (fix search button variant)
- `src/pages/MedicalRecordsPage.tsx` (server-side search + consistent UI)
- `src/pages/SchedulesPage.tsx` (tambah Filter icon)
- `src/pages/QueuePage.tsx` (tambah Filter icon)
- `src/api/medicalRecords.ts` (tambah search param)
- `src/routes/index.tsx` (tambah routes)
