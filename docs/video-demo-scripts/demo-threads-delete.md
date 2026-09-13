# Video Demo Script: Threads Delete Post

**Permission:** `threads_delete`  
**Durasi target:** 1-2 menit  
**File name:** `demo-threads-delete.mp4`

---

## ⚠️ Warnings
- Pastikan scope `threads_delete` sudah di-grant saat OAuth
- Post harus sudah dalam status `published` (bukan draft)
- Limit delete: 100 posts per 24 jam

## ❌ Larangan (Jangan Ditampilkan)
- Jangan tampilkan access_token di browser devtools
- Jangan tampilkan client_secret

---

## Scenes

### Scene 1: Connect Threads Account (20 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:00-0:10 | Halaman Connect Account | Klik "Connect Threads" |  |
| 0:10-0:20 | Consent Threads muncul | Grant permissions | Pastikan scope `threads_delete` terlihat di daftar permissions |
| 0:20-0:30 | Redirect balik | Tunjukkan profil Threads di dashboard |  |

### Scene 2: Tampilkan Post yang Sudah Published (20 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:30-0:45 | Dashboard/post history | Scroll ke post dengan status "Published" | Pilih salah satu post Threads |
| 0:45-0:50 | Detail post | Tunjukkan tombol "Delete" atau "Hapus" | Hover di tombol untuk tooltip |
| 0:50-0:55 | Konfirmasi delete | Klik tombol "Delete" → confirm dialog | Dialog: "Yakin ingin menghapus post ini?" |

### Scene 3: Delete Post dari Threads (30 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:55-1:10 | Browser baru, threads.net | Login ke akun yang sama | Buka feed/profile user |
| 1:10-1:25 | Feed Threads | Scroll cari post yang baru dihapus | Post seharusnya tidak muncul lagi |
| 1:25-1:40 | Kembali ke Sahabat Kreator | Tunjukkan post history | Status berubah jadi "deleted" atau post hilang dari list |

### Scene 4: Verifikasi Delete API Call (20 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 1:40-1:55 | Browser devtools (Network tab) | Tunjukkan request DELETE ke `graph.threads.net` | Method: DELETE, Path: `/{user-id}/threads/{post-id}` |
| 1:55-2:00 | Response | Tunjukkan response body `{success: true}` | Atau kosong (204 No Content) |

---

*Dokumen ini dibuat untuk Sahabat Kreator.*
