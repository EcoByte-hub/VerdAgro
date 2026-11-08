import type { PoligonoGeoJSON } from "@/lib/geo/poligono";

/**
 * Propriedade DEMONSTRATIVA usada no roteiro da apresentação.
 * Mesmo polígono do supabase/seed.sql (≈200 ha, Rio Verde/GO).
 */
export const FAZENDA_BOA_VISTA = {
  id: "aaaaaaaa-0000-4000-8000-000000000001",
  nome: "Fazenda Boa Vista",
  municipio: "Rio Verde",
  uf: "GO",
  producao: "Grãos",
  culturas: ["soja", "milho safrinha"],
  historico:
    "Pastagem degradada até 2017. Conversão para lavoura de grãos em 2018 com plantio direto desde o início.",
  praticas: [
    { pratica: "plantio_direto", desde: 2018 },
    { pratica: "rotacao_culturas", desde: 2019 },
  ],
  poligono: {
    type: "Polygon",
    coordinates: [
      [
        [-50.998726, -17.959067],
        [-50.993109, -17.961547],
        [-50.985887, -17.960402],
        [-50.98368, -17.955059],
        [-50.985486, -17.949143],
        [-50.992106, -17.947616],
        [-50.998124, -17.950097],
        [-50.999528, -17.955059],
        [-50.998726, -17.959067],
      ],
    ],
  } satisfies PoligonoGeoJSON,
} as const;
