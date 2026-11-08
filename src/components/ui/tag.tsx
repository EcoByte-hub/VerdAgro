import { BadgeCheck, CircleDashed, FlaskConical, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Selos de estado. Regra de ouro do styleguide:
 * - estimativa: contorno TRACEJADO (ainda não é crédito)
 * - certificado: preenchimento SÓLIDO (comprovado)
 */
export type TagKind = "estimativa" | "verificacao" | "certificado" | "demo" | "neutro";

const STYLES: Record<TagKind, string> = {
  estimativa: "border border-dashed border-cerrado text-cerrado",
  verificacao: "border border-tinta/25 text-tinta-soft",
  certificado: "bg-broto text-mata-900",
  demo: "border border-current/25 text-tinta-soft",
  neutro: "bg-areia text-tinta",
};

const ICONS: Partial<Record<TagKind, typeof CircleDashed>> = {
  estimativa: CircleDashed,
  verificacao: ShieldCheck,
  certificado: BadgeCheck,
  demo: FlaskConical,
};

export function Tag({
  kind = "neutro",
  children,
  className,
}: {
  kind?: TagKind;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = ICONS[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] font-medium tracking-wider whitespace-nowrap uppercase",
        STYLES[kind],
        className,
      )}
    >
      {Icon && <Icon size={12} aria-hidden />}
      {children}
    </span>
  );
}

/** Selo padrão para qualquer dado fictício exibido na interface. */
export function DemoTag({ className }: { className?: string }) {
  return (
    <Tag kind="demo" className={className}>
      Dados demonstrativos
    </Tag>
  );
}
