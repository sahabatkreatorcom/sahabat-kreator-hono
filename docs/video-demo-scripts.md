# Video Demo Script Templates — Sahabat Kreator

> Panduan lengkap untuk merekam screencast demo aplikasi Sahabat Kreator.
> Gunakan untuk pengajuan App Review ke platform: Meta, TikTok, YouTube.
>
> **aturan umum:**
> - Resolusi: **1920x1080** (1080p) minimum
> - Tanpa audio (atau caption bahasa Inggris jika ada voiceover)
> - Cursor besar, gunakan mouse (bukan keyboard shortcuts)
> - 1 video per submission (per permission)
> - Tampilkan alur LENGKAP: login → OAuth consent → fitur utama → hasil
> - **JANGAN tampilkan:** client_secret, access_token plaintext, password user

---

## 📋 Template 1: Meta — Facebook Pages

**Permission:** `pages_show_list`, `pages_manage_posts`, `publish_video`  
**Durasi target:** 2-3 menit  
**File name:** `demo-meta-facebook-pages.mp4`

### Scene 1: Connect Account (30 detik)

```
[0:00-0:10]
Tampilan: Landing page Sahabat Kreator
Aksi: Klik tombol "Connect Facebook" atau "Hubungkan Akun"
Voiceover (opsional): "Kami akan menghubungkan akun Facebook Page ke Sahabat Kreator."

[0:10-0:25]
Tampilan: Jendela consent Facebook muncul (iframe atau popup)
Aksi: Hover di tombol "Log In" atau "Continue as [Nama]"
Catatan: Biarkan user melihat URL https://www.facebook.com/.../dialog/oauth

[0:25-0:40]
Tampilan: Halaman permissions Facebook
Aksi: Scroll pelan ke bawah untuk tunjukkan scopes:
      - pages_show_list
      - pages_manage_posts  
      - publish_video
Klik tombol "Done" atau "Allow"

[0:40-0:55]
Tampilan: Redirect balik ke Sahabat Kreator
Aksi: Tunjukkan halaman berhasil connect dengan nama Page
Catatan: Jangan zoom ke access_token di URL atau console
```

### Scene 2: Create & Schedule Post (45 detik)

```
[0:55-1:10]
Tampilan: Dashboard kalender/composer Sahabat Kreator
Aksi: Klik "Create Post" atau tombol tambah (+)

[1:10-1:30]
Tampilan: Form composer
Aksi: 
  - Pilih platform: Facebook Page
  - Pilih target Page dari dropdown (tampilkan nama Page)
  - Upload gambar/video (drag & drop)
  - Tulis caption singkat: "Demo post dari Sahabat Kreator"
  - Set tanggal & jam jadwal (pilih 1-2 hari ke depan)

[1:30-1:50]
Tampilan: Preview post
Aksi: Tunjukkan preview cara post akan tampil di Facebook
Klik tombol "Schedule" atau "Jadwalkan"
```

### Scene 3: Publish & Verify (30 detik)

```
[1:50-2:05]
Tampilan: Status post di kalender
Aksi: Tunjukkan status "Scheduled" → tunggu → berubah "Published"
(Percepat waktu jika perlu, atau gunakan time-lapse)

[2:05-2:20]
Tampilan: Buka tab baru, buka Facebook Page yang sama
Aksi: Scroll ke post yang baru tayang
Klik post untuk tunjukkan detail (caption, image, engagement)

[2:20-2:30]
Tampilan: Kembali ke Sahabat Kreator
Aksi: Tunjukkan tab "Posts" atau "History" dengan status "Published"
Voiceover: "Post berhasil dipublikasikan ke Facebook Page melalui Sahabat Kreator."
```

### ❌ Larangan (Jangan Ditampilkan)
- [ ] Client Secret di env/config
- [ ] Access token utuh di browser devtools
- [ ] Password akun Facebook
- [ ] Error message technical detail

---

## 📋 Template 2: Meta — Instagram (via Facebook Login)

**Permission:** `instagram_basic`, `instagram_content_publish`  
**Durasi target:** 2-3 menit  
**File name:** `demo-meta-instagram.mp4`

### Scene 1: Connect Instagram Business (40 detik)

```
[0:00-0:15]
Tampilan: Halaman Connect Account
Aksi: Klik "Connect Instagram" (pilih mode Facebook Login, bukan Instagram Login)

[0:15-0:30]
Tampilan: Consent Facebook muncul
Aksi: Login → grant permissions
Perhatikan: Tampilkan scope `instagram_basic`, `instagram_content_publish`

[0:30-0:45]
Tampilan: Pilih Page dengan Instagram Business Account tertaut
Aksi: Dropdown muncul → pilih Page yang punya IG tertaut
Klik "Continue" atau "Connect"

[0:45-0:55]
Tampilan: Sukses connect, tampilkan username IG
Aksi: Tunjukkan profil IG di dashboard Sahabat Kreator
```

