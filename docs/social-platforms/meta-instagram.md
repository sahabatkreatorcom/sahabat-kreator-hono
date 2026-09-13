# Meta — Instagram Platform (2 Mode)

> Riset per 9 Sep 2026. Docs: developers.facebook.com/docs/instagram-platform

## Perbandingan Mode (KRUSIAL)

| Aspek | **Instagram API with Instagram Login** (standalone, `instagram_standalone`) | **Instagram API with Facebook Login** (`instagram`) |
|---|---|---|
| Host | `graph.instagram.com` | `graph.facebook.com` + `rupload.facebook.com` |
| Token | Instagram User access token | Facebook **Page** access token |
| Prasyarat | IG Business/Creator, **tanpa perlu FB Page** | IG wajib terhubung ke FB Page |
| Permissions | `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_comments`, `instagram_business_manage_messages` | `instagram_basic`, `instagram_content_publish`, `pages_read_engagement` (+ `ads_management`/`ads_read` jika role via Business Manager) |
| Kemampuan | Publishing, comments, mentions, DM, media insights | + **hashtag search**, Business Discovery, tagging produk, Collaboration, Audio API |
| Cocok untuk | Kreator akun IG Professional biasa | Bisnis dengan ekosistem FB Page lengkap |

Satu Meta app Business type bisa memuat kedua setup sekaligus.
Rekomendasi: mode standalone sebagai jalur utama onboarding (ringan),
mode Facebook Login untuk fitur lanjutan (hashtag search, dsb).

## Hashtag Search — Status Terbaru (Sep 2026)

**MASIH AKTIF**, tetapi **HANYA via Instagram API with Facebook Login**
(tidak tersedia di mode standalone). Dokumentasi terakhir di-update 12 Agt 2026
tanpa catatan deprecation.

- **Feature yang diajukan ke App Review:** `Instagram Public Content Access`
- **Permission:** `instagram_basic` (+ `ads_management`/`business_management`/
  `pages_read_engagement` jika role Page via Business Manager)
- **Token:** User access token dari FB user yang punya tasks di Page terhubung
- Endpoint:
  - `GET /ig_hashtag_search?user_id={ig-user-id}&q={hashtag}` → hashtag ID
  - `GET /{ig-hashtag-id}/top_media?user_id=...` → media populer
  - `GET /{ig-hashtag-id}/recent_media?user_id=...` → media terbaru
  - `GET /{ig-user-id}/recently_searched_hashtags` → cek kuota mingguan
- **Limit: 30 hashtag unik per 7 hari rolling** per akun IG Business/Creator.
  Query ulang hashtag sama dalam 7 hari tidak dihitung ulang. Emoji tidak
  didukung; tidak bisa berkomentar di media hasil pencarian
- Sejak 30 Jul 2026: `media_url` bisa hilang dari hasil pencarian (audio
  berlisensi / download dimatikan owner) → treat sebagai optional

**Pembanding Threads:** `threads_keyword_search` lebih longgar — 2.200 query/
24 jam per user, `search_mode=TAG` adalah padanan hashtag.

## Business Login for Instagram (OAuth standalone)

- Authorize: `https://www.instagram.com/oauth/authorize?client_id=...&redirect_uri=...&response_type=code&scope=...`
- Exchange code: `POST https://api.instagram.com/oauth/access_token` (code valid 1 jam, sekali pakai)
- Long-lived token: `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=...` (valid 60 hari)
- Refresh: `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token`
  (token harus ≥24 jam & belum expired; tidak di-refresh dalam 60 hari → mati permanen)

Param penting: `force_reauth=true` (Jun 2025), `enable_fb_login=false` (Feb 2026).

Scope `instagram_business_*` menggantikan scope lama `business_*` yang
**deprecated 27 Januari 2025**.

## Content Publishing (2 langkah: container → publish)

**Langkah 1 — Container:** `POST /{IG_ID}/media`

