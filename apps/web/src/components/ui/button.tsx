import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outlined" | "success";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-primary hover:bg-primary-hover text-white",
  secondary: "bg-surface-hover hover:bg-surface-hover text-foreground border border-border-hover",
  ghost: "hover:bg-surface-hover/50 text-foreground/75 hover:text-foreground",
  outlined: "bg-background text-foreground/85 border border-foreground/65 hover:bg-foreground/5",
  danger: "bg-destructive hover:bg-destructive/80 text-white",
  success: "bg-success hover:bg-success/80 text-white border border-success",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
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
        "inline-flex justify-center items-center gap-2 disabled:opacity-50 rounded-lg font-meidum transition disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
