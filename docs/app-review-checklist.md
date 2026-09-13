# Checklist Pengajuan API — Sahabat Kreator

> Dokumen ini menjadi panduan langkah demi langkah untuk mengajukan akses API ke setiap platform sosial media.
> Update terakhir: 10 September 2026.

---

## 📊 Ringkasan Timeline

| Platform | Estimasi | Status | Mulai | Target Selesai |
|---|---|---|---|---|
| Bluesky | — | ✅ Siap (tidak perlu review) | — | Bisa langsung |
| Pinterest Trial | Instan | ⏳ Menunggu | — | — |
| LinkedIn Share | Instan | ⏳ Menunggu | — | — |
| Meta FB/IG/Threads | 1-3 minggu | 🔴 Belum mulai | — | — |
| TikTok Content Posting | 2-6 minggu | 🔴 Belum mulai | — | — |
| YouTube Compliance | 1-4 minggu | 🔴 Belum mulai | — | — |
| Pinterest Standard | 1-4 minggu | 🔴 Belum mulai | — | — |
| GBP Basic Access | Hari-minggu | 🔴 Belum mulai | — | — |
| LinkedIn Community Mgmt | 3-6 bulan | 🔴 Belum mulai | — | — |

---

## 🟢 BLUESKY — Langsung Bisa

Tidak perlu review/audit. OAuth + publish adapter sudah siap.

- [ ] Konfigurasi `BLUESKY_PDS_URL=https://bsky.social` di `.env`
- [ ] Test koneksi: `POST {pds}/xrpc/com.atproto.server.createSession`
- [ ] Deploy ke production
- [ ] 🎉 Selesai

---

## 🟡 PINTEREST

### Phase 1: Trial Access (Instan)

- [ ] Buka `developers.pinterest.com` → My Apps
- [ ] Klik "Connect App" → isi form:
  - App Name: `Sahabat Kreator`
  - Company: [Nama perusahaan]
  - Website: `https://sahabatkreator.com`
  - Privacy Policy: `https://sahabatkreator.com/kebijakan-privasi`
  - Redirect URI: `https://app.sahabatkreator.com/api/oauth/pinterest/callback`
- [ ] Tunggu approval (biasanya < 1 hari kerja)
- [ ] Generate Sandbox Access Token untuk testing

### Phase 2: Standard Access

- [ ] Upload video demo screencast (1-3 menit):
  - [ ] Resolusi 1080p+, tanpa audio
  - [ ] Tampilkan jendela OAuth Pinterest (`https://www.pinterest.com/oauth/`)
  - [ ] Grant access → redirect sukses
  - [ ] Halaman app menampilkan data akun Pinterest
  - [ ] Create Pin via UI app → tampilkan Pin hasil
  - [ ] **JANGAN** tampilkan secret/token plaintext
- [ ] Klik tombol "Upgrade" di My Apps → Standard Access
- [ ] Attach video demo
- [ ] Submit → tunggu review (1-4 minggu)

---

## 🟡 LINKEDIN — Share on LinkedIn (Instan)

- [ ] Buat LinkedIn Page: `linkedin.com/company/setup`
- [ ] Buka `developer.linkedin.com` → Create App
- [ ] Tab Products → tambahkan:
  - [ ] "Sign In with LinkedIn using OpenID Connect"
  - [ ] "Share on LinkedIn"
- [ ] Tab Auth → set:
  - [ ] Redirect URLs: `https://app.sahabatkreator.com/api/oauth/linkedin/callback`
  - [ ] Scopes: `openid`, `profile`, `email`, `w_member_social`
- [ ] Catat Client ID + Secret ke `.env`
- [ ] 🎉 Selesai (self-serve, instan)

### LinkedIn Community Management API (3-6 bulan)

> ⚠️ Jika ditolak, HARUS buat app baru (tidak bisa re-apply)

