/**
 * O bundler (Turbopack) não resolve o Web Worker do MapLibre GL v6.
 * Copiamos o worker (autocontido) para public/ e o mapa usa setWorkerUrl().
 * Roda no postinstall e antes do dev/build.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/dist/maplibre-gl.mjs"));
mkdirSync("public", { recursive: true });
copyFileSync(join(dist, "maplibre-gl-worker.mjs"), join("public", "maplibre-gl-worker.mjs"));
console.log("worker do MapLibre copiado para public/maplibre-gl-worker.mjs");
