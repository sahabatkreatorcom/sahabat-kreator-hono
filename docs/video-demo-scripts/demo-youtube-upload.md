# Video Demo Script: YouTube Upload

**Permission:** youtube.upload
**Durasi target:** 2-3 menit
**File name:** `demo-youtube-upload.mp4`

## ⚠️ Warnings

- [ ] Video akan dipaksa PRIVATE sampai Compliance Audit lolos
- [ ] Gunakan video sample pendek (<30 detik) untuk demo

## ❌ Larangan (Jangan Ditampilkan)

- [ ] Jangan upload video bermasalah hak cipta
- [ ] Jangan tampilkan API key di console

## Scenes

### Scene 1: Connect YouTube Channel
**Durasi:** 40 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:00-0:15 | Halaman Connect Account | Klik "Connect YouTube" |  |
| 0:15-0:30 | Consent Google muncul | Pilih akun Google → Grant permissions | URL: https://accounts.google.com/o/oauth2/v2/auth |
| 0:30-0:45 | Halaman permissions Google | Scroll tunjukkan scope | Tampilkan: https://www.googleapis.com/auth/youtube.upload |
| 0:45-0:55 | Pilih channel (jika banyak) | Dropdown channel muncul → pilih channel target | Klik 'Continue' |
| 0:55-1:00 | Sukses, tunjukkan channel name + subscriber count | Tunjukkan profil channel di dashboard |  |

### Scene 2: Upload Video
**Durasi:** 60 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 1:00-1:15 | Composer | Klik "Create Post" → pilih platform YouTube |  |
| 1:15-1:40 | Form upload YouTube | Isi form upload | Upload video file (drag & drop)
Isi title (max 100 karakter)
Isi description (max 5000 bytes)
Pilih category
Set tags (opsional) |
| 1:40-2:00 | Privacy setting | Pilih salah satu | Private (default untuk unaudited)
Unlisted
Public (hanya jika sudah audited) |
| 2:00-2:15 | Scheduling (opsional) | Centang 'Schedule' → pilih tanggal & jam | Klik 'Upload' atau 'Schedule' |
| 2:15-2:25 | Progress upload | Tunggu sampai progress bar penuh | Tunjukkan quota usage di bagian bawah (jika ada) |

### Scene 3: Verify YouTube Video
**Durasi:** 30 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 2:25-2:40 | Status post 'Published' atau 'Uploaded' | Buka youtube.com, login ke channel yang sama | Klik 'Library' → 'Videos' |
| 2:40-2:55 | Detail video di YouTube Studio | Tunjukkan title, description, privacy status | Jika scheduled: tunjukkan 'Scheduled' badge |
| 2:55-3:05 | Kembali ke Sahabat Kreator | Tunjukkan post history dengan status 'Published' |  |

---

*Dokumen ini dibuat untuk Sahabat Kreator.*
