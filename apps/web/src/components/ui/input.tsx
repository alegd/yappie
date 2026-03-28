import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground/50 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full bg-surface border rounded-lg px-3 py-2 focus:outline-none transition",
          error
            ? "border-red-500 focus:border-red-400"
            : "border-border-hover focus:border-primary",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
