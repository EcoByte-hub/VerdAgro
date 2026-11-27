"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { criarProjetoAction } from "./actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { PRATICAS, ROTULO_PRATICA } from "@/lib/diagnostico/schema";
import { formatHectares } from "@/lib/utils";

type PropriedadeResumo = {
  id: string;
  nome: string;
  municipio: string;
  uf: string;
  areaHa: number;
  isDemo: boolean;
};

type Props = {
  propriedades: PropriedadeResumo[];
  /** pré-seleção vinda do diagnóstico (?propriedade=&pratica=&titulo=) */
  inicial: { propriedadeId: string | null; titulo: string | null; pratica: string | null };
};

export function FormularioNovoProjeto({ propriedades, inicial }: Props) {
  const [estado, acao, pendente] = useActionState(criarProjetoAction, undefined);
  const [propriedadeId, setPropriedadeId] = useState(
    inicial.propriedadeId && propriedades.some((p) => p.id === inicial.propriedadeId)
      ? inicial.propriedadeId
      : propriedades[0]?.id ?? "",
  );
  const selecionada = propriedades.find((p) => p.id === propriedadeId);

  // O React limpa o formulário depois do envio; em caso de erro, o que foi
  // digitado volta como valor padrão para o produtor não perder o texto.
  const valor = (campo: string, padrao: string | null = null) => estado?.valores?.[campo] ?? padrao ?? "";

  return (
    <form action={acao} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="projeto-propriedade">Propriedade</Label>
          <Select
            id="projeto-propriedade"
            name="propriedade"
            required
            value={propriedadeId}
            onChange={(e) => setPropriedadeId(e.target.value)}
          >
            {propriedades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} · {p.municipio}/{p.uf}
              </option>
            ))}
          </Select>
          {selecionada && (
            <p className="mt-1 text-xs text-tinta-soft">
              O diagnóstico desta propriedade ajuda a escolher a prática do projeto.
            </p>
          )}
        </div>
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
      </div>

      <div>
        <Label htmlFor="projeto-titulo">Título</Label>
        <Input
          id="projeto-titulo"
          name="titulo"
          required
          minLength={3}
          maxLength={120}
          placeholder="Ex.: recuperação de 80 ha de pastagem degradada"
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
          defaultValue={valor("descricao")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="projeto-area">Área do projeto (ha)</Label>
          <Input
            id="projeto-area"
            name="area"
            required
            inputMode="decimal"
            aria-describedby="projeto-area-dica"
            placeholder="Ex.: 80"
            defaultValue={valor("area")}
          />
          <p id="projeto-area-dica" className="mt-1 text-xs text-tinta-soft">
            {selecionada
              ? `Até ${formatHectares(selecionada.areaHa)}, a área da propriedade.`
              : "Não pode passar da área da propriedade."}
          </p>
        </div>
        <div>
          <Label htmlFor="projeto-inicio">Início</Label>
          <Input id="projeto-inicio" name="inicio" type="date" defaultValue={valor("inicio")} />
        </div>
        <div>
          <Label htmlFor="projeto-fim">Término previsto</Label>
          <Input id="projeto-fim" name="fim" type="date" defaultValue={valor("fim")} />
        </div>
      </div>

      <div>
        <Label htmlFor="projeto-objetivo">Objetivo</Label>
        <Textarea
          id="projeto-objetivo"
          name="objetivo"
          maxLength={500}
          className="min-h-20"
          placeholder="Ex.: aumentar o carbono orgânico do solo e reduzir erosão."
          defaultValue={valor("objetivo")}
        />
      </div>

      <div>
        <Label htmlFor="projeto-metodologia">Metodologia de referência</Label>
        <Input
          id="projeto-metodologia"
          name="metodologia"
          maxLength={120}
          placeholder="Ex.: Verra VM0042"
          defaultValue={valor("metodologia")}
        />
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
          defaultValue={valor("infoComercial")}
        />
        <p id="projeto-info-dica" className="mt-1 text-xs text-tinta-soft">
          Aparece para as empresas no marketplace.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-areia bg-palha-50 px-3 py-2">
        <input
          id="projeto-publicar"
          name="publicar"
          type="checkbox"
          defaultChecked={estado?.valores?.publicar === "on"}
          className="size-4 accent-[#2e5e43]"
        />
        <label htmlFor="projeto-publicar" className="flex-1 text-sm text-tinta">
          Publicar no marketplace agora
        </label>
      </div>
      <p className="-mt-2 text-xs text-tinta-soft">
        Sem publicar, o projeto fica só no seu painel — dá para publicar depois, na página do projeto.
      </p>

      <FieldError>{estado?.erro}</FieldError>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href="/produtor/projetos" className={buttonClasses({ variant: "ghost" })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={pendente}>
          {pendente ? "Criando..." : "Criar projeto"}
        </Button>
      </div>
    </form>
  );
}
