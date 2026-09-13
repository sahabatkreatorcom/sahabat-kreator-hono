// Hook draft compose — autosave debounce ke localStorage per organisasi
// dan restore saat mount bila draft masih segar (<24 jam).
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { SettingsState } from "@/components/compose/platform-settings-panel";

/** Umur maksimum draft sebelum dianggap basi */
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 jam
/** Delay autosave setelah perubahan terakhir */
const AUTOSAVE_DEBOUNCE_MS = 2000;

export type ComposeDraft = {
  content: string;
  mediaIds: string[];
  scheduledAt: string | null;
  accountIds: string[];
  platformSettings: Record<string, SettingsState>;
  savedAt: number;
};

function draftKey(orgId: string): string {
  return `sk-compose-draft-${orgId}`;
}

/** Validasi bentuk draft yang dibaca dari localStorage (partial & defensif) */
function parseDraft(raw: string | null): ComposeDraft | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<ComposeDraft>;
    if (typeof data.content !== "string" || typeof data.savedAt !== "number") {
      return null;
    }
    return {
      content: data.content,
      mediaIds: Array.isArray(data.mediaIds)
        ? data.mediaIds.filter((id): id is string => typeof id === "string")
        : [],
      scheduledAt: typeof data.scheduledAt === "string" ? data.scheduledAt : null,
      accountIds: Array.isArray(data.accountIds)
        ? data.accountIds.filter((id): id is string => typeof id === "string")
        : [],
      platformSettings:
        data.platformSettings && typeof data.platformSettings === "object"
          ? (data.platformSettings as Record<string, SettingsState>)
          : {},
      savedAt: data.savedAt,
    };
  } catch {
    return null;
  }
}

export function useComposeDraft(
  orgId: string | null | undefined,
  draft: {
    content: string;
    mediaIds: string[];
    scheduledAt: string | null;
    accountIds: string[];
    platformSettings: Record<string, SettingsState>;
  },
  options?: {
    /** Dipanggil saat user membuang draft yang dipulihkan (reset editor) */
    onDiscard?: () => void;
  },
) {
  /** Waktu (epoch ms) autosave terakhir — untuk indikator "Tersimpan HH:MM" */
  const [savedAt, setSavedAt] = useState<number | null>(null);
  /** Draft yang dipulihkan saat mount (sekali), null bila tidak ada */
  const [restoredDraft, setRestoredDraft] = useState<ComposeDraft | null>(null);
  const restoredRef = useRef(false);
  const onDiscardRef = useRef(options?.onDiscard);
  onDiscardRef.current = options?.onDiscard;

  // Serialisasi draft sebagai dependency stabil (perbandingan nilai, bukan
  // identitas objek) — cegah loop autosave saat re-render tanpa perubahan.
  const draftJson = JSON.stringify(draft);
  const lastSavedJsonRef = useRef<string | null>(null);

  // Restore sekali saat orgId tersedia: bila draft ada & masih <24 jam,
  // tampilkan toast dengan action "Buang" untuk menghapusnya.
  useEffect(() => {
    if (!orgId || restoredRef.current) return;
    restoredRef.current = true;

    const stored = parseDraft(localStorage.getItem(draftKey(orgId)));
    if (!stored) return;

    const isFresh = Date.now() - stored.savedAt < DRAFT_MAX_AGE_MS;
    const isMeaningful = stored.content.trim() !== "" || stored.mediaIds.length > 0;
    if (!isFresh || !isMeaningful) {
      // Draft basi/kosong — langsung bersihkan
      localStorage.removeItem(draftKey(orgId));
      return;
    }

    setRestoredDraft(stored);
    setSavedAt(stored.savedAt);
    toast("Draft dipulihkan", {
      description: "Perubahan terakhir Anda dimuat kembali.",
      action: {
        label: "Buang",
        onClick: () => {
          localStorage.removeItem(draftKey(orgId));
          setRestoredDraft(null);
          setSavedAt(null);
          // Reset editor agar autosave tidak menulis ulang draft yang dibuang
          onDiscardRef.current?.();
        },
      },
    });
  }, [orgId]);

  // Autosave debounce 2 detik — hanya saat ada isi DAN berubah dari yang tersimpan
  useEffect(() => {
    if (!orgId) return;
    const parsed = JSON.parse(draftJson) as ComposeDraft;
    const hasContent = parsed.content.trim() !== "" || parsed.mediaIds.length > 0;
    if (!hasContent) return;
    // Skip bila nilainya sama dengan yang terakhir tersimpan (hindari tulis ulang)
    if (draftJson === lastSavedJsonRef.current) return;

    const timer = window.setTimeout(() => {
      const payload: ComposeDraft = { ...parsed, savedAt: Date.now() };
      try {
        localStorage.setItem(draftKey(orgId), JSON.stringify(payload));
        lastSavedJsonRef.current = draftJson;
        setSavedAt(payload.savedAt);
      } catch {
        // localStorage penuh / disabled — autosave gagal senyap
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [orgId, draftJson]);

  /** Hapus draft (dipanggil setelah post sukses dibuat atau user membuang) */
  const clearDraft = useCallback(() => {
    if (!orgId) return;
    localStorage.removeItem(draftKey(orgId));
    lastSavedJsonRef.current = null;
    setSavedAt(null);
    setRestoredDraft(null);
  }, [orgId]);

  return { savedAt, restoredDraft, clearDraft };
}