- [ ] Siapkan dokumen organisasi legal (SKU/NPWP/akta)
- [ ] Pastikan ada super admin LinkedIn Page yang verifikasi app
- [ ] Submit Development Tier → tunggu 4-8 minggu
- [ ] Setelah approved, lanjut Standard Tier → tunggu 2-4 bulan

---

## 🔴 META (Facebook + Instagram + Threads)

### Persiapan Awal (Minggu 1-2)

- [ ] Buat Meta Business Manager: `business.facebook.com`
- [ ] Upload dokumen Business Verification:
  - [ ] KTP/Passport owner
  - [ ] Dokumen bisnis (NPWP/Akta/Invoice)
  - [ ] Verifikasi telepon + email bisnis
- [ ] Tunggu approval verification (bisa 3-14 hari)

### Buat App (Minggu 2)

- [ ] Buka `developers.facebook.com` → My Apps → Create App
- [ ] App Type: **Business** (bukan Consumer)
- [ ] App Details:
  - [ ] App Name: `Sahabat Kreator`
  - [ ] App Contact Email: `dev@sahabatkreator.id`
  - [ ] Business Partner ID: (kosongkan jika tidak punya)
- [ ] Tambahkan Products:
  - [ ] Facebook Login
  - [ ] Instagram Graph API
  - [ ] Threads API (tambah via "Add Product" → search "Threads")
- [ ] Konfigurasi OAuth:
  - [ ] Client ID + Secret (auto-generated)
  - [ ] Redirect URI (satu per platform): `https://app.sahabatkreator.com/api/oauth/instagram/callback`, `/api/oauth/facebook/callback`, `/api/oauth/threads/callback`
  - [ ] Webhook Verify Token: generate random string
- [ ] Set App Mode ke **Development** (wajib 7 hari sebelum submit review)

### Data Deletion Callback (Minggu 2)

- [ ] Verify endpoint aktif: `POST https://app.sahabatkreator.com/webhooks/meta/data-deletion`
- [ ] Test dengan tools seperti Postman/curl:
  ```bash
  curl -X POST https://app.sahabatkreator.com/webhooks/meta/data-deletion \
    -H "Content-Type: application/json" \
    -d '{"signed_request":"<test-sig>.<test-payload>"}'
  ```
- [ ] Untuk app Instagram Login standalone: `POST https://app.sahabatkreator.com/webhooks/instagram-standalone/data-deletion`
- [ ] Untuk app Threads: `POST https://app.sahabatkreator.com/webhooks/threads/data-deletion`
- [ ] Catat URL callback untuk diisi di App Review

### Video Demo (Minggu 3)

Rekam 3 video terpisah (1080p+, tanpa audio):

#### Video 1: Facebook Pages
- [ ] Klik "Connect Facebook" di Sahabat Kreator
- [ ] Jendela consent Facebook muncul
- [ ] Login → Grant permissions
- [ ] Pilih Page dari daftar
- [ ] Create post → publish ke Page
- [ ] Tunjukkan post tayang di Page

#### Video 2: Instagram (via Facebook Login)
- [ ] Klik "Connect Instagram" (mode FB Login)
- [ ] Consent Facebook → pilih Page dengan IG tertaut
- [ ] Create IG post → publish
- [ ] Tunjukkan post tayang di IG

#### Video 3: Threads
- [ ] Klik "Connect Threads"
- [ ] Consent Threads → grant permissions
- [ ] Create Threads post → publish
- [ ] Tunjukkan post tayang di Threads

### Submit App Review (Minggu 4)

> ⚠️ Ajukan permission satu per satu (max 2-3 per submission)

#### Submission 1: Facebook Pages

- [ ] Buka App Dashboard → App Review → Permissions
- [ ] Pilih: `pages_show_list`, `pages_manage_posts`, `publish_video`
- [ ] Isi form:
  - [ ] Description: "User connecting their Facebook Page to schedule and publish content via Sahabat Kreator"
  - [ ] Usage demo: attach video 1
  - [ ] Intended use: "Content scheduling for Facebook Pages"
