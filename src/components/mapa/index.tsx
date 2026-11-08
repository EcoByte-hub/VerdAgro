"use client";

import dynamic from "next/dynamic";

/** Componentes de mapa carregados só no navegador (MapLibre depende de WebGL/window). */
const Carregando = () => (
  <div className="h-full min-h-[320px] w-full animate-pulse rounded-[var(--radius-card)] bg-mata-800" />
);

export const MapaPropriedade = dynamic(() => import("./mapa-propriedade"), {
  ssr: false,
  loading: Carregando,
});
export const DesenharPoligono = dynamic(() => import("./desenhar-poligono"), {
  ssr: false,
  loading: Carregando,
});
