import { describe, expect, it } from "vitest";
import { FAZENDA_BOA_VISTA } from "@/lib/demo/fazenda-boa-vista";
import { areaHectares, centroide, paraWKT, validarPoligono } from "./poligono";

describe("polígono da propriedade", () => {
  it("calcula ≈200 ha para a Fazenda Boa Vista", () => {
    const ha = areaHectares(FAZENDA_BOA_VISTA.poligono);
    expect(ha).toBeGreaterThan(195);
    expect(ha).toBeLessThan(205);
  });

  it("calcula o centróide em Rio Verde/GO", () => {
    const c = centroide(FAZENDA_BOA_VISTA.poligono);
    expect(c.latitude).toBeCloseTo(-17.954, 2);
    expect(c.longitude).toBeCloseTo(-50.992, 2);
  });

  it("gera WKT com SRID 4326", () => {
    expect(paraWKT(FAZENDA_BOA_VISTA.poligono)).toMatch(/^SRID=4326;POLYGON\(\(-50\.998726 -17\.959067, /);
  });

  it("aceita um polígono válido", () => {
    const r = validarPoligono(FAZENDA_BOA_VISTA.poligono);
    expect(r.ok).toBe(true);
  });

  it("rejeita contorno aberto", () => {
    const aberto = {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
        ],
      ],
    };
    expect(validarPoligono(aberto)).toEqual({ ok: false, erro: "O contorno precisa ser fechado" });
  });

  it("rejeita área minúscula", () => {
    const minusculo = {
      type: "Polygon",
      coordinates: [
        [
          [-50, -17],
          [-50.0001, -17],
          [-50.0001, -17.0001],
          [-50, -17],
        ],
      ],
    };
    const r = validarPoligono(minusculo);
    expect(r.ok).toBe(false);
  });
});
