/**
 * /settings — categorized user settings with explicit Save → backend.
 *
 * Categories (left rail) and per-section save semantics:
 *   • Profile      — draft state + Save → PATCH /api/v1/me
 *                    On mount: GET /me hydrates the store + form fields.
 *   • Appearance   — theme picker (instant-apply via next-themes; no save).
 *   • Preferences  — draft state + Save → local store (PATCH /me/preferences
 *                    when the backend grows it).
 *   • Integrations — pointer / placeholder, no form.
 *
 * Each save button shows a "Saved ✓" tag for ~2s on success, or a destructive
 * inline error if the API fails.
 *
 * Note: API-key vault lives at /credentials (not here).
 */

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  Check,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Settings as SettingsIcon,
  Smartphone,
  Sun,
  Trash2,
  Upload,
  User as UserIcon,
} from "lucide-react";

import {
  meApi,
  type Orientation,
} from "@octoflash/core";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUserSettingsStore } from "@/store/userSettingsStore";

type Category = "profile" | "appearance" | "preferences";

const CATEGORIES: { id: Category; label: string; icon: typeof UserIcon; description: string }[] = [
  { id: "profile",     label: "Profile",     icon: UserIcon,    description: "Name, email, avatar" },
  { id: "appearance",  label: "Appearance",  icon: Palette,     description: "Theme + density" },
  { id: "preferences", label: "Preferences", icon: SettingsIcon, description: "Defaults for new projects" },
];