### Scene 2: Create Instagram Post (45 detik)

```
[0:55-1:10]
Tampilan: Composer / Create Post
Aksi: Klik "Create Post"

[1:10-1:35]
Tampilan: Form Instagram post
Aksi:
  - Pilih target: Instagram Business Account
  - Upload media (foto/carousel)
  - Tulis caption dengan hashtag
  - Set jadwal tayang

[1:35-1:50]
Tampilan: Preview carousel (jika multi-image)
Aksi: Swipe horizontal untuk tunjukkan semua slide
Klik "Schedule"
```

### Scene 3: Verify Instagram Post (30 detik)

```
[1:50-2:05]
Tampilan: Status post di kalender (Scheduled → Published)
Aksi: Tunggu atau time-lapse

[2:05-2:20]
Tampilan: Buka Instagram app/browser
Aksi: Buka profil IG yang terhubung
Scroll ke post yang baru tayang
Tunjukkan caption, like, comment

[2:20-2:30]
Tampilan: Kembali ke Sahabat Kreator
Aksi: Tunjukkan post history dengan status "Published"
```

---

## 📋 Template 3: Meta — Threads

**Permission:** `threads_basic`, `threads_content_publish`, `threads_delete`, `threads_keyword_search`  
**Durasi target:** 2-3 menit (fitur utama) + 1-2 menit per fitur tambahan  
**File name:** `demo-meta-threads.mp4`

> ⚠️ Threads app HARUS terpisah dari Meta app utama (gunakan THREADS_APP_ID sendiri)  
> 📝 Demo untuk `threads_delete` ada di `demo-threads-delete.md`  
> 📝 Demo untuk `threads_keyword_search` ada di `demo-threads-search.md`

### Scene 1: Connect Threads Account (45 detik)

```
[0:00-0:10]
Tampilan: Halaman Connect Account
Aksi: Klik "Connect Threads"

[0:10-0:35]
Tampilan: Consent Threads muncul
URL harus: https://threads.net/oauth/authorize
Aksi: Grant permissions
Perhatikan: Tampilkan SEMUA scopes (7 scopes):
  - threads_basic
  - threads_content_publish
  - threads_manage_replies
  - threads_read_replies
  - threads_manage_insights
  - threads_delete
  - threads_keyword_search
```

### Scene 2: Create Threads Post (35 detik)

```
[0:35-0:50]
Tampilan: Composer
Aksi: Klik "Create Post"

[0:50-1:10]
Tampilan: Form Threads post
Aksi:
  - Pilih target: Threads account
  - Tulis post (max 500 karakter)
  - Tambahkan media (opsional)
  - Set jadwal

[1:10-1:20]
Aksi: Klik "Schedule" atau "Publish Now"
```

### Scene 3: Verify Threads Post (25 detik)

```
[1:20-1:35]
Tampilan: Status post Published
Aksi: Buka threads.net, login ke akun yang sama
Scroll ke post yang baru tayang

[1:35-1:45]
Tampilan: Kembali ke Sahabat Kreator
Aksi: Tunjukkan post history dengan metadata lengkap
```

---

## 📋 Template 4: TikTok Content Posting API

**Permission:** `video.upload`, `video.publish`  
**Durasi target:** 2-3 menit  
**File name:** `demo-tiktok-content-posting.mp4`

> ⚠️ Domain R2 harus sudah verified di TikTok Dev Console sebelum demo

### Scene 1: Connect TikTok Account (40 detik)

```
[0:00-0:15]
Tampilan: Halaman Connect Account
Aksi: Klik "Connect TikTok"

[0:15-0:30]
Tampilan: Consent TikTok muncul
URL harus: https://www.tiktok.com/v2/auth/authorize/
Aksi: Login TikTok → Grant permissions
Perhatikan: Tampilkan scopes:
  - user.info.basic
  - user.info.profile
  - video.upload
  - video.publish

[0:30-0:45]
Tampilan: Redirect balik, tunjukkan username TikTok
Aksi: Tunjukkan profil user di dashboard
```

### Scene 2: Upload & Schedule Video (60 detik)

```
[0:45-1:00]
Tampilan: Composer
Aksi: Klik "Create Post" → pilih platform TikTok

[1:00-1:20]
Tampilan: Form TikTok post
Aksi:
  - Upload video file (atau paste URL publik dari R2)
  - Tulis caption (max 2200 karakter)
  - Pilih privacy level: PUBLIC / SELF_ONLY / FRIENDS
  - Set jadwal tayang

[1:20-1:35]
Tampilan: Preview post
Aksi: Tunjukkan thumbnail video + caption
Klik "Schedule" atau "Publish"

[1:35-1:50]
Tampilan: Status "Publishing" atau "PROCESSING"
Aksi: Tunggu beberapa detik (atau time-lapse)
```

### Scene 3: Verify TikTok Post (30 detik)

