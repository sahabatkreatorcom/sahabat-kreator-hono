// Halaman Compose — buat konten multi-platform dengan jadwal
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  CloudCheck,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { AiComposerPanel } from "@/components/compose/ai-panel";
import { CsvImportPanel } from "@/components/compose/csv-import-panel";
import { type EditableMedia, ImageEditorModal } from "@/components/compose/image-editor-modal";
import { OptimalTimesPanel } from "@/components/compose/optimal-times-panel";
import { PlatformPreviews } from "@/components/compose/platform-previews";
import {
  buildPlatformSettings,
  PlatformSettingsPanel,
  type SettingsState,
} from "@/components/compose/platform-settings-panel";
import { PredictScoreBadge } from "@/components/compose/predict-score-badge";
import { ProductPicker } from "@/components/compose/product-picker";
import { SoundPicker, type SoundTrack } from "@/components/compose/sound-picker";
import { StrategyAssetsPanel } from "@/components/compose/strategy-assets-panel";
import { UtmPanel } from "@/components/compose/utm-panel";
import { ValidationPanel, validatePost } from "@/components/compose/validation-panel";
import { VariationsPanel } from "@/components/compose/variations-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useComposeDraft } from "@/hooks/use-compose-draft";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { meQueryOptions } from "@/layouts/require-auth";
import { api } from "@/lib/api";
import { PLATFORMS } from "@/lib/platforms";

type Account = {
  id: string;
  platform: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isConnected: boolean;
};

// ---- Tipe Web App Launch Handler (file_handlers PWA) — belum ada di lib.dom ----
declare global {
  interface LaunchParams {
    files?: FileSystemFileHandle[];
  }
  interface LaunchQueue {
    setConsumer(consumer: (launchParams: LaunchParams) => void): void;
  }
  interface Window {
    launchQueue?: LaunchQueue;
  }
}

type MediaItem = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  name?: string;
  width?: number | null;
  height?: number | null;
  /** Durasi video dalam detik — null bila bukan video / tidak diketahui */
  durationSeconds?: number | null;
};

/** Opsi resize cepat per platform — dimensi ditangani server (sharp) */
const RESIZE_PRESETS = [
  { platform: "instagram", postType: "feed" as const, label: "IG Feed 4:5" },
  { platform: "instagram", postType: "story" as const, label: "IG Story 9:16" },
  { platform: "tiktok", label: "TikTok 9:16" },
  { platform: "youtube", label: "YouTube 16:9" },
  { platform: "linkedin", label: "LinkedIn 1.91:1" },
];

/** Konflik jadwal dari endpoint /posts/conflicts */
type ScheduleConflict = {
  socialAccountId: string;
  platform: string;
  accountUsername: string;
  postA: { id: string; caption: string; scheduledAt: string };
  postB: { id: string; caption: string; scheduledAt: string };
  deltaMinutes: number;
};

/** Batas karakter per platform */
const CHAR_LIMITS: Record<string, number> = {
  instagram: 2200,
  facebook: 63206,
  x: 280,
  linkedin: 3000,
  tiktok: 2200,
  youtube: 5000,
  threads: 500,
  pinterest: 500,
  manual: 5000,
};

