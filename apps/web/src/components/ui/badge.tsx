import { cn } from "@/lib/utils";

const VARIANT_STYLES = {
  default: "text-foreground/60 bg-[rgba(91,134,229,0.12)] border-transparent",
  info: "text-info bg-[rgba(91,134,229,0.12)] border-transparent",
  success: "text-success bg-[rgba(46,212,122,0.12)] border-transparent",
  warning: "text-warning bg-[rgba(255,179,71,0.12)] border-transparent",
  danger: "text-destructive bg-[rgba(255,71,87,0.12)] border-transparent",
  orange: "text-primary bg-[rgba(255,107,53,0.12)] border-transparent",
  purple: "text-purple-400 bg-purple-400/10 border-transparent",
} as const;

type BadgeVariant = keyof typeof VARIANT_STYLES;

const BASE_STYLES =
  "inline-flex items-center px-2.5 py-0.5 rounded-sm font-body font-medium text-sm border transition-colors";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: Readonly<BadgeProps>) {
  return <span className={cn(BASE_STYLES, VARIANT_STYLES[variant], className)} {...props} />;
}
