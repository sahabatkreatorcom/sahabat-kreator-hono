# Video Demo Script: Meta — Threads

**Permission:** `threads_basic`, `threads_content_publish`, `threads_delete`, `threads_keyword_search`  
**Durasi target:** 2-3 menit (fitur utama) + 1-2 menit per fitur tambahan  
**File name:** `demo-meta-threads.mp4` (utama)

> ⚠️ Threads app HARUS terpisah dari Meta app utama (gunakan THREADS_APP_ID sendiri)  
> 📝 Demo untuk `threads_delete` ada di `demo-threads-delete.md`  
> 📝 Demo untuk `threads_keyword_search` ada di `demo-threads-search.md`

## ⚠️ Warnings

- [ ] Threads app HARUS terpisah dari Meta app utama (gunakan THREADS_APP_ID sendiri)
- [ ] Redirect URI harus di `threads.net`, bukan `facebook.com`
- [ ] Scope `threads_delete` hanya bisa di-grant via standard OAuth flow
- [ ] Scope `threads_keyword_search` membatasi hasil ke postingan publik saja

## ❌ Larangan (Jangan Ditampilkan)

- [ ] Jangan gunakan Meta app ID yang sama untuk Threads
- [ ] Jangan tampilkan access_token di browser devtools
- [ ] Jangan search hashtag sensitif/politik

## Scenes

### Scene 1: Connect Threads Account
**Durasi:** 40 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:00-0:10 | Halaman Connect Account | Klik "Connect Threads" |  |
| 0:10-0:30 | Consent Threads muncul | Grant permissions | URL harus: https://threads.net/oauth/authorize |
| 0:30-0:45 | Halaman permissions Threads | Scroll tunjukkan SEMUA scopes | Tampilkan 7 scopes lengkap (lihat tabel di bawah) |
| 0:45-0:55 | Redirect balik, tunjukkan username Threads | Tunjukkan profil Threads di dashboard | URL redirect mengandung #_ di akhir (ini normal) |

**Daftar Scopes yang Harus Terlihat di Consent:**
```
threads_basic              → Profil user
threads_content_publish    → Publish post
threads_manage_replies     → Kelola replies
threads_read_replies       → Baca thread & conversation
threads_manage_insights    → Analisis performa
threads_delete             → Hapus post (limit 100/24 jam)
threads_keyword_search     → Search postingan publik
```

### Scene 2: Create & Schedule Threads Post
**Durasi:** 40 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:55-1:10 | Composer | Klik "Create Post" |  |
| 1:10-1:35 | Form Threads post | Isi form post | Pilih target: Threads account<br>Tulis post (max 500 karakter)<br>Tambahkan media (opsional)<br>Set jadwal |
| 1:35-1:45 | Preview post | Klik "Schedule" atau "Publish Now" |  |

### Scene 3: Verify Threads Post
**Durasi:** 25 detik

| Time | View | Action | Notes |
|------|------|--------|-------|
| 1:45-2:00 | Status post Published | Buka threads.net, login ke akun yang sama | Scroll ke post yang baru tayang |
| 2:00-2:10 | Kembali ke Sahabat Kreator | Tunjukkan post history | Status "Published" dengan link ke threads.net |
| 2:10-2:25 | Tunjukkan metadata post | Hover/click post untuk detail | Tampilkan: platformPostUrl, scheduledAt, publishedAt |

---

## 🔗 Demo Tambahan (File Terpisah)

Karena Threads memiliki 7 scopes, ada 2 demo tambahan yang perlu direkam terpisah:

### A. Threads Delete Post
**File:** `demo-threads-delete.md`  
**Scope:** `threads_delete`  
**Durasi:** 1-2 menit  
**Fitur:** Delete post dari kalender → verifikasi post hilang dari threads.net

### B. Threads Keyword Search
**File:** `demo-threads-search.md`  
**Scope:** `threads_keyword_search`  
**Durasi:** 2-3 menit  
**Fitur:** Search postingan Threads → tampilkan hasil → navigasi ke post asli

---

*Catatan: Untuk App Review, rekam demo utama (fitur publish) + salah satu demo tambahan (delete ATAU search). Dokumentasi lengkap semua demo tersedia di folder `docs/video-demo-scripts/`.*

*Dokumen ini dibuat untuk Sahabat Kreator.*
