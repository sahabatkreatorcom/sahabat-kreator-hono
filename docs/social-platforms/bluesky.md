# Bluesky — AT Protocol

> Riset per 9 Sep 2026. Docs: atproto.com, docs.bsky.app

## Arsitektur

Jaringan terdesentralisasi — tidak ada satu API terpusat:

| Layanan | URL | Auth |
|---|---|---|
| Entryway/PDS publik | `https://bsky.social` | Ya (app password/OAuth) |
| AppView API | `https://api.bsky.app` (auth) / `https://public.api.bsky.app` (publik, cached) | — |
| Video service | `https://video.bsky.app` | Service token |
| Chat/DM | `https://api.bsky.chat` | Ya |

Semua request via **XRPC**: `{pds}/xrpc/{nsid}`.

## Auth — 2 Opsi

**A. App Password (legacy, masih didukung — paling mudah):**
```
POST https://bsky.social/xrpc/com.atproto.server.createSession
{ "identifier": "<handle>", "password": "<APP_PASSWORD>" }
```
- Gunakan **App Password** (Settings → App passwords), bukan password utama
- Response: `accessJwt`, `refreshJwt`, `did`, `handle`
- **Login rate limit: 30/5 mnt & 300/hari per akun** → persist session
  (`resumeSession`), jangan login berulang
- Bluesky merekomendasikan OAuth untuk project baru, tapi app password masih
  lazim untuk SaaS yang menyimpan kredensial user
- **Tidak ada App Review sama sekali**

**B. atproto OAuth (modern, disarankan untuk aplikasi publik):**
- OAuth 2.0 profile: **PKCE + PAR + DPoP** wajib; `client_id` = URL metadata
  (OAuth Client ID Metadata Document), tanpa client_secret untuk public client
- Web service (Sahabat Kreator) = client "Confidential" dengan metadata + JWK
  publik di web. Scope: `atproto` (wajib); granular scopes dalam pengembangan

## Publishing

**Post (`app.bsky.feed.post`) via `com.atproto.repo.createRecord`:**
```json
POST {pds}/xrpc/com.atproto.repo.createRecord
{
  "repo": "<DID>",
  "collection": "app.bsky.feed.post",
  "record": {
    "$type": "app.bsky.feed.post",
    "text": "Hello!",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "langs": ["id"],
    "facets": []
  }
}
```
Response: `{ "uri": "at://did:plc:.../app.bsky.feed.post/<rkey>", "cid": "..." }`

- **SDK resmi: `@atproto/api` (TypeScript, `BskyAgent`)** — gunakan class `RichText`
  untuk hitung **300 grapheme** dan auto-deteksi facets
- `langs: ["id", "en-US"]` (BCP-47)
- Facets (mention/link/hashtag) pakai **byte offset** (bukan char offset):
  `app.bsky.richtext.facet#tag`, `#mention`, `#link`
- **Reply:** field `reply: { root: {uri, cid}, parent: {uri, cid} }`
- **Quote post:** `embed: { "$type": "app.bsky.embed.record", "record": {uri, cid} }`

## Media (Blobs)

**Gambar:** `POST {pds}/xrpc/com.atproto.repo.uploadBlob` (header
`Content-Type: image/jpeg|png|webp`, body = bytes) → blob object → embed
`app.bsky.embed.images` (array `images: [{alt, image, aspectRatio}]`).
- Maks **4 gambar/post**, **2 MB/gambar** (naik dari 1 MB, Apr 2026),
  alt text maks 1.000 grapheme

**Video:** `app.bsky.embed.video` — 1 video/post, MP4, maks **100 MB**,
durasi maks 3 menit, captions WebVTT (maks 20 file, 20KB).
- Metode: service-token flow → `POST https://video.bsky.app/xrpc/app.bsky.video.uploadVideo?did=<did>&name=<file>`
  dengan service JWT (audience PDS, scope `uploadBlob`, exp 30 mnt) → polling
  `app.bsky.video.getJobStatus` sampai dapat BlobRef
- Akun Bluesky-hosted wajib **verifikasi email** untuk upload video

**External link card:** `app.bsky.embed.external` dengan
`external: {uri, title, description, thumb}` — client harus scrape OG tags
sendiri + upload thumbnail blob.

## Threadgate & Postgate

`app.bsky.feed.threadgate` dengan **rkey sama** dengan post:
rules (maks 5): `mentionRule`, `followingRule`, `followerRule`, `listRule`.
Tanpa record = semua bisa reply; `allow: []` = nobody.
Ada juga `app.bsky.feed.postgate` (disable embedding/quote).

## Rate Limit (per akun)

| Item | Limit |
|---|---|
| Content write | **5.000 poin/jam, 35.000 poin/hari** (CREATE=3, UPDATE=2, DELETE=1 → ±1.666 create/jam) |
| API request umum | 3.000 per 5 menit (per IP) |
| `createSession` | 30/5 mnt, 300/hari |
| Blob upload max | 50 MB per blob (limit PDS) |

HTTP 429 saat kena limit.

## Changelog Penting 2025–2026

- OAuth atproto stabil sebagai jalur utama; auth scopes granular dalam pengembangan
- Sync v1.1, Jetstream v2 + network replay (Agt 2026)
- Image limit 1 MB → **2 MB** (Apr 2026); video 50 MB → **100 MB** (Mar 2025)
- Atproto Spaces (alpha, Agt 2026) — data non-publik/permissioned
- Trademark "AT Protocol" milik Bluesky (Jul 2026)
- Lexicon = schema system JSON; SDK ter-generate dari lexicon

## Impor untuk Sahabat Kreator

- **Tidak ada review/audit** → bisa rilis paling cepat; jadwalkan implementasi pertama
- Gunakan `@atproto/api` (RichText) — jangan hitung facet offset manual
- Persist session (accessJwt + refreshJwt + did), refresh bukan re-login
- Strip EXIF metadata gambar sebelum upload
- Label "bot" di profil akun otomatis (self-label) bila post otomatis —
  edukasikan ke user
- App password user disimpan terenkripsi (schema `social_account.accessToken`)
