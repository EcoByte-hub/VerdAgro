import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_DEMO, regraDaRota } from "@/lib/auth/rotas";
import { env, integrations } from "@/lib/env";

/**
 * Renova a sessão do Supabase a cada requisição e faz a checagem OTIMISTA
 * de login (redireciona para /entrar). A autorização real fica no RLS do banco
 * e nas páginas (ver lib/auth/sessao.ts).
 */
export async function atualizarSessao(request: NextRequest) {
  const regra = regraDaRota(request.nextUrl.pathname);

  if (!integrations.supabase) {
    if (regra && !request.cookies.get(COOKIE_DEMO)) return redirecionarParaEntrar(request);
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl!, env.supabasePublishableKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Não coloque código entre createServerClient e getClaims (renovação da sessão).
  const { data } = await supabase.auth.getClaims();

  if (regra && !data?.claims) return redirecionarParaEntrar(request);
  return response;
}

function redirecionarParaEntrar(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.searchParams.set("voltar", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}
