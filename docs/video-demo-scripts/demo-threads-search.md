# Video Demo Script: Threads Keyword Search

**Permission:** `threads_keyword_search`  
**Durasi target:** 2-3 menit  
**File name:** `demo-threads-search.mp4`

---

## ⚠️ Warnings
- Search hanya mencari postingan **publik**
- Rate limit: 500 searches per 24 jam per user
- Query minimal 1 karakter, maksimal 100 karakter

## ❌ Larangan (Jangan Ditampilkan)
- Jangan search hashtag sensitif/politik
- Jangan tampilkan access_token

---

## Scenes

### Scene 1: Connect Threads Account (25 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:00-0:10 | Halaman Connect Account | Klik "Connect Threads" |  |
| 0:10-0:20 | Consent Threads muncul | Grant permissions | Pastikan scope `threads_keyword_search` terlihat |
| 0:20-0:30 | Redirect balik | Tunjukkan profil Threads di dashboard |  |

### Scene 2: Buka Fitur Search (20 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 0:30-0:45 | Dashboard utama | Klik menu "Search" atau icon loupe | Atau langsung ke halaman search |
| 0:45-0:55 | Halaman search | Tunjukkan input field "Cari postingan Threads" | Placeholder text |
| 0:55-1:00 | Input query | Ketik: "kreator" atau topik relevan |  |

### Scene 3: Eksekusi Search & Tampilkan Hasil (40 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 1:00-1:15 | Tekan Enter/klik Search | Tunggu loading state | Spinner atau skeleton |
| 1:15-1:30 | Hasil search muncul | Scroll melalui hasil | Tunjukkan: author, caption, timestamp, like count |
| 1:30-1:45 | Detail satu hasil | Klik salah satu post | Modal/slide-in menampilkan full post |
| 1:45-2:00 | Navigasi ke Threads | Klik link ke post asli | Buka di tab baru, verify post ada di threads.net |

### Scene 4: Filter & Pagination (30 detik)

| Time | View | Action | Notes |
|------|------|--------|-------|
| 2:00-2:15 | Kembali ke hasil search | Tunjukkan filter (terbaru/terpopuler) | Dropdown sort options |
| 2:15-2:30 | Pagination | Scroll ke bawah atau klik "Load More" | Tunjukkan infinite scroll atau page numbers |
| 2:30-2:45 | Clear search | Klik "X" atau back | Bersihkan query |
| 2:45-3:00 | Demo error handling | Ketik query kosong → tunjukkan validasi error | Message: "Masukkan kata kunci pencarian" |

---

## Technical Notes

Response format dari API:
```json
{
  "results": [
    {
      "id": "threads_post_id",
      "text": "caption post",
      "created_time": "2026-09-10T10:00:00Z",
      "platform": "threads",
      "accountId": "social_account_id"
    }
  ],
  "platform": "threads",
  "total": 25
}
```

Endpoint: `GET /api/search/threads?q=<query>&limit=20`

---

*Dokumen ini dibuat untuk Sahabat Kreator.*
