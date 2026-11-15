"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { maplibregl } from "./maplibre";
import { useCallback, useEffect, useRef, useState } from "react";
import { TerraDraw, TerraDrawPolygonMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { Check, Eraser, PenLine, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { areaHectares, type PoligonoGeoJSON } from "@/lib/geo/poligono";
import { cn, formatHectares } from "@/lib/utils";
import { CENTRO_INICIAL, CORES, ESTILO_SATELITE } from "./estilo";

type Props = {
  onChange: (poligono: PoligonoGeoJSON | null) => void;
  /** Polígono pré-carregado (ex.: fazenda demonstrativa) */
  inicial?: PoligonoGeoJSON | null;
};

type Feicao = ReturnType<TerraDraw["getSnapshot"]>[number];
type Ponto = [number, number];

const MINIMO_PONTOS = 3;

/**
 * Ajustes para toque. No celular o dedo sempre desliza alguns pixels: com a tolerância
 * padrão do Terra Draw (1 px antes do primeiro ponto) o toque vira arrasto do mapa e
 * nenhum ponto é marcado.
 */
const TOQUE = { arrasto: 10, arrastoDesenhando: 12, cliqueMapa: 10 };

const fecharAnel = (pontos: Ponto[]): PoligonoGeoJSON => ({
  type: "Polygon",
  coordinates: [[...pontos, pontos[0]]],
});

const emDesenho = (draw: TerraDraw) =>
  draw.getSnapshot().find((f) => f.geometry.type === "Polygon" && f.properties.currentlyDrawing);

const concluido = (draw: TerraDraw) =>
  draw.getSnapshot().find((f) => f.geometry.type === "Polygon" && !f.properties.currentlyDrawing)
    ?.geometry as PoligonoGeoJSON | undefined;

/** Pontos já confirmados: durante o desenho o anel é [p0 … pn-1, provisório, p0]. */
function pontosConfirmados(f: Feicao | undefined): Ponto[] {
  if (!f || f.geometry.type !== "Polygon") return [];
  const n = Number(f.properties.committedCoordinateCount ?? 0);
  return (f.geometry.coordinates[0] as Ponto[]).slice(0, n);
}

/**
 * Mapa com desenho do limite da propriedade (MapLibre + Terra Draw).
 * Toque/clique em cada canto; feche com "Concluir" ou tocando no primeiro ponto.
 */
export default function DesenharPoligono({ onChange, inicial }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const modoRef = useRef<TerraDrawPolygonMode | null>(null);
  const onChangeRef = useRef(onChange);
  /** evita avisar o formulário a cada movimento do mouse */
  const publicado = useRef<string | null>(inicial ? JSON.stringify(inicial) : null);
  // Só roda no navegador (o mapa é carregado com ssr: false)
  const [toque] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [area, setArea] = useState<number | null>(inicial ? areaHectares(inicial) : null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /** Lê o Terra Draw para a interface e publica só polígono concluído. */
  const sincronizar = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;
    const novos = pontosConfirmados(emDesenho(draw));
    setPontos((atuais) => (JSON.stringify(atuais) === JSON.stringify(novos) ? atuais : novos));

    const poligono = concluido(draw) ?? null;
    setArea(poligono ? areaHectares(poligono) : null);
    const chave = poligono ? JSON.stringify(poligono) : null;
    if (chave !== publicado.current) {
      publicado.current = chave;
      onChangeRef.current(poligono);
    }
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: ESTILO_SATELITE,
      center: inicial ? inicial.coordinates[0][0] : CENTRO_INICIAL,
      zoom: 13,
      attributionControl: { compact: true },
      ...(toque && { clickTolerance: TOQUE.cliqueMapa }),
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("style.load", () => {
      const modo = new TerraDrawPolygonMode({
        styles: {
          fillColor: CORES.broto,
          fillOpacity: 0.2,
          outlineColor: CORES.broto,
          outlineWidth: 2.5,
          closingPointColor: CORES.mata,
          closingPointOutlineColor: CORES.broto,
        },
      });
      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({
          map,
          ...(toque && {
            minPixelDragDistance: TOQUE.arrasto,
            minPixelDragDistanceDrawing: TOQUE.arrastoDesenhando,
          }),
        }),
        modes: [modo],
      });
      draw.start();
      draw.setMode("polygon");
      drawRef.current = draw;
      modoRef.current = modo;

      if (inicial) {
        draw.addFeatures([{ type: "Feature", properties: { mode: "polygon" }, geometry: inicial }]);
        draw.setMode("static"); // pronto: um novo toque não começa outro polígono
      }

      draw.on("change", sincronizar);
      draw.on("finish", () => {
        // Fechado tocando no 1º ponto: sai do modo de desenho depois que o Terra Draw termina o evento
        queueMicrotask(() => {
          draw.setMode("static");
          sincronizar();
        });
      });
    });

    return () => {
      drawRef.current?.stop();
      drawRef.current = null;
      modoRef.current = null;
      map.remove();
    };
  }, [inicial, toque, sincronizar]);

  function concluir() {
    const draw = drawRef.current;
    if (!draw) return;
    const confirmados = pontosConfirmados(emDesenho(draw));
    if (confirmados.length < MINIMO_PONTOS) return;
    draw.setMode("static"); // encerra o desenho em andamento
    const [validacao] = draw.addFeatures([
      { type: "Feature", properties: { mode: "polygon" }, geometry: fecharAnel(confirmados) },
    ]);
    if (!validacao?.valid) {
      console.warn("[mapa] polígono recusado pelo Terra Draw", validacao?.reason);
      draw.setMode("polygon");
    }
    sincronizar();
  }

  function desfazer() {
    modoRef.current?.undo();
    sincronizar();
  }

  function limpar() {
    const draw = drawRef.current;
    if (!draw) return;
    draw.clear();
    draw.setMode("polygon");
    sincronizar();
  }

  const n = pontos.length;
  const pronto = area !== null;
  const areaParcial = n >= MINIMO_PONTOS ? areaHectares(fecharAnel(pontos)) : null;

  const botaoEscuro = "border border-palha/20 text-palha hover:bg-palha/10 hover:text-palha";

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-areia bg-mata-900">
      <div className="relative">
        <div ref={ref} className="h-[420px] w-full sm:h-[480px]" />
      </div>

      <div className="space-y-3 px-4 py-3 text-palha">
        <p className="flex items-center gap-2 text-sm text-palha/80">
          <PenLine size={16} className="shrink-0 text-broto" aria-hidden />
          {pronto ? (
            <>
              Área desenhada: <strong className="font-mono text-broto">{formatHectares(area)}</strong>
            </>
          ) : areaParcial !== null ? (
            <>
              Área até agora: <span className="font-mono text-broto">{formatHectares(areaParcial)}</span>
            </>
          ) : n > 0 ? (
            `${n} ${n === 1 ? "canto marcado" : "cantos marcados"}`
          ) : (
            "Nenhum canto marcado ainda."
          )}
        </p>

        {pronto ? (
          <Button variant="ghost" onClick={limpar} className={cn("w-full sm:w-auto", botaoEscuro)}>
            <Eraser size={16} /> Redesenhar
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button variant="ghost" onClick={desfazer} disabled={n === 0} className={botaoEscuro}>
              <Undo2 size={16} /> Desfazer
            </Button>
            <Button variant="ghost" onClick={limpar} disabled={n === 0} className={botaoEscuro}>
              <Eraser size={16} /> Limpar
            </Button>
            <Button onClick={concluir} disabled={n < MINIMO_PONTOS} className="col-span-2">
              <Check size={16} /> Concluir desenho
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
