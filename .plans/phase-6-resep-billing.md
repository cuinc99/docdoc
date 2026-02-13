# Phase 6: Resep Obat & Billing

**Estimasi:** 3-4 hari
**Prasyarat:** Phase 5 selesai
**Output:** Resep obat + tebus + PDF, invoice + pembayaran (partial payment) + PDF.

---

## 6.1 Backend - Resep Obat

### Migration & Model:
- [ ] Buat migration tabel `prescriptions`:
  ```
  id, prescription_number (unique), patient_id (FK), doctor_id (FK users),
  medical_record_id (FK, unique), items (jsonb),
  -- items: [{drug_name, dosage, frequency, duration, quantity, instructions}]
  notes (nullable, text), is_dispensed (boolean, default false),
  dispensed_at (nullable, timestamp), dispensed_by (nullable, FK users),
  created_at, updated_at
  ```
- [ ] Buat Model `Prescription` dengan:
  - Auto-generate `prescription_number` format `RX{YY}{MM}{DD}{COUNT}` di event `creating`
  - Cast `items` sebagai array
  - Relasi: `patient`, `doctor`, `medicalRecord`, `dispensedByUser`
  - Method `isEditable()`: return `!is_dispensed`
  - Method `dispense(userId)`: set is_dispensed, dispensed_at, dispensed_by
- [ ] Buat `PrescriptionFactory`

### API Endpoints:
- [ ] Buat `PrescriptionController`:
  - `GET /api/prescriptions` - List (paginated, filter by patient_id, is_dispensed)
  - `GET /api/prescriptions/{id}` - Detail
  - `POST /api/prescriptions` - Buat resep (saat konsultasi)
  - `PUT /api/prescriptions/{id}` - Update (hanya jika belum ditebus)
  - `PATCH /api/prescriptions/{id}/dispense` - Tebus resep
  - `GET /api/prescriptions/{id}/pdf` - Download PDF resep
- [ ] Buat `PrescriptionRequest` dengan validasi:
  - Patient ID, Doctor ID, Medical Record ID: required, exists
  - Items: required, array, min 1 item
  - Setiap item: drug_name (required), dosage (required), frequency (required), quantity (required, integer min 1)
- [ ] Buat `PrescriptionPolicy`:
  - Admin & Dokter: create, update (jika belum dispensed)
  - Resepsionis: dispense saja
  - Delete: tidak bisa setelah dispensed
- [ ] Buat PDF template resep (DomPDF):
  - Header: info klinik, dokter
  - Body: list obat (nama, dosis, frekuensi, durasi, jumlah, instruksi)
  - Footer: tanggal, nomor resep
  - Ukuran: A5
- [ ] Tulis Pest test

### Endpoint:
```
GET    /api/prescriptions                    (auth)
GET    /api/prescriptions/{id}               (auth)
POST   /api/prescriptions                    (auth, admin|doctor)
PUT    /api/prescriptions/{id}               (auth, admin|doctor, not dispensed)
PATCH  /api/prescriptions/{id}/dispense      (auth, admin|receptionist)
GET    /api/prescriptions/{id}/pdf           (auth)
```

---

## 6.2 Frontend - Halaman Resep Obat

### Task:
- [ ] Buat API functions (`src/api/prescriptions.ts`)
- [ ] Integrasikan form resep ke halaman konsultasi (`/queue/:id/consultation`):
  - Section "Resep Obat" di bawah form SOAP
  - Dynamic form: tambah/hapus item obat
  - Per item: Nama Obat, Dosis, Frekuensi, Durasi, Jumlah, Instruksi
  - Catatan tambahan
  - Resep dibuat bersamaan saat menyimpan rekam medis
- [ ] Buat halaman `/prescriptions` - Daftar Resep:
  - Tabel: Nomor Resep, Tanggal, Pasien, Dokter, Status (Belum ditebus / Sudah ditebus)
  - Filter: status (semua/belum/sudah ditebus)
  - Aksi: Lihat Detail, Tebus (untuk Resepsionis), Download PDF
- [ ] Buat dialog detail resep:
  - Info pasien, dokter, tanggal
  - List item obat
  - Status tebus
  - Tombol "Tebus Resep" (hanya untuk Resepsionis, jika belum ditebus)
  - Tombol "Download PDF"
- [ ] Konfirmasi dialog sebelum tebus resep (tidak bisa dibatalkan)

---

## 6.3 Backend - Billing & Pembayaran

### Migration & Model:
- [ ] Buat migration tabel `services`:
  ```
  id, name, price (decimal 12,2), is_active (default true),
  created_at, updated_at
  ```
- [ ] Buat migration tabel `invoices`:
  ```
  id, invoice_number (unique), patient_id (FK),
  items (jsonb), -- [{description, quantity, unit_price, total}]
  subtotal (decimal 12,2), discount (decimal 12,2, default 0),
  tax (decimal 12,2, default 0), total (decimal 12,2),
  paid_amount (decimal 12,2, default 0),
  status (enum: pending/partial/paid/cancelled),
  created_at, updated_at
  ```
