"use client";

import { Badge } from "@/components/ui/badge";
import type { ProjectListResponse } from "@/features/projects/types";
import { useQuery } from "@/hooks/use-query";
import { PROJECTS_LIST } from "@/lib/constants/endpoints";
import {
  AUTH_PAGE,
  DASHBOARD_PAGE,
  NEW_PROJECT_PAGE,
  SETTINGS_PAGE,
  projectDetailPage,
} from "@/lib/constants/pages";
import { cn } from "@/lib/utils";
import { FolderOpen, Home, LogOut, Menu, PlusCircle, Settings, X } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  user: { name: string; email: string } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const { data: projectsData } = useQuery<ProjectListResponse>(PROJECTS_LIST);

  const projects = (projectsData?.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));

  const handleLogout = () => {
    signOut({ redirectTo: AUTH_PAGE });
  };

  const isProjectActive = (id: string): boolean => {
    if (!pathname.startsWith(`/dashboard/projects/${id}`)) return false;
    if (pathname.endsWith("/edit")) return false;
    return true;
  };

  const isHomeActive = pathname === DASHBOARD_PAGE;
  const isSettingsActive = pathname === SETTINGS_PAGE || pathname.startsWith(SETTINGS_PAGE + "/");

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden top-4 left-4 z-50 fixed bg-surface-hover p-2 rounded-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

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
          <Link href={DASHBOARD_PAGE} className="font-bold text-lg tracking-tight">
            Yappie
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
          <Link
            href={DASHBOARD_PAGE}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition",
              isHomeActive
                ? "bg-accent-surface text-accent"
                : "text-foreground/75 hover:text-foreground hover:bg-surface-hover/50",
            )}
          >
            <Home size={18} />
            Home
          </Link>

          <div className="pt-4 pb-1 px-3 text-foreground/50 text-xs uppercase tracking-wider">
            Projects
          </div>

          {projects.map((project) => {
            const active = isProjectActive(project.id);
            const count = project.pendingTicketCount ?? 0;
            return (
              <Link
                key={project.id}
                href={projectDetailPage(project.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition",
                  active
                    ? "bg-accent-surface text-accent"
                    : "text-foreground/75 hover:text-foreground hover:bg-surface-hover/50",
                )}
              >
                <FolderOpen size={18} />
                <span className="flex-1 truncate">{project.name}</span>
                {count > 0 && (
                  <Badge variant="default" className="text-xs ml-2">
                    {count}
                  </Badge>
                )}
              </Link>
            );
          })}

          <Link
            href={NEW_PROJECT_PAGE}
            className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg font-medium text-xs uppercase tracking-wider transition border border-dashed border-border-hover text-accent hover:bg-accent-surface"
          >
            <PlusCircle size={14} />
            New project
          </Link>

          <div className="border-border border-t my-2" />

          <Link
            href={SETTINGS_PAGE}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition",
              isSettingsActive
                ? "bg-accent-surface text-accent"
                : "text-foreground/75 hover:text-foreground hover:bg-surface-hover/50",
            )}
          >
            <Settings size={18} />
            Settings
          </Link>
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
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
