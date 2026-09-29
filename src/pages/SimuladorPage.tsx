import { useState } from "react";
import { ANO_ATUAL, Card, Icon, MASK, Toggle, brl, haptic, type Conta, type Theme, type ToastMsg, corConta } from "../shared";
import { duracaoRenda } from "../lib/format";
import Sheet from "../components/Sheet";
import PgblCard from "../components/PgblCard";
import RendaSheet from "../components/RendaSheet";
import { PLANO, projetar, rendaEstimada } from "../lib/regras";

function Slider({ theme, id, label, value, min, max, step = 1, fmt, onChange }: {
  theme: Theme; id: string; label: string; value: number; min: number; max: number; step?: number;
  fmt: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="text-xs font-medium" style={{ color: theme.muted }}>{label}</label>
        <span className="text-sm font-bold" style={{ color: theme.accentText }}>{fmt(value)}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        aria-valuetext={fmt(value)} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function SimuladorPage({ theme, conta, hidden, onUpdateConta, showToast }: {
  theme: Theme; conta: Conta; hidden: boolean; onUpdateConta: (c: Conta) => void;
  showToast: (text: string, type?: ToastMsg["type"]) => void;
}) {
  const cor = corConta(conta);
  const m = (v: number) => (hidden ? MASK : brl(v));
  const nome = conta.nome.split(" ")[0];

  const [taxa, setTaxa] = useState(PLANO.rentabilidadeSimulacao * 100);

  // ── conta recebendo: simulador de renda ────────────────────────────────────
  const rendaMax = Math.max(1000, Math.round((conta.saldo * 0.03) / 50) * 50);
  const [renda, setRenda] = useState(conta.rendaMensal ?? 1000);
  const [rendaSheet, setRendaSheet] = useState(false);

  // ── conta acumulando: simulador de meta ────────────────────────────────────
  const idadeMetaInicial = Math.max(PLANO.idadeMinimaAposentadoria, conta.idadeAtual + 1, conta.anoMeta - ANO_ATUAL + conta.idadeAtual);
  const idade = conta.idadeAtual;
  const [meta, setMeta] = useState(idadeMetaInicial);
  const [aporte, setAporte] = useState(conta.aporteMensal);
  const [confirmar, setConfirmar] = useState(false);
  const [aplicarAporte, setAplicarAporte] = useState(false);
  const [saved, setSaved] = useState(false);

  if (conta.fase === "recebendo") {
    const r = Math.pow(1 + taxa / 100, 1 / 12) - 1;
    const dur = duracaoRenda(conta.saldo, renda, taxa / 100);
    const sustentavel = conta.saldo * r;
    const n10 = 120;
    const saldo10 = Math.max(0, conta.saldo * Math.pow(1 + r, n10) - renda * ((Math.pow(1 + r, n10) - 1) / r));

    return (
      <div className="space-y-4">
        <Card theme={theme}>
          <p className="text-base font-bold mb-1" style={{ color: theme.text }}>Simulador de renda — {nome}</p>
          <p className="text-xs mb-5" style={{ color: theme.muted }}>Veja por quanto tempo o saldo sustenta a renda que você deseja receber.</p>
          <div className="space-y-6">
            <Slider theme={theme} id="sim-renda" label="Renda mensal desejada" value={renda} min={500} max={rendaMax} step={50} fmt={brl} onChange={setRenda} />
            <Slider theme={theme} id="sim-taxa-r" label="Rentabilidade estimada" value={taxa} min={4} max={15} fmt={(v) => `${v}% a.a.`} onChange={setTaxa} />
          </div>
        </Card>

        <div className="rounded-3xl p-6 text-white" style={{ background: `linear-gradient(145deg, ${cor}, ${cor}CC)` }}>
          <p className="text-xs font-medium tracking-wide text-white/85 mb-4 uppercase">Resultado</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Duração do saldo", v: dur === null ? "Indefinida" : `${Math.round(dur)} anos`, highlight: true },
              { l: "Renda sustentável", v: `${m(sustentavel)}/mês` },
              { l: "Saldo em 10 anos", v: m(saldo10) },
              { l: "Taxa aplicada", v: `${taxa}% a.a.` },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.14)" }}>
                <p className="text-xs text-white/85 mb-1">{s.l}</p>
                <p className="text-sm font-bold" style={{ color: s.highlight ? "#FFD580" : "#fff" }}>{s.v}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/85 mt-4">* Simulação ilustrativa. Rentabilidade passada não garante resultados futuros.</p>
        </div>

        <Card theme={theme}>
          <p className="text-sm font-semibold mb-2" style={{ color: theme.text }}>
            {dur === null ? "Essa renda cabe no rendimento do saldo" : "Essa renda consome parte do saldo"}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>
            {dur === null
              ? "Com a rentabilidade escolhida, o saldo rende mais do que você retira. O benefício pode durar por tempo indeterminado."
              : `Com a rentabilidade escolhida, o saldo é consumido em cerca de ${Math.round(dur)} anos. Reduzir a renda ou manter aportes estende esse prazo.`}
          </p>
        </Card>

        <button onClick={() => setRendaSheet(true)}
          className="w-full min-h-14 py-4 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentMid})`, boxShadow: `0 6px 20px ${cor}40` }}>
          Solicitar esta renda
        </button>

        {rendaSheet && (
          <Sheet theme={theme} label="Alterar renda mensal" onClose={() => setRendaSheet(false)}>
            <RendaSheet theme={theme} conta={conta} hidden={hidden} initial={renda} onClose={() => setRendaSheet(false)}
              onSave={(v) => {
                onUpdateConta({ ...conta, rendaMensal: v });
                setRendaSheet(false);
                showToast("Renda alterada a partir do próximo pagamento");
              }} />
          </Sheet>
        )}
      </div>
    );
  }

  // ── acumulando ─────────────────────────────────────────────────────────────
  // Projeção inclui o saldo que a conta já tem, além dos aportes futuros.
  const anos = Math.max(0, meta - idade);
  const projetarCom = (ap: number) => projetar(conta.saldo, ap, anos, taxa / 100);
  const patrimonio = projetarCom(aporte);
  const rendaProjetada = rendaEstimada(patrimonio);
  const anoMetaNovo = ANO_ATUAL + anos;
  const idadeMetaAtual = conta.idadeAtual + (conta.anoMeta - ANO_ATUAL);
  const aporteMudou = aporte !== conta.aporteMensal;

  const salvar = () => {
    haptic("medium");
    onUpdateConta({
      ...conta, anoMeta: anoMetaNovo, meta: Math.round(patrimonio),
      ...(aplicarAporte && aporteMudou ? { aporteMensal: aporte } : {}),
    });
    setConfirmar(false);
    setSaved(true);
    showToast(aplicarAporte && aporteMudou ? "Meta e aporte mensal atualizados" : "Meta salva com sucesso!");
    setTimeout(() => setSaved(false), 2500);
  };

  const atingeMeta = patrimonio >= conta.meta;

  return (
    <div className="space-y-4">
      <Card theme={theme}>
        <p className="text-base font-bold mb-1" style={{ color: theme.text }}>Simulador — {nome}</p>
        <p className="text-xs mb-5" style={{ color: theme.muted }}>
          Hoje: {idade} anos e saldo de {m(conta.saldo)}. Ajuste os valores e veja o impacto no futuro.
        </p>
        <div className="space-y-6">
          <Slider theme={theme} id="sim-meta" label="Aposentar com" value={meta} min={Math.max(PLANO.idadeMinimaAposentadoria, idade + 1)} max={90} fmt={(v) => `${v} anos`} onChange={setMeta} />
          <Slider theme={theme} id="sim-aporte" label="Aporte mensal" value={aporte} min={PLANO.aporteMinimo} max={10000} step={50} fmt={brl} onChange={setAporte} />
          <Slider theme={theme} id="sim-taxa" label="Rentabilidade estimada" value={taxa} min={4} max={15} fmt={(v) => `${v}% a.a.`} onChange={setTaxa} />
        </div>
      </Card>

      <div className="rounded-3xl p-6 text-white" style={{ background: `linear-gradient(145deg, ${cor}, ${cor}CC)` }}>
        <p className="text-xs font-medium tracking-wide text-white/85 mb-4 uppercase">Resultado</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: "Contribuição", v: `${anos} anos` },
            { l: "Patrimônio estimado", v: brl(patrimonio) },
            { l: "Renda estimada/mês", v: brl(rendaProjetada), highlight: true },
            { l: "Taxa aplicada", v: `${taxa}% a.a.` },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.14)" }}>
              <p className="text-xs text-white/85 mb-1">{s.l}</p>
              <p className="text-sm font-bold" style={{ color: s.highlight ? "#FFD580" : "#fff" }}>{s.v}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/85 mt-4">* Inclui o saldo atual. Renda estimada com {String(PLANO.rendaPercentualMin).replace(".", ",")}% do saldo ao mês. Simulação ilustrativa.</p>
      </div>

      <Card theme={theme}>
        <p className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Impacto na sua meta</p>
        <div className="flex items-center justify-between text-xs mb-2" style={{ color: theme.muted }}>
          <span>Meta: <strong style={{ color: theme.text }}>{m(conta.meta)}</strong></span>
          <span>Ano: <strong style={{ color: theme.text }}>{conta.anoMeta}</strong></span>
        </div>
        {atingeMeta ? (
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold" style={{ color: theme.positive }}>
            <Icon.CheckCircle /><span>Você atinge sua meta com folga!</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 mb-2 text-sm font-semibold" style={{ color: theme.warning }}>
            <span className="flex-shrink-0 mt-0.5"><Icon.Alert /></span>
            <span>Faltam {m(conta.meta - patrimonio)} para sua meta de {m(conta.meta)}</span>
          </div>
        )}
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: theme.tagBg }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (patrimonio / conta.meta) * 100).toFixed(1)}%`, background: atingeMeta ? theme.positive : theme.warning }} />
        </div>
        <p className="text-xs mt-1.5 text-right" style={{ color: theme.muted }}>
          {Math.min(100, Math.round((patrimonio / conta.meta) * 100))}% da meta atingida
        </p>
      </Card>

      <Card theme={theme}>
        <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>E se aumentar o aporte?</p>
        {[aporte, aporte * 1.5, aporte * 2].map((ap, i) => {
          const p = projetarCom(ap);
          return (
            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: theme.rowBorder }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded-full" style={{ background: i === 0 ? cor : i === 1 ? theme.accentMid : theme.warning }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: theme.text }}>{["Atual", "+50%", "+100%"][i]} — {brl(ap)}/mês</p>
                  <p className="text-xs" style={{ color: theme.muted }}>Renda: {brl(rendaEstimada(p))}/mês</p>
                </div>
              </div>
              <p className="text-sm font-bold" style={{ color: theme.accentText }}>{brl(p)}</p>
            </div>
          );
        })}
      </Card>

      <PgblCard theme={theme} aporteMensal={aporte} />

      <button onClick={() => setConfirmar(true)}
        className="w-full min-h-14 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
        style={{ background: saved ? theme.accentMid : `linear-gradient(135deg, ${theme.accent}, ${theme.accentMid})`, color: "#fff", boxShadow: `0 6px 20px ${cor}40` }}>
        {saved ? <><Icon.Check size={16} sw={2.5} /> Meta definida com sucesso!</> : <><Icon.Target /> Definir como minha meta</>}
      </button>

      {confirmar && (
        <Sheet theme={theme} label="Definir como minha meta" onClose={() => setConfirmar(false)}>
          <div className="flex flex-col">
            <p className="text-base font-bold mb-1 pr-10" style={{ color: theme.text }}>Definir como minha meta?</p>
            <p className="text-xs mb-5" style={{ color: theme.muted }}>Sua meta passa a ser o patrimônio estimado desta simulação.</p>

            <div className="rounded-2xl p-4 mb-4 space-y-3" style={{ background: theme.inputBg }}>
              {[
                ["Meta de patrimônio", m(conta.meta), m(Math.round(patrimonio))],
                ["Ano previsto", String(conta.anoMeta), String(anoMetaNovo)],
                ["Aposentadoria aos", `${idadeMetaAtual} anos`, `${meta} anos`],
              ].map(([k, de, para]) => (
                <div key={k}>
                  <p className="text-xs" style={{ color: theme.muted }}>{k}</p>
                  <p className="text-sm font-semibold flex items-center gap-2 flex-wrap" style={{ color: theme.text }}>
                    <span style={{ color: theme.muted, textDecoration: de === para ? "none" : "line-through" }}>{de}</span>
                    {de !== para && <><Icon.ChevronRight size={14} /><span style={{ color: theme.accentText }}>{para}</span></>}
                  </p>
                </div>
              ))}
            </div>

            {aporteMudou && (
              <div className="flex items-center justify-between rounded-2xl px-4 py-3.5 mb-4"
                style={{ background: aplicarAporte ? theme.tagBg : theme.inputBg, border: `1px solid ${aplicarAporte ? theme.accent : theme.border}` }}>
                <div className="mr-3">
                  <p className="text-sm font-medium" style={{ color: theme.text }}>Também atualizar meu aporte mensal</p>
                  <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
                    {m(conta.aporteMensal)} → {m(aporte)} por mês. Desligado, seu aporte atual não muda.
                  </p>
                </div>
                <Toggle on={aplicarAporte} onToggle={() => setAplicarAporte(!aplicarAporte)} accent={theme.accent} off={theme.switchOff} label="Também atualizar meu aporte mensal" />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setConfirmar(false)} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-semibold"
                style={{ background: theme.inputBg, color: theme.text }}>
                Cancelar
              </button>
              <button onClick={salvar} className="flex-1 min-h-12 py-3.5 rounded-2xl text-white text-sm font-bold" style={{ background: theme.accent }}>
                Confirmar
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
