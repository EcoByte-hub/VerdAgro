import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-[var(--radius-card)] border border-areia bg-palha-50 p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("font-display-soft text-xl text-mata-900", className)} {...props} />;
}

export function CardEyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("eyebrow text-tinta-soft", className)} {...props} />;
}
