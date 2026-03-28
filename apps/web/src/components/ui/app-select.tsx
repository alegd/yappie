"use client";

import { cn } from "@/lib/utils";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface AppSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function AppSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  ariaLabel,
  className,
}: AppSelectProps) {
  return (
    <SelectPrimitive.Root value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center justify-between gap-2 rounded-lg border border-border-hover bg-surface px-3 py-1.5 transition",
          "focus:border-primary focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "min-w-[140px]",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown size={14} className="text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border-hover bg-background shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-md px-3 py-1.5 outline-none transition",
                  "hover:bg-surface-hover focus:bg-surface-hover",
                  "data-[state=checked]:text-primary",
                )}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
