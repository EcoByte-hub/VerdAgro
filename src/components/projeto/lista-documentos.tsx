import { ExternalLink, FileText, ImageIcon } from "lucide-react";
import { ROTULO_DOCUMENTO, type DocumentoProjeto } from "@/lib/dados/tipos";
import { RemoverDocumento } from "./remover-documento";

const ehImagem = (nome: string) => /\.(jpe?g|png|webp)$/i.test(nome);

/** Lista de documentos com link temporário. Usada pelo dono (com remoção) e no marketplace. */
export function ListaDocumentos({
  documentos,
  vazio,
  podeRemover = false,
  demo = false,
}: {
  documentos: DocumentoProjeto[];
  /** texto quando não há documentos */
  vazio: string;
  podeRemover?: boolean;
  /** modo demonstração: documentos sem arquivo de verdade */
  demo?: boolean;
}) {
  if (!documentos.length) return <p className="mt-2 text-sm text-tinta-soft">{vazio}</p>;

  return (
    <ul className="mt-3 divide-y divide-areia">
      {documentos.map((d) => {
        const Icone = ehImagem(d.nome) ? ImageIcon : FileText;
        return (
          <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <Icone size={18} className="shrink-0 text-musgo" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-tinta">{d.nome}</p>
              <p className="text-xs text-tinta-soft">
                {ROTULO_DOCUMENTO[d.tipo] ?? d.tipo} · {new Date(d.criadoEm).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {d.url ? (
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir ${d.nome}`}
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-semibold text-musgo underline-offset-4 hover:underline"
              >
                Abrir <ExternalLink size={14} aria-hidden />
              </a>
            ) : (
              <span className="shrink-0 text-xs text-argila">{demo ? "Demonstrativo" : "Indisponível"}</span>
            )}
            {podeRemover && <RemoverDocumento id={d.id} nome={d.nome} />}
          </li>
        );
      })}
    </ul>
  );
}
