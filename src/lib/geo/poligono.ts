import area from "@turf/area";
import { z } from "zod";

/** Ring GeoJSON: lista de [longitude, latitude], fechado (primeiro = último). */
export type Anel = [number, number][];
export type PoligonoGeoJSON = { type: "Polygon"; coordinates: Anel[] };

/** Limites de cadastro para a demo (evita polígonos absurdos). */
export const AREA_MINIMA_HA = 1;
export const AREA_MAXIMA_HA = 50_000;

const ponto = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

export const poligonoSchema = z
  .object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(ponto).min(4)).length(1, "Use um único contorno, sem furos"),
  })
  .refine((p) => {
    const anel = p.coordinates[0];
    const [a, b] = [anel[0], anel[anel.length - 1]];
    return a[0] === b[0] && a[1] === b[1];
  }, "O contorno precisa ser fechado");

/** Área em hectares (geodésica, via Turf). */
export function areaHectares(poligono: PoligonoGeoJSON): number {
  return Math.round((area(poligono) / 10_000) * 100) / 100;
}

/** Centróide simples (média dos vértices). Suficiente para clima e mapa. */
export function centroide(poligono: PoligonoGeoJSON): { latitude: number; longitude: number } {
  const anel = poligono.coordinates[0].slice(0, -1);
  const soma = anel.reduce((acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat], [0, 0]);
  return { longitude: soma[0] / anel.length, latitude: soma[1] / anel.length };
}

/** Converte para WKT (formato aceito pelo PostGIS / Supabase). */
export function paraWKT(poligono: PoligonoGeoJSON): string {
  const pts = poligono.coordinates[0].map(([lng, lat]) => `${lng} ${lat}`).join(", ");
  return `SRID=4326;POLYGON((${pts}))`;
}

/** Valida forma e tamanho. Retorna mensagem de erro em português ou null. */
export function validarPoligono(
  input: unknown,
): { ok: true; poligono: PoligonoGeoJSON; areaHa: number } | { ok: false; erro: string } {
  const parsed = poligonoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0]?.message ?? "Polígono inválido" };
  const poligono = parsed.data as PoligonoGeoJSON;
  const areaHa = areaHectares(poligono);
  if (areaHa < AREA_MINIMA_HA)
    return { ok: false, erro: `A área precisa ter pelo menos ${AREA_MINIMA_HA} ha` };
  if (areaHa > AREA_MAXIMA_HA)
    return { ok: false, erro: `A área máxima para cadastro é ${AREA_MAXIMA_HA} ha` };
  return { ok: true, poligono, areaHa };
}
