"use client";

import { startTransition, useActionState, useState } from "react";
import { CheckCircle2, Pencil } from "lucide-react";
import { salvarProjeto, type EstadoEdicaoProjeto } from "@/app/(app)/produtor/projetos/[id]/actions";
import { Button } from "@/components/ui/button";
import { Card, CardEyebrow } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import type { EdicaoProjeto } from "@/lib/dados/tipos";
import { PRATICAS, ROTULO_PRATICA } from "@/lib/diagnostico/schema";
import { formatHectares } from "@/lib/utils";

type Props = {
  projetoId: string;
  inicial: EdicaoProjeto;
  /** área da propriedade: o projeto não pode ser maior que ela */
  areaMaxima: number;
  /** visualização dos dados, renderizada no servidor */
  children: React.ReactNode;
};

/** Card "Dados do projeto" que alterna entre visualização e edição. */
export function DadosProjeto({ projetoId, inicial, areaMaxima, children }: Props) {
  const [editando, setEditando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex min-h-9 items-center justify-between gap-3">
        <CardEyebrow>{editando ? "Editar dados do projeto" : "Dados do projeto"}</CardEyebrow>
        {!editando && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setAviso(null);
              setEditando(true);
            }}
          >
            <Pencil size={14} /> Editar
          </Button>
        )}
      </div>

      {editando ? (
        <FormularioProjeto
          projetoId={projetoId}
          inicial={inicial}
          areaMaxima={areaMaxima}
          onCancelar={() => setEditando(false)}
          onSalvo={(mensagem) => {
            setAviso(mensagem);
            setEditando(false);
          }}
        />
      ) : (
        <>
          {aviso && (
            <p
              role="status"
              className="mt-4 flex items-center gap-2 rounded-2xl bg-broto/25 px-4 py-3 text-sm text-mata-900"
            >
              <CheckCircle2 size={16} className="shrink-0" /> {aviso}
            </p>
          )}
          <div className="mt-4">{children}</div>
        </>
      )}
    </Card>
  );
}

function FormularioProjeto({
  projetoId,
  inicial,
  areaMaxima,
  onCancelar,
  onSalvo,
}: Omit<Props, "children"> & { onCancelar: () => void; onSalvo: (mensagem: string) => void }) {
  const [estado, acao, pendente] = useActionState(
    async (anterior: EstadoEdicaoProjeto, formData: FormData) => {
      const resultado = await salvarProjeto(anterior, formData);
      const ok = resultado?.ok;
      if (ok) startTransition(() => onSalvo(ok));
      return resultado;
    },
    undefined,
  );

  // O React limpa o formulário depois do envio; em caso de erro, o que foi
  // digitado volta como valor padrão para o produtor não perder o texto.
  const valor = (campo: string, padrao: string | null) => estado?.valores?.[campo] ?? padrao ?? "";

  return (
    <form action={acao} className="mt-4 space-y-4">
      <input type="hidden" name="projetoId" value={projetoId} />

      <div>
        <Label htmlFor="projeto-titulo">Título</Label>
        <Input
          id="projeto-titulo"
          name="titulo"
          required
          minLength={3}
          maxLength={120}
          defaultValue={valor("titulo", inicial.titulo)}
        />
      </div>

      <div>
        <Label htmlFor="projeto-descricao">Descrição</Label>
        <Textarea
          id="projeto-descricao"
          name="descricao"
          maxLength={2000}
          placeholder="O que será feito, em qual parte da propriedade e como."
          defaultValue={valor("descricao", inicial.descricao)}
        />
      </div>

      <div>
        <Label htmlFor="projeto-objetivo">Objetivo</Label>
        <Textarea
          id="projeto-objetivo"
          name="objetivo"
          maxLength={500}
          className="min-h-20"
          placeholder="Ex.: aumentar o carbono orgânico do solo e reduzir erosão."
          defaultValue={valor("objetivo", inicial.objetivo)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="projeto-pratica">Prática</Label>
          <Select
            id="projeto-pratica"
            name="pratica"
            required
            defaultValue={valor("pratica", inicial.pratica)}
          >
            {PRATICAS.map((p) => (
              <option key={p} value={p}>
                {ROTULO_PRATICA[p]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="projeto-area">Área do projeto (ha)</Label>
          <Input
            id="projeto-area"
            name="area"
            required
            inputMode="decimal"
            aria-describedby="projeto-area-dica"
            defaultValue={valor("area", String(inicial.areaHa).replace(".", ","))}
          />
          <p id="projeto-area-dica" className="mt-1 text-xs text-tinta-soft">
            Até {formatHectares(areaMaxima)}, a área da propriedade.
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="projeto-metodologia">Metodologia de referência</Label>
        <Input
          id="projeto-metodologia"
          name="metodologia"
          maxLength={120}
          placeholder="Ex.: Verra VM0042"
          defaultValue={valor("metodologia", inicial.metodologia)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="projeto-inicio">Início</Label>
          <Input
            id="projeto-inicio"
            name="inicio"
            type="date"
            defaultValue={valor("inicio", inicial.inicio)}
          />
        </div>
        <div>
          <Label htmlFor="projeto-fim">Término previsto</Label>
          <Input id="projeto-fim" name="fim" type="date" defaultValue={valor("fim", inicial.fim)} />
        </div>
      </div>

      <div>
        <Label htmlFor="projeto-info">Informações comerciais</Label>
        <Textarea
          id="projeto-info"
          name="infoComercial"
          maxLength={1000}
          className="min-h-20"
          aria-describedby="projeto-info-dica"
          placeholder="Ex.: aberto a pré-compra condicionada à verificação."
          defaultValue={valor("infoComercial", inicial.infoComercial)}
        />
        <p id="projeto-info-dica" className="mt-1 text-xs text-tinta-soft">
          Aparece para as empresas no marketplace.
        </p>
      </div>

      <FieldError>{estado?.erro}</FieldError>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancelar} disabled={pendente}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pendente}>
          {pendente ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
