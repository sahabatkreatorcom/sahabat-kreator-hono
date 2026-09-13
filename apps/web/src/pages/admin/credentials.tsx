// Admin: Kredensial Platform — per-platform OAuth card grid

import { env } from "@sahabatkreator/env/web";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2, Save, ShieldCheck, Webhook } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { PLATFORMS, type Platform } from "@/lib/platforms";

type Credential = {
  id: string;
  platform: string;
  clientId: string;
  redirectUri: string | null;
  isActive: boolean;
  updatedAt: string;
};

type CredentialForm = {
  clientId: string;
  clientSecret: string;
};

/** Webhook info per platform — endpoint sesuai aplikasi, bukan per platform.
 *  Instagram (akun bisnis via FB Login) & Facebook: satu aplikasi Meta → /webhooks/meta.
 *  Instagram standalone (IG Login): aplikasi terpisah → /webhooks/instagram-standalone.
 *  Threads: aplikasi sendiri (developers.threads.net) → /webhooks/threads. */
function buildWebhookInfo(platform: Platform, serverOrigin: string) {
  if (platform === "instagram_standalone") {
    return {
      label: "Webhook URL",
      url: `${serverOrigin}/webhooks/instagram-standalone`,
      note: "Instagram Login — aplikasi terpisah. Verify token: env INSTAGRAM_WEBHOOK_VERIFY_TOKEN.",
    };
  }
  if (platform === "instagram" || platform === "facebook") {
    return {
      label: "Webhook URL",
      url: `${serverOrigin}/webhooks/meta`,
      note: "Instagram & Facebook — satu aplikasi Meta. Verify token: env META_WEBHOOK_VERIFY_TOKEN.",
    };
  }
  if (platform === "threads") {
    return {
      label: "Webhook URL",
      url: `${serverOrigin}/webhooks/threads`,
      note: "Threads — aplikasi terpisah (developers.threads.net). Verify token: env THREADS_WEBHOOK_VERIFY_TOKEN.",
    };
  }
  if (platform === "tiktok") {
    return {
      label: "Webhook URL",
      url: `${serverOrigin}/webhooks/tiktok`,
      note: "TikTok Developer Console → Webhooks. Signature otomatis diverifikasi dari Client Secret.",
    };
  }
  return null;
}

/** Data deletion callback URL (syarat App Review) — hanya app keluarga Meta yang
 *  memakai protokol signed_request. Daftarkan di App Dashboard → Settings →
 *  Advanced → Data Deletion Request Callback URL. */
function buildDeletionInfo(platform: Platform, serverOrigin: string) {
  if (platform === "instagram_standalone") {
    return {
      url: `${serverOrigin}/webhooks/instagram-standalone/data-deletion`,
      note: "Daftarkan di developers.facebook.com (app Instagram Login) → Settings → Advanced.",
    };
  }
  if (platform === "instagram" || platform === "facebook") {
    return {
      url: `${serverOrigin}/webhooks/meta/data-deletion`,
      note: "Daftarkan di App Dashboard Meta → Settings → Advanced.",
    };
  }
  if (platform === "threads") {
    return {
      url: `${serverOrigin}/webhooks/threads/data-deletion`,
      note: "Daftarkan di developers.threads.net → Settings → Advanced.",
    };
  }
  return null;
}

function buildSubtitle(platform: Platform, hasCredential: boolean) {
  const status = hasCredential ? "Sudah dikonfigurasi" : "Belum dikonfigurasi";
  const withWebhook = ["instagram", "instagram_standalone", "facebook", "threads", "tiktok"];
  if (withWebhook.includes(platform)) return `OAuth connect + webhook · ${status}`;
  return `OAuth connect · ${status}`;
}

