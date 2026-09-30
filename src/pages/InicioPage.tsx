import { useState, type ReactNode } from "react";
import { ANO_ATUAL, Card, DESTAQUE, Icon, MASK, PROXIMO_PAGAMENTO, brl, can, type Conta, type Theme, type ToastMsg, corConta } from "../shared";
import { duracaoRenda, hhmm } from "../lib/format";
import Sheet from "../components/Sheet";
import Skeleton from "../components/Skeleton";
import ExtratoSheet from "../components/ExtratoSheet";
import RendaSheet from "../components/RendaSheet";
import InformeSheet from "../components/InformeSheet";
import { PLANO } from "../lib/regras";
import { REFERENCIA, RENTABILIDADE, fmtPct } from "../lib/carteira";
import Ajustado from "../components/Ajustado";

// Mês da última lâmina publicada, ex.: "ago".
const mesCurto = REFERENCIA.mes.slice(0, 3);

type Acao = { label: string; action: () => void; icon: ReactNode; bloqueada: boolean; motivo: string; principal?: boolean };

export default function InicioPage({
  conta, theme, hidden, isTitular, loading, updatedAt, onRefresh, onAporte, onGoToSimulador, onToggleHidden, onUpdateConta, showToast,
}: {
  conta: Conta; theme: Theme; hidden: boolean; isTitular: boolean; loading: boolean; updatedAt: Date;
  onRefresh: () => void;
  onAporte: (initialValor?: number, initialTipo?: "extra" | "recorrente") => void;
  onGoToSimulador: () => void;
  onToggleHidden: () => void;
  onUpdateConta: (c: Conta) => void;
  showToast: (text: string, type?: ToastMsg["type"]) => void;
}) {
  const [sheet, setSheet] = useState<null | "extrato" | "renda" | "informe">(null);

  const cor = corConta(conta);
  const podeAportar = can(conta, "aportes");
  const podeResgatar = can(conta, "resgates");
  const pct = Math.min(100, Math.round((conta.saldo / conta.meta) * 100));

  // recomendação de aumento de aporte
  const anosRestantes = Math.max(1, conta.anoMeta - ANO_ATUAL);
  const taxa = PLANO.rentabilidadeSimulacao / 12;
  const n = anosRestantes * 12;
  const fv = (ap: number) => ap * ((Math.pow(1 + taxa, n) - 1) / taxa);
  const anosComAtual = (() => {
    for (let a = 1; a <= 40; a++) {
      const nn = a * 12;
      if (conta.saldo + fv(conta.aporteMensal) * (nn / n) >= conta.meta || fv(conta.aporteMensal) >= conta.meta - conta.saldo) return a;
    }
    return anosRestantes;
  })();
  const recAporte = Math.round(conta.aporteMensal * 1.3 / 50) * 50;
  const diff = recAporte - conta.aporteMensal;
  const diffDia = Math.round((diff / 30) * 10) / 10;
  const anosComRec = (() => {
    for (let a = 1; a <= 40; a++) {
      const nn = a * 12;
      if (fv(recAporte) * (nn / n) >= conta.meta - conta.saldo) return a;
    }
    return Math.max(1, anosComAtual - 3);
  })();
  const anosEconomizados = Math.max(1, anosComAtual - anosComRec);

  const duracao = conta.rendaMensal ? duracaoRenda(conta.saldo, conta.rendaMensal) : null;
  const semPermissao = (motivo: string) => showToast(motivo, "error");

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Carregando dados da conta">
        <Skeleton theme={theme} className="h-44 !rounded-3xl" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} theme={theme} className="h-20 !rounded-2xl" />)}
        </div>
        <Skeleton theme={theme} className="h-52 !rounded-2xl" />
        <Skeleton theme={theme} className="h-36 !rounded-2xl" />
        <Skeleton theme={theme} className="h-40 !rounded-2xl" />
      </div>
    );
  }

  const acoes: Acao[] = [
    {
      label: "Aportar", action: () => onAporte(), principal: true,
      bloqueada: !podeAportar, motivo: "Você não tem permissão para fazer aportes nesta conta.",
      icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
      </svg>,
    },
    {
      label: "Extrato", action: () => setSheet("extrato"),
      bloqueada: !podeAportar, motivo: "Você não tem permissão para ver o histórico desta conta.",
      icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <path strokeLinecap="round" d="M9 12h6M9 16h4" />
      </svg>,
    },
  ];

  const lancamentos = [
    { d: "28 ago", desc: "Aporte avulso", v: 2000, rend: false },
    { d: "01 ago", desc: "Aporte mensal recorrente", v: conta.aporteMensal, rend: false },
    { d: "01 ago", desc: "Rendimento do mês", v: Math.round(conta.saldo * 0.012), rend: true },
  ];

  const tiles: { l: string; v: string; destaque?: boolean }[] = conta.fase === "recebendo"
    ? [
        { l: "Renda mensal", v: hidden ? "••••" : brl(conta.rendaMensal!) },
        { l: "Próx. pagamento", v: PROXIMO_PAGAMENTO.slice(0, 6) },
        { l: `Rentab. ${mesCurto}`, v: `+${fmtPct(RENTABILIDADE.mes)}`, destaque: true },
      ]
    : [
        { l: "Aporte mensal", v: hidden ? "••••" : brl(conta.aporteMensal) },
        { l: "Meta", v: hidden ? "••••" : brl(conta.meta) },
        { l: `Rentab. ${mesCurto}`, v: `+${fmtPct(RENTABILIDADE.mes)}`, destaque: true },
      ];

  return (
    <div className="space-y-4">
      {/* hero */}
      <div className="rounded-3xl p-6 relative overflow-hidden text-white"
        style={{ background: `linear-gradient(145deg, ${cor} 0%, ${cor}CC 100%)` }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-30" aria-hidden="true"
          style={{ background: `radial-gradient(circle, ${DESTAQUE.menta} 0%, transparent 65%)` }} />
        <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full opacity-20" aria-hidden="true"
          style={{ background: `radial-gradient(circle, ${DESTAQUE.dourado} 0%, transparent 65%)` }} />

        <div className="flex items-center justify-between mb-5 relative">
          <div>
            <p className="text-xs text-white/85 font-medium tracking-wide">Saldo acumulado</p>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-3xl font-bold tracking-tight">{hidden ? MASK : brl(conta.saldo)}</p>
              <button onClick={onToggleHidden} aria-pressed={hidden} aria-label={hidden ? "Mostrar saldos" : "Ocultar saldos"}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ color: "rgba(255,255,255,0.85)" }}>
                {hidden ? <Icon.EyeOff /> : <Icon.Eye />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 relative">
          {tiles.map((s) => (
            <div key={s.l} className="rounded-xl px-3 py-2.5"
              style={s.destaque
                ? { background: DESTAQUE.noite, border: `1px solid ${DESTAQUE.menta}40` }
                : { background: "rgba(255,255,255,0.15)" }}>
              <p className="text-xs text-white/85">{s.l}</p>
              <p className="text-sm font-semibold mt-0.5 leading-tight flex items-center gap-1 min-w-0"
                style={s.destaque ? { color: DESTAQUE.menta } : undefined}>
                {s.destaque && <span className="flex-shrink-0"><Icon.Trend size={13} /></span>}
                <Ajustado className="flex-1 min-w-0">{s.v}</Ajustado>
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 relative">
          <p className="text-xs text-white/85">Atualizado às {hhmm(updatedAt)}</p>
          <button onClick={onRefresh} aria-label="Atualizar dados"
            className="min-h-11 -my-2 -mr-2 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-xl">
            <Icon.Refresh size={14} /> Atualizar
          </button>
        </div>
      </div>

      {/* ações rápidas */}
      <div className="grid grid-cols-2 gap-3">
        {acoes.map((a) => (
          <button key={a.label} onClick={a.bloqueada ? () => semPermissao(a.motivo) : a.action}
            aria-disabled={a.bloqueada}
            className="relative flex items-center justify-center gap-2 rounded-2xl min-h-14 px-3 text-sm font-bold transition-all active:scale-95"
            style={a.principal && !a.bloqueada
              ? { background: `linear-gradient(135deg, ${cor}, ${theme.accentMid})`, color: "#fff", boxShadow: `0 6px 20px ${cor}40` }
              : { background: theme.tagBg, color: a.bloqueada ? theme.muted : theme.accentText, opacity: a.bloqueada ? 0.75 : 1 }}>
            {a.bloqueada ? <Icon.Lock size={16} /> : a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* últimos lançamentos */}
      <Card theme={theme}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: theme.text }}>Últimos lançamentos</p>
          {podeAportar && conta.saldo > 0 && (
            <button onClick={() => setSheet("extrato")} className="min-h-11 px-2 -mr-2 text-xs font-medium" style={{ color: theme.accentText }}>
              Ver todos
            </button>
          )}
        </div>
        {!podeAportar ? (
          <div className="flex items-center gap-3 py-2">
            <span style={{ color: theme.muted }}><Icon.Lock /></span>
            <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>
              O histórico de movimentações desta conta não está liberado para você.
            </p>
          </div>
        ) : conta.saldo === 0 ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: theme.inputBg, color: theme.muted }}>
              <Icon.Wallet />
            </div>
            <p className="text-sm font-semibold" style={{ color: theme.text }}>Nenhuma movimentação ainda</p>
            <p className="text-xs text-center" style={{ color: theme.muted }}>Faça seu primeiro aporte para começar</p>
            <button onClick={() => onAporte()} className="mt-1 min-h-11 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: theme.accent }}>
              Aportar
            </button>
          </div>
        ) : (
          lancamentos.map((t, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: theme.rowBorder }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: t.rend ? theme.positiveBg : theme.tagBg, color: t.rend ? theme.positive : theme.accentText }}>
                  {t.rend ? <Icon.Trend /> : <Icon.ArrowUp />}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.text }}>{t.desc}</p>
                  <p className="text-xs" style={{ color: theme.muted }}>{t.d}</p>
                </div>
              </div>
              <p className="text-sm font-semibold" style={{ color: t.rend ? theme.positive : theme.text }}>
                {hidden ? "••••••" : `+${brl(t.v)}`}
              </p>
            </div>
          ))
        )}
      </Card>

      {/* meta de aposentadoria (acumulando) */}
      {conta.fase === "acumulando" && (
        <Card theme={theme}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: theme.text }}>Meta de aposentadoria</p>
            <div className="flex items-center gap-1">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: theme.tagBg, color: theme.accentText }}>
                {pct}% atingido
              </span>
              <button onClick={onGoToSimulador} aria-label="Ajustar meta no simulador"
                className="w-11 h-11 -mr-2 flex items-center justify-center transition-all active:scale-95">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: theme.accent }}>
                  <Icon.Edit size={14} sw={2.4} />
                </span>
              </button>
            </div>
          </div>
          <div className="flex justify-between text-xs mb-2" style={{ color: theme.muted }}>
            <span>{hidden ? "••••••" : brl(conta.saldo)}</span>
            <span>Meta: {hidden ? "••••••" : brl(conta.meta)}</span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: theme.tagBg }}
            role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progresso da meta">
            <div className="relative h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cor}, ${DESTAQUE.menta})` }}>
              <span className="absolute right-0 top-0 h-full aspect-square rounded-full" aria-hidden="true"
                style={{ background: DESTAQUE.dourado, boxShadow: `0 0 0 2px ${theme.surface}` }} />
            </div>
          </div>
          <p className="text-xs mt-2.5" style={{ color: theme.muted }}>
            Previsão: <strong style={{ color: theme.accentText }}>{conta.anoMeta} — {conta.idadeAtual + (conta.anoMeta - ANO_ATUAL)} anos</strong>
          </p>
        </Card>
      )}

      {/* recomendação (acumulando) */}
      {conta.fase === "acumulando" && podeAportar && (
        <div className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${DESTAQUE.noite}, ${DESTAQUE.noiteMid} 60%, ${theme.accent})` }}>
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10" style={{ background: "#fff" }} />
          <div className="flex items-start gap-3 mb-4 relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "rgba(255,255,255,0.1)", color: DESTAQUE.dourado }}>
              <Icon.Zap />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: DESTAQUE.dourado }}>Recomendação</p>
              <p className="text-sm font-bold text-white leading-snug">
                Aumentar seu aporte mensal de{" "}
                <span className="text-white">{hidden ? "••••" : brl(conta.aporteMensal)}</span>
                {" "}para{" "}
                <span style={{ color: DESTAQUE.menta }}>{hidden ? "••••" : brl(recAporte)}/mês</span>
              </p>
              <p className="text-xs text-white/85 mt-1">
                apenas <span className="text-white font-semibold">{hidden ? "••" : `R$ ${diffDia.toFixed(2).replace(".", ",")}`} a mais por dia</span>
              </p>
            </div>
          </div>
          <div className="rounded-2xl px-4 py-3 mb-4 relative" style={{ background: "rgba(255,255,255,0.1)" }}>
            <p className="text-xs text-white/90 leading-relaxed">
              Reduz o tempo de alcance da sua meta de aposentadoria em{" "}
              <strong className="text-white">{anosEconomizados} {anosEconomizados === 1 ? "ano inteiro" : "anos inteiros"}</strong>.
            </p>
          </div>
          <button onClick={() => onAporte(recAporte, "recorrente")}
            className="relative w-full min-h-12 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: "rgba(255,255,255,0.14)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
            <Icon.Repeat size={16} />
            Aumentar aporte mensal
          </button>
        </div>
      )}

      {/* recebimentos (recebendo) */}
      {conta.fase === "recebendo" && (
        <>
          <Card theme={theme}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: theme.text }}>Próximo pagamento</p>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: theme.positiveBg, color: theme.positive }}>
                Agendado
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: theme.text }}>
              {hidden ? MASK : brl(conta.rendaMensal!)}
            </p>
            <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: theme.muted }}>
              <Icon.Calendar size={14} /> {PROXIMO_PAGAMENTO} · na conta cadastrada
            </p>
            <p className="text-xs mt-1 mb-4" style={{ color: theme.muted }}>
              {duracao === null
                ? "Com essa renda, o saldo rende mais do que você retira."
                : `Com essa renda, o saldo dura cerca de ${Math.round(duracao)} anos.`}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={podeResgatar ? () => setSheet("renda") : () => semPermissao("Você não tem permissão para alterar a renda desta conta.")}
                className="min-h-12 py-3 rounded-xl text-xs font-bold text-white" style={{ background: theme.accent }}>
                Alterar renda
              </button>
              <button onClick={() => setSheet("informe")}
                className="min-h-12 py-3 rounded-xl text-xs font-semibold" style={{ background: theme.tagBg, color: theme.accentText }}>
                Informe de rendimentos
              </button>
            </div>
          </Card>

        </>
      )}


      {sheet === "extrato" && (
        <Sheet theme={theme} label="Extrato" onClose={() => setSheet(null)}>
          <ExtratoSheet theme={theme} conta={conta} hidden={hidden} onClose={() => setSheet(null)} showToast={showToast} />
        </Sheet>
      )}
      {sheet === "renda" && (
        <Sheet theme={theme} label="Alterar renda mensal" onClose={() => setSheet(null)}>
          <RendaSheet theme={theme} conta={conta} hidden={hidden} onClose={() => setSheet(null)}
            onSave={(renda) => {
              onUpdateConta({ ...conta, rendaMensal: renda });
              setSheet(null);
              showToast("Renda alterada a partir do próximo pagamento");
            }} />
        </Sheet>
      )}
      {sheet === "informe" && (
        <Sheet theme={theme} label="Informe de rendimentos" onClose={() => setSheet(null)}>
          <InformeSheet theme={theme} conta={conta} hidden={hidden} onClose={() => setSheet(null)} showToast={showToast} />
        </Sheet>
      )}
    </div>
  );
}
