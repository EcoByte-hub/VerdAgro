import { Check } from "lucide-react";
import { ESTAGIOS, type Estagio, type EventoLinhaDoTempo } from "@/lib/dados/tipos";
import { cn } from "@/lib/utils";

const ESTILO = {
  estimativa: {
    feito: "border-2 border-dashed border-cerrado bg-palha-50 text-cerrado",
    texto: "text-cerrado",
  },
  verificacao: { feito: "border-2 border-mata-900 bg-palha-50 text-mata-900", texto: "text-tinta-soft" },
  certificado: { feito: "bg-broto text-mata-900", texto: "text-broto-700" },
} as const;

const ROTULO_TIPO = { estimativa: "Estimativa", verificacao: "Em verificação", certificado: "Certificado" };

/**
 * Os 8 estágios de rastreabilidade. Estimativa = tracejado; certificado = sólido.
 */
export function LinhaDoTempo({ atual, eventos = [] }: { atual: Estagio; eventos?: EventoLinhaDoTempo[] }) {
  const indiceAtual = ESTAGIOS.findIndex((e) => e.id === atual);

  return (
    <ol className="relative space-y-4">
      <span className="absolute top-3 bottom-3 left-[15px] w-px bg-areia" aria-hidden />
      {ESTAGIOS.map((estagio, i) => {
        const concluido = i <= indiceAtual;
        const evento = [...eventos].reverse().find((e) => e.estagio === estagio.id);
        const estilo = ESTILO[estagio.tipo];
        return (
          <li key={estagio.id} className="relative flex items-start gap-4">
            <span
              className={cn(
                "relative z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-xs",
                concluido ? estilo.feito : "border border-areia bg-palha text-argila",
                i === indiceAtual && "ring-4 ring-broto/30",
              )}
            >
              {concluido && i < indiceAtual ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>
            <div className="pt-1">
              <p className={cn("text-sm font-semibold", concluido ? "text-tinta" : "text-argila")}>
                {estagio.rotulo}
                {i === indiceAtual && <span className="ml-2 text-xs font-normal text-musgo">(atual)</span>}
              </p>
              <p
                className={cn(
                  "font-mono text-[10px] tracking-widest uppercase",
                  concluido ? estilo.texto : "text-argila",
                )}
              >
                {ROTULO_TIPO[estagio.tipo]}
                {evento && ` · ${new Date(evento.data).toLocaleDateString("pt-BR")}`}
              </p>
              {evento?.nota && <p className="mt-1 text-xs text-tinta-soft">{evento.nota}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
