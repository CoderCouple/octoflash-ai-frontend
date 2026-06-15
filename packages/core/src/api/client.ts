/**
 * Thin fetch wrapper. Every request goes through here so the base URL,
 * envelope unwrapping, snake↔camel conversion, and error handling live in
 * exactly one place. Shared by both `@octoflash/web` and `@octoflash/desktop`.
 *
 * Backend conventions (octopod-style):
 *   - All responses are wrapped in `BaseResponse<T>`:
 *       { result, status_code, message, success }
 *     We unwrap → just the `result`.
 *   - Field names are snake_case (created_at, output_url, etc).
 *     We recursively convert → camelCase for JS consumers.
 *   - Request bodies: JS sends camelCase → we recursively convert → snake_case
 *     so Pydantic models parse cleanly.
 *
 * Base URL comes from `getRuntimeConfig()`:
 *   - Web:     VITE_API_URL  (Vite injects at build time)
 *   - Desktop: window.octoflash.config.apiUrl  (preload reads from main process)
 *   - Default: http://localhost:8000  (update via .env.local or desktop config.json)
 */

import { getRuntimeConfig } from "../config.js";

// ─── Auth token plumbing ─────────────────────────────────────────────────────
//
// The auth provider lives in the *consumer* package (Supabase in
// packages/web; whatever desktop uses later) so this lib stays
// provider-agnostic. Consumers call `setAuthTokenGetter()` at startup
// with a function the request loop can invoke per call. May be sync or
// async — Supabase's in-memory session lookup is sync; the refresh path
// is async.
//
// Returning `null` skips the `Authorization` header — the request goes
// out unauthenticated and the backend will 401/403 as appropriate.

type AuthTokenGetter = () => string | null | Promise<string | null>;

let _getAuthToken: AuthTokenGetter | null = null;

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _getAuthToken = getter;
}

async function _resolveAuthToken(): Promise<string | null> {
  if (!_getAuthToken) return null;
  try {
    return await _getAuthToken();
  } catch {
    // Don't let auth-resolve failures break the request — let it 401
    // and the FE will treat that as "session expired".
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Override the base URL for this request only (rare). */
  baseUrl?: string;
  /** Skip envelope unwrap + casing conversion (e.g. for non-API endpoints). */
  raw?: boolean;
};

// ─── Casing helpers ───────────────────────────────────────────────────────────

const snakeToCamel = (s: string): string =>
  s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

const camelToSnake = (s: string): string =>
  s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);

function deepTransformKeys<T>(value: unknown, convert: (s: string) => string): T {
  if (Array.isArray(value)) {
    return value.map((v) => deepTransformKeys(v, convert)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        convert(k),
        deepTransformKeys(v, convert),
      ]),
    ) as T;
  }
  return value as T;
}

const toCamel = <T>(v: unknown): T => deepTransformKeys<T>(v, snakeToCamel);
const toSnake = <T>(v: unknown): T => deepTransformKeys<T>(v, camelToSnake);

// ─── Envelope handling ────────────────────────────────────────────────────────

type BaseResponse<T> = {
  result: T | null;
  status_code: number;
  message?: string;
  success?: boolean;
};

function isEnvelope(data: unknown): data is BaseResponse<unknown> {
  return (
    data !== null &&
    typeof data === "object" &&
    "result" in (data as Record<string, unknown>) &&
    "status_code" in (data as Record<string, unknown>) &&
    "success" in (data as Record<string, unknown>)
  );
}

// ─── Core request fn ──────────────────────────────────────────────────────────

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, baseUrl, headers, raw, ...rest } = opts;
  const base = baseUrl ?? getRuntimeConfig().apiUrl;
  const url = `${base.replace(/\/$/, "")}${path}`;

  // FormData / Blob / ArrayBuffer skip the JSON path — the browser sets
  // the right content-type (with the multipart boundary) when we leave it
  // unset, and the body is passed through verbatim.
  const isStreamingBody =
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer;

  const token = await _resolveAuthToken();

  const init: RequestInit = {
    ...rest,
    headers: {
      ...(isStreamingBody ? {} : { "content-type": "application/json" }),
      accept: "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isStreamingBody
      ? (body as BodyInit)
      : body !== undefined
        ? JSON.stringify(raw ? body : toSnake(body))
        : undefined,
  };

  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    // Backend's error envelope still wraps the message — surface it if present.
    const message =
      isEnvelope(data) && data.message ? data.message : `${res.status} ${res.statusText}`;
    throw new ApiError(res.status, url, message, data);
  }

  if (raw) return data as T;

  const unwrapped = isEnvelope(data) ? data.result : data;
  return toCamel<T>(unwrapped);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  del: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
