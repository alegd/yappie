import { PublicNavbar } from "@/components/layout/public-navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      {children}
    </>
  );
}