- [ ] Submit → tunggu review (1-5 hari)

#### Submission 2: Instagram Content Publish

- [ ] Pilih: `instagram_basic`, `instagram_content_publish`
- [ ] Isi form:
  - [ ] Description: "User connecting Instagram Business account to schedule and publish content"
  - [ ] Usage demo: attach video 2
- [ ] Submit → tunggu review

#### Submission 3: Threads Content Publish

- [ ] Pilih: `threads_basic`, `threads_content_publish`
- [ ] Isi form:
  - [ ] Description: "User connecting Threads account to schedule and publish content"
  - [ ] Usage demo: attach video 3
- [ ] Submit → tunggu review

### Setelah Approved

- [ ] Update status di Admin → App Review
- [ ] Set permission "Active" untuk production
- [ ] Jalankan Data Use Checkup tahunan (setiap 12 bulan)

---

## 🔴 TIKTOK

### Persiapan Domain Verification (Minggu 1)

- [ ] Pastikan R2 bucket publicly accessible
- [ ] Setup CDN domain (mis. `cdn.sahabatkreator.com`) apunt ke R2
- [ ] Tambahkan DNS TXT record:
  ```
  _tiktok-domain-verification.cdn.sahabatkreator.com
  → "tiktok-verification-code-xxxxx"
  ```
- [ ] Verifikasi di TikTok Dev Console → Domain Management

### Buat App (Minggu 1-2)

- [ ] Buka `developers.tiktok.com` → My Apps → Create App
- [ ] App Name: `Sahabat Kreator`
- [ ] App Type: **Business**
- [ ] Tambahkan Products:
  - [ ] Login Kit
  - [ ] Content Posting API
- [ ] Konfigurasi OAuth:
  - [ ] Redirect URI: `https://app.sahabatkreator.com/api/oauth/tiktok/callback`
  - [ ] Scopes: `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.upload`, `video.publish`
- [ ] Catat Client Key + Secret ke `.env`

### Video Demo (Minggu 2)

- [ ] Rekam 2-3 menit (1080p+, tanpa audio):
  - [ ] Klik "Connect TikTok" di Sahabat Kreator
  - [ ] Jendela consent TikTok (`https://www.tiktok.com/v2/auth/authorize/`)
  - [ ] Login → Grant permissions
  - [ ] Halaman app menampilkan profil TikTok user
  - [ ] Create video post → upload dari URL publik
  - [ ] Tampilkan status: PROCESSING → PUBLISH_COMPLETE

### Submit Content Posting API (Minggu 3)

- [ ] Buka Dev Console → Your Apps → [App] → Content Posting API
- [ ] Klik "Apply" di bagian Usage
- [ ] Isi form:
  - [ ] App description: "Sahabat Kreator is a social media scheduling platform that allows users to connect their TikTok accounts and schedule video posts in advance."
  - [ ] Use case: "Content creators and social media managers need to schedule TikTok posts in advance to maintain consistent posting schedules across multiple platforms."
  - [ ] Attach video demo
  - [ ] Confirm privacy policy URL
- [ ] Submit → tunggu review (2-6 minggu)

### Setelah Approved

- [ ] Update status di Admin → App Review
- [ ] Monitor daily cap (~15-25 post/hari per user, shared antar app)
- [ ] Implementasi exponential backoff untuk error 429

---

## 🔴 YOUTUBE

### Persiapan Google Cloud (Minggu 1)

- [ ] Buka `console.cloud.google.com`
- [ ] Buat project baru: `sahabat-kreator-youtube`
- [ ] Aktifkan API: YouTube Data API v3
- [ ] Buat OAuth credentials:
  - [ ] OAuth 2.0 Client ID (Web application)
  - [ ] Authorized redirect URIs: `https://app.sahabatkreator.com/api/oauth/youtube/callback` dan `https://app.sahabatkreator.com/api/oauth/google_business/callback`
