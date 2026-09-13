# Laporan Kesiapan Pengajuan Akses API — Sahabat Kreator

> Audit menyeluruh infrastruktur integrasi social media: inventaris platform, kelengkapan
> dokumen formal, keamanan & penanganan data, rate limit & otentikasi, serta status
> readiness per platform. Update terakhir: **13 September 2026**.
>
> Dokumen pendamping:
> - `docs/app-review-checklist.md` — langkah operasional pengajuan per platform
> - `docs/social-platforms/README.md` — matriks teknis & webhook URL
> - `docs/social-platforms/app-review-playbook.md` — strategi pengajuan

---

## 1. Ringkasan Eksekutif

- **10 platform terintegrasi** (9 OAuth + Bluesky app password). X/Twitter dan WhatsApp tidak didukung.
- **Sisi kode/koneksi: siap** — OAuth flow + least-privilege scope, webhook per aplikasi dengan signature verification fail-closed, data deletion callback (keluarga Meta), rate limit berlapis, token refresh otomatis.
- **Sisa pekerjaan dominan non-kode**: screencast, akun demo reviewer, business verification, dokumen legal badan usaha, verifikasi domain (TikTok), isi env credentials.
- **Urutan mulai**: LinkedIn (3-6 bulan, paling lambat) → Meta → TikTok → YouTube → GBP (klaim sekarang, butuh aktif 60+ hari) → Pinterest → Bluesky (tanpa review).

---

## 2. Matriks Platform & Persyaratan Formal

