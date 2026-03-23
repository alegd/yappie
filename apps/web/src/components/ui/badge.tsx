import { cn } from "@/lib/utils";

const VARIANT_STYLES = {
  default: "text-zinc-500 bg-zinc-400/5",
  info: "text-blue-400 bg-blue-400/5",
  success: "text-emerald-500 bg-emerald-400/5",
  warning: "text-yellow-400 bg-yellow-400/5",
  danger: "text-red-500 bg-red-400/5",
  orange: "text-orange-400 bg-orange-400/5",
  purple: "text-purple-400 bg-purple-400/5",
} as const;

type BadgeVariant = keyof typeof VARIANT_STYLES;

const BASE_STYLES =
  "inline-flex items-center px-2.5 py-0.5 border rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-semibold text-xs transition-colors";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: Readonly<BadgeProps>) {
  return <span className={cn(BASE_STYLES, VARIANT_STYLES[variant], className)} {...props} />;
}
