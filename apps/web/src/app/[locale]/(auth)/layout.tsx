import { AuthProviders } from "@/components/auth-providers";
import { PublicNavbar } from "@/components/layout/public-navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviders>
      <PublicNavbar />
      {children}
    </AuthProviders>
  );
}
