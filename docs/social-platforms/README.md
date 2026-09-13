# Ringkasan Integrasi Social Platform — Sahabat Kreator

> Riset dokumentasi resmi per **9 September 2026**. Dokumen ini adalah index;
> detail tiap platform ada di file masing-masing. Angka rate limit & versi API
> berubah cepat — validasi ulang sebelum submit pengajuan akses.

## Matriks Platform

| Platform | API | Versi / Base URL | Auth | Rate Limit Publish | Native Scheduling | App Review |
|---|---|---|---|---|---|---|
| Facebook Pages | Graph API | `v26.0` (29 Jul 2026) → `graph.facebook.com` | OAuth, Page token tanpa expiry | BUC `4800×engaged_users`/24j | ✅ `scheduled_publish_time` (10 mnt–30 hr) | Advanced Access + Business Verification (~1–20 hari/submission) |
| Instagram (standalone) | IG API w/ IG Login | `v26.0` → `graph.instagram.com` | OAuth, long-lived 60 hari (refresh) | 100 post/24j (enforce 50 aman) | ❌ build sendiri | Advanced Access per permission |
| Instagram (via FB Login) | IG API w/ FB Login | `v26.0` → `graph.facebook.com` | FB Page token | sama | ❌ | Advanced Access per permission + feature `Instagram Public Content Access` (hashtag search, 30 hashtag/7 hari) |
| TikTok | Content Posting API v2 | `open.tiktokapis.com` | OAuth, AT 24 jam / RT 365 hari | 6 init/mnt + ~15–25 post/hari (shared antar app) | ❌ | Form "Apply" di dev console (2–6 minggu) |
| YouTube | Data API v3 | `googleapis.com/youtube/v3` | Google OAuth, refresh token | ~100 upload/hari + 10.000 unit/hari pool | ✅ `publishAt` (privacy=private) | API Compliance Audit (wajib, video >28 Jul 2020 dipaksa private) |
| Pinterest | API v5 (5.28) | `api.pinterest.com/v5` | OAuth, AT 30 hari + RT 60 hari ROTATING | Trial 300/hr app; Standard 100/mnt/user | ❌ | Trial (instan) → Standard (video demo) |
| LinkedIn | Posts API (versioned) | `api.linkedin.com/rest` + header `LinkedIn-Version` | OAuth, AT 60 hari | Share: 150/hr/member | ❌ | Personal instan; Page perlu Community Mgmt API (minggu–bulan) |
| Threads | Threads API | `graph.threads.net/v1.0` | OAuth khusus Threads, 60 hari refresh | 250 post/24j | ❌ | App Review per permission |
| Bluesky | AT Protocol | `bsky.social/xrpc` | App Password / atproto OAuth | 5.000 poin/jam (±1.666 post) | ❌ | **Tidak ada** |
| Google Business | Local Posts API | `mybusiness.googleapis.com/v4` | Google OAuth `business.manage` | 300 QPM | ❌ | Basic Access form (GBP 60+ hari aktif) |

## Temuan Krusial untuk Arsitektur

1. **Media wajib URL publik** (Meta: FB/IG/Threads) — selaras dengan R2 Cloudflare
   (bucket/CDN publik; izinkan user-agent `facebookexternalhit`).
2. **TikTok PULL_FROM_URL butuh domain terverifikasi** (DNS TXT) di dev console.
3. **Tidak ada scheduling native** di IG/TikTok/Pinterest/LinkedIn/Threads/Bluesky/GBP
   → scheduler Sahabat Kreator adalah core value; hanya FB & YouTube punya native.
4. **Token housekeeping berbeda per platform:**
   - FB Page token: tanpa expiry, tapi mati saat user kehilangan role → health check `debug_token`
   - IG standalone / Threads: refresh tiap <60 hari atau mati permanen
   - TikTok: AT 24 jam, refresh rutin + **rotating refresh token** (simpan token baru)
   - Pinterest: **rotating refresh token** 60 hari → wajib persist di DB
   - LinkedIn: AT 60 hari, refresh programatik terbatas → siapkan flow re-auth
   - Google: AT 1 jam via refresh token
   - Bluesky: persist session (bukan login berulang — `createSession` 300/hari)
5. **Pola publish 3 arsitektur:**
   - 2-step container: Instagram, Threads (create container → poll status → publish)
   - Init + chunked upload + poll/webhook: TikTok, YouTube (resumable), LinkedIn (ETag), Pinterest video (S3), Bluesky (blob + video job)
   - 1-call: Facebook (feed/photos), LinkedIn text, GBP localPosts
6. **App unaudited = konten dipaksa private** (TikTok & YouTube) — pengajuan audit
   adalah kritikal path; mulai pengajuan sejak dini.
7. **AI content labeling** sudah mandatory di beberapa platform:
   TikTok `is_aigc`, YouTube `status.containsSyntheticMedia`, FB Page Reels
   `is_ai_generated` (TIDAK ada di endpoint IG `/media` — verifikasi ulang saat
   implementasi; IG sering menambahkan parameter tanpa dokumentasi lengkap).
8. **Originality policy TikTok (Sep 2025):** konten watermark platform lain didemote —
   cross-posting perlu re-render/watermark removal per platform.
9. **Token semua platform wajib disimpan terenkripsi** (schema `social_account.accessToken`
   via `encryptToken`) — sudah selaras dengan desain schema existing.

