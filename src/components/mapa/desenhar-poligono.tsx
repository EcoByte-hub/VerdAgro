"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { maplibregl } from "./maplibre";
import { useEffect, useRef, useState } from "react";
import { TerraDraw, TerraDrawPolygonMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { Eraser, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { areaHectares, type PoligonoGeoJSON } from "@/lib/geo/poligono";
import { formatHectares } from "@/lib/utils";
import { CENTRO_INICIAL, CORES, ESTILO_SATELITE } from "./estilo";

type Props = {
  onChange: (poligono: PoligonoGeoJSON | null) => void;
  /** Polígono pré-carregado (ex.: fazenda demonstrativa) */
  inicial?: PoligonoGeoJSON | null;
};

/**
 * Mapa com desenho do limite da propriedade (MapLibre + Terra Draw).
 * Clique para adicionar vértices; clique no primeiro ponto para fechar.
 */
export default function DesenharPoligono({ onChange, inicial }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const onChangeRef = useRef(onChange);
  const [area, setArea] = useState<number | null>(inicial ? areaHectares(inicial) : null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: ESTILO_SATELITE,
      center: inicial ? inicial.coordinates[0][0] : CENTRO_INICIAL,
      zoom: 13,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("style.load", () => {
      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPolygonMode({
            styles: {
              fillColor: CORES.broto,
              fillOpacity: 0.2,
              outlineColor: CORES.broto,
              outlineWidth: 2.5,
              closingPointColor: CORES.mata,
              closingPointOutlineColor: CORES.broto,
            },
          }),
        ],
      });
      draw.start();
      draw.setMode("polygon");
      drawRef.current = draw;

      if (inicial) {
        draw.addFeatures([{ type: "Feature", properties: { mode: "polygon" }, geometry: inicial }]);
      }

      const publicar = () => {
        const poligono = draw.getSnapshot().find((f) => f.geometry.type === "Polygon")?.geometry as
          PoligonoGeoJSON | undefined;
        setArea(poligono ? areaHectares(poligono) : null);
        onChangeRef.current(poligono ?? null);
      };
      draw.on("finish", publicar);
      draw.on("change", (_ids, tipo) => {
        if (tipo === "delete") publicar();
      });
    });

    return () => {
      drawRef.current?.stop();
      drawRef.current = null;
      map.remove();
    };
  }, [inicial]);

  const limpar = () => {
    drawRef.current?.clear();
    drawRef.current?.setMode("polygon");
    setArea(null);
    onChangeRef.current(null);
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-areia bg-mata-900">
      <div ref={ref} className="h-[420px] w-full sm:h-[480px]" />
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-palha">
        <p className="flex items-center gap-2 text-sm text-palha/80">
          <PenLine size={16} className="text-broto" />
          {area === null ? (
            "Clique no mapa para marcar os vértices e no primeiro ponto para fechar."
          ) : (
            <>
              Área desenhada: <strong className="font-mono text-broto">{formatHectares(area)}</strong>
            </>
          )}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={limpar}
          className="text-palha/80 hover:bg-palha/10 hover:text-palha"
        >
          <Eraser size={16} /> Limpar
        </Button>
      </div>
    </div>
  );
}
