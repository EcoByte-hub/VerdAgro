import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { DemoTag } from "@/components/ui/tag";
import type { Propriedade } from "@/lib/dados/tipos";
import { formatHectares } from "@/lib/utils";

export function CardPropriedade({ propriedade }: { propriedade: Propriedade }) {
  return (
    <Link
      href={`/produtor/propriedades/${propriedade.id}`}
      className="group flex flex-col gap-4 rounded-[var(--radius-card)] bg-mata-900 p-6 text-palha transition-transform duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display-soft text-2xl">{propriedade.nome}</p>
          {propriedade.isDemo && <DemoTag className="text-palha/70" />}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-palha/70">
          <MapPin size={14} /> {propriedade.municipio}/{propriedade.uf} ·{" "}
          {propriedade.culturas.join(", ") || "culturas não informadas"}
        </p>
      </div>
      <div className="flex items-center gap-6">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-palha/50 uppercase">Área</p>
          <p className="font-display-soft text-2xl text-broto">{formatHectares(propriedade.areaHa)}</p>
        </div>
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-broto text-mata-900 transition-transform group-hover:rotate-45">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </Link>
  );
}
