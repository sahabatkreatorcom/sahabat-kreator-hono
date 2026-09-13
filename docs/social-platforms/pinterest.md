# Pinterest — API v5

> Riset per 9 Sep 2026. Docs: developers.pinterest.com/docs/api/v5

## Ringkasan

| Item | Nilai |
|---|---|
| Base URL produksi | `https://api.pinterest.com/v5/` |
| Base URL sandbox | `https://api-sandbox.pinterest.com/v5/` |
| Versi | v5 (minor saat ini 5.28; pin versi via OpenAPI spec `pinterest/api-description`) |
| Scope minimal publish | `boards:read`, `boards:write`, `pins:read`, `pins:write`, `user_accounts:read` |

## Sandbox Environment (untuk trial & screencast Standard Access)

- **Trial access otomatis bisa pakai sandbox** (tidak perlu approval terpisah).
  Cara pakai: ganti subdomain `api.` → `api-sandbox.`
- **Token sandbox:** My apps → Manage → tab Configure → **Generate Access Token**
  → pilih environment **Sandbox** → token berlaku **30 hari**, semua scope.
  Alternatif jangka panjang: OAuth flow via `POST https://api-sandbox.pinterest.com/v5/oauth/token`
- **Token sandbox ≠ token production** (terikat Pinterest user, tidak saling dipakai)
- Token product-limited (production, read-only 3 scope, 24 jam) terpisah dari sandbox token
- **Authorize URL dipakai bersama**: `https://www.pinterest.com/oauth/` untuk
  sandbox maupun production — code di-exchange ke token endpoint masing-masing
- Entitas sandbox (Pin/Board/ad account) tidak dikenali di production
- Rate limit mengikuti **access tier** (Trial/Standard), bukan environment

**Endpoint tersedia di sandbox:** CRUD Pin/board/board section, media upload,
user account, followers/following, campaign management penuh, shopping
(catalogs/feeds), OAuth generate/revoke, `DELETE /v5/ad_accounts/{id}/sandbox`.

**TIDAK tersedia di sandbox:** create **video Pins**, shopping ads, business
access test, simulasi ads auction/feed status/conversion upload/bulk editing.
Jangan create Pin ke group board (pemilik board dapat notifikasi membingungkan).

### Strategi Screencast untuk Pengajuan Standard Access

Yang menentukan diterima/tolak **bukan environment-nya, tapi kelengkapan OAuth
flow di video**. Kasus nyata komunitas (n8n, Mar–Apr 2026):

- **DITOLAK:** video hanya menampilkan API call ke `api-sandbox.pinterest.com`
  TANPA OAuth flow lengkap → alasan: "Demo did not show Pinterest integration"
  dan "Demo did not show full OAuth flow"
- **DITERIMA:** video menampilkan jendela OAuth Pinterest terbuka (consent
  screen → Grant access → redirect sukses → token exchange), lalu aksi API nyata

**Isi video yang terbukti lolos (durasi 1–3 menit):**
1. Klik "Connect Pinterest" di app Sahabat Kreator → jendela consent Pinterest
   (`https://www.pinterest.com/oauth/`) → login → Grant access → redirect sukses
2. Halaman app menampilkan data akun Pinterest (`GET /v5/user_account`, list boards)
3. Create Pin via UI app → tampilkan Pin hasil

**Hindari:** tampilkan secret/token plaintext, wireframe tanpa integrasi live,
hanya rekaman Postman/terminal tanpa OAuth consent screen, mengumpulkan
login/password user atau session cookies (otomatis ditolak).

Catatan: sebagian laporan komunitas menyebut `POST /v5/pins` di host production
bisa 403 selama Trial — praktisnya lakukan create Pin demo di **sandbox host
dengan sandbox token** (pasti bekerja saat trial), dengan OAuth flow production
ditampilkan lengkap. Review Standard: 1–4 minggu; jika ditolak bisa appeal via
Help Center ticket.

## OAuth 2.0

- Authorize: `https://www.pinterest.com/oauth/` (params `client_id`, `redirect_uri`,
  `response_type=code`, `scope`, `state`)
- Token: `POST https://api.pinterest.com/v5/oauth/token` — auth **HTTP Basic**
  (`client_id:client_secret`), body `x-www-form-urlencoded`

**Masa berlaku token (perubahan besar):**
- Access token: **30 hari** (prefix `pina`)
- Refresh token: **60 hari, ROTATING** (continuous refresh token) — setiap refresh
  menghasilkan RT baru; harus disimpan atomik di DB (env statis tidak bisa).
  Prefix `pinr`
- App dibuat ≥ 25 Sep 2025 otomatis continuous; app lama wajib
  `continuous_refresh=true`. Legacy RT 365 hari sudah TIDAK didukung
