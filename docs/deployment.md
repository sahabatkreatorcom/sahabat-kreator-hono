# Panduan Deploy — Sahabat Kreator

Dokumentasi deployment untuk **produksi** (`sahabatkreator.com`) dan **staging** (`app.sahabatkreator.com`).

---

## 1. Arsitektur

```
Internet
   │
   ▼
Cloudflare (proxy, SSL Full Strict)
   │
   ▼
NGINX host-level :443 (Cloudflare Origin Cert)
   ├── sahabatkreator.com        → 127.0.0.1:3001  (PROD, indexable)
   └── app.sahabatkreator.com    → 127.0.0.1:3002  (STAGING, noindex)
   │
   ▼
Docker Compose (per environment)
   ├── app     → Hono API + serve static web-dist (image: sahabatkreator-app)
   ├── worker  → BullMQ publisher (image sama, command berbeda)
   ├── migrate → drizzle-kit push + seed (jalan sekali per deploy)
   ├── redis   → antrean BullMQ (internal, tanpa port host)
   └── postgres (PROD SAJA) → PostgreSQL 18, data di volume postgres_data

Database: PRODUKSI = PostgreSQL 17 container (self-hosted di server)
          STAGING  = Neon Serverless Postgres (via DATABASE_URL)
Storage : Cloudflare R2
Email   : Resend
Billing : Sumopod Pay
```

**Poin penting:**
- Satu image Docker (`sahabatkreator-app`) untuk app / worker / migrate — hanya berbeda command di compose.
- Port 3000 dipakai aplikasi lain di server (toeflynk) — **jangan diganggu**.
- Redis & Postgres tanpa port host karena hanya di jaringan internal Docker.
- NGINX berjalan di host (bukan container) karena server menampung beberapa aplikasi.

---

## 2. Prasyarat

### Server
- Linux dengan Docker Engine + Docker Compose v2
- Port 80/443 bebas (NGINX sudah / akan berjalan)
- RAM minimal ±4 GB (app 1 GB + worker 1.5 GB limit + sistem + aplikasi lain)

### Layanan eksternal (siapkan kredensialnya dulu)
| Layanan | Kegunaan | Yang dibutuhkan |
|---|---|---|
| **Neon** | Database Postgres **staging** | Connection string proyek Neon STAGING |
| **Cloudflare** | DNS + proxy + SSL | Akses ke domain `sahabatkreator.com`, buat **Origin Certificate** (`origin.crt` + `origin.key`) |
| **Cloudflare R2** | Storage media | Account ID, Access Key, Secret, Bucket, Public URL |
| **Resend** | Email transaksional | API Key + domain terverifikasi |
| **Sumopod Pay** | Billing | API Key produksi + Webhook Token (base URL `https://api-pay.sumopod.com`) |

### DNS Cloudflare (sebelum mulai)
| Record | Tipe | Nilai | Proxy |
|---|---|---|---|
| `sahabatkreator.com` | A | IP server | ✅ On (oranye) |
| `www.sahabatkreator.com` | CNAME | `sahabatkreator.com` | ✅ On |
| `app.sahabatkreator.com` | CNAME | `sahabatkreator.com` | ✅ On |

SSL/TLS mode: **Full (Strict)** + nyalakan **Always Use HTTPS**.

---

## 3. Deploy Produksi Pertama Kali

### 3.1 Siapkan source di server

```bash
git clone git@github.com:sahabatkreatorcom/sahabat-kreator-hono.git
cd sahabat-kreator-hono
```

### 3.2 Isi `.env.prod`

```bash
cp .env.prod.example .env.prod
```

Generate nilai yang wajib acak:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET
openssl rand -base64 32   # CRON_SECRET
openssl rand -base64 32   # ENCRYPTION_KEY
openssl rand -base64 24   # POSTGRES_PASSWORD
```

Yang **wajib** dicek sebelum lanjut:

| Variabel | Catatan |
|---|---|
| `POSTGRES_PASSWORD` | Password PostgreSQL produksi (container di server) — `DATABASE_URL` di-set otomatis oleh compose |
| `BETTER_AUTH_SECRET` | Min 32 karakter acak |
| `ENCRYPTION_KEY` | Base64 32-byte — dipakai enkripsi token OAuth user. **Jika berubah setelah go-live, semua koneksi platform invalid!** |
| `SUMOPOD_API_BASE_URL` | Harus `https://api-pay.sumopod.com` (BUKAN sandbox) |
| `RESEND_API_KEY` | Produksi |
| `R2_*` | Semua terisi |
| `GA_MEASUREMENT_ID` | ID GA4 (G-XXXXXXX) — build arg, tracking hanya di produksi |

Kredensial platform (META_APP_ID dll.) boleh kosong dulu — bisa diisi via **Admin Panel → Kredensial Platform** setelah aplikasi jalan.

> ⚠️ `.env.prod` sudah di-ignore git. JANGAN commit. Nilai kosong dianggap undefined.