| # | Platform | Aplikasi/Console | Persyaratan Formal Utama | Timeline Review |
|---|---|---|---|---|
| 1 | Instagram bisnis (via FB Login) | Meta App | Advanced Access per permission (max 2-3/submission), Business Verification, mode Live ≥7 hari, screencast per permission, Data Use Checkup tahunan | 1-20 hari/submission |
| 2 | Instagram standalone (IG Login) | App terpisah (`INSTAGRAM_APP_ID`) | Sama seperti Meta; app secret & webhook sendiri | 1-20 hari |
| 3 | Facebook Pages | Meta App (shared dengan #1) | Sama seperti #1 | 1-20 hari |
| 4 | Threads | developers.threads.net | App published, screencast per permission, Tech Provider/Business Verification untuk tool komersial | Mingguan |
| 5 | TikTok | TikTok Developer Console | Sandbox dulu, domain terverifikasi DNS TXT (untuk PULL_FROM_URL), video demo 2-3 mnt, use case audiens luas | 2-6 minggu |
| 6 | YouTube | Google Cloud + Compliance Audit | API Compliance Audit wajib (`yt_api_form`), OAuth verification scope sensitif, quota extension form terpisah | Hari-minggu |
| 7 | Pinterest | Pinterest Developer | Akun BUSINESS + verifikasi email, privacy policy live, Trial→Standard (screencast wajib tampilkan OAuth flow lengkap) | Trial instan; Standard 1-4 minggu |
| 8 | LinkedIn | LinkedIn Developer | Organisasi legal + email bisnis terverifikasi + super admin Page; Development→Standard tier; jika ditolak harus buat app baru | **3-6 bulan** |
| 9 | Google Business Profile | Google Cloud | GBP terverifikasi **aktif 60+ hari**, website bisnis match domain, isi Project Number (bukan ID) | Hari-minggu |
| 10 | Bluesky | — | **Tanpa review sama sekali** — cukup app password | — |

### Konfigurasi OAuth per platform (implementasi)

Semua platform OAuth memakai authorization code + state (TTL 10 menit, sekali pakai, bind user+org).
Callback path: `{SERVER_URL}/api/oauth/{platform}/callback`.

| Platform | Scope yang Diminta | Refresh Token |
|---|---|---|
| instagram (FB Login) | `pages_show_list, pages_manage_posts, pages_read_engagement, publish_video, instagram_basic, instagram_content_publish, instagram_manage_comments, instagram_manage_messages, instagram_manage_insights` | Page token long-lived tanpa expiry |
| instagram_standalone | `instagram_business_basic, instagram_business_content_publish, instagram_business_manage_comments, instagram_business_manage_messages, instagram_business_manage_insights` | Ya (60 hari) |
| facebook | `pages_show_list, pages_manage_posts, pages_read_engagement, publish_video, pages_manage_engagement` | Page token tanpa expiry |
| threads | `threads_basic, threads_content_publish, threads_manage_replies, threads_read_replies, threads_manage_insights` | Ya (60 hari) |
| tiktok | `user.info.basic, user.info.profile, user.info.stats, video.upload, video.publish, video.list, comment.list, comment.list.manage` | Ya (AT 24 jam; **RT rotating** dipersist) |
| youtube | `youtube.upload, youtube.force-ssl, userinfo.profile` (+ `access_type=offline`) | Ya (RT offline) |
| google_business | `business.manage, userinfo.profile` | Ya (RT offline, client shared YouTube) |
| pinterest | `boards:read, boards:write, pins:read, pins:write, user_accounts:read` (Basic auth exchange) | Ya (AT 30 hari; **RT rotating 60 hari** dipersist) |
| linkedin | `openid, profile, email, w_member_social` | Ya (AT 60 hari) |
| bluesky | App password (`app_password`) — atproto OAuth (PKCE+PAR+DPoP) menyusul | — |

Referensi kode: `packages/publishing/src/oauth.ts`, `apps/server/src/routes/oauth.ts`,
`packages/publishing/src/token-refresh.ts`.

---

## 3. Kelengkapan Dokumen & Data Pendukung

### Sudah ada (terverifikasi kode)

| Kebutuhan | Status | Lokasi |
|---|---|---|
| Privacy Policy spesifik per platform (data end-user, retensi, enkripsi, sub-processor) | ✓ | `apps/web/src/pages/marketing/legal.tsx` — `/kebijakan-privasi` |
| Terms of Service, Cookie Policy, Refund Policy | ✓ | `legal.tsx` — semua publik tanpa login |
| Data Deletion instructions + jalur end-user platform | ✓ | `legal.tsx` — `/penghapusan-data` |
| Data Deletion callback (keluarga Meta) + audit trail + status URL publik | ✓ | `apps/server/src/routes/data-deletion.ts` — 3 endpoint per aplikasi |
| Landing, pricing, blog, kontak, FAQ, changelog, compare | ✓ | `apps/web/src/pages/marketing/` |
| Admin: form credentials 10 platform (secret terenkripsi) + callback/webhook/deletion URL siap-copy | ✓ | `apps/web/src/pages/admin/credentials.tsx` |
| Tracking pengajuan: status flow, checklist 7 item, permissionScope terpisah, riwayat, deadline | ✓ | `apps/server/src/routes/admin-api-access.ts` |
| Test diagnostik koneksi: Meta family + TikTok | ✓ | `apps/server/src/routes/admin-api-tests.ts` |
| Docs requirements 11 platform + playbook + skrip video demo | ✓ | `docs/social-platforms/`, `docs/video-demo-scripts/` |

### Belum ada (aset manual, di luar kode)

1. **Screencast per permission** — checkbox saja; tidak ada penyimpanan URL video. Wajib 1080p+, UI Inggris, 1 video per permission dengan deskripsi usage unik.
2. **Akun demo/staging untuk reviewer** — checkbox saja; belum dikelola. Disyaratkan Meta, LinkedIn, YouTube, GBP.
3. **Business Verification Meta** — KTP/paspor owner + dokumen bisnis via Business Manager (3-14 hari).
4. **Dokumen legal LinkedIn** — nama legal, alamat, NPWP/akta, email bisnis terverifikasi, super admin Page.
5. **Env credentials semua platform kosong** — isi via `.env` atau admin credentials page.
6. **GBP aktif 60+ hari** — klaim & verifikasi SEKARANG (kritikal path kedua terpanjang).
7. **Domain verifikasi TikTok DNS TXT** — untuk PULL_FROM_URL dari R2/CDN.
8. **Git repository belum di-init** — produksi tanpa version control; init + commit baseline sebelum deploy.
9. **sitemap.xml & robots.txt** — belum ada (Google/Pinterest umumnya mengecek; SEO blog juga butuh).

---

## 4. Keamanan & Penanganan Data

| Area | Status | Catatan |
|---|---|---|
| Enkripsi at-rest AES-256-GCM (versioned `v1`, key 32-byte env) | ✓ | Token, app secret, app password, page token pending, VAPID key |
| Webhook signature fail-closed (HMAC timing-safe) | ✓ | Meta/IG/Threads `X-Hub-Signature-256`; IG standalone secret terpisah tanpa fallback; TikTok sha256(body+secret) + timestamp replay ±5 mnt |
| Data deletion callback `signed_request` | ✓ | Verifikasi HMAC + `algorithm` check; penghapusan engagement/DM end-user lintas org; audit `platform_data_deletion`; confirmation code `SK-DEL-*` + status URL publik noindex |
| better-auth: organization, admin, 2FA email, verifikasi email wajib | ✓ | Session 7 hari + refresh 24 jam; rate limit 20/60 dtk; impersonation admin 1 jam |
| Security headers, CORS allowlist, rate limit API 100/60 dtk | ✓ | `apps/server/src/index.ts` |
| Export data (JSON) + hapus akun permanen + audit log admin | ✓ | Token tidak pernah dikirim ke client; hapus akun = konfirmasi ketik `HAPUS` + cleanup R2 |
| Upload media: whitelist MIME, magic bytes, tolak SVG, SSRF guard, batas 100 MB | ✓ | `apps/server/src/routes/media.ts`, `apps/server/src/lib/ssrf.ts` |
| R2: cleanup saat hapus media/akun, presigned URL tersedia | ✓ | Bucket publik — disengaja agar platform bisa fetch media URL saat publish (syarat Meta/TikTok PULL_FROM_URL) |
| Konsistensi kebijakan hapus akun vs implementasi | ✓ **Direkonsiliasi 13 Sep 2026** | Teks legal dulu menjanjikan "masa tunggu 30 hari" padahal kode hapus permanen seketika — teks legal + toast sudah diselaraskan ke implementasi aktual |
| Request body size limit global | ✗ | Endpoint JSON belum dibatasi (upload sudah manual 100 MB). Rencana: `hono/body-limit` |
| Replay protection TikTok | Sebagian | Timestamp dari header tidak ikut ditandatangani; mitigasi upsert idempotent sudah ada |
| Kebocoran secret | ✓ Aman | Tidak ada hard-coded credential; `.gitignore` lengkap; `.env.example` hanya placeholder. Repo belum jadi git repository — tidak ada riwayat commit, tapi init segera + jangan commit `.env`/`origin.key` |

---

## 5. Rate Limit, Otentikasi & Alur Integrasi

### Pertahanan berlapis (semua terverifikasi)

1. **Pre-publish check internal** per social account — `enforceDailyLimit` (`packages/publishing/src/pipeline.ts`): instagram/instagram_standalone/facebook/linkedin 50, threads 250, tiktok 15, youtube 50, pinterest 100, bluesky 200, google_business 100 per 24 jam (semua di bawah limit resmi platform).
2. **Rate limiter BullMQ per platform** (`packages/queue/src/connection.ts`): TikTok 1 job/12 dtk (init 6/mnt), Meta family/LinkedIn/GBP 1 job/3 dtk, YouTube/Pinterest 1 job/5 dtk, Bluesky 1 job/2 dtk.
3. **Retry 429/5xx + Retry-After + exponential backoff** di semua adapter (`packages/publishing/src/http.ts`); YouTube chunked upload retry per-chunk max 10 attempt; TikTok `rate_limit_exceeded` retryable.
4. **Token refresh otomatis tiap jam** untuk 9 platform OAuth (`apps/worker/src/index.ts` + `token-refresh.ts`), window 2 hari sebelum expiry, rotasi RT dipersist, akun expired ditandai `needsReconnect`.
5. **Quota snapshot dari header respons nyata** (`packages/publishing/src/quota.ts`): Meta BUC (`X-Business-Use-Case-Usage`), LinkedIn/Pinterest (`X-RateLimit-*`), upsert idempotent per hari.
6. **Rate limit aplikasi sendiri**: 100 req/60 dtk global, 10/60 dtk AI, banner 429 di UI.

### Gap rate limit (tidak memblokir pengajuan — jadwalkan iterasi berikut)

1. Snapshot kuota yang direkam tidak dipakai untuk pre-publish check (write-only) — anggaran BUC 0 tidak mencegah publish.
2. 4 platform tanpa quota hook: TikTok, YouTube, GBP (memang minim header) + **Bluesky** (parser sudah mendukung header-nya, tinggal pasang `onResponse: quotaHook`).
3. Quota hook tidak konsisten: FB photo post & Pinterest pin video final tanpa hook.
4. `enforceDailyLimit` berbasis `updatedAt` bukan `publishedAt`.
5. YouTube 403 `quotaExceeded` tidak dibedakan dari policy violation.
6. `META_BUC_TOTAL = 200` hard-coded (asumsi Tier B statis).
7. Mode fallback tanpa Redis kehilangan limiter per platform + retry backoff.

### Catatan integrasi

- **PKCE tidak dipakai** — benar untuk semua platform saat ini (server-side confidential client); wajib nanti untuk Bluesky atproto OAuth.
- **`LINKEDIN_EXTRA_SCOPES` dead env** — didefinisikan tapi tidak tersambung ke flow (`cred.extra` tidak pernah diisi). Perlu wiring via `platform_credential.extraConfigEnc` jika ingin posting sebagai company Page.
- **Test diagnostik baru 5 platform** (Meta family + TikTok) — YouTube/LinkedIn/Pinterest/GBP belum punya suite.

---

## 6. Status Readiness per Platform

### Siap diajukan (sisa pekerjaan non-kode saja)

| Platform | Sisa pekerjaan |
|---|---|
| **Bluesky** | Tidak ada — set `BLUESKY_PDS_URL`, deploy, selesai |
| **Instagram bisnis + Facebook + Threads** (1 Meta App) | Akun developer → business verification → credentials → mode Live 7 hari → screencast 3 video → submit per permission |
| **Instagram standalone** (app terpisah) | Sama seperti di atas dengan app IG Login sendiri |
| **Pinterest** | Akun business → Trial access (instan) → credentials → screencast OAuth flow → Standard |
| **TikTok** | Akun developer → sandbox E2E → verifikasi domain DNS TXT → video demo → Apply (2-6 minggu) |

### Perlu pembenahan dulu

| Platform | Bloker | Solusi |
|---|---|---|
| **LinkedIn** (mulai SEGERA — 3-6 bulan) | Tidak ada suite diagnostik + `LINKEDIN_EXTRA_SCOPES` dead | Tambah suite diagnostik LinkedIn; wiring extraScopes |
| **YouTube** | Tidak ada suite diagnostik Google | Tambah suite (validasi token + refresh via tokeninfo) |
| **GBP** | Bloker absolut: GBP harus aktif 60+ hari | Klaim & verifikasi GBP hari ini; sisanya menunggu |
| **Bluesky OAuth penuh** | Masih app password | Cukup untuk mulai; atproto (PKCE+PAR+DPoP) menyusul |

---

## 7. Rencana Eksekusi

| Tahap | Aksi |
|---|---|
| Hari ini | Init git repository + commit baseline; klaim & verifikasi GBP (mulai hitungan 60 hari) |
| Minggu ini | Buat akun developer semua platform; isi env + credentials via admin; jalankan test diagnostik; deploy production |
| Paralel | Mulai pengajuan LinkedIn (paling lambat); buat suite diagnostik YouTube/LinkedIn; wiring `LINKEDIN_EXTRA_SCOPES`; tambah `body-limit`; sitemap.xml + robots.txt |
| Setelah verifikasi bisnis | Meta: mode Live 7 hari → screencast → submit per permission (max 2-3) |
| Setelah sandbox | TikTok: E2E test → verifikasi domain → video demo → Apply |
| Menyusul | YouTube compliance audit; Pinterest Trial→Standard; GBP Basic Access saat umur 60 hari terpenuhi |

---

## Changelog

- **13 Sep 2026** — Audit pertama. Rekonsiliasi teks legal hapus akun; koreksi URL salah faktual di docs (webhook & data-deletion); laporan ini dibuat.