- [ ] Buat migration tabel `payments`:
  ```
  id, invoice_id (FK), amount (decimal 12,2),
  method (enum: cash/transfer), reference (nullable),
  received_by (FK users), created_at, updated_at
  ```
- [ ] Buat Model `Service` (CRUD sederhana)
- [ ] Buat Model `Invoice` dengan:
  - Auto-generate `invoice_number` format `INV{YY}{MM}{COUNT}`
  - Cast `items` sebagai array
  - Relasi: `patient`, `payments`
  - Method `recalculateStatus()`: update status berdasarkan paid_amount vs total
  - Method `addPayment(amount, method, reference, userId)`: buat payment + update paid_amount + recalculate status
- [ ] Buat Model `Payment` dengan relasi `invoice`, `receivedBy`
- [ ] Buat Factory untuk Service, Invoice

### API Endpoints:
- [ ] Buat `ServiceController` (CRUD sederhana, admin only)
- [ ] Buat `InvoiceController`:
  - `GET /api/invoices` - List (paginated, filter by patient_id, status)
  - `GET /api/invoices/{id}` - Detail (include payments)
  - `POST /api/invoices` - Buat invoice
  - `PUT /api/invoices/{id}` - Update invoice (hanya jika status pending)
  - `POST /api/invoices/{id}/payments` - Tambah pembayaran
  - `PATCH /api/invoices/{id}/cancel` - Batalkan invoice
  - `GET /api/invoices/{id}/pdf` - Download PDF invoice
- [ ] Buat `InvoiceRequest` & `PaymentRequest` dengan validasi
- [ ] Buat `InvoicePolicy`:
  - Admin & Resepsionis: CRUD penuh
  - Dokter: tidak ada akses
- [ ] Buat PDF template invoice (DomPDF):
  - Header: info klinik
  - Body: tabel item (deskripsi, qty, harga, total), subtotal, diskon, pajak, total
  - Riwayat pembayaran
  - Sisa tagihan
- [ ] Tulis Pest test

### Endpoint:
```
GET    /api/services                    (auth)
POST   /api/services                    (auth, admin)
PUT    /api/services/{id}               (auth, admin)
DELETE /api/services/{id}               (auth, admin)

GET    /api/invoices                    (auth, admin|receptionist)
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
- [ ] Buat API functions (`src/api/invoices.ts`, `src/api/services.ts`)
- [ ] Buat halaman `/billing` - Daftar Invoice:
  - Tabel: Nomor Invoice, Tanggal, Pasien, Total, Dibayar, Sisa, Status
  - Filter: status (semua/pending/partial/paid/cancelled)
  - Badge status berwarna (pending: kuning, partial: biru, paid: hijau, cancelled: merah)
  - Tombol "Buat Invoice"
- [ ] Buat form "Buat Invoice" (modal/halaman):
  - Pilih pasien (search/select)
  - Dynamic items:
    - Pilih dari daftar layanan (auto-fill harga) atau input manual
    - Deskripsi, Jumlah, Harga Satuan -> Total per item auto-calculate
  - Subtotal (auto), Diskon (input), Pajak (input), Total (auto)
  - Tombol Simpan
- [ ] Buat halaman `/billing/:id` - Detail Invoice:
  - Info pasien, nomor invoice, tanggal
  - Tabel item
  - Summary: subtotal, diskon, pajak, total, sudah dibayar, sisa
  - Riwayat pembayaran (tabel: tanggal, jumlah, metode, referensi, diterima oleh)
  - Tombol "Tambah Pembayaran" (jika belum lunas)
  - Tombol "Download PDF"
  - Tombol "Batalkan" (jika masih pending)
- [ ] Buat dialog "Tambah Pembayaran":
  - Jumlah (max = sisa tagihan)
  - Metode: Tunai / Transfer
  - Referensi (untuk transfer)
  - Setelah bayar -> status auto-update (partial/paid)
- [ ] Toast notifikasi: "Pembayaran berhasil", "Invoice lunas", dll.

---

## 6.5 Verifikasi

- [ ] Buat resep saat konsultasi -> nomor resep auto-generate
- [ ] Tebus resep -> status berubah, tidak bisa edit lagi
- [ ] Download PDF resep berfungsi
- [ ] Buat invoice dengan item layanan
- [ ] Partial payment: bayar sebagian -> status "partial", bayar sisa -> status "paid"
- [ ] Download PDF invoice berfungsi
- [ ] Batalkan invoice berfungsi
- [ ] Dokter tidak bisa akses billing (403)
- [ ] Pest test semua pass

---

## Deliverables

| Item | Status |
|------|--------|
| Migration & Model Prescription + auto number | - |
| API resep (CRUD + dispense + PDF) | - |
| Form resep di halaman konsultasi | - |
| Halaman list resep + detail + tebus | - |
| PDF resep (DomPDF) | - |
| Migration & Model Service, Invoice, Payment | - |
| API invoice (CRUD + payment + cancel + PDF) | - |
| Halaman list invoice + detail + pembayaran | - |
| Form buat invoice (dynamic items + layanan) | - |
| Partial payment flow | - |
| PDF invoice (DomPDF) | - |
| Pest test resep & billing | - |
