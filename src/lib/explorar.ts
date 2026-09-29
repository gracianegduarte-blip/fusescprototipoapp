// Conteúdo e cálculos da área "Explorar" (visitante sem cadastro).
import { PLANO, rendaEstimada } from "./regras";
import { ORDEM_PRODUTOS, PRODUTOS, type Produto } from "./produtos";
import type { ProdutoId } from "../shared";

export const APORTE_MINIMO = PLANO.aporteMinimo;

// ─── PLANOS ───────────────────────────────────────────────────────────────────
// Textos vêm de lib/produtos.ts (mesmos do site). Aqui ficam só a sugestão de aporte e a cor.
export type PlanoId = ProdutoId;

export type Plano = Produto & {
  sugestaoMensal: number;
  sugestaoAnos: number;
  parentesco: "Titular" | "Pai" | "Filho" | "Cônjuge";
};

const EXTRA: Record<ProdutoId, Pick<Plano, "sugestaoMensal" | "sugestaoAnos" | "parentesco">> = {
  futuro: { sugestaoMensal: 300, sugestaoAnos: 25, parentesco: "Titular" },
  bemestar: { sugestaoMensal: 0, sugestaoAnos: 0, parentesco: "Cônjuge" },
  pais: { sugestaoMensal: 200, sugestaoAnos: 10, parentesco: "Pai" },
  filhos: { sugestaoMensal: 150, sugestaoAnos: 18, parentesco: "Filho" },
};

export const PLANOS: Plano[] = ORDEM_PRODUTOS.map((id) => ({ ...PRODUTOS[id], ...EXTRA[id] }));

// ─── TRILHAS ──────────────────────────────────────────────────────────────────
export type Categoria = "Finanças" | "Previdência" | "Proteção";

export type Licao = { id: number; titulo: string; duracao: string; conteudo: string[]; bloqueada: boolean };
export type Trilha = { id: number; titulo: string; categoria: Categoria; descricao: string; licoes: Licao[] };

export const TRILHAS: Trilha[] = [
  {
    id: 1, titulo: "Planejamento Financeiro 101", categoria: "Finanças",
    descricao: "Organize o orçamento e crie sua primeira reserva de emergência sem complicação.",
    licoes: [
      {
        id: 11, titulo: "O raio-X das suas finanças", duracao: "4 min", bloqueada: false,
        conteudo: [
          "Antes de investir, é preciso saber para onde o dinheiro vai. Anote durante um mês tudo o que entra e tudo o que sai.",
          "Separe os gastos em três grupos: essenciais (moradia, alimentação, saúde), variáveis (lazer, compras) e futuro (reserva, previdência).",
          "Uma referência simples é a regra 50-30-20: 50% para o essencial, 30% para o variável e 20% para o seu futuro.",
        ],
      },
      {
        id: 12, titulo: "Construindo sua reserva", duracao: "5 min", bloqueada: false,
        conteudo: [
          "A reserva de emergência cobre imprevistos sem que você precise mexer nos investimentos de longo prazo.",
          "O ideal é guardar o equivalente a 6 meses do seu custo de vida em aplicações seguras e com liquidez diária.",
          "Com a reserva pronta, a previdência passa a ser dinheiro que trabalha para você por décadas.",
        ],
      },
      { id: 13, titulo: "O poder dos juros compostos", duracao: "6 min", bloqueada: true, conteudo: [] },
    ],
  },
  {
    id: 2, titulo: "Descomplicando a Previdência", categoria: "Previdência",
    descricao: "Entenda como funciona a previdência complementar e como ela reduz o seu imposto.",
    licoes: [
      {
        id: 21, titulo: "O que é previdência complementar?", duracao: "4 min", bloqueada: false,
        conteudo: [
          "A previdência complementar é um investimento de longo prazo para somar à aposentadoria do INSS.",
          "A FUSESC é uma entidade fechada de previdência complementar: não tem fins lucrativos e é supervisionada pela PREVIC. O resultado dos investimentos fica com os participantes.",
          "Você faz aportes mensais ou esporádicos, o dinheiro rende ao longo dos anos e, no futuro, vira renda mensal.",
        ],
      },
      {
        id: 22, titulo: `Dedução de até ${PLANO.deducaoIrPct}% no IR`, duracao: "5 min", bloqueada: false,
        conteudo: [
          `Quem faz a declaração completa do IR pode deduzir as contribuições à previdência complementar até o limite de ${PLANO.deducaoIrPct}% da renda bruta tributável do ano.`,
          "Para ter direito, é preciso também contribuir para o INSS ou para um regime próprio de previdência.",
          "O imposto não some: ele é pago lá na frente, quando você recebe o benefício. Com a tabela regressiva, a alíquota pode cair para 10%.",
        ],
      },
      { id: 23, titulo: "Tabela regressiva ou progressiva?", duracao: "6 min", bloqueada: true, conteudo: [] },
    ],
  },
  {
    id: 3, titulo: "O Guia da Proteção Familiar", categoria: "Proteção",
    descricao: "Garanta que as pessoas que você ama fiquem amparadas financeiramente.",
    licoes: [
      {
        id: 31, titulo: "Previdência como proteção", duracao: "4 min", bloqueada: false,
        conteudo: [
          "No plano, você indica dependentes e beneficiários. Em caso de falecimento, a FUSESC paga a pensão ou o saldo diretamente a eles, conforme o regulamento.",
          "Isso ajuda a família a ter dinheiro disponível em um momento difícil.",
        ],
      },
      {
        id: 32, titulo: "Planejando a sucessão", duracao: "5 min", bloqueada: false,
        conteudo: [
          "Organizar o patrimônio com antecedência evita custos altos de inventário e disputas familiares.",
          "Revise seus beneficiários sempre que houver mudanças na família: casamento, nascimento de filhos, separação.",
        ],
      },
      { id: 33, titulo: "Blindagem patrimonial", duracao: "7 min", bloqueada: true, conteudo: [] },
    ],
  },
];

