# Threads — Threads API

> Riset per 9 Sep 2026. Docs: developers.facebook.com/docs/threads

## Ringkasan

| Item | Nilai |
|---|---|
| API host | `https://graph.threads.net/v1.0/` (alias `graph.threads.com`) |
| OAuth host | `https://threads.net/oauth/authorize` |
| App | Meta App dengan **Threads Use Case** — gunakan **Threads App ID/Secret** khusus (terpisah dari App ID utama) |
| Token | short-lived 1 jam → long-lived **60 hari** (refresh) |

## Auth Flow (OAuth 2.0)

1. Redirect user ke `https://threads.net/oauth/authorize?client_id=<THREADS_APP_ID>&redirect_uri=...&scope=...&response_type=code&state=<STATE>`
   - Code valid **1 jam, sekali pakai**; strip `#_` di akhir redirect
   - Error cancel: `error=access_denied&error_reason=user_denied`
2. Exchange code → short-lived token:
   `POST https://graph.threads.net/oauth/access_token`
   (client_id, client_secret, grant_type=authorization_code, redirect_uri, code)
3. Exchange → long-lived (60 hari, server-side):
   `GET https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=<SECRET>&access_token=<SHORT>`
4. Refresh: `GET https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=<LONG>`
   - Token harus berusia ≥24 jam & belum expired; tidak di-refresh dalam 60 hari → **mati permanen**
   - Long-lived token profil **private** sekarang bisa di-refresh; permission grant
     user berlaku **90 hari** (refresh memperpanjang 90 hari)

## Scope

| Scope | Fungsi |
|---|---|
| `threads_basic` | **Wajib** semua endpoint |
| `threads_content_publish` | Publish post/reply |
| `threads_manage_replies` | POST reply endpoint (reply, hide, approval) |
| `threads_read_replies` | GET reply/conversation |
| `threads_manage_insights` | GET insights |
| `threads_delete` | DELETE post (limit 100/24 jam) |
| `threads_keyword_search` | Search post publik |
| `threads_manage_mentions` | Webhook mention + get mentions |
| `threads_location_tagging` | Search & tag lokasi (500 search/24 jam) |
| `threads_share_to_instagram` | Cross-share ke IG Stories (Mar 2026) |

## Publishing (2 langkah / container)

**Post tunggal (TEXT/IMAGE/VIDEO):**
1. `POST /{threads-user-id}/threads` — `media_type` (TEXT→`text`, IMAGE→`image_url`,
   VIDEO→`video_url`), plus `alt_text`, `reply_control`, `topic_tag`,
   `link_attachment`, `quote_post_id`, `gif_attachment` → **container ID**
2. `POST /{threads-user-id}/threads_publish` dengan `creation_id=<container_id>` → media ID

Tunggu ±30 detik; polling `GET /{container-id}?fields=status,error_message`
(`IN_PROGRESS | FINISHED | PUBLISHED | ERROR | EXPIRED`). Container tidak
dipublish dalam 24 jam → `EXPIRED`.

**Carousel (2–20 item):** buat container per item (`is_carousel_item=true`) →
container `media_type=CAROUSEL` + `children=<id1,id2,...>` → publish.
Carousel dihitung **1 post** terhadap rate limit.

**`auto_publish_text=true`** (Jun 2025): publish post teks dalam 1 call saja.

**Fitur lain:** `reply_to_id` (reply), `quote_post_id` (quote),
`topic_tag` (1–50 char, tanpa titik/&), `link_attachment` (hanya text post,
maks 5 link unik — error `THREADS_API__LINK_LIMIT_EXCEEDED` sejak 22 Des 2025),
`gif_attachment` (hanya GIPHY; Tenor sunset Mar 2026), poll, spoiler,
ghost post, reply approvals, `reply_control`: `everyone | accounts_you_follow |
mentioned_only | parent_post_author_only | followers_only`.

Media wajib **URL publik** (Meta mendownload file) → selaras R2 Cloudflare publik.

## Spesifikasi Media

| Tipe | Spec |
|---|---|
| Gambar | JPEG/PNG maks 8 MB, rasio maks 10:1, lebar 320–1440px |
| Video | MOV/MP4 (H.264/HEVC, AAC), maks **1 GB / 5 menit / 100 Mbps**, 23–60 FPS, maks 1920 kolom |
| Teks | maks **500 karakter** (emoji per byte UTF-8) |

## Insights

- Media: `GET /{threads-media-id}/insights?metric=views,likes,replies,reposts,quotes,shares`
- User: `GET /{threads-user-id}/threads_insights?metric=...&since=&until=` →
  `views` (time series), `likes`, `replies`, `reposts`, `quotes`, `clicks`,
  `followers_count`, `follower_demographics` (perlu ≥100 follower, breakdown
  `country|city|age|gender`). Data tersedia sejak 13 Apr 2024.

## Rate Limit (per 24 jam rolling)

| Aksi | Limit |
|---|---|
| Post publish | **250** (dihitung di `threads_publish`, carousel = 1) |
| Replies | 1.000 |
| Deletion | 100 |
| Location search | 500 |
| General | `4800 × impressions` call count (impressions min 10) |

Cek kuota: `GET /{threads-user-id}/threads_publishing_limit?fields=quota_usage,config`.

## Pengajuan Akses

1. Meta App dengan Threads Use Case (App ID/Secret terpisah)
2. Development: invite **Threads Tester** (App Dashboard → Roles) — tester bisa
   grant semua permission tanpa review
3. User publik: tiap permission harus lulus **App Review** (per permission,
   masing-masing perlu screencast flow spesifik) + app **published/Live**
4. Tool komersial: **Tech Provider Verification** / Business Verification
5. Penolakan umum: over-scoping, screencast tidak menunjukkan fitur scope,
   media URL tidak publik, tidak ada logika refresh token

## Impor untuk Sahabat Kreator

- Refresh scheduler (mis. mingguan) sebelum 60 hari — token mati permanen jika lewat
- Retry idempotent: cek status container sebelum re-publish (cegah double-post,
  terutama error `4279009`)
- Enforce 250 post/24 jam di sisi app untuk fitur scheduling
- Threads App ID/Secret terpisah → tambah env khusus (jangan campur App ID utama Meta)
