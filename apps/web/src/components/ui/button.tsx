import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outlined";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-primary hover:bg-primary-hover text-white",
  secondary: "bg-surface-hover hover:bg-surface-hover text-foreground border border-border-hover",
  ghost: "hover:bg-surface-hover/50 text-muted hover:text-foreground",
  outlined: "bg-background text-foreground/85 border border-foreground/65 hover:bg-foreground/5",
  danger: "bg-red-600 hover:bg-red-500 text-white",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex justify-center items-center gap-2 disabled:opacity-50 rounded-lg font-medium transition disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
