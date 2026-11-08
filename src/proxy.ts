import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  // Ignora arquivos estáticos e imagens
  matcher: ["/((?!_next/static|_next/image|icon.svg|apple-icon.png|maplibre-gl-worker.mjs|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