## Urutan Rekomendasi Pengajuan Akses (kritikal path terpanjang dulu)

| Prioritas | Platform | Alasan |
|---|---|---|
| 1 | LinkedIn (Community Mgmt) | Review bisa 3–6 bulan; mulai dari Development tier |
| 2 | Meta App Review (FB+IG+Threads) | Hingga 20 hari per submission, per permission |
| 3 | TikTok Content Posting API | 2–6 minggu; mulai dari sandbox |
| 4 | YouTube Compliance Audit | Hari–minggu; tapi syarat ketat demo video |
| 5 | Google Business Basic Access | Butuh GBP aktif 60+ hari — daftar sekarang |
| 6 | Pinterest Standard | Trial dulu (instan), upgrade saat siap |
| 7 | Bluesky | Tidak ada review — implementasi kapan saja |

## Isi Folder

- `meta-facebook.md` — Facebook Pages API
- `meta-instagram.md` — Instagram (2 mode) + Messaging API
- `tiktok.md` — Content Posting API v2 + Display API
- `youtube.md` — Data API v3 + quota system
- `pinterest.md` — API v5
- `linkedin.md` — Posts API versioned
- `threads.md` — Threads API
- `bluesky.md` — AT Protocol
- `google-business.md` — Local Posts + Performance API
- `app-review-playbook.md` — strategi pengajuan akses semua platform

> Laporan status kesiapan audit menyeluruh (13 Sep 2026): `../api-access-readiness.md`.
> Checklist operasional pengajuan: `../app-review-checklist.md`.

---

## Webhook Callback URLs per Platform

Webhook diterima di endpoint `/webhooks/:platform` (di luar prefix `/api` — sesuai implementasi `apps/server/src/index.ts:122-125`). Konfigurasi di developer console masing-masing platform:

| Platform | Callback URL | Format Payload | Verifikasi |
|---|---|---|---|
| Facebook | `https://app.sahabatkreator.com/webhooks/meta` | Meta standard (`entry[]`) | `hub.verify_token` (GET) + `X-Hub-Signature-256` (POST) |
| Instagram (FB Login) | `https://app.sahabatkreator.com/webhooks/meta` | Meta standard | Sama seperti Facebook |
| Instagram (Standalone) | `https://app.sahabatkreator.com/webhooks/instagram-standalone` | Meta standard | Verify token `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` + signature `INSTAGRAM_APP_SECRET` (app terpisah) |
| Threads | `https://app.sahabatkreator.com/webhooks/threads` | Threads format (`topic`, `values.value`) | `THREADS_WEBHOOK_VERIFY_TOKEN` + signature `THREADS_APP_SECRET` |
| TikTok | `https://app.sahabatkreator.com/webhooks/tiktok` | JSON `type` field | `X-Signature` (sha256 body + client secret) + timestamp anti-replay |
| YouTube | — | Tidak ada webhook (status via polling) | — |
| Pinterest | — | Tidak ada webhook (status via polling `GET /v5/pins/{id}`) | — |
| LinkedIn | — | Tidak ada webhook (status via polling) | — |
| Google Business | — | Tidak ada webhook (status via polling) | — |
| Bluesky | — | Tidak ada webhook (polling status via API) | — |

### Catatan Penting

1. **Meta (FB/IG/Threads)**: Endpoint harus merespons 2xx dalam 20 detik. Pemrosesan aktual dilakukan worker via tabel `webhook_event`.
2. **TikTok**: Webhook `post.publish.complete` memberikan status final. Worker polling `status/fetch/` sebagai fallback.
3. **Data Deletion**: Callback penghapusan data end-user (syarat App Review) — 3 endpoint terpisah per aplikasi: `/webhooks/meta/data-deletion`, `/webhooks/instagram-standalone/data-deletion`, `/webhooks/threads/data-deletion`. Diverifikasi via `signed_request` (HMAC-SHA256 app secret masing-masing), balas `{url, confirmation_code}`. Implementasi: `apps/server/src/routes/data-deletion.ts`. Status URL publik: `WEB_URL/penghapusan-data/status?code=...`.
4. **Versi API**: Gunakan `META_GRAPH_VERSION` dari env (default `v26.0`) untuk semua callback URL Meta.

## Addendum Riset Lanjutan (9 Sep 2026)

1. **Graph API v26.0 dirilis 29 Juli 2026** — pakai v26.0 untuk integrasi baru.
   Breaking: protokol legacy dihapus (`pretty`, `debug`, `date_format`,
   `GET /?ids=`, ETag/304); tidak ada perubahan pada publishing organik.
2. **Instagram hashtag search masih aktif** — tapi HANYA via Facebook Login
   (feature `Instagram Public Content Access`, 30 hashtag unik/7 hari/akun).
   Tidak tersedia di mode standalone. Alternatif lebih longgar di Threads:
   `threads_keyword_search` (2.200 query/24 jam, `search_mode=TAG`).
3. **Pinterest sandbox** — trial access otomatis dapat sandbox
   (`api-sandbox.pinterest.com`, token 30 hari semua scope). Screencast
   pengajuan Standard boleh direkam di sandbox, asalkan OAuth flow lengkap
   tampil di video (kasus komunitas: video tanpa OAuth consent ditolak).
4. **Kolaborator IG tetap max 3** (dokumentasi Jun 2026 — verifikasi langsung).
