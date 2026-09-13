# TikTok — Content Posting API v2 + Display API

> Riset per 9 Sep 2026. Docs: developers.tiktok.com/doc/content-posting-api-get-started

## Endpoint Penting

| Endpoint | URL | Scope |
|---|---|---|
| Query Creator Info | `POST https://open.tiktokapis.com/v2/post/publish/creator_info/query/` | video.publish |
| Direct Post (video) | `POST https://open.tiktokapis.com/v2/post/publish/video/init/` | video.publish |
| Inbox Upload (draft) | `POST https://open.tiktokapis.com/v2/post/publish/inbox/video/init/` | video.upload |
| Photo/Carousel post | `POST https://open.tiktokapis.com/v2/post/publish/content/init/` | video.publish / video.upload |
| Cek status post | `POST https://open.tiktokapis.com/v2/post/publish/status/fetch/` | video.upload / video.publish |
| Upload file | `{upload_url}` dari response (domain `open-upload.tiktokapis.com`) | PUT chunked |
| OAuth authorize | `https://www.tiktok.com/v2/auth/authorize/` | — |
| OAuth token | `POST https://open.tiktokapis.com/v2/oauth/token/` | — |
| User info | `GET https://open.tiktokapis.com/v2/user/info/` | user.info.basic/.profile/.stats |

## OAuth Flow (Login Kit v2)

- OAuth 2.0 Authorization Code Grant; **PKCE wajib untuk mobile/desktop**
- **Access token: 24 jam. Refresh token: 365 hari** → background refresh job wajib
- Refresh token bisa **rotasi** (response bisa berisi RT baru) — selalu simpan token baru
- Semua token disimpan server-side. Revoke: `/v2/oauth/revoke/`

## Direct Post vs Inbox Upload

| Aspek | Direct Post | Inbox Upload (MEDIA_UPLOAD) |
|---|---|---|
| Scope | `video.publish` | `video.upload` |
| Hasil | Langsung tayang di feed | Masuk inbox/draft, user edit & publish manual di app TikTok |
| Privacy level | Wajib (harus cocok `privacy_level_options` dari creator_info) | Tidak perlu |
| Audit | App unaudited dipaksa PRIVATE (SELF_ONLY) | Sama |

**Alur Direct Post:**
1. `creator_info/query/` → `privacy_level_options`, `max_video_post_duration_sec`, dsb
2. `video/init/` → `publish_id` + `upload_url` (**upload_url hanya berlaku 1 jam**)
3. PUT chunked ke `upload_url`
4. Polling `status/fetch/` (atau webhook) sampai `PUBLISH_COMPLETE`
5. Post publik lewat moderasi TikTok — `post_id` hanya diberikan setelah lolos moderasi

## Scope

`user.info.basic`, `user.info.profile`, `user.info.stats`,
`video.upload` (draft), `video.publish` (direct post), `video.list` (read-only).

## Limitasi Media

**Video:**
- Format: MP4 (rekomendasi), WebM, MOV; codec H.264 (rekomendasi), H.265, VP8/VP9
- Framerate 23–60 FPS; resolusi 360–4096px; durasi max **10 menit via API**
- Ukuran max **4 GB**
- Chunk: min 5 MB, max 64 MB (chunk terakhir sampai 128 MB), max 1000 chunk, sekuensial
- Caption max **2200 karakter UTF-16**; # dan @ auto-parse

**Foto (photo post/carousel — fitur BARU):**
- WebP/JPEG; max 1080p; max 20 MB/foto; **max 35 foto** per post via `PULL_FROM_URL` saja
- Endpoint `/v2/post/publish/content/init/` dengan `media_type: "PHOTO"`
- `title` (max 90), `description` (max 4000), `photo_cover_index`, `auto_add_music`

**PULL_FROM_URL:**
- Domain/URL prefix **wajib terverifikasi** (DNS TXT record atau file verifikasi)
  → domain publik R2 Cloudflare Sahabat Kreator harus terverifikasi di dev console
- URL harus HTTPS, tanpa redirect; timeout download 1 jam; ingress TikTok ~100 Mbps

## Rate Limit (angka terbaru)

| Limit | Nilai |
|---|---|
| Init upload/post per user token | **6 request/menit** (sliding window) |
| Status fetch per user token | **30 request/menit** |
| Daily post cap per akun | **~15–25 post/hari** (dibagi dengan SEMUA app yang diotorisasi user, bukan per-app) |
| Pending inbox share | max 5 draft pending/24 jam (`spam_risk_too_many_pending_share`) |
| Display API | 600 req/mnt per endpoint |

Error penting: 429 `rate_limit_exceeded` (retry: exponential backoff + jitter),
`spam_risk_too_many_posts`, `reached_active_user_cap`,
`unaudited_client_can_only_post_to_private_accounts`, `privacy_level_option_mismatch`,
`url_ownership_unverified`.

## Privasi & Field Tambahan

