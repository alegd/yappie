import { cn } from "@/lib/utils";

interface CardBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  ref?: React.Ref<HTMLParagraphElement>;
}

interface CardTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  ref?: React.Ref<HTMLParagraphElement>;
}

export function Card({ className, ref, ...props }: CardBaseProps) {
  return (
    <div
      ref={ref}
      className={cn("bg-background border border-border rounded-lg text-foreground", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ref, ...props }: CardBaseProps) {
  return <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ref, ...props }: CardTitleProps) {
  return (
    <h3
      ref={ref}
      className={cn("font-semibold text-xl leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ref, ...props }: CardTextProps) {
  return <p ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

export function CardContent({ className, ref, ...props }: CardBaseProps) {
  return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ref, ...props }: CardBaseProps) {
  return <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
