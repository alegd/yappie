"use client";

import { Card } from "@/components/ui/card/Card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AppearanceSection() {
  return (
    <section className="py-8">
      <h2 className="mb-4 font-semibold text-lg">Appearance</h2>

      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Theme</p>
            <p className="mt-0.5 text-foreground/75 text-sm">
              Choose light, dark, or system preference
            </p>
          </div>
          <ThemeToggle />
        </div>
      </Card>
    </section>
  );
}
