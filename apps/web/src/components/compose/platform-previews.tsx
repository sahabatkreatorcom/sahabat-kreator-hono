// Live preview per platform di Compose — tampilan visual konten sebelum publish.
// Tab per platform terpilih (maks 4 tab, sisanya dropdown). Style khusus IG (frame HP)
// & Threads (minimal), platform lain pakai kartu seragam.

import {
  Bookmark,
  ChevronDown,
  Eye,
  Heart,
  ImagePlus,
  MessageCircle,
  Repeat2,
  Send,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";

/** Maksimum tab yang tampil — sisanya masuk dropdown */
const MAX_TABS = 4;

/** Mapping ukuran avatar ke class Tailwind statis (hindari class dinamis) */
const AVATAR_SIZES = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-9 w-9",
} as const;

export type PreviewAccount = {
  id: string;
  platform: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type PreviewMedia = {
  id: string;
  url: string;
  mimeType: string;
  name?: string;
  filename: string;
  /** Dimensi asli media (piksel) — untuk deteksi rasio preview */
  width?: number | null;
  height?: number | null;
};

/** Rasio media untuk preview umum — tiktok 9:16, youtube 16:9, sisanya 1:1 */
function genericAspect(platform: string): "square" | "portrait" | "landscape" {
  if (platform === "tiktok") return "portrait";
  if (platform === "youtube") return "landscape";
  return "square";
}

/** Rasio media untuk preview IG — deteksi dari dimensi: vertikal 4:5, sisanya 1:1 */
function instagramAspect(media: PreviewMedia | undefined): "square" | "portrait" {
  if (!media) return "square";
  if (media.width && media.height && media.height > media.width) return "portrait";
  if (!media.width || !media.height) return "portrait"; // default feed IG 4:5
  return "square";
}

const ASPECT_CLASS: Record<"square" | "portrait" | "landscape", string> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-video",
};

/** Untuk platform non-IG (tiktok), rasio portrait pakai 9:16 */
const ASPECT_CLASS_TALL: Record<"square" | "portrait" | "landscape", string> = {
  square: "aspect-square",
  portrait: "aspect-[9/16]",
  landscape: "aspect-video",
};

