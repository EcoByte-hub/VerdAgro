"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { PoligonoGeoJSON } from "@/lib/geo/poligono";
import { CORES, ESTILO_SATELITE } from "./estilo";

/** Mapa somente leitura com o contorno da propriedade. */
export default function MapaPropriedade({
  poligono,
  className,
}: {
  poligono: PoligonoGeoJSON;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: ESTILO_SATELITE,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const anel = poligono.coordinates[0];
    const lngs = anel.map((p) => p[0]);
    const lats = anel.map((p) => p[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 48, duration: 0 },
    );

    map.on("load", () => {
      map.addSource("propriedade", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: poligono },
      });
      map.addLayer({
        id: "propriedade-fill",
        type: "fill",
        source: "propriedade",
        paint: { "fill-color": CORES.broto, "fill-opacity": 0.18 },
      });
      map.addLayer({
        id: "propriedade-linha",
        type: "line",
        source: "propriedade",
        paint: { "line-color": CORES.broto, "line-width": 2.5 },
      });
    });

    return () => map.remove();
  }, [poligono]);

  return (
    <div
      ref={ref}
      className={className}
      role="img"
      aria-label="Mapa de satélite com o limite da propriedade"
    />
  );
}