// ─── QUIZZES ──────────────────────────────────────────────────────────────────
export type QuizId = "plano" | "perfil";
type Opcao = { label: string; pesos: Record<string, number> };
export type Quiz = { titulo: string; perguntas: { pergunta: string; opcoes: Opcao[] }[] };

export const QUIZZES: Record<QuizId, Quiz> = {
  plano: {
    titulo: "Qual plano combina com você?",
    perguntas: [
      {
        pergunta: "Qual é a sua fase de vida?",
        opcoes: [
          { label: "Construindo meu futuro", pesos: { futuro: 3 } },
          { label: "Já tenho uma reserva e quero viver dela", pesos: { bemestar: 3 } },
          { label: "Cuidando dos meus pais", pesos: { pais: 3 } },
          { label: "Planejando o futuro dos filhos", pesos: { filhos: 3 } },
        ],
      },
      {
        pergunta: "Qual é a sua principal preocupação?",
        opcoes: [
          { label: "Aposentadoria complementar", pesos: { futuro: 2 } },
          { label: "Ter uma renda mensal a partir de agora", pesos: { bemestar: 2 } },
          { label: "Renda para os idosos da família", pesos: { pais: 2 } },
          { label: "Educação e independência dos filhos", pesos: { filhos: 2 } },
        ],
      },
      {
        pergunta: "Quem contribui financeiramente com você?",
        opcoes: [
          { label: "Somente eu", pesos: { futuro: 1, bemestar: 1 } },
          { label: "Eu e meus irmãos", pesos: { pais: 2 } },
          { label: "Eu e meu cônjuge", pesos: { filhos: 2 } },
        ],
      },
    ],
  },
  perfil: {
    titulo: "Qual é o seu perfil de investidor?",
    perguntas: [
      {
        pergunta: "Como você reage a uma queda de 15% no investimento em um mês?",
        opcoes: [
          { label: "Retiro tudo, não suporto perder", pesos: { conservador: 3 } },
          { label: "Fico ansioso, mas espero", pesos: { moderado: 3 } },
          { label: "Aporto mais, é uma oportunidade", pesos: { arrojado: 3 } },
        ],
      },
      {
        pergunta: "Qual é o seu horizonte principal?",
        opcoes: [
          { label: "Até 2 anos", pesos: { conservador: 2 } },
          { label: "De 5 a 10 anos", pesos: { moderado: 2 } },
          { label: "Mais de 15 anos", pesos: { arrojado: 2 } },
        ],
      },
      {
        pergunta: "Quanto da reserva você toparia colocar em renda variável?",
        opcoes: [
          { label: "Nada", pesos: { conservador: 2 } },
          { label: "Até 30%", pesos: { moderado: 2 } },
          { label: "Mais de 50%", pesos: { arrojado: 2 } },
        ],
      },
      {
        pergunta: "Qual é a sua prioridade?",
        opcoes: [
          { label: "Preservar o que tenho", pesos: { conservador: 2 } },
          { label: "Crescer com equilíbrio", pesos: { moderado: 2 } },
          { label: "Maximizar o retorno", pesos: { arrojado: 2 } },
        ],
      },
    ],
  },
};