/** Default jadwal: besok jam 09:00 (format datetime-local) */
function defaultScheduledAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ComposePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState("");
  // Sound terpilih untuk konten video (TikTok/Reels)
  const [soundTrack, setSoundTrack] = useState<SoundTrack | null>(null);
  // Produk yang di-tag ke konten
  const [productIds, setProductIds] = useState<string[]>([]);
  // Variasi caption per platform — accountId → custom caption (kosong = caption utama)
  const [variations, setVariations] = useState<Record<string, string>>({});
  // Pengaturan khusus per platform (first comment, TikTok privacy, YouTube, dll)
  const [platformSettings, setPlatformSettings] = useState<Record<string, SettingsState>>({});
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule" | "draft">("schedule");
  const [scheduledAt, setScheduledAt] = useState(() => defaultScheduledAt());

  const { data: meData } = useQuery(meQueryOptions);
  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.get<{ accounts: Account[] }>("/accounts"),
  });
  const { data: mediaData } = useQuery({
    queryKey: ["media"],
    queryFn: () => api.get<{ items: MediaItem[] }>("/media"),
  });

  const accounts = (accountsData?.accounts ?? []).filter((a) => a.isConnected);

  // Pre-select akun dari query param
  const preselect = params.get("account");
  const preselectApplied = useState(() => {
    if (preselect) setSelectedAccounts([preselect]);
    return true;
  })[0];
  void preselectApplied;

  // Draft autosave + restore (per org aktif)
  const orgId = meData?.organization?.id ?? null;
  const draftState = {
    content,
    mediaIds,
    scheduledAt: scheduleMode === "schedule" ? scheduledAt : null,
    accountIds: selectedAccounts,
    platformSettings,
  };
  const { savedAt, restoredDraft, clearDraft } = useComposeDraft(orgId, draftState, {
    // User membuang draft → reset editor ke kondisi awal
    onDiscard: () => {
      setContent("");
      setMediaIds([]);
      setScheduledAt(defaultScheduledAt());
      setSelectedAccounts(preselect ? [preselect] : []);
      setPlatformSettings({});
    },
  });

  // Pre-fill konten dari navigate state (mis. "Pakai ide" dari halaman tren).
  // State dibersihkan via navigate replace agar refresh/back tidak mengisi ulang.
  const prefilledContent = (location.state as { content?: string } | null)?.content ?? null;

  // Flag "prefill aktif" — mencegah restore draft lokal menimpa ide yang
  // baru saja dipilih user dari halaman tren.
  const prefillActive = prefilledContent !== null;

  useEffect(() => {
    if (!prefilledContent) return;
    setContent(prefilledContent);
    navigate(location.pathname, { replace: true, state: null });
  }, [prefilledContent, location.pathname, navigate]);

  // Terapkan draft yang dipulihkan ke state compose (sekali) — kecuali saat
  // user baru tiba dengan prefill dari halaman tren (ide menang atas draft)
  useEffect(() => {
    if (!restoredDraft || prefillActive) return;
    if (restoredDraft.content.trim() !== "") setContent(restoredDraft.content);
    if (restoredDraft.mediaIds.length > 0) setMediaIds(restoredDraft.mediaIds);
    if (restoredDraft.scheduledAt) setScheduledAt(restoredDraft.scheduledAt);
    if (restoredDraft.accountIds.length > 0) {
      setSelectedAccounts(restoredDraft.accountIds);
    }
    if (Object.keys(restoredDraft.platformSettings).length > 0) {
      setPlatformSettings(restoredDraft.platformSettings);
    }
  }, [restoredDraft, prefillActive]);

  const createPost = useMutation({
    mutationFn: (payload: unknown) => api.post("/posts", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-posts"] });
      // Post sukses dibuat — draft tidak lagi diperlukan
      clearDraft();
      // Izinkan navigasi ke calendar tanpa konfirmasi (state belum re-render)
      allowNextNavigation();
      toast.success("Konten berhasil disimpan");
      navigate("/calendar");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Guard perubahan belum tersimpan — cegah navigasi & reload.
  // hasChanges = konten terisi atau ada media; nonaktif saat submit pending.
  const hasChanges = content.trim() !== "" || mediaIds.length > 0;
  const { allowNext: allowNextNavigation } = useUnsavedChanges(hasChanges && !createPost.isPending);

  const uploadMedia = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload<{ media: MediaItem }>("/media/upload", formData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      setMediaIds((ids) => [...ids, data.media.id]);
      toast.success("Media diupload");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // File handler PWA — file dibuka via "Buka dengan Sahabat Kreator" dari OS
  // (manifest file_handlers) langsung di-upload & dilampirkan ke compose,
  // memakai alur upload yang sama dengan input file.
  useEffect(() => {
    if (!("launchQueue" in window) || !window.launchQueue) return;
    window.launchQueue.setConsumer(async (launchParams) => {
      if (!launchParams.files?.length) return;
      for (const handle of launchParams.files) {
        try {
          const file = await handle.getFile();
          uploadMedia.mutate(file);
        } catch {
          toast.error("Gagal membuka file yang dibagikan");
        }
      }
    });
  }, [uploadMedia]);

  // Media yang sedang diedit di image editor modal
  const [editingMedia, setEditingMedia] = useState<EditableMedia | null>(null);

  // Resize gambar ke dimensi platform via sharp di server
  const resizeMedia = useMutation({
    mutationFn: (vars: { mediaId: string; preset: (typeof RESIZE_PRESETS)[number] }) =>
      api.post<{ media: MediaItem }>("/media/resize", {
        mediaId: vars.mediaId,
        platform: vars.preset.platform,
        ...(vars.preset.postType ? { postType: vars.preset.postType } : {}),
      }),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      // Ganti media lama dengan hasil resize di compose state
      setMediaIds((ids) => ids.map((id) => (id === vars.mediaId ? data.media.id : id)));
      toast.success(`Media di-resize ke ${vars.preset.label}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleAccount(id: string) {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  /** Cek konflik jadwal (±10 menit di akun yang sama) sebelum simpan.
   * Hanya peringatan — user boleh tetap lanjut. Return false bila user batal. */
  async function confirmScheduleConflict(): Promise<boolean> {
    if (scheduleMode !== "schedule" || !scheduledAt) return true;
    const target = new Date(scheduledAt);
    if (Number.isNaN(target.getTime())) return true;

    const from = new Date(target.getTime() - 15 * 60_000).toISOString();
    const to = new Date(target.getTime() + 15 * 60_000).toISOString();
    try {
      const data = await api.get<{ conflicts: ScheduleConflict[] }>(
        `/posts/conflicts?from=${from}&to=${to}&candidateAt=${target.toISOString()}&accountIds=${selectedAccounts.join(",")}`,
      );
      const hits = (data.conflicts ?? []).filter((c) =>
        selectedAccounts.includes(c.socialAccountId),
      );
      if (hits.length === 0) return true;

      // Sisi post lain = pasangan yang bukan post kandidat (id "")
      const hit = hits[0]!;
      const other = hit.postA.id === "" ? hit.postB : hit.postA;
      const time = new Date(other.scheduledAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return window.confirm(
        `Post lain sudah dijadwal pada ${time} di akun @${hit.accountUsername} (selisih ${hit.deltaMinutes} menit). Tetap simpan?`,
      );
    } catch {
      // Endpoint tidak tersedia / gagal — jangan blokir penyimpanan
      return true;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (selectedAccounts.length === 0) {
      toast.error("Pilih minimal satu akun social media");
      return;
    }
    if (!content.trim() && mediaIds.length === 0) {
      toast.error("Tulis konten atau lampirkan media");
      return;
    }

    // Peringatan konflik jadwal — user boleh lanjut (return false = batal simpan)
    if (!(await confirmScheduleConflict())) return;

    const tags = hashtags
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);

    createPost.mutate({
      content,
      scheduledAt: scheduleMode === "schedule" ? new Date(scheduledAt).toISOString() : null,
      audioTrackId: soundTrack?.id ?? null,
      productIds,
      items: selectedAccounts.map((socialAccountId) => {
        const variation = variations[socialAccountId]?.trim();
        const account = accounts.find((a) => a.id === socialAccountId);
        const settings = platformSettings[socialAccountId];
        return {
          socialAccountId,
          // Custom caption per platform bila diisi — fallback caption utama
          content: variation || content,
          hashtags: tags,
          mediaIds,
          // First comment (IG/FB/TikTok) — dikirim bila diisi
          firstComment: settings?.firstComment?.trim() || undefined,
          // Pengaturan khusus platform (TikTok privacy, YouTube title, dll)
          platformSettings: account ? buildPlatformSettings(account.platform, settings) : undefined,
        };
      }),
    });
  }

  const mediaItems = mediaData?.items ?? [];
  const selectedMedia = mediaItems.filter((m) => mediaIds.includes(m.id));

  // Platform dominan untuk konteks AI (platform akun pertama terpilih)
  const aiPlatform = accounts.find((a) => a.id === selectedAccounts[0])?.platform ?? "instagram";

  // Akun yang dipilih (objek penuh) — untuk preview & validasi
  const selectedAccountObjects = accounts.filter((a) => selectedAccounts.includes(a.id));

  // Validasi client-side — error memblokir tombol publish
  const validationIssues = validatePost({
    content,
    hashtags,
    variations,
    platformSettings,
    accounts: selectedAccountObjects.map((a) => ({
      id: a.id,
      platform: a.platform,
      username: a.username,
    })),
    media: selectedMedia,
    scheduledAt: scheduleMode === "schedule" ? scheduledAt : null,
    scheduleMode,
  });
  const hasValidationErrors = validationIssues.some((issue) => issue.severity === "error");

  // Waktu autosave terakhir untuk indikator "Tersimpan HH:MM"
  const savedAtLabel = savedAt
    ? new Date(savedAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl">Buat Konten</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            Tulis sekali, tayang di semua platform terpilih
          </p>
        </div>
        {savedAtLabel && (
          <span
            className="flex items-center gap-1.5 rounded-full border border-[var(--border-light)] px-2.5 py-1 text-[var(--text-muted)] text-xs"
            title={`Draft tersimpan otomatis pukul ${savedAtLabel} (lokal di perangkat ini)`}
          >
            <CloudCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Tersimpan {savedAtLabel}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Editor utama */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pilih akun */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Pilih Akun</h2>
              {accounts.length > 0 && (
                <span className="text-[var(--text-muted)] text-xs">
                  {selectedAccounts.length}/{accounts.length} dipilih
                </span>
              )}
            </div>
            {accounts.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm">
                Belum ada akun terhubung. Hubungkan akun Anda terlebih dahulu di halaman Akun
                Sosmed.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {accounts.map((account) => {
                  const cfg = PLATFORMS[account.platform as keyof typeof PLATFORMS];
                  const Icon = cfg?.icon;
                  const selected = selectedAccounts.includes(account.id);
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => toggleAccount(account.id)}
                      className={`flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition-colors ${
                        selected
                          ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)] font-medium"
                          : "border-[var(--border)] hover:border-[var(--accent-gold)]"
                      }`}
                    >
                      {account.avatarUrl ? (
                        <img
                          src={account.avatarUrl}
                          alt={account.username}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        Icon && (
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${cfg.color}1a` }}
                          >
                            <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                          </span>
                        )
                      )}
                      @{account.username}
                      {selected ? (
                        <Check className="h-3.5 w-3.5 text-[var(--accent-gold)]" />
                      ) : (
                        cfg && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cfg.color }}
                            title={cfg.label}
                          />
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Konten */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Konten</h2>
              <span className="text-[var(--text-muted)] text-xs">{content.length} karakter</span>
            </div>
            <Textarea
              placeholder="Tulis caption Anda di sini... gunakan {emoji} untuk menyemangati!"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(CHAR_LIMITS)
                .filter(([platform]) =>
                  selectedAccounts.some(
                    (id) => accounts.find((a) => a.id === id)?.platform === platform,
                  ),
                )
                .map(([platform, limit]) => (
                  <Badge
                    key={platform}
                    variant={content.length > limit ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {PLATFORMS[platform as keyof typeof PLATFORMS]?.label ?? platform}:{" "}
                    {content.length}/{limit}
                  </Badge>
                ))}
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="hashtags">Hashtag</Label>
              <Input
                id="hashtags"
                placeholder="kontenkreator, tipsmarketing, sahabatkreator"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
            </div>
          </div>

          {/* Variasi caption per platform */}
          <VariationsPanel
            selectedAccounts={selectedAccounts}
            accounts={accounts.map((a) => ({
              id: a.id,
              platform: a.platform,
              username: a.username,
            }))}
            variations={variations}
            onChange={setVariations}
            baseContent={content}
          />

          {/* Media */}
          <div className="card p-6">
            <h2 className="mb-4 font-semibold">Media</h2>
            <div className="flex flex-wrap items-center gap-3">
              {selectedMedia.map((m) => {
                const isImage = m.mimeType.startsWith("image/");
                return (
                  <div key={m.id} className="group relative">
                    {isImage ? (
                      <img
                        src={m.url}
                        alt={m.name ?? m.filename}
                        className="h-20 w-20 rounded-[var(--radius-md)] object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] text-xs">
                        video
                      </div>
                    )}
                    {/* Aksi media (hover): edit gambar, hapus */}
                    <div className="absolute inset-x-0 bottom-0 hidden justify-center gap-1 rounded-b-[var(--radius-md)] bg-black/60 p-1 group-hover:flex">
                      {isImage && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingMedia({
                              id: m.id,
                              name: m.name ?? m.filename,
                              url: m.url,
                            })
                          }
                          className="rounded-full bg-white/20 p-1 text-white hover:bg-white/40"
                          aria-label="Edit gambar"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setMediaIds((ids) => ids.filter((i) => i !== m.id))}
                        className="rounded-full bg-white/20 p-1 text-white hover:bg-red-500"
                        aria-label="Hapus media"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border-2 border-[var(--border)] border-dashed text-[var(--text-muted)] hover:border-[var(--accent-gold)]">
                {uploadMedia.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
                <span className="text-[10px]">Upload</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/wav"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadMedia.mutate(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {/* Auto-resize gambar terpilih ke dimensi platform */}
            {selectedMedia.some((m) => m.mimeType.startsWith("image/")) && (
              <div className="mt-4 space-y-2 border-[var(--border-light)] border-t pt-4">
                <p className="font-medium text-[var(--text-secondary)] text-xs">
                  Resize Otomatis per Platform
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {RESIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      disabled={resizeMedia.isPending}
                      onClick={() => {
                        const firstImage = selectedMedia.find((m) =>
                          m.mimeType.startsWith("image/"),
                        );
                        if (!firstImage) return;
                        resizeMedia.mutate({
                          mediaId: firstImage.id,
                          preset,
                        });
                      }}
                      className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs transition-colors hover:border-[var(--accent-gold)] disabled:opacity-50"
                      title={`Resize gambar pertama terpilih ke dimensi ${preset.label} — dibuat sebagai media baru`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Diterapkan ke gambar pertama terpilih. Membuat salinan baru — media asli tetap
                  tersimpan.
                </p>
              </div>
            )}
          </div>

          {/* Pengaturan platform — dipindah ke kolom utama (bawah Media) */}
          <PlatformSettingsPanel
            accounts={accounts}
            selectedAccountIds={selectedAccounts}
            settings={platformSettings}
            onChange={(accountId, next) =>
              setPlatformSettings((prev) => ({ ...prev, [accountId]: next }))
            }
          />

          {/* Publikasi — dipindah ke kolom utama (bawah Media) */}
          <div className="card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Publikasi</h2>
              {/* Prediksi skor engagement — update live saat konten berubah */}
              <PredictScoreBadge
                content={content}
                hashtags={hashtags}
                platforms={selectedAccounts.map(
                  (id) => accounts.find((a) => a.id === id)?.platform ?? "instagram",
                )}
                hasMedia={mediaIds.length > 0}
                scheduledHour={
                  scheduleMode === "schedule" && scheduledAt
                    ? new Date(scheduledAt).getHours()
                    : new Date().getHours()
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "now", label: "Sekarang", icon: Send },
                  { value: "schedule", label: "Jadwalkan", icon: CalendarClock },
                  { value: "draft", label: "Draft", icon: Save },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setScheduleMode(opt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border px-2 py-3 text-xs ${
                    scheduleMode === opt.value
                      ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)] font-medium"
                      : "border-[var(--border)] hover:border-[var(--accent-gold)]"
                  }`}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              ))}
            </div>

            {scheduleMode === "schedule" && (
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Tanggal & Waktu</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
                <p className="text-[var(--text-muted)] text-xs">Zona waktu: Asia/Jakarta (WIB)</p>
              </div>
            )}
          </div>

          {/* Panel validasi — error memblokir publish */}
          <ValidationPanel issues={validationIssues} />
        </div>

        {/* Panel publish */}
        <div className="space-y-4">
          <AiComposerPanel
            platform={aiPlatform}
            content={content}
            hashtags={hashtags}
            onApplyContent={setContent}
            onApplyHashtags={setHashtags}
          />

          <StrategyAssetsPanel
            onApplyTemplate={(templateContent, templateHashtags) => {
              setContent(templateContent);
              const current = hashtags
                .split(/[,\s]+/)
                .map((t) => t.replace(/^#/, "").trim())
                .filter(Boolean);
              const merged = [...new Set([...current, ...templateHashtags])];
              setHashtags(merged.join(", "));
              toast.success("Template diterapkan");
            }}
            onApplyHashtags={(collectionTags) => {
              const current = hashtags
                .split(/[,\s]+/)
                .map((t) => t.replace(/^#/, "").trim())
                .filter(Boolean);
              const merged = [...new Set([...current, ...collectionTags])];
              setHashtags(merged.join(", "));
            }}
          />

          {scheduleMode === "schedule" && (
            <OptimalTimesPanel
              platform={aiPlatform}
              onSelect={(localDateTime) => {
                setScheduledAt(localDateTime);
                toast.success("Jadwal diperbarui dari saran waktu terbaik");
              }}
            />
          )}

          <UtmPanel content={content} onApplyContent={setContent} />

          <SoundPicker selectedTrackId={soundTrack?.id ?? null} onSelect={setSoundTrack} />
          <ProductPicker selectedIds={productIds} onChange={setProductIds} />

          {/* Live preview per platform terpilih */}
          <PlatformPreviews
            accounts={accounts}
            selectedAccountIds={selectedAccounts}
            content={content}
            variations={variations}
            media={selectedMedia}
          />

          <div className="card space-y-3 p-4 lg:sticky lg:bottom-4">
            {/* Ringkasan target publish */}
            {selectedAccounts.length > 0 && (
              <p className="text-[var(--text-muted)] text-xs">
                Akan dipublikasikan ke{" "}
                <span className="font-medium text-[var(--text-secondary)]">
                  {selectedAccounts.length} akun
                </span>
                {mediaIds.length > 0 && ` · ${mediaIds.length} media`}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createPost.isPending || hasValidationErrors}
              title={
                hasValidationErrors ? "Perbaiki error validasi sebelum publish" : undefined
              }
            >
              {createPost.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : scheduleMode === "now" ? (
                <Send className="h-4 w-4" />
              ) : scheduleMode === "schedule" ? (
                <CalendarClock className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {scheduleMode === "now"
                ? "Posting Sekarang"
                : scheduleMode === "schedule"
                  ? "Jadwalkan"
                  : "Simpan Draft"}
            </Button>
          </div>
        </div>
      </form>

      {/* Import massal CSV */}
      <CsvImportPanel />

      {/* Image editor modal — edit gambar sebelum dipakai */}
      <ImageEditorModal
        media={editingMedia}
        onClose={() => setEditingMedia(null)}
        onSaved={(newMedia) => {
          queryClient.invalidateQueries({ queryKey: ["media"] });
          // Ganti media lama dengan hasil edit di compose state
          if (editingMedia) {
            setMediaIds((ids) => ids.map((id) => (id === editingMedia.id ? newMedia.id : id)));
          }
          setEditingMedia(null);
        }}
      />
    </div>
  );
}
