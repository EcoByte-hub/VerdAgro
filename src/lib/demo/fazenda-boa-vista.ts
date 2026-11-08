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
        [-50.965217, -17.85058],
        [-50.959604, -17.853061],
        [-50.952386, -17.851916],
        [-50.950181, -17.846573],
        [-50.951986, -17.840657],
        [-50.958601, -17.83913],
        [-50.964616, -17.841611],
        [-50.966019, -17.846573],
        [-50.965217, -17.85058],
      ],
    ],
  } satisfies PoligonoGeoJSON,
} as const;
