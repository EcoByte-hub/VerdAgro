"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirPapel } from "@/lib/auth/sessao";
import { criarInteresse } from "@/lib/dados";

export type EstadoInteresse = { erro?: string; ok?: string } | undefined;

const schema = z.object({
  projetoId: z.uuid(),
  mensagem: z.string().trim().min(10, "Escreva uma mensagem com pelo menos 10 caracteres").max(2000),
  volume: z.string().optional(),
});

export async function manifestarInteresse(_: EstadoInteresse, formData: FormData): Promise<EstadoInteresse> {
  const sessao = await exigirPapel("empresa");
  const dados = schema.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: dados.error.issues[0].message };

  const volume = dados.data.volume ? Number(dados.data.volume.replace(",", ".")) : null;
  if (volume !== null && (!Number.isFinite(volume) || volume <= 0)) return { erro: "Volume inválido" };

  try {
    await criarInteresse(sessao, {
      projetoId: dados.data.projetoId,
      mensagem: dados.data.mensagem,
      volumeProposto: volume,
    });
  } catch (e) {
    return { erro: (e as Error).message || "Não foi possível enviar." };
  }
  revalidatePath(`/marketplace/${dados.data.projetoId}`);
  return {
    ok:
      sessao.modo === "demo"
        ? "Interesse simulado (modo demonstração). No app conectado, o produtor recebe no painel."
        : "Interesse enviado! O produtor vai receber no painel.",
  };
}
