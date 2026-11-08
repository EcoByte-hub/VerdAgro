import * as maplibregl from "maplibre-gl";

// Worker servido de public/ (ver scripts/copiar-worker-maplibre.mjs)
if (typeof window !== "undefined") maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

export { maplibregl };
