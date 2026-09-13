# Video Demo Script: TikTok Content Posting API

**Permission:** video.upload, video.publish
**Durasi target:** 2-3 menit
**File name:** `demo-tiktok-content-posting.mp4`

## ⚠️ Warnings

- [ ] Domain R2 harus sudah verified di TikTok Dev Console sebelum demo
- [ ] Video sample harus dari URL publik (bukan local file)

## ❌ Larangan (Jangan Ditampilkan)

- [ ] Jangan tampilkan video dengan watermark platform lain
- [ ] Jangan gunakan akun dengan konten sensitif

## Scenes

### Scene 1: Connect TikTok Account
**Durasi:** 40 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:00-0:15 | Halaman Connect Account | Klik "Connect TikTok" |  |
| 0:15-0:30 | Consent TikTok muncul | Login TikTok → Grant permissions | URL harus: https://www.tiktok.com/v2/auth/authorize/ |
| 0:30-0:45 | Halaman permissions TikTok | Scroll tunjukkan scopes | Tampilkan: user.info.basic, user.info.profile, video.upload, video.publish |
| 0:45-0:55 | Redirect balik, tunjukkan username TikTok | Tunjukkan profil user di dashboard |  |

### Scene 2: Upload & Schedule Video
**Durasi:** 60 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:55-1:10 | Composer | Klik "Create Post" → pilih platform TikTok |  |
| 1:10-1:35 | Form TikTok post | Isi form post | Upload video file (atau paste URL publik dari R2)
Tulis caption (max 2200 karakter)
Pilih privacy level: PUBLIC / SELF_ONLY / FRIENDS
Set jadwal tayang |
| 1:35-1:50 | Preview post | Tunjukkan thumbnail video + caption | Klik "Schedule" atau "Publish" |
| 1:50-2:05 | Status 'Publishing' atau 'PROCESSING' | Tunggu beberapa detik (atau time-lapse) | Tunjukkan publish_id di detail post (untuk debugging) |

### Scene 3: Verify TikTok Post
**Durasi:** 30 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 2:05-2:20 | Status berubah 'PUBLISH_COMPLETE' atau 'Published' | Buka tiktok.com, login ke akun yang sama | Cari video yang baru tayang |
| 2:20-2:35 | Detail video di TikTok | Scroll tunjukkan caption, like count, comment |  |
| 2:35-2:45 | Kembali ke Sahabat Kreator | Tunjukkan post history dengan status 'Published' |  |

---

*Dokumen ini dibuat untuk Sahabat Kreator.*
