"use client";

import { useId, useState, useTransition } from "react";
import { CheckCircle2, FileText, FileUp, ImageIcon, Upload, X } from "lucide-react";
import { anexarDocumento } from "@/app/(app)/produtor/projetos/[id]/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { SeletorOpcoes } from "@/components/ui/seletor-opcoes";
import { ROTULO_DOCUMENTO, TIPOS_DOCUMENTO } from "@/lib/dados/tipos";
import {
  ACCEPT_ARQUIVOS,
  BUCKET_EVIDENCIAS,
  caminhoNoBucket,
  formatarTamanho,
  traduzirErroStorage,
  validarArquivo,
} from "@/lib/documentos";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const OPCOES_TIPO = TIPOS_DOCUMENTO.map((t) => ({ valor: t, rotulo: ROTULO_DOCUMENTO[t] }));

/**
 * Envio de documento: o arquivo vai do navegador direto para o bucket privado
 * (pasta do projeto) e depois é registrado em project_documents por uma server action.
 */
export function EnviarDocumento({ projetoId, demo }: { projetoId: string; demo: boolean }) {
  const [tipo, setTipo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  /** muda a cada envio para o seletor de tipo voltar ao início */
  const [rodada, setRodada] = useState(0);
  const [enviando, iniciar] = useTransition();
  const idArquivo = useId();
  const idTipo = useId();

  function escolher(f: File | undefined) {
    setAviso(null);
    if (!f) return;
    const validacao = validarArquivo(f);
    if (!validacao.ok) {
      setErro(validacao.erro);
      setArquivo(null);
      return;
    }
    setErro(null);
    setArquivo(f);
  }

  function enviar() {
    if (!arquivo) return;
    if (!tipo) {
      setErro("Escolha o tipo do documento.");
      return;
    }
    const validacao = validarArquivo(arquivo);
    if (!validacao.ok) {
      setErro(validacao.erro);
      return;
    }
    setErro(null);
    setAviso(null);

    iniciar(async () => {
      if (demo) {
        setAviso("Arquivo válido. No modo demonstração ele não é enviado.");
        setArquivo(null);
        return;
      }
      const caminho = caminhoNoBucket(projetoId, validacao.extensao);
      try {
        const { error } = await createClient()
          .storage.from(BUCKET_EVIDENCIAS)
          .upload(caminho, arquivo, { contentType: validacao.mime, upsert: false });
        if (error) {
          setErro(traduzirErroStorage(error));
          return;
        }
      } catch (e) {
        setErro(traduzirErroStorage({ message: (e as Error).message }));
        return;
      }

      const resposta = await anexarDocumento({ projetoId, caminho, nome: arquivo.name, tipo });
      if (resposta?.erro) {
        setErro(resposta.erro);
        return;
      }
      setAviso(resposta?.ok ?? "Documento anexado.");
      setArquivo(null);
      setTipo("");
      setRodada((n) => n + 1);
    });
  }

  const Icone = arquivo?.type.startsWith("image/") ? ImageIcon : FileText;

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={idTipo}>Tipo do documento</Label>
        <SeletorOpcoes
          key={rodada}
          id={idTipo}
          name="tipoDocumento"
          rotulo="Tipo do documento"
          opcoes={OPCOES_TIPO}
          placeholder="Escolha o tipo"
          onChange={(valor) => {
            setTipo(valor);
            setErro(null);
          }}
        />
      </div>

      {arquivo ? (
        <div className="flex items-center gap-3 rounded-2xl border border-areia bg-palha px-4 py-3">
          <Icone size={18} className="shrink-0 text-musgo" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-tinta">{arquivo.name}</p>
            <p className="text-xs text-tinta-soft">{formatarTamanho(arquivo.size)}</p>
          </div>
          <button
            type="button"
            aria-label="Trocar arquivo"
            onClick={() => setArquivo(null)}
            disabled={enviando}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-argila transition-colors hover:bg-areia hover:text-tinta disabled:opacity-50"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ) : (
        <label
          htmlFor={idArquivo}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            escolher(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-areia bg-palha px-4 py-6 text-center transition-colors hover:border-musgo/50 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-broto/60",
            arrastando && "border-musgo bg-broto/10",
          )}
        >
          <FileUp size={22} className="text-musgo" aria-hidden />
          <span className="text-sm font-semibold text-tinta">
            Escolher arquivo<span className="hidden sm:inline"> ou arrastar para cá</span>
          </span>
          <span className="text-xs text-tinta-soft">PDF ou imagem (JPG, PNG ou WEBP), até 10 MB</span>
          <input
            id={idArquivo}
            type="file"
            accept={ACCEPT_ARQUIVOS}
            className="sr-only"
            onChange={(e) => {
              escolher(e.target.files?.[0]);
              e.target.value = ""; // permite escolher o mesmo arquivo de novo
            }}
          />
        </label>
      )}

      <div aria-live="polite">
        {erro && <p className="text-sm text-erro">{erro}</p>}
        {aviso && (
          <p className="flex items-center gap-2 rounded-2xl bg-broto/25 px-4 py-3 text-sm text-mata-900">
            <CheckCircle2 size={16} className="shrink-0" aria-hidden /> {aviso}
          </p>
        )}
      </div>

      <Button onClick={enviar} disabled={!arquivo || enviando} className="w-full sm:w-auto">
        <Upload size={16} aria-hidden /> {enviando ? "Enviando..." : "Enviar documento"}
      </Button>
    </div>
  );
}
