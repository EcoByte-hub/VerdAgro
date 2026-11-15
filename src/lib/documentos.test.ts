import { describe, expect, it } from "vitest";
import {
  caminhoNoBucket,
  caminhoValido,
  formatarTamanho,
  TAMANHO_MAXIMO_BYTES,
  traduzirErroStorage,
  validarArquivo,
} from "./documentos";

const PROJETO = "bbbbbbbb-0000-4000-8000-000000000001";
const MB = 1024 * 1024;

describe("validarArquivo", () => {
  it("aceita PDF e imagens dentro do limite", () => {
    expect(validarArquivo({ name: "car.pdf", type: "application/pdf", size: 2 * MB })).toEqual({
      ok: true,
      mime: "application/pdf",
      extensao: "pdf",
    });
    expect(validarArquivo({ name: "foto.jpeg", type: "image/jpeg", size: 1000 })).toMatchObject({
      ok: true,
      extensao: "jpg",
    });
  });

  it("usa a extensão quando o navegador não informa o tipo", () => {
    expect(validarArquivo({ name: "Laudo.PDF", type: "", size: 1000 })).toMatchObject({
      ok: true,
      mime: "application/pdf",
    });
    expect(validarArquivo({ name: "nota.pdf", type: "application/octet-stream", size: 1000 })).toMatchObject({
      ok: true,
    });
  });

  it("recusa outros formatos com mensagem em português", () => {
    expect(validarArquivo({ name: "planilha.xlsx", type: "application/vnd.ms-excel", size: 1000 })).toEqual({
      ok: false,
      erro: "Formato não aceito. Envie um PDF ou uma imagem (JPG, PNG ou WEBP).",
    });
    expect(validarArquivo({ name: "IMG_0001.HEIC", type: "image/heic", size: 1000 }).ok).toBe(false);
  });

  it("recusa arquivo vazio e acima de 10 MB, dizendo o tamanho", () => {
    expect(validarArquivo({ name: "a.pdf", type: "application/pdf", size: 0 })).toEqual({
      ok: false,
      erro: "O arquivo está vazio.",
    });
    expect(
      validarArquivo({ name: "a.pdf", type: "application/pdf", size: TAMANHO_MAXIMO_BYTES }),
    ).toMatchObject({
      ok: true,
    });
    expect(validarArquivo({ name: "a.pdf", type: "application/pdf", size: 12.3 * MB })).toEqual({
      ok: false,
      erro: "O arquivo tem 12,3 MB. O limite é 10 MB.",
    });
  });
});

describe("caminho no bucket", () => {
  it("fica na pasta do projeto, com nome aleatório e a extensão", () => {
    const caminho = caminhoNoBucket(PROJETO, "pdf");
    expect(caminho.startsWith(`${PROJETO}/`)).toBe(true);
    expect(caminhoValido(PROJETO, caminho)).toBe(true);
  });

  it("recusa caminho de outro projeto ou com subpastas", () => {
    const caminho = caminhoNoBucket(PROJETO, "png");
    expect(caminhoValido("bbbbbbbb-0000-4000-8000-000000000002", caminho)).toBe(false);
    expect(caminhoValido(PROJETO, `${PROJETO}/../outro/${caminho.split("/")[1]}`)).toBe(false);
    expect(caminhoValido(PROJETO, `${PROJETO}/meu arquivo.pdf`)).toBe(false);
  });
});

describe("mensagens", () => {
  it("formata tamanhos", () => {
    expect(formatarTamanho(500)).toBe("1 KB");
    expect(formatarTamanho(850 * 1024)).toBe("850 KB");
    expect(formatarTamanho(2.4 * MB)).toBe("2,4 MB");
  });

  it("traduz erros do Storage", () => {
    expect(
      traduzirErroStorage({ message: "The object exceeded the maximum allowed size", statusCode: "413" }),
    ).toBe("O arquivo passa do limite de 10 MB.");
    expect(
      traduzirErroStorage({ message: "mime type application/zip is not supported", statusCode: "415" }),
    ).toMatch(/^Formato não aceito/);
    expect(
      traduzirErroStorage({ message: "new row violates row-level security policy", statusCode: "403" }),
    ).toBe("Você não tem permissão para enviar arquivos neste projeto.");
    expect(traduzirErroStorage({ message: "Failed to fetch" })).toMatch(/^Sem conexão/);
    expect(traduzirErroStorage({ message: "algo inesperado" })).toBe(
      "Não foi possível enviar o arquivo. Tente novamente.",
    );
  });
});
