# LinkedIn — Posts API (Versioned)

> Riset per 9 Sep 2026. Docs: learn.microsoft.com/en-us/linkedin

## Ringkasan

| Item | Nilai |
|---|---|
| Base URL | `https://api.linkedin.com/rest/` (`/v2/` = legacy/sunset untuk Marketing API) |
| Header wajib semua request | `LinkedIn-Version: {YYYYMM}` + `X-Restli-Protocol-Version: 2.0.0` + `Authorization: Bearer {token}` |
| Versi terbaru saat riset | **202608** (Agustus 2026) |
| Cadence | versi baru tiap bulan, didukung min 1 tahun sebelum sunset |
| Token lifetime | **60 hari**; refresh programatik terbatas partner → siapkan flow re-auth |

Header `LinkedIn-Version` hilang = error 400. Sunset mendatang: 202508 → 17 Agt 2026,
202509 → 15 Sep 2026, 202510 → 15 Okt 2026. Versi deprecated langsung error.

## Scope

| Scope | Fungsi | Cara dapat |
|---|---|---|
| `openid`, `profile`, `email` | Sign In via OIDC (JWT ID Token, `GET /v2/userinfo`) | Self-serve, product "Sign In with LinkedIn using OpenID Connect" |
| `w_member_social` | Post/comment/like sebagai member pribadi | Self-serve, product **"Share on LinkedIn"** |
| `w_organization_social` | Post atas nama company page (user harus admin) | Wajib approval **Community Management API** |
| `r_organization_social` | Baca post & engagement company page | Community Management API |
| `r_organization_admin` | List company page yang user kelola (`organizationAcls`) | Community Management / Advertising API |
| `rw_organization_admin` | Kelola setting company page | Advertising/Community Mgmt |
| `r_member_social` | Baca feed member sendiri | **RESTRICTED — hampir tidak bisa diajukan baru** |

Rekomendasi: mulai `openid profile email w_member_social` (self-serve) →
ajukan Community Management API untuk fitur company page.

## POST /rest/posts (menggantikan ugcPosts)

```json
{
  "author": "urn:li:person:{id} atau urn:li:organization:{id}",
  "commentary": "teks post (maks 3.000 char)",
  "visibility": "PUBLIC",
  "distribution": { "feedDistribution": "MAIN_FEED", "targetEntities": [], "thirdPartyDistributionChannels": [] },
  "lifecycleState": "PUBLISHED",
  "isReshareDisabledByAuthor": false
}
```

- Sukses = **201**, post ID di header `x-restli-id`
- Person URN dari `GET /v2/userinfo` (field `sub`)
- Content types organik: Text, Image, Video, **Document (PDF carousel)**, Article (link),
  MultiImage, Poll, Celebration. **Carousel = hanya sponsored (ads)**
- Article post TIDAK scrape URL otomatis — wajib set `source`, `thumbnail`, `title`,
  `description` manual (scrape OG tags sendiri)
- Operasi: `GET /rest/posts/{id}`, `GET /rest/posts?author={urn}&q=author`,
  `DELETE /rest/posts/{id}`, reshare via `reshareContext.parent`
- **Tidak ada parameter scheduled_at** → scheduler dibangun sendiri

## Organization Access (Multi-Company)

Daftar company page yang bisa dikelola user:

```
GET /rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED
&projection=(elements*(organizationReference,role,state,organization~(id,localizedName,vanityName)))
```

- Field `organization~` (Rest.li decoration) langsung memuat `id`, `localizedName`,
  `vanityName` — tidak perlu request `/rest/organizations` terpisah
- URN hasil: `urn:li:organization:{id}` → dipakai sebagai `author` POST /rest/posts
- Butuh scope `r_organization_admin` (product ter-approve, bukan self-serve)
- Tanpa scope → 403 → app fallback ke flow person-only (sudah di-handle)

