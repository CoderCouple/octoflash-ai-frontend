/**
 * Contact / waitlist form on the marketing site.
 *
 * Single endpoint: POST /api/v1/contact. The backend treats email as the
 * unique key — re-submitting the same address returns 200 with a friendly
 * "already on the list" message (also indicated via `result.duplicate`).
 */

import { api } from "./client.js";

export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactResult = {
  received: boolean;
  duplicate: boolean;
};

export const contactApi = {
  submit: (body: ContactInput) =>
    api.post<ContactResult>("/api/v1/contact", body),
};