export const RESULTADO_QUIZ: Record<string, { titulo: string; desc: string }> = {
  conservador: { titulo: "Perfil Conservador", desc: "Segurança em primeiro lugar. Priorize renda fixa e baixa oscilação." },
  moderado: { titulo: "Perfil Moderado", desc: "Equilíbrio entre risco e retorno. Diversifique com previdência de longo prazo." },
  arrojado: { titulo: "Perfil Arrojado", desc: "Você tolera oscilação em troca de retorno maior no longo prazo." },
  ...Object.fromEntries(ORDEM_PRODUTOS.map((id) => [id, { titulo: PRODUTOS[id].nome, desc: PRODUTOS[id].resumo }])),
};

// ─── SIMULADOR DE METAS ───────────────────────────────────────────────────────
export type Objetivo = { id: string; titulo: string; meta: number; anos: number };

export const OBJETIVOS: Objetivo[] = [
  { id: "aposentadoria", titulo: "Aposentadoria tranquila", meta: 1_200_000, anos: 25 },
  { id: "educacao", titulo: "Educação dos filhos", meta: 250_000, anos: 15 },
  { id: "imovel", titulo: "Imóvel próprio", meta: 400_000, anos: 10 },
  { id: "viagem", titulo: "Viagem dos sonhos", meta: 60_000, anos: 4 },
  { id: "livre", titulo: "Reserva livre", meta: 100_000, anos: 8 },
];

export type CenarioId = "constante" | "evolutivo" | "ideal";
export type Cenario = { id: CenarioId; label: string; hint: string; saldoFinal: number; totalAportado: number; primeiroAporte: number; ultimoAporte: number; rendaMensal: number };

const CRESCIMENTO_ANUAL = 0.05;

function acumular(base: number, anos: number, evoluir: boolean) {
  const i = Math.pow(1 + PLANO.rentabilidadeSimulacao, 1 / 12) - 1;
  let saldo = 0, total = 0, ultimo = base;
  for (let a = 0; a < anos; a++) {
    const m = evoluir ? base * Math.pow(1 + CRESCIMENTO_ANUAL, a) : base;
    ultimo = m;
    for (let k = 0; k < 12; k++) { saldo = (saldo + m) * (1 + i); total += m; }
  }
  return { saldo, total, ultimo };
}

function cenario(id: CenarioId, label: string, hint: string, base: number, anos: number, evoluir: boolean): Cenario {
  const r = acumular(base, anos, evoluir);
  return {
    id, label, hint,
    saldoFinal: Math.round(r.saldo), totalAportado: Math.round(r.total),
    primeiroAporte: Math.round(base), ultimoAporte: Math.round(r.ultimo),
    rendaMensal: Math.round(rendaEstimada(r.saldo)),
  };
}

// Aporte inicial (com evolução anual) que atinge a meta — busca binária.
function aporteIdeal(meta: number, anos: number) {
  let lo = 0, hi = 1000;
  while (acumular(hi, anos, true).saldo < meta) hi *= 2;
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (acumular(mid, anos, true).saldo >= meta) hi = mid; else lo = mid;
  }
  return Math.max(APORTE_MINIMO, Math.ceil(hi));
}

export function simularMeta(mensal: number, meta: number, anos: number): Cenario[] {
  return [
    cenario("constante", "Como você simulou", "Aporte fixo todo mês", mensal, anos, false),
    cenario("evolutivo", "Evolução anual", "Aporte cresce 5% ao ano", mensal, anos, true),
    cenario("ideal", "Para bater a meta", "Aporte que atinge a meta", aporteIdeal(meta, anos), anos, true),
  ];
}

// Economia de IR com a dedução de até 12% (renda de referência R$ 120 mil/ano, alíquota 27,5%).
export const economiaIrAnual = (mensal: number) =>
  Math.round(Math.min(mensal * 12, 120_000 * (PLANO.deducaoIrPct / 100)) * 0.275);

// ─── PRÉ-CADASTRO ─────────────────────────────────────────────────────────────
export type MetaRascunho = { objetivo: string; meta: number; anos: number; mensal: number };
export type PreCadastro = { nome: string; email: string; celular: string; nascimento: string; meta?: MetaRascunho };

// Valores em reais sempre com duas casas decimais (ex.: R$ 1.200.000,00).
export const brl0 = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
