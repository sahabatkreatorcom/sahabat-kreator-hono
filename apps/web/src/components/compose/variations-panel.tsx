// Panel variasi caption per platform — custom caption tiap akun terpilih.
// Kosong = pakai caption utama (default). Ini mengisi item.content saat POST /posts.
// Panel collapsible: default collapsed, isi via tab per platform agar hemat scroll.
import { Check, ChevronDown, Layers, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";

export type AccountLite = {
  id: string;
  platform: string;
  username: string;
};

/** Batas karakter per platform — sama dengan CHAR_LIMITS di compose */
const CHAR_LIMITS: Record<string, number> = {
  instagram: 2200,
  facebook: 63206,
  x: 280,
  linkedin: 3000,
  tiktok: 2200,
  youtube: 5000,
  threads: 500,
  pinterest: 500,
  google_business: 1500,
  manual: 5000,
};

export function VariationsPanel({
  selectedAccounts,
  accounts,
  variations,
  onChange,
  baseContent,
}: {
  selectedAccounts: string[];
  accounts: AccountLite[];
  variations: Record<string, string>;
  /** Update variasi (accountId → caption custom) */
  onChange: (next: Record<string, string>) => void;
  baseContent: string;
}) {
  // Panel collapsed by default — user buka hanya bila ingin kustomisasi
  const [open, setOpen] = useState(false);
  // Tab aktif = accountId (bukan platform — dua akun platform sama tetap tab terpisah)
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const selected = accounts.filter((a) => selectedAccounts.includes(a.id));
  if (selected.length === 0) return null;

  const withVariation = selected.filter((a) => variations[a.id]?.trim());
  const allUseBase = withVariation.length === 0;

  // Tab aktif default = akun terpilih pertama yang punya variasi, atau akun pertama
  const currentTab = activeTab && selected.some((a) => a.id === activeTab)
    ? activeTab
    : (withVariation[0]?.id ?? selected[0]!.id);
  const activeAccount = selected.find((a) => a.id === currentTab)!;
  const activeCfg = PLATFORMS[activeAccount.platform as keyof typeof PLATFORMS];
  const activeValue = variations[activeAccount.id] ?? "";
  const activeLimit = CHAR_LIMITS[activeAccount.platform] ?? 2200;
  const baseExceedsActive = activeLimit < baseContent.length;

  return (
    <div className="card p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="font-semibold">Variasi Caption per Platform</span>
          {withVariation.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {withVariation.length} custom
            </Badge>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[var(--text-muted)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Ringkasan saat collapsed */}
      {!open && (
        <p className="mt-2 text-[var(--text-secondary)] text-xs">
          {allUseBase ? (
            <>
              Semua platform memakai caption utama.{" "}
              <span className="text-[var(--accent-gold)]">Kustomisasi per platform →</span>
            </>
          ) : (
            <>
              {withVariation.length} dari {selected.length} akun memakai caption custom.{" "}
              <span className="text-[var(--accent-gold)]">Lihat detail →</span>
            </>
          )}
        </p>
      )}

      {open && (
        <div className="mt-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[var(--text-secondary)] text-xs">
              Kosongkan untuk pakai caption utama. Sesuaikan gaya tiap platform — caption X lebih
              pendek, IG bisa lebih storytelling.
            </p>
            {!allUseBase && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({})}
                className="shrink-0 text-xs"
              >
                <RotateCcw className="h-3 w-3" />
                Reset semua
              </Button>
            )}
          </div>

          {/* Tab per akun terpilih — ganti textarea panjang jadi satu editor */}
          <div
            role="tablist"
            className="flex flex-wrap gap-1.5 border-[var(--border-light)] border-b pb-3"
          >
            {selected.map((account) => {
              const cfg = PLATFORMS[account.platform as keyof typeof PLATFORMS];
              const Icon = cfg?.icon;
              const isCustom = Boolean(variations[account.id]?.trim());
              const isOver =
                isCustom && (variations[account.id]?.length ?? 0) > (CHAR_LIMITS[account.platform] ?? 2200);
              const isActive = account.id === currentTab;
              return (
                <button
                  key={account.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(account.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors ${
                    isActive
                      ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)] font-medium"
                      : "border-[var(--border)] hover:border-[var(--accent-gold)]"
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />}
                  @{account.username}
                  {isCustom && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isOver ? "bg-red-500" : "bg-[var(--accent-gold)]",
                      )}
                      title="Punya caption custom"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Editor caption untuk tab aktif */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm">
                {activeValue.trim() ? (
                  <Check className="h-3.5 w-3.5 text-[var(--accent-gold)]" />
                ) : null}
                <span className="font-medium">{activeCfg?.label ?? activeAccount.platform}</span>
                <span className="text-[var(--text-muted)]">@{activeAccount.username}</span>
              </span>
              <span
                className={cn(
                  "text-[10px]",
                  activeValue.trim()
                    ? activeValue.length > activeLimit
                      ? "font-semibold text-red-500"
                      : "text-[var(--accent-gold)]"
                    : "text-[var(--text-muted)]",
                )}
              >
                {activeValue.trim()
                  ? `${activeValue.length}/${activeLimit} (custom)`
                  : "pakai caption utama"}
              </span>
            </div>
            <Textarea
              rows={5}
              placeholder={`Caption khusus ${activeCfg?.label ?? activeAccount.platform} (opsional)...`}
              value={activeValue}
              onChange={(e) => onChange({ ...variations, [activeAccount.id]: e.target.value })}
              className="text-sm"
            />
            {baseExceedsActive && !activeValue.trim() && baseContent.trim() && (
              <p className="text-[11px] font-medium text-red-500">
                Caption utama {baseContent.length} karakter melebihi batas{" "}
                {activeCfg?.label ?? activeAccount.platform} ({activeLimit}) — isi variasi untuk
                platform ini.
              </p>
            )}
          </div>

          {allUseBase && baseContent.trim() && (
            <p className="text-[var(--text-muted)] text-xs">
              Semua platform akan memakai caption utama ({baseContent.length} karakter).
              {selected.some((a) => (CHAR_LIMITS[a.platform] ?? 2200) < baseContent.length) && (
                <span className="ml-1 font-medium text-red-500">
                  Peringatan: caption utama melebihi batas sebagian platform — isi variasi.
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
