export interface UmamiConfig {
  src: string;
  websiteId: string;
}

export function getUmamiConfig(): UmamiConfig | null {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  if (!src || !websiteId) return null;

  return { src, websiteId };
}
