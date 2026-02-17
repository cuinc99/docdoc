# Phase 7.5: Frontend Consistency Refactor & Backend Audit

**Estimasi:** 1-2 hari
**Prasyarat:** Phase 7 selesai
**Output:** UI/UX konsisten di seluruh halaman, komponen reusable, backend quality fixes.
**Status:** ✅ Complete

---

## 7.5.1 Frontend — Komponen Reusable Baru

### Komponen RetroUI:
- [x] `Dialog` — wrapper standar dengan overlay, escape key, ARIA, X close button
- [x] `Textarea` — mirip Input component, support `aria-invalid` error styling
- [x] `Select` — menggantikan `selectClass` constant

### Komponen Shared:
- [x] `ConfirmDialog` — dialog konfirmasi generik (menggantikan `window.confirm()`)
- [x] `FormField` — wrapper label+input+error dengan styling konsisten
- [x] `Pagination` — chevron prev/next + "Hal X dari Y (Z data)"
- [x] `SearchBar` — search icon inside input + tombol "Cari"

### Komponen Domain:
- [x] `DiagnosisSelector` — ICD-10 search + diagnosis list (extracted dari ConsultationPage & EditMedicalRecordPage)
- [x] `PrescriptionItemsEditor` — editor item obat dengan disabled state (extracted dari ConsultationPage & EditMedicalRecordPage)
- [x] `InvoiceItemsEditor` — editor item invoice dengan service selector (extracted dari CreateInvoicePage & EditInvoicePage)
- [x] `InvoiceSummary` — kalkulasi subtotal/diskon/pajak/total (extracted dari CreateInvoicePage & EditInvoicePage)

### Extended:
- [x] `PageHeader` — ditambah props `onBack` dan `subtitle` (menggantikan 7 inline back-button header)

### Utility:
- [x] `formatRupiah` dipindah ke `utils.ts` (sebelumnya duplikasi di 3 file, inline di 2 file)

---

## 7.5.2 Frontend — Refactor Semua Halaman (21 halaman)

### Konsistensi Dialog:
- [x] Overlay standar `bg-black/50` (sebelumnya campur `bg-black/40` dan `bg-black/50`)
- [x] ARIA attributes (`role="dialog"`, `aria-modal`, `aria-label`) di semua dialog
- [x] Escape key handling di semua dialog
- [x] X close button di semua dialog
- [x] `max-h-[90vh] overflow-y-auto overscroll-contain` di semua dialog

### Konsistensi Form:
- [x] Label standar: `text-sm font-body font-medium` (sebelumnya campur `text-xs text-muted-foreground`)
- [x] Required asterisk: `<span className="text-destructive"> *</span>` (sebelumnya campur plain text `*`)
- [x] Error message: `text-sm text-destructive font-body mt-1` (sebelumnya Login/Register tanpa `font-body`)
- [x] Textarea menggunakan komponen `<Textarea>` (sebelumnya inline className)

### Konsistensi List/Action:
- [x] Pagination standar via `<Pagination>` (sebelumnya PatientsPage berbeda dari halaman lain)
- [x] Search standar via `<SearchBar>` (sebelumnya copy-paste di 5 halaman)
- [x] Select standar via `<Select>` (sebelumnya `selectClass` constant)
- [x] Border item: `border-2` konsisten (sebelumnya drug items menggunakan `border` 1px)
- [x] Destructive button: `gap-1.5 py-1.5` standar

### Konsistensi Loading/Empty:
- [x] Semua halaman menggunakan `<EmptyState loading>` (sebelumnya QueuePage dan detail pages menggunakan custom inline)
- [x] Semua header menggunakan `<PageHeader>` (sebelumnya QueuePage menggunakan raw `<Text>`)

### Eliminasi Copy-Paste:
- [x] ICD-10 diagnosis section (~80 baris) → `<DiagnosisSelector>` (dipakai di 2 halaman)
- [x] Prescription items (~60 baris) → `<PrescriptionItemsEditor>` (dipakai di 2 halaman)
- [x] Invoice items (~70 baris) → `<InvoiceItemsEditor>` + `<InvoiceSummary>` (dipakai di 2 halaman)

### Fix Bug:
- [x] `birth_date` "Invalid Date" pada daftar pasien — frontend menggunakan `formatDateId()` langsung

---

## 7.5.3 Backend — Audit & Fixes

### Response Consistency:
- [x] `ApiResponse::paginated()` helper baru untuk endpoint paginated
- [x] 5 controller (`PatientController`, `MedicalRecordController`, `PrescriptionController`, `InvoiceController`, `UserManagementController`) direfactor menggunakan `ApiResponse::paginated()`
- [x] Default message diterjemahkan ke Bahasa Indonesia (`Success` → `Berhasil`, `Not found` → `Data tidak ditemukan`, dll.)

### Search Consistency:
- [x] 3 controller (`MedicalRecordController`, `PrescriptionController`, `InvoiceController`) diubah dari `ilike` (PostgreSQL-only) ke `whereRaw('LOWER(...) LIKE ?')` (cross-DB compatible)

### Timezone Fix:
- [x] `QueueController` — semua `now()` diganti dengan `Carbon::now('Asia/Makassar')`

### Performance Fix:
- [x] `DashboardController` visit chart — 30 individual COUNT queries diganti dengan 1 grouped query

### Date Serialization Fix:
- [x] `PatientResource`, `QueueResource`, `MedicalRecordResource` — `birth_date` dikembalikan sebagai `Y-m-d` string (sebelumnya raw Carbon datetime)

### Minor Fixes:
- [x] `PrescriptionController::pdf()` dan `InvoiceController::pdf()` — return type `: \Illuminate\Http\Response`
- [x] Larastan `@var` annotations untuk Carbon type inference

---

## 7.5.4 Verifikasi

- [x] 173 tests pass (415 assertions)
- [x] Larastan: 0 errors
- [x] TypeScript: clean
- [x] Frontend build: success (930 KB, turun dari 957 KB)
- [x] No frontend breakage dari backend changes

---

## Deliverables

| Item | Status |
|------|--------|
| 7 komponen shared baru (Dialog, Textarea, Select, FormField, ConfirmDialog, Pagination, SearchBar) | ✅ |
| 4 komponen domain baru (DiagnosisSelector, PrescriptionItemsEditor, InvoiceItemsEditor, InvoiceSummary) | ✅ |
| PageHeader extended (onBack, subtitle) | ✅ |
| formatRupiah centralized ke utils | ✅ |
| 21 halaman direfactor ke komponen shared | ✅ |
| ApiResponse::paginated() + Indonesian defaults | ✅ |
| Search cross-DB compatibility (3 controllers) | ✅ |
| QueueController timezone fix | ✅ |
| DashboardController N+1 fix | ✅ |
| birth_date serialization fix (3 resources) | ✅ |
| Bundle size reduced (-27 KB) | ✅ |
