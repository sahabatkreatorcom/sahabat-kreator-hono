# Video Demo Script: Pinterest Private Board Access

**Permission:** `boards:read_secret`, `boards:write_secret`, `pins:read_secret`, `pins:write_secret`  
**Durasi target:** 2-3 menit  
**File name:** `demo-pinterest-private-boards.mp4`

---

## ⚠️ Warnings
- Board private hanya bisa diakses jika user grant scope `boards:read_secret`
- Pin di board private hanya bisa dibaca/dibuat dengan scope `pins:read_secret` + `pins:write_secret`
- Standard Access request harus menunjukkan use case untuk private content

## ❌ Larangan (Jangan Ditampilkan)
- Jangan gunakan board yang berisi konten sensitif
- Jangan tampilkan access_token

---

## Scenes

### Scene 1: Connect Pinterest Account (30 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:00-0:10 | Halaman Connect Account | Klik "Connect Pinterest" |  |
| 0:10-0:25 | Consent Pinterest muncul | Grant permissions | Pastikan scope `boards:read_secret`, `boards:write_secret` terlihat |
| 0:25-0:40 | Redirect balik | Tunjukkan profil Pinterest di dashboard |  |

### Scene 2: Fetch Boards (dengan Private) (30 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:40-0:55 | Dropdown pilih board | Klik untuk buka dropdown | Tunjukkan daftar board |
| 0:55-1:10 | Daftar board muncul | Scroll lihat semua board | Public board + Private board (dengan icon gembok) |
| 1:10-1:20 | Highlight private board | Hover di board dengan label "Secret" | Tooltip: "Private Board" |

### Scene 3: Buat Pin di Private Board (40 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 1:20-1:35 | Composer/Create Post | Klik "Create Pin" |  |
| 1:35-1:50 | Pilih board | Dropdown board → pilih private board | Board dengan icon gembok terpilih |
| 1:50-2:05 | Upload media + caption | Upload gambar, isi title & description |  |
| 2:05-2:15 | Publish pin | Klik "Save" atau "Publish" |  |

### Scene 4: Verifikasi Pin di Pinterest (30 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 2:15-2:30 | Browser baru, pinterest.com | Login ke akun yang sama | Buka board private yang dipilih |
| 2:30-2:45 | Board private | Scroll ke pin yang baru dibuat | Pin muncul di board private |
| 2:45-3:00 | Kembali ke Sahabat Kreator | Tunjukkan post history | Status "Published" dengan link ke pin |

### Scene 5: Demo Error Handling (20 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 3:00-3:15 | Tanpa scope secret | Disconnect & reconnect tanpa scope secret |  |
| 3:15-3:25 | Fetch boards lagi | Tunjukkan hanya public board | Private board tidak muncul |
| 3:25-3:30 | Error message | Tunjukkan pesan: "Private boards memerlukan permission tambahan" |  |

---

## API Endpoint

```
GET /api/pinterest/boards
Response:
{
  "boards": [
    { "id": "board_id", "name": "Public Board", "privacy": "public" },
    { "id": "secret_board_id", "name": "Private Board", "privacy": "secret" }
  ],
  "hasSecretScope": true
}
```

---

*Dokumen ini dibuat untuk Sahabat Kreator.*
