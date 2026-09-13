# YouTube — Data API v3

> Riset per 9 Sep 2026. Docs: developers.google.com/youtube/v3

## Endpoint Penting

| Endpoint | URL | Fungsi |
|---|---|---|
| Video upload (resumable) | `POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status` | Inisiasi, return header `Location` (session URI) |
| Videos | `https://www.googleapis.com/youtube/v3/videos` | list/insert/update/delete |
| Thumbnail | `https://www.googleapis.com/youtube/v3/thumbnails/set` | Custom thumbnail |
| Playlist | `.../playlists` & `/playlistItems` | Kelola playlist (insert 50 unit) |
| Channels | `.../channels` | Info channel (1 unit) |
| Search | `.../search` | 100 unit |

## OAuth Flow

- OAuth 2.0 Web Server flow; **tidak ada service account** untuk upload atas nama
  channel user (service account hanya untuk content owner/MCS)
- `access_type=offline` → simpan **refresh_token**; access token ~1 jam auto-refresh
- Scope sensitif → wajib lolos **Google OAuth app verification**
- `prompt=select_account consent` → memaksa Google account chooser; akses channel
  via channel itu sendiri (lihat Multi-channel di bawah)

## Multi-Channel

`videos.insert` **tidak punya parameter pemilihan channel** — video selalu masuk ke
channel milik akun Google yang meng-approve consent. Konsekuensi:

- **Satu koneksi = satu channel**. Satu akun Google bisa punya ≤ 200 channel
  (brand account), tapi tiap channel butuh koneksi OAuth terpisah
- Implementasi Sahabat Kreator (note.md #14): authorize YouTube memakai
  `prompt=select_account consent` → user pilih akun Google channel yang dituju
  di layar login Google → connect ulang untuk channel berikutnya
- Hint UI sudah ada di halaman Accounts: "hubungkan YouTube lagi — pilih akun
  channel yang dituju"

## Scope

| Scope | Fungsi |
|---|---|
| `https://www.googleapis.com/auth/youtube.upload` | Upload + manage video user (paling sempit — rekomendasi) |
| `https://www.googleapis.com/auth/youtube.force-ssl` | Edit/hapus video, rating, komentar, caption, playlist |
| `https://www.googleapis.com/auth/youtube.readonly` | Read-only |

Praktik terbaik: `youtube.upload` untuk publish flow; tambah `youtube.force-ssl`
hanya jika butuh playlist management (Google sangat ketat soal least-privilege).

## Resumable Upload

1. `POST /upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`
   body JSON (snippet + status), header `X-Upload-Content-Type`,
   `X-Upload-Content-Length` → response header `Location` = session URI
2. PUT chunk binary ke session URI dengan `Content-Range`
3. Query progress: PUT dengan `Content-Range: bytes */TOTAL`; resume dari byte terakhir
4. **Exponential backoff** (retry 500/502/503/504, max ~10) sesuai sampel resmi
- Max file **256 GB**, MIME `video/*` atau `application/octet-stream`

## Metadata & Scheduled Publish

Set saat insert: `snippet.title`, `snippet.description`, `snippet.tags[]`,
`snippet.categoryId`, `status.privacyStatus`, **`status.publishAt`**,
`status.selfDeclaredMadeForKids`, `status.embeddable`, `status.license`,
`status.containsSyntheticMedia` (label A/S content, Okt 2024),
`recordingDetails.recordingDate`, `notifySubscribers` (true/false).

**Scheduling native:**
```
status.privacyStatus = "private"
status.publishAt = "2026-09-01T14:00:00Z"   // RFC 3339, masa depan
```
`publishAt` **hanya berlaku jika privacyStatus = private**; YouTube otomatis
flip ke public di waktu tsb. Tidak ada endpoint schedule terpisah.

## YouTube Shorts

- Tidak ada API upload khusus Shorts — pakai `videos.insert` yang sama
- Klasifikasi otomatis: **square/vertical (9:16 atau 1:1) dan ≤ 3 menit** = Shorts
  (batas dinaikkan dari 60 dtk ke 3 menit sejak 15 Okt 2024; duration-based,
  hashtag #shorts tidak diperlukan)
- 31 Mar 2025: view dihitung saat mulai play/replay tanpa minimum watch time

## Quota System — PERUBAHAN BESAR

| Periode | Biaya `videos.insert` | Catatan |
|---|---|---|
| Sebelum Des 2025 | 1.600 unit | ~6 upload/hari dari pool 10.000 |
| **4 Des 2025** (resmi, revision history) | **~100 unit** | Masih dari pool 10.000 unit/hari |
| **1 Jun 2026** (pihak ketiga, belum resmi) | ~100 unit, **bucket terpisah ~100 upload/hari** di luar pool 10.000 | Validasi di Cloud Console |

Struktur default terbaru:
- **100 `search.list`/hari, 100 `videos.insert`/hari, 10.000 unit/hari gabungan endpoint lain**
- read/list = 1 unit; write = 50 unit; `search.list` = 100 unit; captions insert = 400 unit
- Reset **tengah malam Pacific Time (PT)**

## Audit & Compliance

- **Semua video dari project unaudited (dibuat setelah 28 Jul 2020) dipaksa PRIVATE**
  — `publishAt` diterima tapi tidak berfungsi sampai audit lolos
- Quota extension wajib **API Compliance Audit**:
  - Audit & Quota Extension Form (audit pertama): `support.google.com/youtube/contact/yt_api_form`
  - Audited Developer Requests Form (audit < 12 bulan, minta tambah quota)
  - Appeals Form / Change of Control Form
- Kepatuhan: YouTube API Services Terms & Developer Policies
  (data retention, caching limit 30 hari, dsb.)

## Perubahan Lain

- 27 Agt 2026: kebijakan penghitungan views semua format berubah
- `search.list` `relatedToVideoId` deprecated; dislike count private (kecuali owner)
- `mostPopular` chart (10 Jul 2025) menampilkan Trending Music/Movies/Gaming

## Impor untuk Sahabat Kreator

- Quota-aware scheduler: monitor bucket upload + pool unit; jadwalkan upload
  tersebar merata (reset tengah malam PT — sesuaikan timezone UI)
- `publishAt` = scheduling native YouTube → gunakan untuk fitur schedule agar
  tidak perlu worker publish tepat waktu
- Simpan session URI upload untuk resumable recovery

---

## Checklist Persiapan Pengajuan YouTube Compliance Audit

### Persyaratan
- [ ] Google Cloud Project aktif dengan YouTube Data API v3 diaktifkan
- [ ] Video demo 2-3 menit menampilkan:
  - OAuth consent screen Google
  - Upload video via Sahabat Kreator
  - Video muncul di channel (state: private → scheduled → public)
- [ ] Privacy Policy menyebut retention data video upload
- [ ] Website bisnis aktif dengan domain match email developer
- [ ] Siap menyediakan demo account dalam 7 hari jika diminta

### Setelah Submitted
- [ ] Monitor email dari Google untuk permintaan informasi tambahan
- [ ] Video project unaudited akan dipaksa PRIVATE sampai audit lolos
- [ ] Quota default: 100 videos.insert/hari + 10.000 unit/hari pool