### 3.3 Pasang NGINX + SSL

```bash
# Salin konfigurasi (file ada di root repo: sahabatkreator.conf)
sudo cp sahabatkreator.conf /etc/nginx/conf.d/sahabatkreator.conf

# Pasang Origin Certificate Cloudflare
sudo mkdir -p /etc/nginx/ssl
sudo cp origin.crt origin.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/origin.key

# Validasi & reload
sudo nginx -t && sudo systemctl reload nginx
```

### 3.4 Build & jalankan

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

> ⚠️ `--env-file .env.prod` **wajib** — compose membaca `POSTGRES_PASSWORD` (dan `GA_MEASUREMENT_ID`) dari sana untuk interpolasi. Tanpa itu deploy gagal dengan pesan error yang jelas (guard `:?`).

Urutan otomatis: `postgres` & `redis` sehat → `migrate` (drizzle-kit push --force + seed idempoten) → `app` + `worker`.

`DATABASE_URL` **tidak perlu diisi** di `.env.prod` — compose otomatis mengarahkannya ke container postgres internal (`postgresql://sahabatkreator:...@postgres:5432/sahabatkreator`).

### 3.5 Verifikasi

```bash
# Container semua jalan (postgres, redis, migrate exited 0, app, worker)
docker compose --env-file .env.prod -f docker-compose.prod.yml ps

# Health endpoint
curl -s https://sahabatkreator.com/health

# Robots.txt HARUS indexable (tidak ada "Disallow: /")
curl -s https://sahabatkreator.com/robots.txt

# Sitemap
curl -s https://sahabatkreator.com/sitemap.xml | head -5

# Cek service worker + manifest ter-load
curl -sI https://sahabatkreator.com/sw.js | head -3
curl -sI https://sahabatkreator.com/manifest.webmanifest | head -3

# Worker jalan (log tidak error)
docker logs sahabatkreator-worker --tail 50
```

Buka `https://sahabatkreator.com` di browser — halaman landing harus tampil, register/login harus berfungsi.

---

## 4. Deploy Staging (app.sahabatkreator.com)

Mirip produksi, dengan perbedaan:

```bash
cp .env.staging.example .env.staging
# Isi DATABASE_URL dengan proyek Neon STAGING (terpisah dari produksi!)

docker compose -f docker-compose.staging.yml up -d --build
```

Perbedaan build staging (otomatis dari compose):
- `SERVER_URL` = `https://app.sahabatkreator.com`
- `SITE_URL` (canonical) **tetap** `https://sahabatkreator.com` — canonical staging mengarah ke produksi agar tidak muncul duplikat di SERP
- `INDEXABLE` kosong → build web mendapat `robots.txt` Disallow + meta noindex
- `GA_MEASUREMENT_ID` kosong → tidak ada tracking di staging

Staging sudah terwakili di `sahabatkreator.conf` (upstream `127.0.0.1:3002` + `X-Robots-Tag: noindex` dari NGINX — lapisan ke-4).

---

## 5. Update / Redeploy

### Workflow standar (staging → produksi)

```bash
cd sahabat-kreator-hono
git pull origin main

# 1. Uji di staging dulu
docker compose -f docker-compose.staging.yml up -d --build

# 2. Setelah QA lolos, naikkan ke produksi
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

`docker compose up -d --build` otomatis:
1. Rebuild image (build web + server di dalam Docker)
2. Jalankan `migrate` (sync skema + seed) sebelum app/worker baru start
3. Restart app & worker dengan image baru

### Deploy hanya perubahan env (tanpa rebuild)

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --force-recreate
```

---

## 6. Rollback

Image Docker diberi tag `sahabatkreator-app:prod` (ditimpa tiap build). Untuk rollback cepat:

```bash
# Cek image lama yang masih ada di sistem
docker images

# Rollback ke commit tertentu (paling andal)
git log --oneline -10          # temukan commit terakhir yang sehat
git checkout <commit-sehat>
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

> ⚠️ **Catatan skema DB:** deploy memakai `drizzle-kit push --force` (sinkronisasi skema langsung). Push yang menghapus/mengubah kolom **bersifat destruktif dan tidak otomatis ter-rollback**. Untuk perubahan skema besar, backup dulu (lihat § 7).

### Backup database produksi (PostgreSQL container)

Data produksi ada di volume `postgres_data` — **tidak ada backup otomatis dari provider** (beda dengan Neon). Jadwalkan backup rutin:

```bash
# Backup harian (cron) — dump ke file host
docker exec sahabatkreator-postgres pg_dump -U sahabatkreator sahabatkreator \
  | gzip > /root/backups/sahabatkreator-$(date +%F).sql.gz

# Restore
gunzip -c /root/backups/sahabatkreator-2026-09-13.sql.gz \
  | docker exec -i sahabatkreator-postgres psql -U sahabatkreator -d sahabatkreator
