# Meta — Facebook Pages API (Graph API)

> Riset per 9 Sep 2026. Docs: developers.facebook.com/docs/pages-api

## Ringkasan

| Item | Nilai |
|---|---|
| Graph API versi terbaru | **v26.0** (rilis 29 Juli 2026; tersedia ~2 tahun) |
| Versi minimum aman | v22.0+ (v20.0 expired 24 Sep 2026, v21.0 expired 21 Jan 2027) |
| Base URL | `https://graph.facebook.com/v26.0/` |
| Video upload host | `https://graph-video.facebook.com` + `https://rupload.facebook.com` |

## Permissions (Advanced Access)

| Permission | Fungsi |
|---|---|
| `pages_show_list` | Menampilkan daftar Page user |
| `pages_manage_posts` | Publish/edit/delete konten Page |
| `pages_read_engagement` | Baca metadata & engagement post Page |
| `pages_manage_engagement` | Kelola komentar dsb |
| `pages_read_user_engagement` | Baca engagement |
| `publish_video` | Publish video ke Page |

User di Page harus punya task: `CREATE_CONTENT`, `MANAGE`, `MODERATE`
(cek field `tasks` dari `GET /me/accounts`).

## Token Flow

1. User token short-lived → exchange long-lived (`fb_exchange_token`, ~60 hari)
2. `GET /me/accounts` → Page Access Token (tanpa expiry; mati jika user
   kehilangan role/ganti password)
3. Validasi berkala via `GET /debug_token`

## Endpoint Publish

| Aksi | Endpoint | Host |
|---|---|---|
| Post teks/link | `POST /{page_id}/feed` (`message`, `link`) | graph.facebook.com |
| **Scheduled post** | `POST /{page_id}/feed` + `published=false` + `scheduled_publish_time` (rentang **10 menit – 30 hari**) | graph.facebook.com |
| Photo | `POST /{page_id}/photos` (`url` publik) | graph.facebook.com |
| Video | `POST /{page_id}/videos` (chunked handle) | graph-video.facebook.com |
| **Reel** | `POST /{page_id}/video_reels` (3 phase, lihat bawah) | graph.facebook.com + rupload.facebook.com |
| Update post | `POST /{post_id}` (hanya post buatan app kita) | graph.facebook.com |
| Delete post | `DELETE /{post_id}` | graph.facebook.com |

### Flow Reels (3 langkah)

1. `POST /{page_id}/video_reels?upload_phase=start` → `video_id` + `upload_url`
2. Upload binary ke `https://rupload.facebook.com/video-upload/{version}/{video_id}`
   (header `offset: 0`, `file_size`; atau `file_url` untuk hosted file)
3. `POST /{page_id}/video_reels?upload_phase=finish&video_state=PUBLISHED&video_id=...`
   + `description`, `title`, `place`

Limit: **30 reels/24 jam per Page**.

### Resumable Upload (file besar)

1. `POST /{app_id}/uploads` (`file_name`, `file_length`, `file_type`:
   `application/pdf`, `image/jpeg`, `image/png`, `video/mp4`) → `upload:<SESSION_ID>`
2. `POST /upload:<SESSION_ID>` header `file_offset: 0` + binary → handle `{"h": "..."}`
3. Resume: `GET /upload:<SESSION_ID>` → offset terakhir

Host file harus mengizinkan user-agent `facebookexternalhit/1.1` (jangan blokir
robots.txt). URL fbcdn ditolak.

## Spesifikasi Video/Reels

| Property | Spec |
|---|---|
| Format | .mp4 (recommended) |
| Aspect ratio | 9:16 |
| Resolusi | 1080×1920 (min 540×960) |
| Frame rate | 24–60 fps |
| Durasi Reels | 3–90 detik (story max 60 detik) |
| Codec | H.264/H.265, closed GOP 2–5 dtk, fixed frame rate |
| Audio | AAC LC, stereo, 128kbps+, 48kHz |

## Rate Limiting (BUC)

Rate limit bergantung **token yang dipakai**, bukan endpoint:

- App/User token → Platform Rate Limit: `200 × jumlah user aktif`/jam (error 4/17/32)
- **Page token → BUC**: `4800 × jumlah engaged users` Page per 24 jam (error 80001)
- Jika dua sistem bisa apply, BUC yang dipakai

Monitoring: header `X-App-Usage` (platform), `X-Business-Use-Case-Usage` (BUC:
`call_count`, `total_cputime`, `total_time`, `estimated_time_to_regain_access`).

Best practices: berhenti memanggil saat throttle, sebar query merata,
pakai filter agar response kecil, gunakan system user token untuk volume tinggi.

## Changelog Penting 2025–2026

- **v26.0 (29 Jul 2026) — versi terbaru.** Perubahan breaking yang relevan:
  - Protokol legacy dihapus (semua versi tersisa per 27 Okt 2026): parameter
    `pretty`, `debug`, `date_format` error; `GET /?ids=...` error; header
    `ETag`/`304 Not Modified` dihapus → **client code tidak boleh memakai ini**
  - New Pages Experience: field `current_location`, `genre`, `network`,
    `parking`, `start_info` deprecated
  - Commerce Order Management API deprecated total (47 endpoint)
  - TIDAK ada perubahan breaking pada Content Publishing IG/Threads/Page publishing
- v25.0 (18 Feb 2026) — sebelumnya versi terbaru
- v24.0 (8 Okt 2025) — Certificate Transparency deprecated; `overlay_url` Live Video dihapus
- Graph API versi expire ~2 tahun → pin versi di env, jangan hardcode per-module

---

## Checklist Persiapan Pengajuan Meta App Review

### Persyaratan Umum
- [ ] Meta Business Manager sudah dibuat dan verified (Business Verification)
- [ ] App type: "Business" (bukan "Consumer")
- [ ] App mode: "Live" (minimal Development mode selama 7 hari sebelum submit)
- [ ] Privacy Policy URL: `https://sahabatkreator.com/kebijakan-privasi`
- [ ] Terms of Service URL: `https://sahabatkreator.com/syarat-ketentuan`
- [ ] Data Deletion mechanism: callback endpoint aktif di `https://app.sahabatkreator.com/webhooks/meta/data-deletion` (verifikasi `signed_request`, balas `{url, confirmation_code}`)
- [ ] Demo account tersedia untuk reviewer (test user dengan role di app)

### Per Permission (ajukan satu per satu, max 2-3 per submission)

#### pages_manage_posts (Publish ke Facebook Page)
- [ ] Video demo: connect Facebook Page → create post → publish
- [ ] Justifikasi: "User perlu menjadwalkan konten ke Facebook Page mereka"
- [ ] Scope minimal: `pages_show_list`, `pages_manage_posts`, `publish_video`

#### instagram_content_publish (Instagram via Facebook Login)
- [ ] Video demo: connect Instagram Business → create post → publish
- [ ] Justifikasi: "User perlu menjadwalkan konten ke Instagram Business mereka"
- [ ] Scope minimal: `instagram_basic`, `instagram_content_publish`

#### threads_content_publish (Threads)
- [ ] Video demo: connect Threads → create post → publish
- [ ] Justifikasi: "User perlu menjadwalkan konten ke Threads mereka"
- [ ] Scope minimal: `threads_basic`, `threads_content_publish`

### Setelah Approved
- [ ] Update `META_GRAPH_VERSION` ke versi terbaru jika ada breaking change
- [ ] Jalankan Data Use Checkup tahunan di Business Manager
- [ ] Monitor permission usage — scope tidak dipakai 90 hari akan revoke