/** Format angka singkat ala sosmed — 1200 → 1,2 rb, 3500000 → 3,5 jt */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".", ",")} rb`;
  return String(n);
}

/** Caption efektif akun — variasi custom bila ada, fallback caption utama */
function effectiveCaption(
  account: PreviewAccount,
  baseContent: string,
  variations: Record<string, string>,
): string {
  const variation = variations[account.id]?.trim();
  return variation || baseContent;
}

/** Media terpilih — gambar dipreview langsung, video pakai elemen video + kontrol */
function MediaPreview({
  media,
  aspect,
  tall,
}: {
  media: PreviewMedia | undefined;
  aspect: "square" | "portrait" | "landscape";
  /** true = portrait pakai 9:16 (TikTok), false = 4:5 (IG) */
  tall: boolean;
}) {
  const aspectClass = tall ? ASPECT_CLASS_TALL[aspect] : ASPECT_CLASS[aspect];

  if (!media) {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 bg-[var(--bg-tertiary)] text-[var(--text-muted)]",
          aspectClass,
        )}
      >
        <ImagePlus className="h-8 w-8" />
        <span className="text-xs">Belum ada media</span>
      </div>
    );
  }
  if (media.mimeType.startsWith("image/")) {
    return (
      <div className={cn("w-full overflow-hidden bg-[var(--bg-tertiary)]", aspectClass)}>
        <img
          src={media.url}
          alt={media.name ?? media.filename}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  if (media.mimeType.startsWith("video/")) {
    return (
      <div className={cn("w-full overflow-hidden bg-black", aspectClass)}>
        {/* Muted default ala preview sosmed — user bisa unmute via kontrol */}
        <video
          src={media.url}
          controls
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  // Audio / tipe lain — tampilkan nama file
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-1 bg-[var(--bg-tertiary)] px-4 text-center text-[var(--text-muted)]",
        aspectClass,
      )}
    >
      <span className="font-medium text-[var(--text-secondary)] text-xs">
        {media.name ?? media.filename}
      </span>
      <span className="text-[10px]">{media.mimeType}</span>
    </div>
  );
}

/** Caption dengan line-clamp 3 + tombol "selengkapnya" untuk expand */
function ClampedCaption({ caption }: { caption: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!caption.trim()) {
    return <p className="text-[var(--text-muted)] text-sm italic">Tanpa caption</p>;
  }
  return (
    <div>
      <p className={cn("text-[var(--text-secondary)] text-sm", !expanded && "line-clamp-3")}>
        {caption}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-0.5 text-[var(--text-muted)] text-xs hover:text-[var(--accent-gold)]"
      >
        {expanded ? "tutup" : "selengkapnya"}
      </button>
    </div>
  );
}

/** Avatar bulat dengan ring gradient — fallback inisial username bila tanpa avatarUrl */
function Avatar({
  account,
  size = "md",
}: {
  account: PreviewAccount;
  size?: keyof typeof AVATAR_SIZES;
}) {
  if (account.avatarUrl) {
    return (
      <img
        src={account.avatarUrl}
        alt={account.username}
        className={cn("rounded-full object-cover", AVATAR_SIZES[size])}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-pink)] font-semibold text-white text-xs",
        AVATAR_SIZES[size],
      )}
      aria-hidden
    >
      {account.username.slice(0, 1).toUpperCase()}
    </div>
  );
}

/** Nama tampilan untuk header preview */
function displayName(account: PreviewAccount): string {
  return account.displayName?.trim() || `@${account.username}`;
}

// ---------------------------------------------------------------------------
// Preview Instagram — frame HP
// ---------------------------------------------------------------------------

function InstagramPreview({
  account,
  caption,
  media,
}: {
  account: PreviewAccount;
  caption: string;
  media: PreviewMedia | undefined;
}) {
  const aspect = instagramAspect(media);
  // Likes placeholder 0 — post belum terpublish
  const likes = 0;

  return (
    <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-[28px] border-[6px] border-[var(--brand-navy)] bg-[var(--bg-secondary)] shadow-md">
      {/* Header — avatar dengan ring gradient + username */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]">
          <Avatar account={account} size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--text-primary)] text-xs">
            {displayName(account)}
          </p>
          <p className="truncate text-[10px] text-[var(--text-muted)]">@{account.username}</p>
        </div>
        <span className="text-[var(--text-muted)]">···</span>
      </div>

      {/* Media — rasio 1:1 atau 4:5 dari media terpilih */}
      <MediaPreview media={media} aspect={aspect} tall={false} />

      {/* Baris ikon */}
      <div className="flex items-center justify-between px-3 pt-2.5 text-[var(--text-primary)]">
        <span className="flex items-center gap-3.5">
          <Heart className="h-5 w-5" />
          <MessageCircle className="h-5 w-5" />
          <Send className="h-5 w-5" />
        </span>
        <Bookmark className="h-5 w-5" />
      </div>

      {/* Count likes singkat */}
      <div className="px-3 pt-1.5">
        <p className="font-semibold text-[var(--text-primary)] text-xs">
          {formatCount(likes)} suka
        </p>
      </div>

      {/* Caption — 3 baris + selengkapnya */}
      <div className="px-3 pt-1 pb-3">
        <ClampedCaption caption={caption} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview Threads — minimal, tanpa frame HP, teks utama besar
// ---------------------------------------------------------------------------

function ThreadsPreview({
  account,
  caption,
  media,
}: {
  account: PreviewAccount;
  caption: string;
  media: PreviewMedia | undefined;
}) {
  return (
    <div className="mx-auto w-full max-w-[380px] space-y-3">
      {/* Header — avatar + nama */}
      <div className="flex items-center gap-2.5">
        <Avatar account={account} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--text-primary)] text-sm">
            {displayName(account)}
          </p>
          <p className="truncate text-[var(--text-muted)] text-xs">
            @{account.username} · sekarang
          </p>
        </div>
      </div>

      {/* Teks utama besar — tanpa clamp agar terbaca utuh */}
      <div className="pl-[46px]">
        {caption.trim() ? (
          <p className="text-[15px] text-[var(--text-primary)] leading-relaxed">{caption}</p>
        ) : (
          <p className="text-[15px] text-[var(--text-muted)] italic">Tanpa caption</p>
        )}

        {/* Media opsional — rasio square */}
        {media && (
          <div className="mt-3 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-light)]">
            <MediaPreview media={media} aspect="square" tall={false} />
          </div>
        )}

        {/* Reply count */}
        <div className="mt-2.5 flex items-center gap-4 text-[var(--text-muted)]">
          <Heart className="h-4 w-4" />
          <Repeat2 className="h-4 w-4" />
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">0 balasan</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview umum — facebook, tiktok, youtube, linkedin, pinterest, bluesky, gbp
// ---------------------------------------------------------------------------

function GenericPreview({
  platform,
  account,
  caption,
  media,
}: {
  platform: string;
  account: PreviewAccount;
  caption: string;
  media: PreviewMedia | undefined;
}) {
  const cfg = PLATFORMS[platform as keyof typeof PLATFORMS];
  const Icon = cfg?.icon;
  const label = cfg?.label ?? platform;
  const aspect = genericAspect(platform);
  const tall = platform === "tiktok";

  return (
    <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-secondary)]">
      {/* Header — icon platform + label + username */}
      <div className="flex items-center gap-2.5 border-[var(--border-light)] border-b px-4 py-3">
        {Icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-tertiary)]"
            style={{ color: cfg?.color }}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--text-primary)] text-sm">
            {displayName(account)}
          </p>
          <p className="truncate text-[var(--text-muted)] text-xs">@{account.username}</p>
        </div>
        {/* Badge platform — dot warna + label */}
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 font-medium text-[10px] text-[var(--text-secondary)]">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: cfg?.color ?? "var(--text-muted)" }}
          />
          {label}
        </span>
      </div>

      {/* Media — rasio menyesuaikan platform */}
      <MediaPreview media={media} aspect={aspect} tall={tall} />

      {/* Caption dengan line-clamp 3 */}
      <div className="space-y-2 px-4 py-3">
        <ClampedCaption caption={caption} />
        {/* Baris engagement ringan agar terlihat seperti kartu sosmed */}
        <div className="flex items-center gap-3 border-[var(--border-light)] border-t pt-2 text-[var(--text-muted)]">
          <span className="flex items-center gap-1 text-xs">
            <ThumbsUp className="h-3.5 w-3.5" />
            {formatCount(0)}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <MessageCircle className="h-3.5 w-3.5" />
            {formatCount(0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel utama — tab per platform terpilih
// ---------------------------------------------------------------------------

export function PlatformPreviews({
  accounts,
  selectedAccountIds,
  content,
  variations,
  media,
}: {
  /** Daftar seluruh akun terhubung (untuk lookup username) */
  accounts: PreviewAccount[];
  /** Id akun yang dipilih di compose */
  selectedAccountIds: string[];
  /** Caption utama */
  content: string;
  /** Variasi caption custom per akun */
  variations: Record<string, string>;
  /** Media terpilih (sudah di-filter dari mediaIds) */
  media: PreviewMedia[];
}) {
  // State tab aktif — harus di atas sebelum early return (rules of hooks)
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  const selected = accounts.filter((a) => selectedAccountIds.includes(a.id));
  const hasContent = content.trim().length > 0;
  const hasMedia = media.length > 0;

  // Panel hanya muncul saat ada akun terpilih & ada konten/media
  if (selected.length === 0 || (!hasContent && !hasMedia)) {
    return null;
  }

  // Dedup per platform — satu tab per platform, akun pertama sebagai representatif
  const byPlatform = new Map<string, PreviewAccount>();
  for (const account of selected) {
    if (!byPlatform.has(account.platform)) {
      byPlatform.set(account.platform, account);
    }
  }
  const platforms = [...byPlatform.keys()];
  const visible = platforms.slice(0, MAX_TABS);
  const overflow = platforms.slice(MAX_TABS);

  // Fallback: tab pertama bila belum ada pilihan aktif / pilihan hilang
  const currentPlatform =
    activePlatform && platforms.includes(activePlatform) ? activePlatform : platforms[0];
  const currentAccount = byPlatform.get(currentPlatform);
  const currentCfg = PLATFORMS[currentPlatform as keyof typeof PLATFORMS];

  // Media pertama dipakai untuk preview
  const firstMedia = media[0];
  const caption = currentAccount ? effectiveCaption(currentAccount, content, variations) : content;

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Eye className="h-4 w-4 text-[var(--text-muted)]" />
        <h2 className="font-semibold">Preview</h2>
        <span className="text-[var(--text-muted)] text-xs">({platforms.length} platform)</span>
      </div>

      {/* Tab per platform — maks 4, sisanya dropdown */}
      <div className="mb-4 flex items-center gap-1.5">
        {visible.map((platform) => {
          const cfg = PLATFORMS[platform as keyof typeof PLATFORMS];
          const Icon = cfg?.icon;
          const isActive = platform === currentPlatform;
          return (
            <button
              key={platform}
              type="button"
              onClick={() => setActivePlatform(platform)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                isActive
                  ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)] font-medium"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]",
              )}
              aria-pressed={isActive}
            >
              {Icon && <Icon className="h-3.5 w-3.5" style={{ color: cfg?.color }} />}
              {cfg?.label ?? platform}
            </button>
          );
        })}

        {overflow.length > 0 && (
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1.5 text-[var(--text-secondary)] text-xs transition-colors hover:border-[var(--accent-gold)]"
              >
                +{overflow.length}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            }
            contentClassName="min-w-[160px]"
          >
            {overflow.map((platform) => {
              const cfg = PLATFORMS[platform as keyof typeof PLATFORMS];
              const Icon = cfg?.icon;
              return (
                <DropdownItem key={platform} onClick={() => setActivePlatform(platform)}>
                  {Icon && <Icon className="h-3.5 w-3.5" style={{ color: cfg?.color }} />}
                  {cfg?.label ?? platform}
                </DropdownItem>
              );
            })}
          </Dropdown>
        )}
      </div>

      {/* Render preview sesuai platform aktif */}
      {currentAccount && (
        <div className="animate-fade-in" key={currentPlatform}>
          {currentPlatform === "instagram" || currentPlatform === "instagram_standalone" ? (
            <InstagramPreview account={currentAccount} caption={caption} media={firstMedia} />
          ) : currentPlatform === "threads" ? (
            <ThreadsPreview account={currentAccount} caption={caption} media={firstMedia} />
          ) : (
            <GenericPreview
              platform={currentPlatform}
              account={currentAccount}
              caption={caption}
              media={firstMedia}
            />
          )}
        </div>
      )}

      <p className="mt-4 text-center text-[11px] text-[var(--text-muted)]">
        Preview {currentCfg?.label ?? currentPlatform} bersifat ilustratif — tampilan final dapat
        sedikit berbeda di aplikasi platform.
      </p>
    </div>
  );
}
