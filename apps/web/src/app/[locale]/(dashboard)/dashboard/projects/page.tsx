import { redirect } from "next/navigation";

export default function LegacyProjectsRedirect() {
  redirect("/dashboard");
}