export default function SettingsPage() {
  const [active, setActive] = useState<Category>("profile");

  return (
    <div className="px-7 py-6 max-w-[1280px] mx-auto">
      <div className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, appearance, and project defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-6">
        <nav className="flex md:flex-col gap-1">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isActive = c.id === active;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={cn(
                  "flex items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors",
                  "hover:bg-muted/60",
                  isActive && "bg-muted",
                )}
              >
                <Icon className={cn("size-4 mt-0.5 shrink-0", isActive ? "text-foreground" : "text-muted-foreground")} />
                <div className="min-w-0">
                  <div className={cn("text-[12px] font-medium", isActive ? "text-foreground" : "text-foreground/80")}>
                    {c.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground hidden md:block">
                    {c.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {active === "profile" && <ProfilePanel />}
          {active === "appearance" && <AppearancePanel />}
          {active === "preferences" && <PreferencesPanel />}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Profile — backend-backed (PATCH /me)
// ────────────────────────────────────────────────────────────────────────────

function ProfilePanel() {
  const store = useUserSettingsStore();

  // Draft state — only flushes to the store + backend on Save.
  const [displayName, setDisplayName] = useState(store.displayName);
  const [avatarUrl, setAvatarUrl] = useState(store.avatarUrl);
  const [email, setEmail] = useState(store.email);

  // Hydrate from /me on mount so the form reflects backend state, not just
  // the local cache. If the call fails (no auth in dev), fall back silently
  // to the persisted values.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctx = await meApi.get();
        if (cancelled) return;
        setDisplayName(ctx.user.displayName ?? "");
        setAvatarUrl(ctx.user.avatarUrl ?? "");
        setEmail(ctx.user.email ?? "");
        store.setDisplayName(ctx.user.displayName ?? "");
        store.setAvatarUrl(ctx.user.avatarUrl ?? "");
        store.setEmail(ctx.user.email ?? "");
      } catch {
        // 401 / 404 in dev — local state stays.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty =
    displayName !== store.displayName ||
    avatarUrl !== store.avatarUrl ||
    email !== store.email;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Pick an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Image must be under 8MB");
      return;
    }
    setUploading(true);
    try {
      // POST /me/avatar — server stores the file (local disk in dev,
      // S3 in prod) and returns the updated Me with avatar_url set.
      // We sync both the local draft and the persisted store so the
      // sidebar updates immediately, even before the user clicks Save.
      const me = await meApi.uploadAvatar(file);
      const url = me.avatarUrl ?? "";
      setAvatarUrl(url);
      store.setAvatarUrl(url);
    } catch (err) {
      setUploadError((err as Error).message ?? "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  const initials = (displayName || email || "?").trim().charAt(0).toUpperCase();

  return (
    <SettingsSection
      title="Profile"
      description="This is how teammates and reviewers see you across the studio — on project cards, comments, and exports."
    >
      <Field label="Photo">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="size-16">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName || "avatar"} />}
            <AvatarFallback className="text-base">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5 mr-1.5" />
                    Upload photo
                  </>
                )}
              </Button>
              {avatarUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAvatarUrl("")}
                  disabled={loading || uploading}
                  title="Remove photo"
                >
                  <Trash2 className="size-3.5 mr-1.5" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              PNG / JPG up to 8MB. Resized to 256×256.
            </p>
            {uploadError && (
              <p className="text-[11px] text-destructive">{uploadError}</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickPhoto}
          />
        </div>
      </Field>
      <Field label="Display name" htmlFor="display-name">
        <Input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={255}
          placeholder="Your name"
          disabled={loading}
        />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          disabled={loading}
          readOnly
          title="Email is managed by Cognito"
          className="opacity-70"
        />
      </Field>
      <Field label="Avatar URL" htmlFor="avatar-url">
        <Input
          id="avatar-url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://… or paste a data URL"
          disabled={loading}
        />
      </Field>

      <SaveBar
        dirty={dirty}
        save={async () => {
          await meApi.update({ displayName, avatarUrl });
          store.setDisplayName(displayName);
          store.setAvatarUrl(avatarUrl);
        }}
        reset={() => {
          setDisplayName(store.displayName);
          setAvatarUrl(store.avatarUrl);
          setEmail(store.email);
        }}
      />
    </SettingsSection>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Appearance — instant-apply theme picker
// ────────────────────────────────────────────────────────────────────────────

function AppearancePanel() {
  const { theme, setTheme } = useTheme();
  const opts: { value: string; label: string; icon: typeof Sun }[] = [
    { value: "light",  label: "Light",  icon: Sun },
    { value: "dark",   label: "Dark",   icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];
  const current = theme ?? "system";

  return (
    <SettingsSection
      title="Appearance"
      description="Light, dark, or follow your system. Applies immediately to every screen."
    >
      <div className="flex gap-2 flex-wrap">
        {opts.map((opt) => {
          const Icon = opt.icon;
          const isActive = current === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md border text-[12px] transition-colors",
                isActive
                  ? "border-foreground bg-muted"
                  : "border-border hover:border-foreground/30 hover:bg-muted/40",
              )}
            >
              <Icon className="size-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Preferences — backend-backed (PATCH /me/preferences)
// ────────────────────────────────────────────────────────────────────────────

function PreferencesPanel() {
  const store = useUserSettingsStore();

  // Draft state — flushed to the backend (and local store) on Save.
  const [defaultOrientation, setDefaultOrientation] = useState<Orientation>(
    store.defaultOrientation,
  );
  const [defaultVoiceId, setDefaultVoiceId] = useState(store.defaultVoiceId);
  const [loading, setLoading] = useState(true);

  // Hydrate from /me so the form reflects backend state, not the cache.
  // 401 / 404 in dev quietly fall back to the persisted local values.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctx = await meApi.get();
        if (cancelled) return;
        const prefs = ctx.user.preferences ?? {};
        const orient = prefs.defaultOrientation ?? store.defaultOrientation;
        const voice = prefs.defaultVoiceId ?? store.defaultVoiceId;
        setDefaultOrientation(orient);
        setDefaultVoiceId(voice);
        store.setDefaultOrientation(orient);
        store.setDefaultVoiceId(voice);
      } catch {
        /* keep local */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty =
    defaultOrientation !== store.defaultOrientation ||
    defaultVoiceId !== store.defaultVoiceId;

  const orientations: { v: Orientation; label: string; icon: typeof Smartphone }[] = [
    { v: "portrait",  label: "Portrait",  icon: Smartphone },
    { v: "landscape", label: "Landscape", icon: Monitor },
  ];

  return (
    <SettingsSection
      title="Project defaults"
      description="The orientation and voice we'll pre-select when you start a new project. Saves you a few clicks per video."
    >
      <Field label="Default orientation">
        <div className="flex gap-2">
          {orientations.map((o) => {
            const Icon = o.icon;
            const isActive = defaultOrientation === o.v;
            return (
              <button
                key={o.v}
                onClick={() => setDefaultOrientation(o.v)}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md border text-[12px] transition-colors",
                  isActive
                    ? "border-foreground bg-muted"
                    : "border-border hover:border-foreground/30 hover:bg-muted/40",
                )}
              >
                <Icon className="size-3.5" />
                {o.label}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Default voice id" htmlFor="default-voice">
        <Input
          id="default-voice"
          value={defaultVoiceId}
          onChange={(e) => setDefaultVoiceId(e.target.value)}
          placeholder="(none — falls back to system default)"
          disabled={loading}
        />
      </Field>

      <SaveBar
        dirty={dirty}
        save={async () => {
          // Sparse partial — only edited fields get sent. We pass both
          // today; the contract supports omitting either key.
          await meApi.updatePreferences({
            defaultOrientation,
            defaultVoiceId: defaultVoiceId || null,
          });
          store.setDefaultOrientation(defaultOrientation);
          store.setDefaultVoiceId(defaultVoiceId);
        }}
        reset={() => {
          setDefaultOrientation(store.defaultOrientation);
          setDefaultVoiceId(store.defaultVoiceId);
        }}
      />
    </SettingsSection>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ────────────────────────────────────────────────────────────────────────────

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 shadow-none">
      <div className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex flex-col gap-4 max-w-md">{children}</div>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      {children}
    </div>
  );
}

/**
 * Save / Reset bar shared across editable sections.
 *
 *   `save` runs on click; on success → "Saved ✓" tag for ~2s.
 *   `reset` reverts the form fields to the last-saved state.
 *   Both Save and Reset disabled while not dirty.
 *   `Save` shows a spinner during the in-flight request and an inline error
 *   message if it throws.
 */
function SaveBar({
  dirty,
  save,
  reset,
}: {
  dirty: boolean;
  save: () => Promise<void>;
  reset: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await save();
      setSavedAt(Date.now());
    } catch (e) {
      setError((e as Error).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const showSaved = savedAt !== null && Date.now() - savedAt < 2500;

  return (
    <div className="flex items-center gap-2 pt-2 border-t mt-2">
      <Button size="sm" onClick={onSave} disabled={!dirty || saving}>
        {saving ? (
          <>
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            Saving…
          </>
        ) : (
          "Save"
        )}
      </Button>
      <Button size="sm" variant="ghost" onClick={reset} disabled={!dirty || saving}>
        Reset
      </Button>
      {showSaved && (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
          <Check className="size-3" /> Saved
        </span>
      )}
      {error && (
        <span className="text-[11px] text-destructive truncate">{error}</span>
      )}
    </div>
  );
}