- `image_url` / `video_url` (wajib URL publik)
- `media_type`: `VIDEO` | `REELS` | `STORIES` | `CAROUSEL`
- `is_carousel_item: true` (item carousel)
- `upload_type=resumable` (video besar — hanya Facebook Login mode)
- `caption`, `alt_text` (hanya image post), `user_tags`, `cover_url`, `share_to_feed`, `location`
- ⚠️ `is_ai_generated` TIDAK tercantum di parameter `/{IG_ID}/media` (cek ulang
  saat implementasi — saat ini hanya FB Page Reels `/video_reels` yang punya)
- `branded_content_sponsor_ids` (max 2) + `is_paid_partnership` (Apr 2026)
- `trial_params` (Des 2025 — Trial Reels: `graduation_strategy: MANUAL|SS_PERFORMANCE`)

**Langkah 2 — Publish:** `POST /{IG_ID}/media_publish` dengan `creation_id` = container ID

**Status container:** `GET /{IG_CONTAINER_ID}?fields=status_code` →
`EXPIRED | ERROR | FINISHED | IN_PROGRESS | PUBLISHED`.
**Polling 1×/menit, max 5 menit.** Container expire 24 jam; max 400 container/24 jam.

**Carousel:** buat hingga 10 container item → container utama `media_type=CAROUSEL`
+ `children=id1,id2,...` → publish.

**Cek limit:** `GET /{IG_ID}/content_publishing_limit`

**Rate limit:** 100 post API per 24 jam rolling (docs bagian carousel masih
menyebut 50 — pakai **50 sebagai limit aman internal**).

## Spesifikasi Media

| Tipe | Spec |
|---|---|
| Image | JPEG saja, max 8 MB, max lebar 1920px, rasio 0.01:1–10:1 |
| Video feed | 3 dtk – 15 mnt, bitrate ≤25 Mbps, audio 128 kbps |
| Reels | MP4/MOV, 9:16, 5–90 dtk, H.264/HEVC, 23–60 fps, moov atom di depan |
| Stories | expire 24 jam, tidak bisa sticker (link/poll/lokasi), bisa mention (Jul 2025) |

Limitasi publish: tidak ada shopping tag, tidak ada filter, PPA wajib selesai
jika Page mensyaratkan, 2FA Page harus dijalankan user.

## Instagram Messaging (DM)

Dua jalur:

1. Standalone: Messaging API via `graph.instagram.com` (scope `instagram_business_manage_messages`)
2. IG linked ke FB Page: Messenger API for Instagram (`pages_messaging` + `instagram_basic`)

Fitur: kirim/terima pesan (teks, media, template), private reply ke komentar
(1 DM per komentar), story mention webhook, ice breakers, quick replies,
sender actions (typing indicator, mark_seen — Sep 2025).

Update 2025–2026: multi-image send GA (Mei 2026), PDF attachment (Des 2025),
self-messaging (Nov 2025), `message_edit` webhook (Sep 2025).

**Aturan:** customer harus memulai percakapan lebih dulu (24-hour window
standard messaging; human agent escalation untuk lebih lama).

## Changelog Penting 2025–2026

- **Jul 2026:** `media_url` bisa hilang dari response (audio berlisensi / owner
  nonaktifkan download) → treat sebagai optional, fallback `permalink`/`thumbnail_url`
- **Jun 2026:** metric `link_clicks` Story; Instagram Audio API (FB Login only);
  `is_ai_generated` (AI Info Label — hanya FB Page Reels `/video_reels`,
  bukan endpoint IG `/media`)
- **Apr 2026:** `reposts_count`, `saved_count`, `shares_count`; Collaborative Media API;
  Like Media & Comments API (permission baru `instagram_manage_engagement`)
- **Des 2025:** Trial Reels; **DELETE media** (`DELETE /{ig_media_id}`, permission `instagram_manage_contents`)
- **Mar 2025:** `alt_text` image post
- **Jan 2025:** scope `business_*` → `instagram_business_*`

## Permission Final untuk Diajukan

Standalone: `instagram_business_basic`, `instagram_business_content_publish`,
`instagram_business_manage_comments`, `instagram_business_manage_messages`

Via FB Login (opsional): `instagram_basic`, `instagram_content_publish`
(+ `pages_read_user_content`, `pages_show_list`)

Opsional roadmap: `instagram_manage_contents` (delete), `instagram_manage_engagement`
(like), `instagram_branded_content_creator` (partnership label)
