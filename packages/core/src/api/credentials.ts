/**
 * `/credentials` — per-user secret vault.
 *
 *   GET    /api/v1/credentials              → list this user's vault entries (masked)
 *   PUT    /api/v1/credentials/{name}       → create or update by name
 *   DELETE /api/v1/credentials/{name}       → soft-delete
 *
 * The server only ever returns `maskedValue` — the raw secret never leaves
 * the backend once written.
 */

import { api } from "./client.js";

export type Credential = {
  id: string;
  name: string;
  maskedValue: string;
  isSet: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertCredentialInput = {
  value: string;
};

export const credentialsApi = {
  list: () => api.get<Credential[]>("/api/v1/credentials"),
  upsert: (name: string, body: UpsertCredentialInput) =>
    api.put<Credential>(`/api/v1/credentials/${encodeURIComponent(name)}`, body),
  delete: (name: string) =>
    api.del<null>(`/api/v1/credentials/${encodeURIComponent(name)}`),
};
