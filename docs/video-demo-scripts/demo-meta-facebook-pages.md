# Video Demo Script: Meta — Facebook Pages

**Permission:** pages_show_list, pages_manage_posts, publish_video
**Durasi target:** 2-3 menit
**File name:** `demo-meta-facebook-pages.md`

## ⚠️ Warnings

- [ ] Pastikan app Meta sudah >7 hari di Development mode sebelum submit

## ❌ Larangan (Jangan Ditampilkan)

- [ ] Jangan tampilkan access_token di browser devtools
- [ ] Jangan tampilkan client_secret di environment config

## Scenes

### Scene 1: Connect Facebook Page
**Durasi:** 30 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:00-0:10 | Landing page Sahabat Kreator | Klik tombol "Connect Facebook" atau "Hubungkan Akun" | Voiceover (opsional): "Kami akan menghubungkan akun Facebook Page ke Sahabat Kreator." |
| 0:10-0:25 | Jendela consent Facebook muncul (iframe atau popup) | Hover di tombol 'Log In' atau 'Continue as [Nama]' | Biarkan user melihat URL https://www.facebook.com/.../dialog/oauth |
| 0:25-0:40 | Halaman permissions Facebook | Scroll pelan ke bawah untuk tunjukkan scopes | Tampilkan: pages_show_list, pages_manage_posts, publish_video |
| 0:40-0:55 | Redirect balik ke Sahabat Kreator | Tunjukkan halaman berhasil connect dengan nama Page | Jangan zoom ke access_token di URL atau console |

### Scene 2: Create & Schedule Post
**Durasi:** 45 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:55-1:10 | Dashboard kalender/composer Sahabat Kreator | Klik "Create Post" atau tombol tambah (+) |  |
| 1:10-1:30 | Form composer | Isi form post | Pilih platform: Facebook Page
Pilih target Page dari dropdown (tampilkan nama Page)
Upload gambar/video (drag & drop)
Tulis caption singkat: "Demo post dari Sahabat Kreator"
Set tanggal & jam jadwal (pilih 1-2 hari ke depan) |
| 1:30-1:50 | Preview post | Tunjukkan preview cara post akan tampil di Facebook | Klik tombol "Schedule" atau "Jadwalkan" |

### Scene 3: Publish & Verify
**Durasi:** 30 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 1:50-2:05 | Status post di kalender | Tunjukkan status 'Scheduled' → tunggu → berubah 'Published' | Percepat waktu jika perlu, atau gunakan time-lapse |
| 2:05-2:20 | Buka tab baru, buka Facebook Page yang sama | Scroll ke post yang baru tayang | Klik post untuk tunjukkan detail (caption, image, engagement) |
| 2:20-2:30 | Kembali ke Sahabat Kreator | Tunjukkan tab 'Posts' atau 'History' dengan status 'Published' | Voiceover: "Post berhasil dipublikasikan ke Facebook Page melalui Sahabat Kreator." |

---

*Dokumen ini dibuat untuk Sahabat Kreator.*
