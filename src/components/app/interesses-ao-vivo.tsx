"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Nome de canal único por montagem: no StrictMode o efeito roda duas vezes, e reaproveitar
// um canal que ainda está sendo removido quebra a nova inscrição
let proximoCanal = 0;

/** 401: o canal não pôde ler a linha (RLS). O evento chega vazio e não é deste usuário. */
const semPermissao = (payload: { errors: string[] | null }) =>
  payload.errors?.some((erro) => erro.includes("401")) ?? false;

type Linha = { id: string };

/**
 * Supabase Realtime: quando um interesse chega, muda ou é retirado, atualiza a tela com
 * router.refresh(): o contador do menu e as listas vêm de novo do servidor.
 * INSERT e UPDATE passam pelo RLS de interests (cada produtor só recebe os dos próprios
 * projetos). DELETE não passa: chega para todos os inscritos só com o id, então a tela só
 * atualiza se o id estiver entre os interesses que este produtor enxerga.
 */
export function InteressesAoVivo() {
  const router = useRouter();
  const [recebidos, setRecebidos] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const meus = new Set<string>();
    let canal: RealtimeChannel | undefined;
    let desmontado = false;
    let espera: ReturnType<typeof setTimeout> | undefined;
    let jaConectou = false;
    // Vários eventos seguidos viram um refresh só
    const atualizar = () => {
      clearTimeout(espera);
      espera = setTimeout(() => router.refresh(), 300);
    };
    // O RLS devolve só os interesses dos projetos deste produtor
    const carregarMeus = async () => {
      const { data } = await supabase.from("interests").select("id");
      meus.clear();
      for (const { id } of data ?? []) meus.add(id);
    };

    async function escutar() {
      // O token do usuário precisa estar no socket ANTES do subscribe: sem ele o canal entra
      // como anônimo, o RLS não consegue filtrar pelo dono do projeto e chegam eventos de todos
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token || desmontado) return;
      await supabase.realtime.setAuth(token);
      if (desmontado) return;

      canal = supabase
        .channel(`interesses-recebidos-${++proximoCanal}`)
        .on<Linha>(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "interests" },
          (payload) => {
            if (semPermissao(payload)) return;
            meus.add(payload.new.id);
            setRecebidos((n) => n + 1);
            atualizar();
          },
        )
        .on<Linha>(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "interests" },
          (payload) => {
            if (!semPermissao(payload)) atualizar();
          },
        )
        .on<Linha>(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "interests" },
          (payload) => {
            if (payload.old.id && meus.delete(payload.old.id)) atualizar();
          },
        )
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") return;
          void carregarMeus();
          // Reconectou (rede caiu, aba dormiu no celular): eventos podem ter se perdido
          if (jaConectou) atualizar();
          jaConectou = true;
        });
    }
    void escutar();

    return () => {
      desmontado = true;
      clearTimeout(espera);
      if (canal) void supabase.removeChannel(canal);
    };
  }, [router]);

  // O contador do menu muda sem foco nem navegação: o aviso sonoro fica por conta desta região
  return (
    <p className="sr-only" aria-live="polite">
      {recebidos === 0
        ? ""
        : recebidos === 1
          ? "Você recebeu um novo interesse de empresa."
          : `Você recebeu ${recebidos} novos interesses de empresas.`}
    </p>
  );
}
