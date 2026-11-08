"use client";

import { useActionState, useState } from "react";
import { salvarPropriedade } from "@/app/(app)/produtor/propriedades/nova/actions";
import { DesenharPoligono } from "@/components/mapa";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { FAZENDA_BOA_VISTA } from "@/lib/demo/fazenda-boa-vista";
import { PRATICAS, ROTULO_PRATICA } from "@/lib/diagnostico/schema";
import type { PoligonoGeoJSON } from "@/lib/geo/poligono";

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

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
            <Select id="uf" name="uf" required defaultValue="">
              <option value="" disabled>
                UF
              </option>
              {UFS.map((uf) => (
                <option key={uf}>{uf}</option>
              ))}
            </Select>
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
              <div
                key={p}
                className="flex items-center gap-3 rounded-xl border border-areia bg-palha-50 px-3 py-2"
              >
                <input
                  id={`pratica_${p}`}
                  name={`pratica_${p}`}
                  type="checkbox"
                  className="size-4 accent-[#2e5e43]"
                />
                <label htmlFor={`pratica_${p}`} className="flex-1 text-sm text-tinta">
                  {ROTULO_PRATICA[p]}
                </label>
                <input
                  name={`desde_${p}`}
                  inputMode="numeric"
                  placeholder="desde"
                  aria-label={`${ROTULO_PRATICA[p]}: ano de início`}
                  className="w-20 rounded-lg border border-areia bg-palha px-2 py-1 text-sm"
                />
              </div>
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
