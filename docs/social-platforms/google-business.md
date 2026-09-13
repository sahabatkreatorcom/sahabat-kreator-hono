# Google Business Profile — Local Posts + Performance API

> Riset per 9 Sep 2026. Docs: developers.google.com/my-business

## Status & Struktur

- Google **membatasi akses API**: project Cloud baru mulai dengan **quota 0 QPM** —
  wajib lulus **Application for Basic API Access**
- Struktur 8 API terpisah (bukan monolitik v4.9): Account Management,
  Business Information, Reviews, **Local Posts**, Business Profile Performance,
  Verifications, Place Actions, Notifications (+ Lodging untuk hotel)

## Pengajuan Akses (wajib)

1. Google Cloud project aktif
2. Pemohon mengelola **GBP terverifikasi yang aktif 60+ hari** (milik sendiri/klien)
3. Punya **website bisnis** tercantum di GBP (domain email harus match)
4. Submit form: `https://support.google.com/business/contact/api_default` →
   pilih **"Application for Basic API Access"** → isi **Project Number** (bukan
   Project ID) + email owner/manager
5. Indikator approval: quota berubah **0 QPM → 300 QPM** di Cloud Console
   (APIs & Services → Quotas). Review beberapa hari–minggu
6. Audit: Google berhak review penggunaan kapan saja; project nonaktif 90 hari
   bisa dinonaktifkan; wajib sediakan akun demo dalam 7 hari jika diminta;
   mekanisme disconnect end-user dalam 7 hari kerja

## Auth

- OAuth 2.0 Google standar, scope tunggal: **`https://www.googleapis.com/auth/business.manage`**
  (tidak ada scope read-only — consent screen menampilkan peringatan akses tulis)
- Access token 1 jam; `access_type=offline` + `prompt=consent` agar selalu dapat
  **refresh_token**
- **Service account + domain-wide delegation tidak lagi didukung** untuk
  pengelolaan lokasi baru — end-user harus OAuth manual sign-in

## Base URL

| API | Base URL |
|---|---|
| Local Posts / Reviews / legacy | `https://mybusiness.googleapis.com/v4/` |
| Account Management | `https://mybusinessaccountmanagement.googleapis.com/v1/` |
| Business Information | `https://mybusinessbusinessinformation.googleapis.com/v1/` |
| Performance | `https://businessprofileperformance.googleapis.com/v1/` |

## LocalPosts (publish)

**Create:** `POST https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/localPosts`

Body: `languageCode`, `summary`, `topicType`, `media[]` (`mediaFormat: PHOTO`,
`sourceUrl`), `event`, `offer`, `callToAction`, **`scheduledTime`**.

- **scheduledTime** (RFC 3339, bisa di-set user): LocalPost dibuat dalam state
  **SCHEDULED**, Google yang mempublikasikannya di waktu tsb. → GBP PUNYA
  native scheduling. State pasca-create: `SCHEDULED` → `PROCESSING` →
  `LIVE` | `REJECTED`

- **topicType:** `STANDARD` (default/What's New), `EVENT`, `OFFER`, `ALERT`
  (hanya COVID_19). **Product posts TIDAK bisa dibuat via API**
- **EVENT:** `event: { title, schedule: { startDate, startTime, endDate, endTime } }`
- **OFFER:** `offer: { couponCode, redeemOnlineUrl, termsConditions }`
- **callToAction.actionType:** `BOOK`, `ORDER`, `SHOP`, `LEARN_MORE`, `SIGN_UP`,
  `CALL` (+ `url`)

Operasi lain: `PATCH .../localPosts/{id}?updateMask=summary`,
`DELETE .../localPosts/{id}`, `GET .../localPosts[/{id}]`.

Flow lokasi: `accounts.list` → `accounts.locations.list` untuk `locationId`.
Recurring posts didukung via LocalPosts API.

## Business Profile Performance API (insights)

Base: `https://businessprofileperformance.googleapis.com/v1/`

- `GET /v1/{location=locations/*}:fetchMultiDailyMetricsTimeSeries` — beberapa
  metrik harian sekaligus (impression Search/Maps, klik website, klik telepon,
  permintaan arah, dll — 11 `DailyMetric`)
- `GET /v1/{name=locations/*}:getDailyMetricsTimeSeries` — satu metrik harian
- `GET /v1/{parent=locations/*}/searchkeywords/impressions/monthly` —
  **keyword pencarian bulanan** yang membuat bisnis ditemukan di Search/Maps

Deprecated (jangan pakai): `accounts.locations.reportInsights`,
`accounts.locations.localPosts.reportInsights`, batch `locationNames`.

## Deprecations Penting

| API/Method | Status |
|---|---|
| GMB v4.9 monolitik | Sunset 30 Apr 2022 (v4 masih jalan untuk localPosts/reviews) |
| Business Calls API | Deprecated 30 Mei 2023 |
| **My Business Q&A API** | **Dihentikan 3 Nov 2025** — jangan rancang fitur Q&A |
| Legacy v4 reviews | Tidak otomatis aktif walau Basic Access disetujui — banyak project dapat `403 SERVICE_DISABLED`; validasi dulu di project |

## Rate Limit / Quota

| API | Limit |
|---|---|
| Business Information | 300 QPM; Create Location 300 QPD; Update 10.000 QPD; **Edits 10/mnt per GBP (tidak bisa dinaikkan)** |
| Lainnya (Account Mgmt, Performance, dll) | 300 QPM masing-masing |

Error 429 `RESOURCE_EXHAUSTED`. Best practice: pace merata (~5 req/dtk),
exponential backoff + jitter, pakai notifications daripada polling, cache data statis.
Quota increase via form yang sama (ditolak jika usage < 50% QPM).

## Impor untuk Sahabat Kreator

- Ajukan Basic Access **sedini mungkin** — butuh GBP aktif 60+ hari + website bisnis
- Fitur yang TIDAK bisa via API: hapus review (flag manual), product posts,
  Q&A (mati), v4 reviews belum tentu aktif — validasi dulu
- Kepatuhan: transparansi ke end-user, notifikasi perubahan akun ≤48 jam,
  mekanisme disconnect ≤7 hari kerja, akun demo siap
- `metadata` di schema `social_account` cocok untuk menyimpan `locationId` +
  `accountId` (sesuai komentar schema existing)
