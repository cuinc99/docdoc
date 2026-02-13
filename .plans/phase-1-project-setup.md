# Phase 1: Project Setup & Infrastruktur

**Estimasi:** 2-3 hari
**Prasyarat:** Laravel Herd terinstall, Bun terinstall, PostgreSQL tersedia (via Herd atau lokal)
**Output:** Project siap development dengan backend Laravel 12 (Herd) + frontend React 19 (Bun) terhubung.

---

## 1.1 Inisialisasi Backend (Laravel 12 + Herd)

### Task:
- [x] Install Laravel 12 via Composer (`composer create-project laravel/laravel backend`)
- [x] Link project ke Herd: `cd backend && herd link docdoc-api`
  - Backend akan tersedia di `http://docdoc-api.test`
- [x] Buat database PostgreSQL 17 (via Herd database manager atau `createdb docdoc`)
- [x] Konfigurasi `.env`:
  ```
  APP_URL=http://docdoc-api.test
  DB_CONNECTION=pgsql
  DB_HOST=127.0.0.1
  DB_PORT=5432
  DB_DATABASE=docdoc
  DB_USERNAME=...
  DB_PASSWORD=...
  SANCTUM_STATEFUL_DOMAINS=localhost:5173
  SESSION_DOMAIN=.test
  ```
- [x] Install & konfigurasi Laravel Sanctum untuk SPA auth
- [x] Install dev tools:
  - Laravel Debugbar (`barryvdh/laravel-debugbar`)
  - Laravel Pint (sudah built-in Laravel 12)
  - Larastan (`larastan/larastan`) + `phpstan.neon`
- [x] Install laravel-dompdf (`barryvdh/laravel-dompdf`)
- [x] Setup CORS configuration (`config/cors.php`) untuk koneksi ke frontend `localhost:5173`
- [x] Buat base API response helper (`{ data, message, errors }`)

### Struktur Folder Backend:
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/
│   ├── Policies/
│   └── Services/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── routes/
│   └── api.php
└── tests/
    ├── Feature/
    └── Unit/
```

---

## 1.2 Inisialisasi Frontend (React 19 + Vite 6 + Bun)

### Task:
- [x] Scaffold project React + TypeScript via Vite 6 (`bun create vite frontend --template react-ts`)
- [x] Install & konfigurasi TailwindCSS 4 + `@tailwindcss/vite` plugin
  ```
  bun add tailwindcss @tailwindcss/vite
  ```
- [x] Install & init shadcn/ui (`bunx shadcn@latest init`)
- [x] Setup RetroUI theme:
  - Tambah font Archivo Black + Space Grotesk (Google Fonts)
  - Tambah CSS variables RetroUI (light + dark mode)
- [x] Install RetroUI komponen dasar: Button, Card, Input, Badge, Avatar
  ```
  bunx shadcn@latest add 'https://retroui.dev/r/button.json'
  bunx shadcn@latest add 'https://retroui.dev/r/card.json'
  bunx shadcn@latest add 'https://retroui.dev/r/input.json'
  bunx shadcn@latest add 'https://retroui.dev/r/badge.json'
  bunx shadcn@latest add 'https://retroui.dev/r/avatar.json'
  ```
- [x] Install dependencies utama:
  ```
  bun add react-router-dom @tanstack/react-query react-hook-form @hookform/resolvers zod @tanstack/react-table lucide-react recharts sonner axios
  ```
- [x] Install dev dependencies:
  ```
  bun add -d vitest @testing-library/react @testing-library/jest-dom eslint prettier @types/node
  ```
- [x] Setup path alias (`@/` -> `./src/`)
- [x] Konfigurasi Axios instance:
  - Base URL: `http://docdoc-api.test` (Herd)
  - `withCredentials: true` (untuk Sanctum cookie)
  - Interceptor: redirect ke `/login` jika 401
- [x] Setup TanStack Query provider (`QueryClientProvider`)
- [x] Setup React Router dengan route placeholder

### Struktur Folder Frontend:
```
frontend/
├── src/
│   ├── api/            # Axios instance & API functions
│   ├── components/
│   │   ├── layout/     # Sidebar, BottomNav, AppShell
│   │   ├── retroui/    # RetroUI components (auto-installed)
│   │   └── ui/         # shadcn/ui components (auto-installed)
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities, helpers
│   ├── pages/          # Page components per route
│   ├── routes/         # React Router config
│   ├── stores/         # State (jika perlu)
│   ├── types/          # TypeScript interfaces
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
└── bun.lockb
```

---

## 1.3 Docker (Production Only)

### Task:
- [x] Buat `Dockerfile` untuk backend (PHP 8.2 + extensions + Composer)
- [x] Buat `Dockerfile` untuk frontend (Bun + Vite build -> Nginx serve static)
- [x] Buat `docker-compose.yml` (untuk production deployment):
  - Service `backend` (Laravel + PHP-FPM + Nginx, port 8000)
  - Service `frontend` (Nginx serve static, port 80)
  - Service `db` (PostgreSQL 17, port 5432)
- [x] Buat `.env.example` untuk backend & frontend

### Catatan:
- Docker **tidak digunakan** saat development lokal
- Development lokal menggunakan:
  - Backend: Laravel Herd (`http://docdoc-api.test`)
  - Frontend: `bun run dev` (Vite dev server, `http://localhost:5173`)
  - Database: PostgreSQL via Herd atau service lokal

---

## 1.4 Verifikasi

- [x] `php artisan migrate` berhasil (tabel default Laravel)
- [x] Backend API bisa diakses via `http://docdoc-api.test/api/health`
- [x] Frontend dev server berjalan di `http://localhost:5173`
- [x] Frontend bisa request ke backend (CORS + Sanctum cookie berfungsi)
- [x] Linting & formatting berjalan (`pint`, `phpstan`, `eslint`, `prettier`)

---

## Deliverables

| Item | Status |
|------|--------|
| Laravel 12 project + Herd linked (`docdoc-api.test`) | ✅ |
| PostgreSQL 17 database terhubung | ✅ |
| React 19 + Vite 6 + Bun project dengan RetroUI theme | ✅ |
| CORS + Sanctum SPA auth terkonfigurasi | ✅ |
| Docker Compose production (opsional, belum wajib) | ✅ |
| Dev tools (lint, format, static analysis) siap | ✅ |