```
[1:50-2:05]
Tampilan: Status berubah "PUBLISH_COMPLETE" atau "Published"
Aksi: Buka tiktok.com, login ke akun yang sama
Cari video yang baru tayang

[2:05-2:20]
Tampilan: Detail video di TikTok
Aksi: Scroll tunjukkan caption, like count, comment

[2:20-2:30]
Tampilan: Kembali ke Sahabat Kreator
Aksi: Tunjukkan post history dengan status "Published"
```

---

## 📋 Template 5: YouTube Compliance Audit

**Permission:** `youtube.upload`  
**Durasi target:** 2-3 menit  
**File name:** `demo-youtube-upload.mp4`

> ⚠️ Video akan dipaksa PRIVATE sampai Compliance Audit lolos

### Scene 1: Connect YouTube Channel (40 detik)

```
[0:00-0:15]
Tampilan: Halaman Connect Account
Aksi: Klik "Connect YouTube"

[0:15-0:30]
Tampilan: Consent Google muncul
URL: https://accounts.google.com/o/oauth2/v2/auth
Aksi: Pilih akun Google → Grant permissions
Perhatikan: Scope `https://www.googleapis.com/auth/youtube.upload`

[0:30-0:45]
Tampilan: Pilih channel (jika banyak)
Aksi: Dropdown channel muncul → pilih channel target
Klik "Continue"

[0:45-0:55]
Tampilan: Sukses, tunjukkan channel name + subscriber count
```

### Scene 2: Upload Video (60 detik)

```
[0:55-1:10]
Tampilan: Composer
Aksi: Klik "Create Post" → pilih platform YouTube

[1:10-1:35]
Tampilan: Form upload YouTube
Aksi:
  - Upload video file (drag & drop)
  - Isi title (max 100 karakter)
  - Isi description (max 5000 bytes)
  - Pilih category
  - Set tags (opsional)

[1:35-1:55]
Tampilan: Privacy setting
Aksi: Pilih salah satu:
  - Private (default untuk unaudited)
  - Unlisted
  - Public (hanya jika sudah audited)
  
[1:55-2:10]
Tampilan: Scheduling (opsional)
Aksi: Centang "Schedule" → pilih tanggal & jam
Klik "Upload" atau "Schedule"

[2:10-2:20]
Tampilan: Progress upload
Aksi: Tunggu sampai progress bar penuh
```

### Scene 3: Verify YouTube Video (30 detik)

```
[2:20-2:35]
Tampilan: Status post "Published" atau "Uploaded"
Aksi: Buka youtube.com, login ke channel yang sama
Klik "Library" → "Videos"

[2:35-2:50]
Tampilan: Detail video di YouTube Studio
Aksi: Tunjukkan title, description, privacy status
Jika scheduled: tunjukkan "Scheduled" badge

[2:50-3:00]
Tampilan: Kembali ke Sahabat Kreator
Aksi: Tunjukkan post history dengan status "Published"
```

---

## 🎬 Tips Rekaman

### Setup Technical
```
Resolution: 1920x1080 (1080p)
FPS: 30fps
Format: MP4 (H.264 codec)
Max file size: 100MB (cek requirements tiap platform)
```

### Software Rekomendasi
- **OBS Studio** (gratis, open source) — paling populer
- **Loom** (cloud-based, mudah)
- **Camtasia** (berbayar, editor built-in)

### Best Practices
1. **Zoom in** pada area penting (tombol, form field)
2. **Delay 2-3 detik** sebelum klik tombol (biar reviewer lihat)
3. **Jangan fast-forward** terlalu cepat — reviewer perlu lihat setiap step
4. **Gunakan hover effect** — arahkan mouse ke elemen sebelum klik
5. **Tutup notifikasi** OS dan browser sebelum rekam
6. **Test run** sekali sebelum rekam final

### Common Mistakes (Hindari!)
- ❌ Menampilkan access_token/client_secret di URL atau console
- ❌ Tidak menampilkan jendela consent OAuth
- ❌ Langsung跳到 hasil tanpa tunjukkan proses
- ❌ Menggunakan akun real dengan data sensitif (pakai test account)
- ❌ Video terlalu panjang (>5 menit) atau terlalu pendek (<1 menit)

---

## ✅ Pre-Flight Checklist Sebelum Submit

Sebelum merekam, pastikan:

- [ ] App sudah di-mode **Development** (minimal 7 hari untuk Meta)
- [ ] Redirect URI sudah dikonfigurasi di developer console
- [ ] Test account siap (bukan akun real user)
- [ ] Video/demo content sudah disiapkan (gambar, video sample)
- [ ] Browser dalam mode incognito/private (hindari cached session)
- [ ] Screen resolution diset 1920x1080
- [ ] Mouse cursor diset ukuran besar (easy to follow)
- [ ] Notifikasi OS dan aplikasi lain dimatikan

---

*Dokumen ini dibuat untuk Sahabat Kreator. Sesuaikan dengan flow aktual aplikasi.*
