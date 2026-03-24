"use client";

import {
  ANALYTICS_PAGE,
  AUDIOS_PAGE,
  LOGIN_PAGE,
  PROJECTS_PAGE,
  SETTINGS_PAGE,
  TICKETS_PAGE,
} from "@/lib/constants/pages";
import { cn } from "@/lib/utils";
import { BarChart3, FileText, FolderOpen, LogOut, Menu, Mic, Settings, X } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: AUDIOS_PAGE, label: "Audios", icon: Mic },
  { href: TICKETS_PAGE, label: "Tickets", icon: FileText },
  { href: PROJECTS_PAGE, label: "Projects", icon: FolderOpen },
  { href: ANALYTICS_PAGE, label: "Analytics", icon: BarChart3 },
  { href: SETTINGS_PAGE, label: "Settings", icon: Settings },
];

interface SidebarProps {
  user: { name: string; email: string } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    signOut({ redirectTo: LOGIN_PAGE });
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden top-4 left-4 z-50 fixed bg-surface-hover p-2 rounded-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden z-40 fixed inset-0 bg-black/50"
          onClick={() => setIsOpen(false)}
          onKeyDown={() => setIsOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      <aside
        className={cn(
          "flex flex-col bg-background border-border border-r w-60",
          "fixed md:static inset-y-0 left-0 z-40 transition-transform md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 border-border border-b">
          <Link href={AUDIOS_PAGE} className="font-bold text-lg tracking-tight">
            Yappie
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition",
                  isActive
                    ? "bg-accent-surface text-accent"
                    : "text-muted hover:text-foreground hover:bg-surface-hover/50",
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-border border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex justify-center items-center rounded-full w-8 h-8 font-bold text-accent text-sm bg-accent-surface">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-muted-foreground text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
