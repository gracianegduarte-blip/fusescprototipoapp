// Fonte única de regras e textos institucionais do app.
//
// INSTITUCIONAL — conferido em fusesc.com.br (set/2026).
// PLANO — o regulamento do novo plano ainda não foi publicado. Os parâmetros abaixo seguem o que a
// FUSESC já pratica nos planos Multifuturo (Manual do Participante MFII) e a legislação das EFPC.
// Ajuste aqui quando o regulamento for aprovado pela PREVIC: todas as telas leem deste arquivo.

// ─── INSTITUCIONAL ────────────────────────────────────────────────────────────
export const FUSESC = {
  nome: "FUSESC – Fundação CODESC de Seguridade Social",
  cnpj: "83.564.443/0001-32",
  natureza: "Entidade fechada de previdência complementar",
  supervisao: "PREVIC",
  telefone: "0800 048 3000",
  email: "central@fusesc.com.br",
  endereco: "Av. Prefeito Osmar Cunha, 251, sala 802, Centro, Florianópolis/SC",
};

export const LINKS_INVESTIMENTOS = {
  rentabilidade: "https://fusesc.com.br/investimentos/",
  politica: "https://fusesc.com.br/investimentos/#politicas",
  demonstrativos: "https://fusesc.com.br/investimentos/#demonstrativos",
};

export const RODAPE_LEGAL = `${FUSESC.nome} · CNPJ ${FUSESC.cnpj} · ${FUSESC.natureza} supervisionada pela ${FUSESC.supervisao}`;
export const AVISO_RENTABILIDADE = "Rentabilidade passada não é garantia de rentabilidade futura.";

// ─── PLANO ────────────────────────────────────────────────────────────────────
export const PLANO = {
  nome: "Novo Plano FUSESC",
  modalidade: "Contribuição definida",
  aporteMinimo: 50,
  aporteMaximo: 100_000,
  // Taxa usada em todas as simulações (nominal, ao ano). Ilustrativa.
  rentabilidadeSimulacao: 0.09,
  // Carência para resgate e portabilidade de saída (MFII: 3 anos de vinculação).
  carenciaMeses: 36,
  resgateParcelasMax: 12,
  // Nos planos FUSESC atuais, o resgate encerra a participação no plano.
  resgateEncerraPlano: true,
  // Prazos do extrato de institutos e do termo de opção (MFII).
  prazoExtratoDias: 30,
  prazoTermoOpcaoDias: 60,
  // Na concessão da aposentadoria, parte do saldo pode ser recebida à vista (MFII: até 20%).
  saqueNaAposentadoriaPct: 20,
  idadeMinimaAposentadoria: 55,
  // Formas de renda (MFII): vitalícia, prazo determinado ou percentual mensal do saldo.
  rendaPrazoAnos: [10, 20] as const,
  rendaPercentualMin: 0.5,
  rendaPercentualMax: 1,
  rendaPercentualMax70: 1.5,
  // Dedução no IR (Lei 9.532/97): contribuições até 12% da renda bruta tributável, na declaração completa.
  deducaoIrPct: 12,
};

export const PLANO_LABEL = `${PLANO.nome} — ${PLANO.modalidade}`;

// Renda mensal estimada usando o percentual mínimo do saldo (0,5% ao mês).
export const rendaEstimada = (saldo: number) => saldo * (PLANO.rendaPercentualMin / 100);

// Valor futuro: saldo atual + aportes mensais, com juros compostos mensais.
export function projetar(saldoAtual: number, aporteMensal: number, anos: number, taxaAnual = PLANO.rentabilidadeSimulacao) {
  const n = Math.max(0, Math.round(anos * 12));
  const i = Math.pow(1 + taxaAnual, 1 / 12) - 1;
  const fator = Math.pow(1 + i, n);
  return saldoAtual * fator + (i > 0 ? aporteMensal * ((fator - 1) / i) : aporteMensal * n);
}

// ─── TRIBUTAÇÃO (Lei 11.053/2004 e Lei 14.803/2024) ───────────────────────────
export const TABELA_REGRESSIVA: { ate: string; aliquota: number }[] = [
  { ate: "Até 2 anos", aliquota: 35 },
  { ate: "2 a 4 anos", aliquota: 30 },
  { ate: "4 a 6 anos", aliquota: 25 },
  { ate: "6 a 8 anos", aliquota: 20 },
  { ate: "8 a 10 anos", aliquota: 15 },
  { ate: "Mais de 10 anos", aliquota: 10 },
];

export const TEXTO_REGIME =
  "Você escolhe entre a tabela regressiva (de 35% a 10%, conforme o tempo de cada contribuição) e a progressiva (tabela do IR, com ajuste na declaração anual). A escolha pode ser feita até o pedido do primeiro benefício ou resgate.";

// ─── NÍVEIS DE CADASTRO ───────────────────────────────────────────────────────
export const NIVEIS = [
  { n: 0, titulo: "Pré-cadastro", desc: "Nome, e-mail, celular e ano de nascimento" },
  { n: 1, titulo: "Nível 1", desc: "Endereço e documento com foto" },
  { n: 2, titulo: "Nível 2", desc: "Declarações PEP, FATCA e renda" },
];
