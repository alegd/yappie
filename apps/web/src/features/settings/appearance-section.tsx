"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AppearanceSection() {
  return (
    <section className="py-8">
      <h2 className="mb-4 font-semibold text-lg">Appearance</h2>

      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">Theme</p>
          <p className="mt-0.5 text-foreground/75 text-sm">
            Choose light, dark, or system preference
          </p>
        </div>
        <ThemeToggle />
      </div>
    </section>
  );
}
