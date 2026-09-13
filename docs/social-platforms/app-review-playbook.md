# Playbook Pengajuan Akses API — Semua Platform

> Strategi pengajuan akses untuk produksi Sahabat Kreator. Per 9 Sep 2026.
> Timeline review berubah cepat — validasi ulang sebelum submit.

## Urutan Prioritas (kritikal path terpanjang dulu)

| # | Platform | Estimasi | Catatan |
|---|---|---|---|
| 1 | **LinkedIn Community Mgmt API** | 3–6 bulan total | Development tier 4–8 minggu → Standard. Jika ditolak harus buat app baru. Mulai SEKARANG. |
| 2 | **Meta App Review** (FB+IG+Threads) | 1–20 hari per submission | Per permission, per kategori. Resubmission reset antrian. Business Verification dulu. |
| 3 | **TikTok Content Posting API** | 2–6 minggu | Sandbox dulu (tanpa review), lalu form Apply di dev console |
| 4 | **YouTube Compliance Audit** | Hari–minggu | Syarat ketat demo video; project unaudited = video dipaksa private |
| 5 | **Google Business Basic Access** | Hari–minggu | Butuh GBP aktif 60+ hari — klaim/verifikasi GBP sekarang |
| 6 | **Pinterest Standard** | Hari kerja | Trial instan dulu; upgrade dengan video demo saat siap |
| 7 | **Bluesky** | — | Tidak ada review. Implementasi kapan saja |

## Aset yang Harus Disiapkan (berlaku lintas platform)

1. **Privacy Policy URL** (HTTPS, publik) — harus spesifik per platform:
   menyebut data yang dikumpulkan, retensi, hak hapus, data deletion callback
2. **Terms of Service URL**
3. **Data Deletion mechanism** (URL callback + in-app flow) — Meta wajib, lainnya best practice.
   SUDAH TERIMPLEMENTASI: `/webhooks/{meta|instagram-standalone|threads}/data-deletion`
   (verify `signed_request` HMAC-SHA256 → hapus engagement/DM end-user → audit log
   `platform_data_deletion` → balas `{url, confirmation_code}`).
   Daftarkan di App Dashboard masing-masing: Settings → Advanced → Data Deletion
   Request Callback URL. Status URL end-user: `WEB_URL/penghapusan-data/status?code=...`
4. **Video demo/screencast** per platform:
   - Resolusi 1080p+, **UI bahasa Inggris** (atau caption), tanpa audio
   - Tampilkan alur lengkap: login → OAuth consent → grant permission →
     penggunaan nyata fitur terkait permission di app
   - Gunakan mouse (bukan keyboard), cursor besar
   - 1 screencast per permission — deskripsi usage unik (jangan copy-paste)
5. **Landing page / app production-ready** — reviewer harus bisa akses
   (staging publik atau akun demo dengan test credentials)
6. **Business Verification** (Meta) — dokumen legal badan usaha
7. **Dokumen legal organisasi** (LinkedIn Community Mgmt) — email bisnis terverifikasi,
   nama legal, alamat, website, super admin Page

## Timeline Buffer untuk Rilis

- Rencanakan **3–6 minggu buffer** untuk pipeline rilis tergantung platform
- Setiap rejection = reset antrian dari nol → submit berkualitas > submit cepat
- Permission tidak dipakai 90 hari (Meta) → user harus re-grant;
  **Data Use Checkup tahunan** wajib pasca-approval

## Penyebab Penolakan Paling Umum (antisipasi)

| Penyebab | Platform |
|---|---|
| Over-scoping (minta permission yang tidak dipakai) | Semua |
| Screencast tidak menampilkan alur lengkap / tidak match deskripsi usage | Meta, LinkedIn, Pinterest |
| Privacy policy generik / tanpa data deletion / URL 404 | Meta, TikTok, Pinterest |
| Tidak ada API call sukses per permission dalam 30 hari sebelum submit | Meta |
| Terlalu banyak permission dalam satu submission | Meta |
| App tidak bisa diakses reviewer | Semua |
| Deskripsi app vague / use case "personal utility" | TikTok, Pinterest |
| Integrasi belum live (cuma wireframe) | Pinterest |
| Social listening / competitor monitoring | LinkedIn (restricted) |

## Status "Unaudited" — Batasan Selama Menunggu

- **TikTok:** semua post dipaksa PRIVATE (SELF_ONLY); sandbox bisa test penuh
- **YouTube:** semua video project unaudited dipaksa private; `publishAt` tidak berfungsi
- **Pinterest Trial:** Pin/Board = sandbox entities (hanya terlihat pembuatnya);
  1.000 req/hari
- **Meta Standard Access:** hanya user dengan role di app/Business yang bisa login
- **GBP:** semua call 403 (0 QPM) sebelum Basic Access

Strategi: gunakan periode ini untuk E2E test di staging dengan akun internal/tester.

## Least-Privilege Scope per Platform (set awal)

| Platform | Scope awal |
|---|---|
| Facebook | `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `publish_video` |
| Instagram standalone | `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_comments`, `instagram_business_manage_messages` |
| TikTok | `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.upload`, `video.publish` |
| YouTube | `youtube.upload` (+ `youtube.force-ssl` hanya jika fitur playlist) |
| Pinterest | `boards:read`, `boards:write`, `pins:read`, `pins:write`, `user_accounts:read` |
| LinkedIn | `openid`, `profile`, `email`, `w_member_social` (+ CM API untuk page) |
| Threads | `threads_basic`, `threads_content_publish`, `threads_manage_replies`, `threads_manage_insights` |
| Bluesky | `atproto` (OAuth) atau app password |
| GBP | `business.manage` |

Tambah scope lanjutan (search, insights granular, engagement) di submission
berikutnya setelah fitur terkait ada di produk.

## Kebijakan Konten Lintas Platform (2025–2026)

1. **AI content labeling**: TikTok `is_aigc`, YouTube `status.containsSyntheticMedia`,
   IG `is_ai_generated` — siapkan toggle di komposer
2. **TikTok Originality (Sep 2025):** watermark platform lain didemote →
   fitur cross-posting perlu re-render tanpa watermark per platform
3. **DM 24-hour window** (Meta messaging): customer harus mulai percakapan
4. **GIF**: Threads hanya GIPHY (Tenor sunset Mar 2026)
5. **Paid partnership label**: TikTok `brand_content_toggle`, IG `is_paid_partnership`,
   Threads branded content

## Env Variables yang Akan Dibutuhkan (single source of truth di root)

```
# Meta (satu app multi-use-case)
META_APP_ID=, META_APP_SECRET=,
THREADS_APP_ID=, THREADS_APP_SECRET=,   # terpisah di dashboard Threads Use Case
META_GRAPH_VERSION=v26.0,

# TikTok
TIKTOK_CLIENT_KEY=, TIKTOK_CLIENT_SECRET=,

# Google (YouTube + GBP)
GOOGLE_CLIENT_ID=, GOOGLE_CLIENT_SECRET=,

# Pinterest
PINTEREST_APP_ID=, PINTEREST_APP_SECRET=,

# LinkedIn
LINKEDIN_CLIENT_ID=, LINKEDIN_CLIENT_SECRET=, LINKEDIN_API_VERSION=202608,

# Bluesky
BLUESKY_PDS_URL=https://bsky.social,
```

(Catatatan: nilai final disesuaikan saat implementasi packages/env — daftar ini
acuan kebutuhan, bukan final.)
