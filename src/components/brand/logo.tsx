import { cn } from "@/lib/utils";

/** Símbolo VerdAgro: folha formada por linhas de plantio (talhão visto de cima). */
export function LogoMark({
  variant = "positive",
  className = "size-9",
}: {
  variant?: "positive" | "negative";
  className?: string;
}) {
  const bg = variant === "positive" ? "#0e2a1f" : "#c5f25c";
  const leaf = variant === "positive" ? "#c5f25c" : "#0e2a1f";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill={bg} />
      <path d="M14 50C14 30 28 14 50 14c0 22-16 36-36 36Z" fill={leaf} />
      <path d="M14 50 40 24M22 50l18-18M14 42l18-18" stroke={bg} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  variant = "positive",
  className,
}: {
  variant?: "positive" | "negative";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark variant={variant} />
      <span
        className={cn(
          "font-display text-[1.45rem] leading-none tracking-[-0.03em]",
          variant === "positive" ? "text-tinta" : "text-palha",
        )}
      >
        <span className="font-semibold">Verd</span>
        <span className="font-normal italic">Agro</span>
      </span>
    </span>
  );
}
