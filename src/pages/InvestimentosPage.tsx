import { useState } from "react";
import { Card, Donut, Icon, MASK, brl, type Conta, type Theme, type ToastMsg } from "../shared";
import { AVISO_RENTABILIDADE, LINKS_INVESTIMENTOS } from "../lib/regras";
import {
  AVISO_GARANTIA, COMPARATIVO, PERIODO_LABEL, PRESTADORES, REFERENCIA, RENTABILIDADE, SEGMENTOS, SEM_ALOCACAO, fmtPct,
  type Periodo,
} from "../lib/carteira";
import Skeleton from "../components/Skeleton";
import EvolucaoChart from "../components/EvolucaoChart";
import { PRODUTOS } from "../lib/produtos";

export default function InvestimentosPage({ theme, hidden, conta, loading, onFalarAssessor }: {
  theme: Theme; hidden: boolean; conta: Conta; loading: boolean;
  onUpdateConta: (c: Conta) => void; onFalarAssessor: () => void;
  showToast: (text: string, type?: ToastMsg["type"]) => void;
}) {
  const [periodo, setPeriodo] = useState<Periodo>("m12");
  const [aberto, setAberto] = useState<string | null>(null);
  // Revelação progressiva (lei de Miller): detalhes da carteira só quando a pessoa pede.
  const [detalhes, setDetalhes] = useState(false);
  const m = (v: number) => (hidden ? MASK : brl(v));
  const primeiroNome = conta.nome.split(" ")[0];
  const maxComp = Math.max(...COMPARATIVO.map((c) => c[periodo]));
  const cdi = COMPARATIVO.find((c) => c.nome === "CDI")!;
  const pctCdi = Math.round((RENTABILIDADE[periodo] / cdi[periodo]) * 100);
  const funds = SEGMENTOS.map((s) => ({ name: s.nome, color: s.cor, pct: Math.round(s.pct), ret: s.mes ?? 0 }));

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Carregando investimentos">
        <Skeleton theme={theme} className="h-40 !rounded-3xl" />
        <Skeleton theme={theme} className="h-56 !rounded-2xl" />
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} theme={theme} className="h-20 !rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* como funciona */}
      <div className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${theme.accent}, ${theme.accentMid})` }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ background: "#fff" }} aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-widest text-white/85 mb-2">Como seu dinheiro trabalha</p>
        <p className="text-base font-bold leading-snug mb-2">
          A FUSESC investe os aportes {conta.pessoa === 0 ? `que você faz no ${PRODUTOS[conta.produto].nome}` : `da conta de ${primeiroNome}`} e o resultado volta todo para a conta.
        </p>
        <p className="text-xs leading-relaxed text-white/90">
          A fundação não tem fins lucrativos. Os recursos são aplicados seguindo a Política de Investimentos aprovada pelo
          Conselho Deliberativo e a Resolução CMN nº 4.994/2022, sob supervisão da PREVIC.
        </p>
        <div className="grid grid-cols-3 gap-2 mt-4 relative">
          {["Você contribui", "A FUSESC investe", "O rendimento vai para a conta"].map((t, i) => (
            <div key={t} className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.15)" }}>
              <p className="text-sm font-bold">{i + 1}</p>
              <p className="text-xs leading-tight text-white/90">{t}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5" style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
        <span className="mt-0.5 flex-shrink-0" style={{ color: theme.accentText }}><Icon.Info size={16} /></span>
        <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>
          Números reais da carteira do <strong style={{ color: theme.text }}>{REFERENCIA.plano}</strong> em {REFERENCIA.data},
          usados como referência até o novo plano ter histórico próprio.
        </p>
      </div>

      {/* resultado */}
      <Card theme={theme}>
        <p className="text-sm font-semibold" style={{ color: theme.text }}>Rentabilidade do plano</p>
        <div className="flex items-end gap-2 mt-2 mb-4">
          <p className="text-3xl font-bold tracking-tight" style={{ color: theme.positive }}>+{fmtPct(RENTABILIDADE.m12)}</p>
          <p className="text-xs pb-1.5" style={{ color: theme.muted }}>nos últimos 12 meses</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: `Em ${REFERENCIA.mes.split("/")[0]}`, v: RENTABILIDADE.mes },
            { l: "Em 2026", v: RENTABILIDADE.ano },
            { l: "Em 5 anos", v: RENTABILIDADE.m60 },
          ].map((s) => (
            <div key={s.l} className="rounded-xl p-3" style={{ background: theme.inputBg }}>
              <p className="text-sm font-bold" style={{ color: theme.text }}>+{fmtPct(s.v)}</p>
              <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{s.l}</p>
            </div>
          ))}
        </div>
      </Card>

      <EvolucaoChart theme={theme} cor={theme.accent} saldo={conta.saldo} rendimento12m={conta.rendimento12m} hidden={hidden} />

      {/* comparação */}
      <Card theme={theme}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm font-semibold" style={{ color: theme.text }} id="comp-label">Comparado a outros indicadores</p>
        </div>
        <p className="text-xs mb-3" style={{ color: theme.muted }}>
          Em {PERIODO_LABEL[periodo]}, o plano rendeu {pctCdi}% do CDI e superou a poupança e a inflação.
        </p>
        <div role="radiogroup" aria-labelledby="comp-label" className="grid grid-cols-3 gap-1 p-1 rounded-xl mb-4" style={{ background: theme.inputBg }}>
          {(Object.keys(PERIODO_LABEL) as Periodo[]).map((p) => (
            <button key={p} role="radio" aria-checked={periodo === p} onClick={() => setPeriodo(p)}
              className="min-h-10 rounded-lg text-xs font-semibold"
              style={periodo === p ? { background: theme.accent, color: "#fff" } : { color: theme.muted }}>
              {PERIODO_LABEL[p]}
            </button>
          ))}
        </div>
        <ul className="space-y-2.5">
          {COMPARATIVO.map((c) => (
            <li key={c.nome}>
              <div className="flex justify-between text-xs mb-1">
                <span className={c.plano ? "font-bold" : ""} style={{ color: c.plano ? theme.text : theme.muted }}>{c.nome}</span>
                <span className="font-semibold" style={{ color: c.plano ? theme.accentText : theme.text }}>{fmtPct(c[periodo])}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: theme.inputBg }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(c[periodo] / maxComp) * 100}%`, background: c.plano ? theme.accent : theme.switchOff }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs mt-3" style={{ color: theme.muted }}>Meta atuarial: INPC + 3,87% ao ano. {AVISO_RENTABILIDADE}</p>
      </Card>

      {/* onde está aplicado */}
      <Card theme={theme}>
        <p className="text-sm font-semibold" style={{ color: theme.text }}>Onde o dinheiro está aplicado</p>
        <p className="text-xs mt-0.5 mb-4" style={{ color: theme.muted }}>
          Mesma distribuição para todos os participantes. Seu saldo de {m(conta.saldo)} segue essa divisão.
        </p>
        <Donut theme={theme} saldo={conta.saldo} hidden={hidden} funds={funds} />
      </Card>

      <button onClick={() => setDetalhes(!detalhes)} aria-expanded={detalhes} aria-controls="detalhes-carteira"
        className="w-full min-h-12 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ background: theme.surface, color: theme.accentText, border: `1px solid ${theme.border}` }}>
        {detalhes ? "Ocultar detalhes da carteira" : "Ver detalhes da carteira"}
        <span style={{ transform: detalhes ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><Icon.Chevron /></span>
      </button>

      {detalhes && (<div id="detalhes-carteira" className="space-y-4">
      <div className="space-y-2">
        {SEGMENTOS.map((s) => {
          const exp = aberto === s.nome;
          return (
            <Card key={s.nome} theme={theme} className="!p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: s.cor }}>{fmtPct(s.pct, 1)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>{s.nome}</p>
                    {s.mes !== null && (
                      <p className="text-xs font-bold flex-shrink-0" style={{ color: theme.positive }}>+{fmtPct(s.mes)} no mês</p>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>{s.desc}</p>
                  <p className="text-xs mt-1" style={{ color: theme.text }}>
                    Sua parte: {m((conta.saldo * s.pct) / 100)} · no plano: R$ {s.milhoes.toFixed(2).replace(".", ",")} mi
                  </p>
                  {s.composicao && (
                    <button onClick={() => setAberto(exp ? null : s.nome)} aria-expanded={exp}
                      className="min-h-9 mt-1 text-xs font-semibold flex items-center gap-1" style={{ color: theme.accentText }}>
                      {exp ? "Ocultar composição" : "Ver composição"}
                      <span style={{ transform: exp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><Icon.Chevron /></span>
                    </button>
                  )}
                  {exp && s.composicao && (
                    <ul className="mt-1 space-y-1.5">
                      {s.composicao.map((c) => (
                        <li key={c.nome}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span style={{ color: theme.muted }}>{c.nome}</span>
                            <span className="font-semibold" style={{ color: theme.text }}>{fmtPct(c.pct)}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.inputBg }}>
                            <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: s.cor }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        <p className="text-xs px-1" style={{ color: theme.muted }}>Sem alocação no momento: {SEM_ALOCACAO.join(" e ").toLowerCase()}.</p>
      </div>

      {/* quem cuida */}
      <Card theme={theme}>
        <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>Quem cuida e fiscaliza</p>
        <p className="text-xs mb-3" style={{ color: theme.muted }}>
          {brl(REFERENCIA.totalInvestido)} investidos no {REFERENCIA.plano}, acompanhados por empresas independentes.
        </p>
        {[...PRESTADORES, { papel: "Supervisão", nome: "PREVIC" }].map((p) => (
          <div key={p.papel} className="flex justify-between gap-3 py-2.5 border-b last:border-0 text-sm" style={{ borderColor: theme.rowBorder }}>
            <span style={{ color: theme.muted }}>{p.papel}</span>
            <span className="font-semibold text-right" style={{ color: theme.text }}>{p.nome}</span>
          </div>
        ))}
      </Card>

      {/* transparência */}
      <Card theme={theme}>
        <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>Transparência</p>
        <p className="text-xs mb-3" style={{ color: theme.muted }}>Documentos publicados no site da FUSESC.</p>
        {[
          { l: `Lâmina de ${REFERENCIA.mes}`, href: REFERENCIA.lamina },
          { l: "Política de Investimentos", href: LINKS_INVESTIMENTOS.politica },
          { l: "Demonstrativos de investimentos", href: LINKS_INVESTIMENTOS.demonstrativos },
        ].map((d) => (
          <a key={d.l} href={d.href} target="_blank" rel="noopener noreferrer"
            className="min-h-12 flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: theme.rowBorder }}>
            <span style={{ color: theme.accentText }}><Icon.Doc size={18} /></span>
            <span className="flex-1 text-sm" style={{ color: theme.text }}>{d.l}</span>
            <span style={{ color: theme.muted }}><Icon.External /></span>
          </a>
        ))}
      </Card>

      </div>)}

      <p className="text-xs leading-relaxed px-1" style={{ color: theme.muted }}>{AVISO_GARANTIA}</p>

      <button onClick={onFalarAssessor} className="w-full min-h-12 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ background: theme.tagBg, color: theme.accentText }}>
        <Icon.Headset /> Dúvidas sobre os investimentos? Fale com a FUSESC
      </button>
    </div>
  );
}