function PlatformCard({
  platformKey,
  platformCfg,
  existing,
  serverOrigin,
  onSave,
  saving,
}: {
  platformKey: Platform;
  platformCfg: (typeof PLATFORMS)[Platform];
  existing?: Credential;
  serverOrigin: string;
  onSave: (platform: Platform, data: CredentialForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<CredentialForm>({
    clientId: existing?.clientId ?? "",
    clientSecret: "",
  });

  const Icon = platformCfg.icon;
  const callbackUrl = `${serverOrigin}/api/oauth/${platformKey}/callback`;
  const webhookInfo = buildWebhookInfo(platformKey, serverOrigin);
  const deletionInfo = buildDeletionInfo(platformKey, serverOrigin);

  const handleSave = () => {
    onSave(platformKey, form);
  };

  return (
    <div className="card flex flex-col overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center gap-3 border-[var(--border-light)] border-b p-4 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
          <Icon className="h-4.5 w-4.5" style={{ color: platformCfg.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{platformCfg.label}</p>
            <Badge variant={existing?.isActive ? "success" : "secondary"}>
              {existing?.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <p className="mt-0.5 text-[var(--text-muted)] text-xs">
            {buildSubtitle(platformKey, !!existing)}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Callback URL */}
        <div className="rounded-lg bg-[var(--bg-tertiary)] p-3">
          <div className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)] text-xs">
            <Link2 className="h-3.5 w-3.5" />
            Callback URL (OAuth redirect)
          </div>
          <p className="mt-1 break-all font-mono text-[var(--text-primary)] text-xs">
            {callbackUrl}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Sama untuk semua platform — daftarkan persis seperti tertulis di konsol pengembang.
          </p>
        </div>

        {/* Webhook URL */}
        {webhookInfo && (
          <div className="rounded-lg bg-[var(--bg-tertiary)] p-3">
            <div className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)] text-xs">
              <Webhook className="h-3.5 w-3.5" />
              {webhookInfo.label}
            </div>
            <p className="mt-1 break-all font-mono text-[var(--text-primary)] text-xs">
              {webhookInfo.url}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">{webhookInfo.note}</p>
          </div>
        )}

        {/* Data Deletion Callback URL (syarat App Review) */}
        {deletionInfo && (
          <div className="rounded-lg bg-[var(--bg-tertiary)] p-3">
            <div className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)] text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              Data Deletion Callback URL
            </div>
            <p className="mt-1 break-all font-mono text-[var(--text-primary)] text-xs">
              {deletionInfo.url}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">{deletionInfo.note}</p>
          </div>
        )}

        {/* Client ID */}
        <div className="space-y-1.5">
          <Label htmlFor={`client-id-${platformKey}`} className="text-xs">
            Client ID
          </Label>
          <Input
            id={`client-id-${platformKey}`}
            value={form.clientId}
            onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
            placeholder="App ID / Client ID"
            className="h-9 text-sm"
          />
        </div>

        {/* Client Secret */}
        <div className="space-y-1.5">
          <Label htmlFor={`client-secret-${platformKey}`} className="text-xs">
            Client Secret
          </Label>
          <Input
            id={`client-secret-${platformKey}`}
            type="password"
            value={form.clientSecret}
            onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
            placeholder={existing ? "•••••••• (sudah tersimpan)" : "App Secret"}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-[var(--border-light)] border-t px-4 py-3">
        <Button
          size="sm"
          disabled={saving || !form.clientId}
          onClick={handleSave}
          className="bg-[var(--accent-gold)] text-white hover:bg-[var(--accent-gold)]/90"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Simpan
        </Button>
      </div>
    </div>
  );
}

export function AdminCredentialsPage() {
  const queryClient = useQueryClient();
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-credentials"],
    queryFn: () => api.get<{ credentials: Credential[] }>("/admin/platform-credentials"),
  });

  // Hooks harus dipanggil sebelum early return — map kredensial per platform
  const credentials = data?.credentials ?? [];
  const credentialMap = useMemo(() => {
    const map: Record<string, Credential> = {};
    for (const cred of credentials) {
      map[cred.platform] = cred;
    }
    return map;
  }, [credentials]);

  const save = useMutation({
    mutationFn: (input: { platform: string; clientId: string; clientSecret: string }) =>
      api.post("/admin/platform-credentials", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-credentials"] });
      toast.success("Kredensial tersimpan (secret terenkripsi)");
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setSavingPlatform(null),
  });

  if (isLoading) return <PageLoader />;

  const serverOrigin = env.VITE_SERVER_URL || window.location.origin;

  const platformEntries = Object.entries(PLATFORMS).filter(([key]) => key !== "manual");

  const handleSave = (platform: Platform, formData: CredentialForm) => {
    if (!formData.clientId) {
      toast.error("Client ID wajib diisi");
      return;
    }
    if (!formData.clientSecret && !credentialMap[platform]) {
      toast.error("Client Secret wajib diisi untuk kredensial baru");
      return;
    }
    setSavingPlatform(platform);
    save.mutate({
      platform,
      clientId: formData.clientId,
      clientSecret: formData.clientSecret,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Kredensial Platform</h1>
        <p className="mt-1 text-[var(--text-secondary)] text-sm">
          Konfigurasi OAuth App ID, Secret, dan Webhook per platform sosial
        </p>
      </div>

      {/* Platform cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {platformEntries.map(([key, cfg]) => (
          <PlatformCard
            key={key}
            platformKey={key as Platform}
            platformCfg={cfg}
            existing={credentialMap[key]}
            serverOrigin={serverOrigin}
            onSave={handleSave}
            saving={savingPlatform === key && save.isPending}
          />
        ))}
      </div>
    </div>
  );
}
