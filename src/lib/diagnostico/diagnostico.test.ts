import { describe, expect, it } from "vitest";
import climaFixture from "@/lib/demo/dados/nasa-power-rio-verde-2024.json";
import { DIAGNOSTICO_DEMO } from "@/lib/demo/diagnostico-demo";
import { FAZENDA_BOA_VISTA } from "@/lib/demo/fazenda-boa-vista";
import { NDVI_DEMO } from "@/lib/demo/ndvi-demo";
import { resumirClima } from "@/lib/clima/nasa-power";
import { calcularIndicadores } from "./indicadores";
import { montarMensagem, SYSTEM_PROMPT } from "./prompt";
import { diagnosticoSchema } from "./schema";

const clima = resumirClima(climaFixture, { ano: 2024, latitude: -17.846, longitude: -50.958 });

describe("indicadores", () => {
  it("calcula NDVI médio, pico e estação seca da série demo", () => {
    const ind = calcularIndicadores(NDVI_DEMO, clima);
    expect(ind.ndviPico).toBe(0.81);
    expect(ind.ndviSeca).toBeLessThan(0.35);
    expect(ind.mesesSoloExposto).toBe(2); // ago e set < 0,3
    expect(ind.mesesComDado).toBe(12);
    expect(ind.precipitacaoAnualMm).toBe(clima.precipitacaoAnual);
  });

  it("lida com ausência total de dados", () => {
    const ind = calcularIndicadores(null, null);
    expect(ind.ndviMedio).toBeNull();
    expect(ind.mesesComDado).toBe(0);
  });
});

describe("guarda-corpos", () => {
  it("o schema não tem nenhum campo de carbono, crédito, receita ou certificação", () => {
    const campos = JSON.stringify(diagnosticoSchema.toJSONSchema()).toLowerCase();
    for (const proibido of ["co2", "tonelada", "credito", "crédito", "receita", "certificad", "valor"]) {
      expect(campos.includes(`"${proibido}`)).toBe(false);
    }
    expect(Object.keys(diagnosticoSchema.shape)).not.toContain("creditos");
  });

  it("o prompt proíbe estimar carbono e afirmar certificação", () => {
    expect(SYSTEM_PROMPT).toContain("Não estime toneladas de CO₂");
    expect(SYSTEM_PROMPT).toContain("Não diga que a propriedade, a prática ou um projeto é certificado");
  });

  it("o diagnóstico demo respeita o schema", () => {
    expect(diagnosticoSchema.safeParse(DIAGNOSTICO_DEMO).success).toBe(true);
  });
});

describe("mensagem para a IA", () => {
  it("inclui dados informados, indicadores e a origem do NDVI", () => {
    const msg = montarMensagem(
      {
        nome: FAZENDA_BOA_VISTA.nome,
        municipio: FAZENDA_BOA_VISTA.municipio,
        uf: FAZENDA_BOA_VISTA.uf,
        areaHa: 200,
        producao: FAZENDA_BOA_VISTA.producao,
        culturas: FAZENDA_BOA_VISTA.culturas,
        historico: FAZENDA_BOA_VISTA.historico,
        praticas: FAZENDA_BOA_VISTA.praticas,
      },
      calcularIndicadores(NDVI_DEMO, clima),
      "demo",
    );
    expect(msg).toContain("Rio Verde/GO");
    expect(msg).toContain("Plantio direto (desde 2018)");
    expect(msg).toContain("série demonstrativa");
    expect(msg).toContain("NDVI de pico: 0,81");
  });
});
