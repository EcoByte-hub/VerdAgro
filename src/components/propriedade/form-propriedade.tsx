"use client";

import { useActionState, useState } from "react";
import { salvarPropriedade } from "@/app/(app)/produtor/propriedades/nova/actions";
import { DesenharPoligono } from "@/components/mapa";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { SeletorAno } from "@/components/ui/seletor-ano";
import { SeletorOpcoes } from "@/components/ui/seletor-opcoes";
import type { Pratica } from "@/lib/dados/tipos";
import { FAZENDA_BOA_VISTA } from "@/lib/demo/fazenda-boa-vista";
import { PRATICAS, ROTULO_PRATICA } from "@/lib/diagnostico/schema";
import type { PoligonoGeoJSON } from "@/lib/geo/poligono";
import { OPCOES_UF } from "@/lib/geo/ufs";

export function FormPropriedade() {
  const [estado, acao, pendente] = useActionState(salvarPropriedade, undefined);
  const [poligono, setPoligono] = useState<PoligonoGeoJSON | null>(null);
  const [inicial, setInicial] = useState<PoligonoGeoJSON | null>(null);

  return (
    <form action={acao} className="grid gap-8 xl:grid-cols-[1.3fr_1fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="mb-0">Limite da propriedade</Label>
          <button
            type="button"
            className="text-xs font-semibold text-musgo underline-offset-4 hover:underline"
            onClick={() => {
              setInicial(FAZENDA_BOA_VISTA.poligono);
              setPoligono(FAZENDA_BOA_VISTA.poligono);
            }}
          >
            Usar polígono da fazenda demonstrativa
          </button>
        </div>
        <DesenharPoligono key={inicial ? "demo" : "vazio"} inicial={inicial} onChange={setPoligono} />
        <input type="hidden" name="poligono" value={poligono ? JSON.stringify(poligono) : ""} />
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome da propriedade</Label>
          <Input id="nome" name="nome" required placeholder="Fazenda Boa Vista" />
        </div>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <div>
            <Label htmlFor="municipio">Município</Label>
            <Input id="municipio" name="municipio" required />
          </div>
          <div>
            <Label htmlFor="uf">UF</Label>
            <SeletorOpcoes
              id="uf"
              name="uf"
              rotulo="UF"
              opcoes={OPCOES_UF}
              placeholder="UF"
              required
              mensagemObrigatorio="Escolha a UF"
              buscavel
              placeholderBusca="Buscar estado"
              alinhar="fim"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="producao">Tipo de produção</Label>
            <Input id="producao" name="producao" placeholder="Grãos, pecuária..." />
          </div>
          <div>
            <Label htmlFor="culturas">Culturas (separe por vírgula)</Label>
            <Input id="culturas" name="culturas" placeholder="soja, milho safrinha" />
          </div>
        </div>
        <div>
          <Label htmlFor="historico">Histórico de uso do solo</Label>
          <Textarea
            id="historico"
            name="historico"
            placeholder="Ex.: pastagem até 2017, lavoura desde 2018..."
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-tinta">Práticas de manejo adotadas</legend>
          <div className="space-y-2">
            {PRATICAS.filter((p) => p !== "outra").map((p) => (
              <LinhaPratica key={p} pratica={p} />
            ))}
          </div>
        </fieldset>

        <FieldError>{estado?.erro}</FieldError>
        <Button type="submit" size="lg" className="w-full" disabled={pendente || !poligono}>
          {pendente ? "Salvando..." : poligono ? "Salvar propriedade" : "Desenhe o limite no mapa"}
        </Button>
      </div>
    </form>
  );
}

function LinhaPratica({ pratica }: { pratica: Pratica }) {
  // Controlado para que escolher o ano marque a prática: sem a marcação o servidor descarta o ano
  const [marcada, setMarcada] = useState(false);
  const rotulo = ROTULO_PRATICA[pratica];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-areia bg-palha-50 px-3 py-2">
      <input
        id={`pratica_${pratica}`}
        name={`pratica_${pratica}`}
        type="checkbox"
        checked={marcada}
        onChange={(e) => setMarcada(e.target.checked)}
        className="size-4 accent-[#2e5e43]"
      />
      <label htmlFor={`pratica_${pratica}`} className="flex-1 text-sm text-tinta">
        {rotulo}
      </label>
      <SeletorAno
        name={`desde_${pratica}`}
        rotulo={`${rotulo}: ano de início`}
        placeholder="desde"
        onChange={(ano) => {
          if (ano !== null) setMarcada(true);
        }}
      />
    </div>
  );
}