- [ ] Catat Client ID + Secret ke `.env`

### Video Demo (Minggu 2)

- [ ] Rekam 2-3 menit (1080p+, tanpa audio):
  - [ ] OAuth consent screen Google muncul
  - [ ] Grant permissions (`youtube.upload`)
  - [ ] Upload video via Sahabat Kreator
  - [ ] Tunjukkan video di channel (state: private → scheduled → public)

### Submit Compliance Audit (Minggu 3)

- [ ] Buka `support.google.com/youtube/contact/yt_api_form`
- [ ] Pilih: "I want to use the YouTube Data API v3 for uploading videos"
- [ ] Isi form:
  - [ ] Project number: (dari Cloud Console)
  - [ ] Email: developer email
  - [ ] App description + use case
  - [ ] Attach video demo
  - [ ] Confirm privacy policy
- [ ] Submit → tunggu review (hari-minggu)

### Setelah Approved

- [ ] Quota naik dari 100 ke limit lebih tinggi (cek di Cloud Console)
- [ ] Video bisa dijadwalkan dengan `status.privacyStatus=private` + `status.publishAt`

---

## 🔴 GOOGLE BUSINESS PROFILE

### Persyaratan Wajib

- [ ] Punya GBP yang sudah aktif ≥60 hari
- [ ] Domain website match dengan email owner GBP
- [ ] Website bisnis tersambung di GBP

### Submit Basic Access (Minggu 1-2)

- [ ] Buka `support.google.com/business/contact/api_default`
- [ ] Pilih: "Application for Basic API Access"
- [ ] Isi:
  - [ ] Project Number (Google Cloud)
  - [ ] Email owner/manager GBP
  - [ ] App description
- [ ] Submit → tunggu approval (beberapa hari-minggu)
- [ ] Indikator sukses: quota berubah 0 QPM → 300 QPM di Cloud Console

---

## 📝 Tracking Progress

Isi tabel ini setelah setiap platform selesai:

| Platform | Submission Date | Status | Approved Date | Notes |
|---|---|---|---|---|
| Bluesky | — | ✅ Done | — | Tidak perlu review |
| Pinterest Trial | | | | |
| Pinterest Standard | | | | |
| LinkedIn Share | | | | |
| LinkedIn Community Mgmt | | | | |
| Meta Facebook Pages | | | | |
| Meta Instagram | | | | |
| Meta Threads | | | | |
| TikTok | | | | |
| YouTube | | | | |
| Google Business | | | | |

---

## ⚠️ Troubleshooting Umum

| Masalah | Solusi |
|---|---|
| Meta App Review ditolak | Perbaiki video demo, pastikan menampilkan alur lengkap OAuth → fitur |
| TikTok domain verification gagal | Pastikan DNS TXT record propagasi (>24 jam) dan bucket R2 public |
| YouTube quota 0 QPM | Submit form Basic Access dulu sebelum bisa pakai API |
| LinkedIn Community Mgmt ditolak | Pastikan use case komersial, bukan social listening |
| Permission Meta revoke | Scope tidak dipakai 90 hari → aktifkan ulang dengan test user |
| Pinterest Standard ditolak | Video demo harus tampilkan OAuth consent screen, bukan cuma API call |

---

## 📞 Kontak Developer Support

| Platform | Link |
|---|---|
| Meta | `developers.facebook.com/help` |
| TikTok | `developers.tiktok.com/support` |
| YouTube | `support.google.com/youtube/contact/yt_api_form` |
| Pinterest | `developers.pinterest.com/help` |
| LinkedIn | `developer.linkedin.com/docs` |
| Google Business | `support.google.com/business/contact/api_default` |

---

*Dokumen ini dibuat untuk Sahabat Kreator. Update setiap ada perubahan kebijakan platform.*