```

---

## 7. Operasional Harian

### Log

```bash
docker logs sahabatkreator-app -f --tail 100      # API
docker logs sahabatkreator-worker -f --tail 100   # publisher worker
docker logs sahabatkreator-postgres --tail 50     # database
docker logs sahabatkreator-redis --tail 50        # antrean
sudo tail -f /var/log/nginx/access.log            # trafik (NGINX host)
```

### Health & resource

```bash
curl -s https://sahabatkreator.com/health
docker stats --no-stream     # cek RAM/CPU container (limit: app 1g/1.5cpu, worker 1.5g/1.5cpu)
df -h                        # disk (watch: growth volume redis_data)
```

### Restart service

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml restart app worker
```

### Endpoint khusus (butuh CRON_SECRET)

Beberapa endpoint internal (cron/fallback) memakai header `Authorization: Bearer $CRON_SECRET`. Lihat `apps/server/src/routes/` untuk detail.

---

## 8. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| 502 Bad Gateway | Container app belum sehat / mati | `docker compose --env-file .env.prod -f docker-compose.prod.yml ps`, cek log app, tunggu start_period 20s |
| Container migrate Exit 1 | `POSTGRES_PASSWORD` kosong / container postgres belum sehat | Cek `.env.prod` + `--env-file`, `docker logs <container-migrate>` |
| App connect DB gagal | `DATABASE_URL` tertimpa nilai salah di `.env.prod` | Hapus `DATABASE_URL` dari `.env.prod` — compose yang mengaturnya |
| SSL error dari Cloudflare | Origin cert salah / kadaluarsa | Pastikan `origin.crt`/`origin.key` valid di `/etc/nginx/ssl/`, mode SSL **Full (Strict)** |
| Email verifikasi tidak terkirim | `RESEND_API_KEY` kosong / domain belum diverifikasi | Dashboard Resend → Domain |
| Upload media gagal | R2 kredensial/bucket salah | Cek `R2_*`, test dari Admin Panel |
| Pembayaran lewat sandbox | `SUMOPOD_API_BASE_URL` masih sandbox | Ganti ke `https://api-pay.sumopod.com` + recreate container |
| Koneksi platform tiba-tiba invalid semua | `ENCRYPTION_KEY` berubah | Kembalikan nilai lama — key ini tidak boleh dirotasi sembarangan |
| Google mengindeks staging | — | Sudah dijaga 4 lapis (build guard, seo.ts runtime, middleware Hono, NGINX). Cek `curl -sI https://app.sahabatkreator.com` ada `X-Robots-Tag: noindex` |
| Webhook platform tidak masuk | Cloudflare/firewall blokir atau verify token salah | Cek Admin Panel → log webhook; pastikan callback URL terdaftar di developer console platform |
| `nginx: directive "real_ip_header" is duplicate` | Konflik dengan config aplikasi lain | `sahabatkreator.conf` sudah menaruh `real_ip_header` di dalam server block — jangan pindah ke level http |

---

## 9. Checklist Go-Live

- [ ] DNS Cloudflare aktif (apex, www, app) + proxy on + Full (Strict)
- [ ] `origin.crt` / `origin.key` terpasang di `/etc/nginx/ssl/`
- [ ] `.env.prod` lengkap: POSTGRES_PASSWORD, BETTER_AUTH_SECRET, ENCRYPTION_KEY, CRON_SECRET, Resend, R2, Sumopod **produksi**
- [ ] `docker compose --env-file .env.prod -f docker-compose.prod.yml ps` semua healthy
- [ ] Backup DB berjalan (pg_dump harian via cron — data ada di volume `postgres_data`, tidak ada backup provider)
- [ ] `/health` balas OK
- [ ] Register + login + verifikasi email berfungsi
- [ ] `robots.txt` indexable, `sitemap.xml` accessible
- [ ] `ENCRYPTION_KEY` disimpan backup aman (password manager) — wajib sama selamanya
- [ ] Backup `.env.prod` disimpan aman (tidak di repo)
- [ ] Staging deploy + noindex terverifikasi
- [ ] Setelah semua: submit sitemap ke Google Search Console
- [ ] Kredensial platform diisi via Admin Panel → Kredensial Platform
- [ ] Pengajuan API social platform mengikuti [docs/app-review-checklist.md](app-review-checklist.md)

---

## 10. Referensi File

| File | Peran |
|---|---|
| [Dockerfile](../Dockerfile) | Build image tunggal (deps → build web+server → runtime non-root) |
| [docker-compose.prod.yml](../docker-compose.prod.yml) | Orkestrasi produksi (redis, migrate, app :3001, worker) |
| [docker-compose.staging.yml](../docker-compose.staging.yml) | Orkestrasi staging (app :3002) |
| [sahabatkreator.conf](../sahabatkreator.conf) | NGINX host-level + Cloudflare real IP + noindex staging |
| [.env.prod.example](../.env.prod.example) | Template env produksi |
| [.env.staging.example](../.env.staging.example) | Template env staging |
| [docs/app-review-checklist.md](app-review-checklist.md) | Pengajuan akses API social platform |
