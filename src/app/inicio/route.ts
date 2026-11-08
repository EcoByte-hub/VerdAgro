import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/auth/sessao";
import { HOME_DO_PAPEL } from "@/lib/auth/rotas";

/** Redireciona o usuário logado para a área do seu papel. */
export async function GET() {
  const sessao = await obterSessao();
  redirect(sessao ? HOME_DO_PAPEL[sessao.papel] : "/entrar");
}
