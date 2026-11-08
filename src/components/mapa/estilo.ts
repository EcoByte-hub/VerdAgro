import type { StyleSpecification } from "maplibre-gl";

/**
 * Mapa base com imagem de satélite (Esri World Imagery) e atribuição visível.
 * Conferir os termos de uso do provedor antes da demo pública (issue dedicada).
 */
export const ESTILO_SATELITE: StyleSpecification = {
  version: 8,
  sources: {
    satelite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Imagens © Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "satelite", type: "raster", source: "satelite" }],
};

/** Centro inicial: cerrado goiano (região da fazenda demo). */
export const CENTRO_INICIAL: [number, number] = [-50.9915, -17.9545];

export const CORES = {
  broto: "#c5f25c",
  mata: "#0e2a1f",
  cerrado: "#e39a75",
} as const;
