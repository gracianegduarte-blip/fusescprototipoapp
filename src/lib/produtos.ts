// Opções do Novo Plano FUSESC, com os textos do site (fusescprototiposite / C:\fusesc-previdência).
// O plano "Para Colaboradores" (empresas) fica fora do app por enquanto.
import type { ProdutoId } from "../shared";

export type Produto = {
  id: ProdutoId;
  nome: string;
  chamada: string;
  resumo: string;
  pontos: string[];
  // Para quem: o próprio titular ou um familiar.
  para: "titular" | "familia";
};

export const PRODUTOS: Record<ProdutoId, Produto> = {
  futuro: {
    id: "futuro", nome: "Meu Futuro", chamada: "Liberdade e aposentadoria", para: "titular",
    resumo: "Construa patrimônio aos poucos, com contribuições regulares, para complementar a sua aposentadoria.",
    pontos: [
      "Contribuições regulares, no valor que couber no seu orçamento",
      "Regras, custos e benefícios descritos no regulamento do plano",
      "Você indica os seus beneficiários",
    ],
  },
  bemestar: {
    id: "bemestar", nome: "Meu Bem-Estar", chamada: "Renda perpétua ou por prazo", para: "titular",
    resumo: "Transforme o que você já tem em uma renda mensal, que pode ser perpétua ou por um prazo definido.",
    pontos: [
      "Renda perpétua: você recebe todos os meses e o valor aplicado continua no plano",
      "Prazo definido: você escolhe por quantos anos quer receber",
      "Você indica os seus beneficiários",
    ],
  },
  pais: {
    id: "pais", nome: "Para Seus Pais", chamada: "Renda imediata e cuidado futuro", para: "familia",
    resumo: "Aposentadoria imediata ou planejamento futuro, para quem cuidou de você.",
    pontos: [
      "Aposentadoria imediata: a renda mensal começa logo",
      "Planejamento futuro: contribuições agora para receber mais adiante",
      "Indicação de beneficiários, conforme o regulamento",
    ],
  },
  filhos: {
    id: "filhos", nome: "Para Seus Filhos", chamada: "Futuro protegido e educação", para: "familia",
    resumo: "Planeje o futuro dos seus filhos com contribuições regulares ao longo dos anos, por exemplo para a faculdade ou a independência financeira.",
    pontos: [
      "Contribuições regulares, começando cedo",
      "Regras de resgate e benefícios descritas no regulamento do plano",
      "Você acompanha a evolução do plano",
    ],
  },
};

export const ORDEM_PRODUTOS: ProdutoId[] = ["futuro", "bemestar", "pais", "filhos"];
