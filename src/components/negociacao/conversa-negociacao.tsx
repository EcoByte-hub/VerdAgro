import { Card } from "@/components/ui/card";
import type { Negociacao } from "@/lib/dados/tipos";
import { cn } from "@/lib/utils";
import { AtualizarConversa, FormMensagem } from "./form-mensagem";

const formatarData = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });

export function ConversaNegociacao({
  negociacao,
  usuarioId,
  demo,
}: {
  negociacao: Negociacao;
  usuarioId: string;
  demo: boolean;
}) {
  const contraparte = negociacao.contraparte ?? (usuarioId === negociacao.empresaId ? "Produtor" : "Empresa");

  return (
    <Card className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display-soft text-2xl text-mata-900">Conversa</h2>
        {!demo && <AtualizarConversa />}
      </div>

      <section aria-labelledby="proposta-inicial" className="min-w-0 rounded-2xl bg-areia/50 p-4">
        <h3 id="proposta-inicial" className="text-sm font-semibold text-tinta">
          Proposta inicial
        </h3>
        <p className="mt-1 text-xs [overflow-wrap:anywhere] text-tinta-soft">
          {negociacao.empresaId === usuarioId ? "Você" : contraparte}
          {" · "}
          <time dateTime={negociacao.criadoEm}>{formatarData(negociacao.criadoEm)}</time>
        </p>
        <p className="mt-3 text-sm [overflow-wrap:anywhere] whitespace-pre-wrap text-tinta">
          {negociacao.mensagem}
        </p>
      </section>

      {negociacao.mensagens.length ? (
        <ol aria-label="Histórico de mensagens" className="space-y-3">
          {negociacao.mensagens.map((mensagem) => {
            const propria = mensagem.autorId === usuarioId;
            return (
              <li
                key={mensagem.id}
                className={cn(
                  "min-w-0 rounded-2xl border p-4 sm:max-w-[90%]",
                  propria ? "ml-auto border-broto-700/30 bg-broto/15" : "border-areia bg-palha-50",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="min-w-0 text-sm font-semibold [overflow-wrap:anywhere] text-tinta">
                    {propria ? "Você" : contraparte}
                  </p>
                  <time dateTime={mensagem.criadoEm} className="text-xs text-tinta-soft">
                    {formatarData(mensagem.criadoEm)}
                  </time>
                </div>
                <p className="mt-2 text-sm [overflow-wrap:anywhere] whitespace-pre-wrap text-tinta">
                  {mensagem.corpo}
                </p>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-tinta-soft">Ainda não há mensagens nesta conversa.</p>
      )}

      {demo ? (
        <p className="rounded-xl bg-areia/50 p-4 text-sm text-tinta-soft">
          No modo demonstração, as mensagens não são enviadas. Entre com uma conta conectada para conversar.
        </p>
      ) : (
        <FormMensagem interesseId={negociacao.id} />
      )}
    </Card>
  );
}