- `privacy_level`: `PUBLIC_TO_EVERYONE`, `MUTUAL_FOLLOW_FRIENDS`, `FOLLOWER_OF_CREATOR`, `SELF_ONLY`
  — **harus salah satu dari `privacy_level_options`** hasil creator_info (beda per akun)
- Padanan "draft" = inbox upload (`/inbox/video/init/`) atau `privacy_level: SELF_ONLY`
- `disable_comment`, `disable_duet`, `disable_stitch`, `video_cover_timestamp_ms`,
  `brand_content_toggle` (paid partnership), **`is_aigc`** (label AI-generated)

## Webhook (disarankan daripada polling)

Event: `post.publish.complete`, `post.publish.failed`,
`post.publish.inbox_delivered`, `post.publish.publicly_available`,
`post.publish.no_longer_publicaly_available`. Konfigurasi URL di dev console.

## Audio Upload — TIDAK TERSEDIA

Content Posting API **tidak menyediakan endpoint upload audio** pihak ketiga.
Audio harus di-mix/embed ke file video sebelum upload (praktik standar semua
scheduling tool).

## Pengajuan Akses (PERUBAHAN PENTING 2025–2026)

1. Buat app → tambahkan produk **Content Posting API** + **Login Kit**
2. **Sandbox mode** = jalur standar pre-audit (max 5 sandbox/app, 10 akun/sandbox,
   bisa test OAuth + upload penuh tanpa review; post dipaksa private)
3. Pengajuan: dev console → production → Content Posting API → **Usage → "Apply"**
   → form "Application to request access". Review **2–6 minggu**
4. Persyaratan: privacy policy URL publik (menyebut TikTok, data, retensi, hak hapus),
   ToS URL, **video demo 2–3 menit** (flow OAuth consent → halaman post → user klik
   publish), justifikasi per scope (least-privilege), app production-ready
5. Use case harus melayani audiens luas ("personal account management utility" ditolak)
6. **Kebijakan Originality (15 Sep 2025):** konten watermark platform lain/duplikat
   dekat didemote → cross-posting perlu re-render per platform

## Impor untuk Sahabat Kreator

- `privacy_level_options` per akun → UI harus fetch & adapt saat komposer TikTok dibuka
- Daily cap shared antar app → tampilkan sisa kuota & mitigasi error
- Webhook-first untuk status post; simpan `publish_id` untuk korelasi
- Domain R2 wajib diverifikasi sebelum fitur PULL_FROM_URL aktif

---

## Checklist Persiapan Pengajuan TikTok

Sebelum mengajukan Content Posting API di TikTok Developer Console, pastikan:

### 1. Domain Verification (Wajib untuk PULL_FROM_URL)
- [ ] Bucket R2 Cloudflare sudah publik (public access enabled)
- [ ] Domain CDN (mis. `cdn.sahabatkreator.com`) sudah apunt ke R2
- [ ] DNS TXT record sudah ditambahkan di domain:
  ```
  _tiktok-domain-verification.cdn.sahabatkreator.com → "tiktok-verification-code-xxxxx"
  ```
- [ ] Verifikasi berhasil di: TikTok Dev Console → Your Apps → [App] → Content Posting API → Domain Management
- [ ] User-agent `facebookexternalhit` tidak diblokir robots.txt (untuk Meta cross-posting nanti)

### 2. Aset Compliance
- [ ] Privacy Policy URL publik: `https://sahabatkreator.com/kebijakan-privasi`
  - Memuat penjelasan penyimpanan token terenkripsi
  - Memuat mekanisme Data Deletion Request (Meta callback)
  - Memuat retensi data per platform
- [ ] Terms of Service URL publik
- [ ] Halaman data deletion: `https://sahabatkreator.com/penghapusan-data` (TikTok tidak memakai protokol callback Meta — cukup instruksi manual + email, retensi data dijelaskan di kebijakan privasi)

### 3. Video Demo (1–3 menit)
- [ ] Resolusi 1080p+, tanpa audio
- [ ] Tampilkan alur lengkap:
  1. Klik "Connect TikTok" di Sahabat Kreator
  2. Jendela consent TikTok muncul (`https://www.tiktok.com/v2/auth/authorize/`)
  3. Login → Grant permissions → redirect sukses
  4. Halaman app menampilkan profil TikTok user
  5. Create video post via UI → upload dari URL publik
  6. Tampilkan status publish (PROCESSING → PUBLISH_COMPLETE)
- [ ] Jangan tampilkan: client_secret, access_token plaintext, password user

### 4. App Configuration
- [ ] Product "Content Posting API" sudah ditambahkan di dashboard
- [ ] Product "Login Kit" sudah ditambahkan
- [ ] Redirect URI HTTPS sudah dikonfigurasi
- [ ] Scope yang diminta: `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.upload`, `video.publish`
- [ ] Gunakan sandbox dulu untuk E2E test (maks 10 akun tester)

### 5. Setelah Approved (Production)
- [ ] Semua post default ke `privacy_level: SELF_ONLY` sampai audit lolos
- [ ] Monitoring daily cap (~15-25 post/hari per user, shared antar app)
- [ ] Implementasi exponential backoff untuk error 429
