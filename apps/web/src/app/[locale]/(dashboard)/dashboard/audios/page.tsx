import { redirect } from "next/navigation";

export default function LegacyAudiosRedirect() {
  redirect("/dashboard");
}
