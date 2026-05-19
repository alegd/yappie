import { apiFetch } from "./client";

export function deleteAccountRequest(email: string): Promise<{ requested: boolean }> {
  return apiFetch<{ requested: boolean }>("/auth/account/delete/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function deleteAccountConfirm(
  email: string,
  code: string,
): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>("/auth/account/delete/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
}
