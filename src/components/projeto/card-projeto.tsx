import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { DemoTag } from "@/components/ui/tag";
import { ROTULO_PRATICA } from "@/lib/diagnostico/schema";
import type { ProjetoResumo } from "@/lib/dados/tipos";
import { formatHectares } from "@/lib/utils";
import { SeloEstagio } from "./selo-estagio";

export function CardProjeto({ projeto, href }: { projeto: ProjetoResumo; href: string }) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-[var(--radius-card)] border border-areia bg-palha-50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-mata-900/30 hover:shadow-[0_20px_40px_-24px_rgba(14,42,31,0.35)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeloEstagio estagio={projeto.estagio} />
        {projeto.isDemo && <DemoTag />}
      </div>
      <h3 className="mt-4 font-display-soft text-xl text-mata-900">{projeto.titulo}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-tinta-soft">
        <MapPin size={14} /> {projeto.municipio}/{projeto.uf}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-areia/50 p-2.5">
          <dt className="text-tinta-soft">Prática</dt>
          <dd className="font-semibold text-tinta">{ROTULO_PRATICA[projeto.pratica]}</dd>
        </div>
        <div className="rounded-xl bg-areia/50 p-2.5">
          <dt className="text-tinta-soft">Área</dt>
          <dd className="font-semibold text-tinta">{formatHectares(projeto.areaHa)}</dd>
        </div>
      </dl>
      <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-musgo">
        Ver projeto{" "}
        <ArrowUpRight
          size={16}
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </span>
    </Link>
  );
}