**Implementasi Sahabat Kreator (note.md #15):**
1. Callback OAuth → jika token granted `r_organization_admin` → fetch organizations
2. >0 company → simpan `oauth_pending_selection` (profil pribadi + semua company,
   token user-level di-share ke semua entitas) → picker modal "Pilih Profil LinkedIn"
3. Select → upsert `social_account` dengan `platformAccountId` = URN lengkap
   (`urn:li:person:{sub}` / `urn:li:organization:{id}`), `metadata.ownerType`
   = `person` | `organization`
4. Scope org di-gate env `LINKEDIN_EXTRA_SCOPES` — kosongkan sampai product
   approved (scope tak terdaftar → consent ditolak `invalid_scope`)

## Upload Media (pattern initializeUpload → upload → finalize)

**Image (Images API):**
1. `POST /rest/images?action=initializeUpload` body `{"initializeUploadRequest": {"owner": "urn:li:..."}}` → `uploadUrl` + image URN
2. Upload binary ke `uploadUrl` (single upload)
3. `GET /rest/images/{urn}` → status `AVAILABLE`
4. Post: `content.media.id: "urn:li:image:..."`

Spec: JPG/GIF/PNG, < 36.152.320 pixel, GIF ≤ 250 frame; alt text via
`content.media.altText` (≤ 4.086 char).

**Video (Videos API):**
1. `POST /rest/videos?action=initializeUpload` body `{"initializeUploadRequest": {"owner": "...", "fileSizeBytes": N, "uploadCaptions": bool, "uploadThumbnail": bool}}` → `uploadInstructions[]` (part 4MB, `uploadUrl` per part), `uploadToken`, video URN
2. PUT tiap part → kumpulkan **ETag** per response
3. `POST /rest/videos?action=finalizeUpload` body `{"finalizeUploadRequest": {"video": "urn:li:video:...", "uploadToken": "...", "uploadedPartIds": ["etag1",...]}}`
4. Post: `content.media.id: "urn:li:video:..."` (+ `title`)

Spec: MP4, 3 dtk–30 mnt, 75KB–500MB (max 5GB multi-part); captions EN saja;
upload URL expired 30 hari.

**Document (PDF carousel — Documents API):**
1. `POST /rest/documents?action=initializeUpload` → `uploadUrl` + document URN
2. `--upload-file` ke `uploadUrl`
3. Post: `content.media: {"title": "file.pdf", "id": "urn:li:document:..."}`

Spec: PDF/PPT/PPTX/DOC/DOCX, maks **100MB & 300 halaman**.

## Rate Limits

- Per **24 jam** (reset tengah malam UTC), dua dimensi: per **Application** dan
  per **Member**. Angka standar tidak dipublikasikan — cek Developer Portal → Analytics
- **Share on LinkedIn (yang dipublikasikan): Member 150 request/hari,
  Application 100.000 request/hari**
- OIDC: Member 500/hari, App 100.000/hari
- 429 saat kena; email alert ke Developer Admin saat >75% kuota app-level
- Best practice algoritma: 1–2 post/hari per halaman

## Pengajuan Akses

**Self-serve (instan):**
1. Buat LinkedIn Page (wajib untuk app) → linkedin.com/company/setup
2. developer.linkedin.com → Create App (asosiasikan ke Page)
3. Tab Products → tambahkan "Sign In with LinkedIn using OpenID Connect" (instan)
   dan "Share on LinkedIn" (review ringan)
4. Tab Auth → Client ID + Secret + redirect URL HTTPS

**Community Management API (company page):**
1. Syarat: organisasi legal terdaftar, use case komersial, email bisnis terverifikasi,
   super admin Page verifikasi app
2. Ajukan via tab Products → **Development tier** (build & test, integrasi ≤ 12 bulan)
3. Upgrade **Standard tier**: form + **screen recording** (OAuth flow, user posting
   via app, komentar tampil, field data personal yang ditampilkan) + test credentials
4. Timeline: Development 4–8 minggu; Standard total 3–6 bulan.
   **Jika ditolak → buat app baru (tidak bisa re-apply app sama)**
5. Restricted use cases: social listening/competitor monitoring DITOLAK

## Changelog Penting 2025–2026

- **ugcPosts & Shares API → Posts API** (migration guide resmi):
  `specificContent`→`content`, `shareCommentary`→`commentary`,
  dark post = `distribution.NONE` + `visibility.PUBLIC`
- **Assets API → Images/Videos/Documents API** terpisah (URN spesifik, multi-part
  default untuk video)
- Versioning ketat: sunset bulanan, wajib migrasi ≥1x/tahun
- 31 Agt 2026: field `location` dihapus dari `/v2/me` & `/v2/people` → `geoLocation`
- `r_member_social` restricted; analytics member tersedia via Community Mgmt API
  (`r_member_profileAnalytics` 202504+, `r_member_postAnalytics` 202506+)
- Community Management API kini hanya untuk **organisasi legal komersial**
- Matched Audiences API GA (Agt 2026)

## Impor untuk Sahabat Kreator

- **Token 60 hari tanpa refresh programatik** untuk app biasa → UX re-auth
  terjadang wajib; tampilkan `tokenExpiry` warning H-7 (kolom sudah ada di schema)
- `LinkedIn-Version` harus configurable via env dan di-upgrade rutin
- Multi-part video upload + ETag → state machine upload dengan penyimpanan ETag sementara
- Article post butuh OG scrape sendiri (title, description, thumbnail blob)
- **Multi-company**: token user-level dipakai untuk semua entitas (person & company)
  — tidak ada token per-company; posting company = ganti `author` URN saja

---

## Checklist Persiapan Pengajuan LinkedIn Community Management API

### Self-Serve (Instan — Sign In + Share)
- [ ] LinkedIn Page sudah dibuat (`linkedin.com/company/setup`)
- [ ] App dibuat di developer.linkedin.com
- [ ] Product "Sign In with LinkedIn using OpenID Connect" ditambahkan
- [ ] Product "Share on LinkedIn" ditambahkan
- [ ] Scope: `openid`, `profile`, `email`, `w_member_social`

### Community Management API (Company Page) — Development Tier
- [ ] Organisasi legal terdaftar dengan dokumen lengkap
- [ ] Email bisnis terverifikasi
- [ ] Super admin Page sudah memverifikasi app
- [ ] Screen recording demo: OAuth → post ke company page → komentar tampil
- [ ] Test credentials siap untuk reviewer

### Standard Tier (3-6 bulan total)
- [ ] Development tier sudah berjalan ≥12 bulan
- [ ] Use case komersial jelas (social listening DITOLAK)
- [ ] Re-submit jika ditolak harus buat app baru (tidak bisa re-apply)

### Setelah Approved
- [ ] Set `LINKEDIN_EXTRA_SCOPES=r_organization_admin w_organization_social` di env
      (mengaktifkan company picker + posting sebagai company)
- [ ] Update `LINKEDIN_API_VERSION` setiap bulan (sunset bulanan)
- [ ] Implementasi UX re-auth ketika token 60 hari habis
- [ ] Monitor quota: 150 request/hari per member, 100.000 per app
