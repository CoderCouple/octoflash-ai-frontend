/**
 * /credentials — per-user secret vault (encrypted server-side).
 *
 * Values are masked on read; only the user that wrote them can update or
 * delete. The vault accepts any `name`, so the KNOWN_KEYS list below is purely
 * UX — it surfaces the well-known env-pinned secrets the backend understands
 * (Anthropic / ElevenLabs / OpenAI Whisper / Temporal Cloud / YouTube Data
 * API). Custom keys live alongside via the "Add custom credential" row.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  ApiError,
  credentialsApi,
  type Credential,
} from "@octoflash/core";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const KNOWN_KEYS: {
  name: string;
  label: string;
  description: string;
  placeholder: string;
  docsUrl?: string;
}[] = [
  {
    name: "ANTHROPIC_API_KEY",
    label: "Anthropic API key",
    description: "Used by the Manim script generator + describer + evaluator (Claude).",
    placeholder: "sk-ant-…",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    name: "ELEVEN_API_KEY",
    label: "ElevenLabs API key",
    description: "Voiceover synthesis inside the Manim render.",
    placeholder: "el-…",
    docsUrl: "https://elevenlabs.io/app/settings/api-keys",
  },
  {
    name: "OPENAI_API_KEY",
    label: "OpenAI / Whisper key",
    description: "Optional — used by the Whisper transcription path when set.",
    placeholder: "sk-…",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    name: "TEMPORAL_API_KEY",
    label: "Temporal Cloud API key",
    description: "Routes worker connections to Temporal Cloud (TLS auto-enables).",
    placeholder: "tmprl-…",
    docsUrl: "https://docs.temporal.io/cloud/api-keys",
  },
  {
    name: "TEMPORAL_ADDRESS",
    label: "Temporal Cloud address",
    description: "Namespace host, e.g. `<ns>.<account>.tmprl.cloud:7233`.",
    placeholder: "<ns>.<account>.tmprl.cloud:7233",
  },
  {
    name: "TEMPORAL_NAMESPACE",
    label: "Temporal namespace",
    description: "Temporal Cloud namespace name.",
    placeholder: "octoflash.<account>",
  },
  {
    name: "YOUTUBE_API_KEY",
    label: "YouTube Data API key",
    description: "Optional — official channel sync when set (falls back to yt-dlp).",
    placeholder: "AIza…",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
  },
];

export default function CredentialsPage() {
  const [creds, setCreds] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const rows = await credentialsApi.list();
      setCreds(rows);
      setError(null);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? `HTTP ${e.status}: ${e.message}`
          : (e as Error).message ?? "Failed to load credentials",
      );
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byName = useMemo(() => {
    const m = new Map<string, Credential>();
    for (const c of creds) m.set(c.name, c);
    return m;
  }, [creds]);

  const customCreds = useMemo(() => {
    const known = new Set(KNOWN_KEYS.map((k) => k.name));
    return creds.filter((c) => !known.has(c.name));
  }, [creds]);

  return (
    <div className="px-7 py-6 max-w-[1280px] mx-auto">
      <div className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
        <p className="text-sm text-muted-foreground mt-1">
          API keys + secrets, encrypted at rest. Values are masked on read — only the user
          that wrote them can update or delete.
        </p>
      </div>

      <Card className="p-5 shadow-none max-w-3xl">
        <SecurityNotice />

        <div className="flex flex-col gap-2 mt-4">
          {loading ? (
            <div className="text-[12px] text-muted-foreground py-4">Loading…</div>
          ) : (
            <>
              {KNOWN_KEYS.map((k) => (
                <CredentialRow
                  key={k.name}
                  label={k.label}
                  name={k.name}
                  description={k.description}
                  placeholder={k.placeholder}
                  docsUrl={k.docsUrl}
                  existing={byName.get(k.name) ?? null}
                  onChange={refresh}
                />
              ))}
              {customCreds.map((c) => (
                <CredentialRow
                  key={c.id}
                  label={c.name}
                  name={c.name}
                  description="Custom credential."
                  placeholder="value"
                  existing={c}
                  onChange={refresh}
                />
              ))}
              <CustomCredentialAdder
                existingNames={new Set(creds.map((c) => c.name))}
                onAdded={refresh}
              />
            </>
          )}
        </div>

        {error && <div className="text-[11px] text-destructive pt-2">{error}</div>}
      </Card>
    </div>
  );
}

function SecurityNotice() {
  return (
    <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-[11.5px] text-muted-foreground">
      <Lock className="size-3.5 mt-0.5 shrink-0" />
      <span>
        Stored encrypted server-side. Only masked previews leave the backend;
        the raw value cannot be read back once saved.
      </span>
    </div>
  );
}

function CredentialRow({
  label,
  name,
  description,
  placeholder,
  docsUrl,
  existing,
  onChange,
}: {
  label: string;
  name: string;
  description: string;
  placeholder: string;
  docsUrl?: string;
  existing: Credential | null;
  onChange: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSave = async () => {
    if (!value.trim()) {
      setErr("Value can't be empty");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await credentialsApi.upsert(name, { value: value.trim() });
      setValue("");
      setEditing(false);
      await onChange();
    } catch (e) {
      setErr(
        e instanceof ApiError ? `HTTP ${e.status}: ${e.message}` : (e as Error).message ?? "Save failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    setErr(null);
    try {
      await credentialsApi.delete(name);
      await onChange();
    } catch (e) {
      setErr(
        e instanceof ApiError ? `HTTP ${e.status}: ${e.message}` : (e as Error).message ?? "Delete failed",
      );
      throw e;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start gap-3">
        <div className="size-7 rounded bg-muted flex items-center justify-center shrink-0">
          <KeyRound className="size-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12.5px] font-medium">{label}</span>
            {existing?.isSet ? (
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium tracking-wider">
                Set
              </span>
            ) : (
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium tracking-wider">
                Not set
              </span>
            )}
            <code className="text-[10px] font-mono text-muted-foreground">{name}</code>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {description}{" "}
            {docsUrl && (
              <a
                href={docsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline"
              >
                Where do I find this?
              </a>
            )}
          </p>

          {existing?.isSet && !editing && (
            <div className="font-mono text-[11px] mt-2 text-foreground/80">
              {existing.maskedValue}
            </div>
          )}

          {editing && (
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  disabled={busy}
                  className="pr-8"
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 size-6 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
                  onClick={() => setShow((v) => !v)}
                  title={show ? "Hide" : "Show"}
                >
                  {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
              {err && <span className="text-[11px] text-destructive">{err}</span>}
              <div className="flex gap-1.5">
                <Button size="sm" onClick={onSave} disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setValue("");
                    setErr(null);
                  }}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={busy}>
              <Pencil className="size-3 mr-1" />
              {existing?.isSet ? "Update" : "Set"}
            </Button>
            {existing?.isSet && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={busy}
                title="Delete"
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={`Delete ${label}?`}
        description={
          `Removes the stored ${name} credential. Anything in Octoflash that ` +
          "depends on this key will fall back to the server-side env var, " +
          "if one is set — otherwise that path will fail until you re-add it."
        }
        confirmLabel="Delete credential"
        destructive
        onConfirm={doDelete}
      />
    </div>
  );
}

function CustomCredentialAdder({
  existingNames,
  onAdded,
}: {
  existingNames: Set<string>;
  onAdded: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSave = async () => {
    const trimmed = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!trimmed) {
      setErr("Name is required");
      return;
    }
    if (existingNames.has(trimmed)) {
      setErr("A credential with this name already exists");
      return;
    }
    if (!value.trim()) {
      setErr("Value can't be empty");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await credentialsApi.upsert(trimmed, { value: value.trim() });
      setOpen(false);
      setName("");
      setValue("");
      await onAdded();
    } catch (e) {
      setErr(
        e instanceof ApiError ? `HTTP ${e.status}: ${e.message}` : (e as Error).message ?? "Failed",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="self-start mt-1"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5 mr-1" /> Add custom credential
      </Button>
    );
  }

  return (
    <div className="rounded-md border p-3 flex flex-col gap-2">
      <div className="text-[12.5px] font-medium">Custom credential</div>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="NAME_LIKE_THIS"
        disabled={busy}
      />
      <Input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="value"
        disabled={busy}
      />
      {err && <span className="text-[11px] text-destructive">{err}</span>}
      <div className="flex gap-1.5">
        <Button size="sm" onClick={onSave} disabled={busy}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setErr(null);
          }}
          disabled={busy}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
