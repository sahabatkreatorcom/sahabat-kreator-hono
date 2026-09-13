// Panel variasi caption per platform — custom caption tiap akun terpilih.
// Kosong = pakai caption utama (default). Ini mengisi item.content saat POST /posts.
import { RotateCcw } from "lucide-react";
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
  const selected = accounts.filter((a) => selectedAccounts.includes(a.id));
  if (selected.length === 0) return null;

  const withVariation = selected.filter((a) => variations[a.id]?.trim());
  const allUseBase = withVariation.length === 0;

  return (
    <div className="card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Variasi Caption per Platform</h2>
          <p className="mt-0.5 text-[var(--text-secondary)] text-xs">
            Kosongkan untuk pakai caption utama. Sesuaikan gaya tiap platform — caption X lebih
            pendek, IG bisa lebih storytelling.
          </p>
        </div>
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

      <div className="space-y-4">
        {selected.map((account) => {
          const cfg = PLATFORMS[account.platform as keyof typeof PLATFORMS];
          const Icon = cfg?.icon;
          const value = variations[account.id] ?? "";
          const limit = CHAR_LIMITS[account.platform] ?? 2200;
          const isCustom = Boolean(value.trim());

          return (
            <div key={account.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm">
                  {Icon && <Icon className="h-4 w-4" style={{ color: cfg.color }} />}
                  <span className="font-medium">{cfg?.label ?? account.platform}</span>
                  <span className="text-[var(--text-muted)]">@{account.username}</span>
                </div>
                <span
                  className={cn(
                    "text-[10px]",
                    isCustom
                      ? value.length > limit
                        ? "font-semibold text-red-500"
                        : "text-[var(--accent-gold)]"
                      : "text-[var(--text-muted)]",
                  )}
                >
                  {isCustom ? `${value.length}/${limit} (custom)` : "pakai caption utama"}
                </span>
              </div>
              <Textarea
                rows={value.trim() ? 4 : 2}
                placeholder={
                  isCustom ? "" : `Caption khusus ${cfg?.label ?? account.platform} (opsional)...`
                }
                value={value}
                onChange={(e) => onChange({ ...variations, [account.id]: e.target.value })}
                className="text-sm"
              />
            </div>
          );
        })}
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
  );
}
