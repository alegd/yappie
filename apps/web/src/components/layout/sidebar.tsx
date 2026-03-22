"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, FileText, FolderOpen, Settings, BarChart3, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/audios", label: "Audios", icon: Mic },
  { href: "/dashboard/tickets", label: "Tickets", icon: FileText },
  { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  user: { name: string; email: string } | null;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden top-4 left-4 z-50 fixed bg-zinc-800 p-2 rounded-lg"
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
          "flex flex-col bg-zinc-900/50 border-zinc-800 border-r w-60",
          "fixed md:static inset-y-0 left-0 z-40 transition-transform md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 border-zinc-800 border-b">
          <Link href="/dashboard" className="font-bold text-lg tracking-tight">
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
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50",
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-zinc-800 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex justify-center items-center bg-indigo-500/20 rounded-full w-8 h-8 font-bold text-indigo-400 text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-zinc-500 text-xs truncate">{user?.email}</p>
            </div>
            <button onClick={onLogout} className="text-zinc-500 hover:text-zinc-300 transition">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
