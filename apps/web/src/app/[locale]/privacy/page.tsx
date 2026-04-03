import { PrivacyPolicy } from "@/features/legal/privacy-policy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