- Client credentials token prefix `pinc` (org-level, scope terbatas)

Token invalid jika user ganti password/username atau bocor via GitHub Secret Scanner.

## Scope Lengkap

`pins:read`, `pins:write`, `pins:read_secret`, `pins:write_secret`,
`boards:read`, `boards:write`, `boards:read_secret`, `boards:write_secret`,
`user_accounts:read`, `catalogs:read`, `catalogs:write`, `ads:read`, `ads:write`.

## Endpoint Publish

### POST /v5/pins (rate limit category `org_write`)

Field: `board_id` (wajib), `board_section_id`, `title` (≤100), `description` (≤800),
`alt_text` (≤500), `link` (≤2048), `dominant_color`, `media_source`, `parent_pin_id`.

**Image Pin** — `media_source.source_type`: `image_url` (+ `url`, `is_standard`)
atau `image_base64` (+ `content_type`, `data`).

**Video Pin (4 langkah):**
1. `POST /v5/media` body `{"media_type": "video"}` → `media_id`, `upload_url`, `upload_parameters`
2. Upload multipart ke AWS S3 bucket Pinterest
   (`pinterest-media-upload.s3-accelerate.amazonaws.com`) — semua `upload_parameters`
   + file .mp4/.mov/.m4v, TANPA Bearer auth, sukses = 204
3. `GET /v5/media/{media_id}` → cek status `succeeded`
4. `POST /v5/pins` dengan `media_source: {source_type: "video_id", cover_image_url, media_id}`
   — **cover_image_url wajib**, invalid = 400

**Carousel Pin: TIDAK DIDUKUNG LAGI** — format organik disederhanakan menjadi
image atau video saja. Multi-image = Pin terpisah per image. Idea/Story Pin juga
tidak tersedia via API.

Endpoint pendukung: `POST /v5/boards`, `POST /v5/pins/{pin_id}` (save ke board lain),
`PATCH/DELETE /v5/pins/{id}`, `GET /v5/boards`, `GET /v5/user_account`.

Volume limit akun: max **2.000 board, 200.000 Pin** per akun.

## Rate Limits (resmi terbaru)

**Universal:** Trial = **1.000 request/hari per app**; Standard = **100 req/detik per user per app**.

| Kategori | Trial (per hari/app) | Standard (per menit/user/app) |
|---|---|---|
| `org_read` | 1.000 | 1.000 |
| **`org_write` (buat board/pin)** | **300** | **100** |
| `org_analytics` | 1.000 | 60 |
| `catalogs_read`/`catalogs_write` | 1.000 | 100 |
| `ads_read` | 1.000 | 1.000 |
| `ads_write` | 300 | 400 |

Header: `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`. Error 429.

## Pengajuan Akses

1. Akun Pinterest **BUSINESS** wajib + verifikasi email → developers.pinterest.com
   → My apps → Connect app
2. **Trial access** (gratis): form app name, company, website, **privacy policy URL
   (wajib & live)**, deskripsi detail, redirect URIs. Review tiap hari kerja,
   approval hampir instan
3. Batas Trial: semua Pin/Board = sandbox entities (hanya terlihat pembuatnya);
   test token expired 24 jam
4. **Standard access** (gratis, produksi): tombol Upgrade di My apps → upload
   **video demo** menampilkan (a) OAuth flow lengkap, (b) live Pinterest API action
   di app (terminal/Postman pun diterima jika single-user)
5. Penolakan umum: privacy policy tidak accessible, deskripsi vague, demo video
   tidak menampilkan auth flow, belum ada integrasi live (cuma wireframe)
6. Di atas Standard: Marketing Developer Partners (MDP, curated)

## Changelog Penting 2025–2026

- 25 Sep 2025: refresh token legacy 365-hari dihapus → continuous RT 60-hari rotasi
- Format Pin organik disederhanakan (carousel organik dihapus)
- Rate limit per-kategori dipublikasikan resmi
- OpenAPI spec resmi — pin versi (5.28 termasuk breaking release)
- MCP server alpha untuk ads data (Jun 2026, read-only, partner terbatas)

## Impor untuk Sahabat Kreator

- **Rotating refresh token** → job refresh harus atomic update DB (satu transaksi),
  jangan simpan di env — selaras dengan kolom `accessToken`/`refreshToken`
  terenkripsi di schema `social_account`
- Cache daftar board (sudah ada tabel `pinterest_board_cache`, kedaluwarsa 24 jam
  sesuai komentar schema — konsisten dengan best practice)
- Video pin perlu state machine upload (media → poll → pin)
- Tidak ada carousel → batasi UI komposer Pinterest ke single image/video
