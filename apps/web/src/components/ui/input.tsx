import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-400 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm focus:outline-none transition",
          error ? "border-red-500 focus:border-red-400" : "border-zinc-700 focus:border-indigo-500",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
