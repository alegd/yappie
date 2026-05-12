import { apiFetch } from "./client";
import type { Quota } from "./types";

export function getQuota(): Promise<Quota> {
  return apiFetch<Quota>("/quotas");
}
