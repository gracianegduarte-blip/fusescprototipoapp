import { useState } from "react";
import { ANO_ATUAL, Icon, MASK, brl, haptic, type Conta, type Theme, corConta } from "../shared";
import { PLANO, TABELA_REGRESSIVA } from "../lib/regras";

const PARCELAS = [1, 6, PLANO.resgateParcelasMax];

export default function ResgateSheet({ theme, conta, hidden, onClose }: {
  theme: Theme; conta: Conta; hidden: boolean; onClose: () => void;
}) {
  const cor = corConta(conta);
  const [etapa, setEtapa] = useState<"regras" | "pedido" | "enviado">("regras");
  const [parcelas, setParcelas] = useState(1);
  const [ciente, setCiente] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [protocolo] = useState(() => `RES-2026-${Math.floor(100000 + Math.random() * 900000)}`);

  const meses = Math.max(0, (ANO_ATUAL - conta.anoAbertura) * 12);
  const liberado = meses >= PLANO.carenciaMeses;
  const faltam = PLANO.carenciaMeses - meses;
  const m = (v: number) => (hidden ? MASK : brl(v));
  const primeiroNome = conta.nome.split(" ")[0];

  if (etapa === "enviado") {
    return (
      <div className="flex flex-col items-center text-center py-2" role="status">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: theme.positiveBg, color: theme.positive }}>
          <Icon.CheckCircle size={32} />
        </div>
        <p className="text-lg font-bold mb-1" style={{ color: theme.text }}>Pedido de resgate enviado</p>
        <p className="text-sm leading-relaxed mb-5" style={{ color: theme.muted }}>
          Em até {PLANO.prazoExtratoDias} dias a FUSESC envia o extrato com os valores líquidos. Você confirma o resgate
          assinando o termo de opção em até {PLANO.prazoTermoOpcaoDias} dias.
        </p>
        <div className="w-full rounded-2xl p-4 mb-5 text-left space-y-2" style={{ background: theme.inputBg }}>
          {[
            ["Protocolo", protocolo],
            ["Conta", `${conta.nome} (${conta.parentesco})`],
            ["Pagamento", parcelas === 1 ? "Parcela única" : `${parcelas} parcelas mensais`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 text-sm">
              <span style={{ color: theme.muted }}>{k}</span>
              <span className="font-semibold text-right" style={{ color: theme.text }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: cor }}>
          Concluir
        </button>
      </div>
    );
  }

  if (etapa === "pedido") {
    return (
      <div className="flex flex-col">
        <button onClick={() => setEtapa("regras")} className="min-h-11 self-start flex items-center gap-1 text-sm font-semibold mb-1" style={{ color: theme.accentText }}>
          <Icon.ChevronLeft /> Regras de resgate
        </button>
        <p className="text-base font-bold mb-1" style={{ color: theme.text }}>Solicitar resgate</p>
        <p className="text-xs mb-5" style={{ color: theme.muted }}>Conta de {primeiroNome} · saldo bruto de {m(conta.saldo)}</p>

        <p className="text-xs font-semibold tracking-wide uppercase mb-2" id="parcelas-label" style={{ color: theme.muted }}>Como quer receber</p>
        <div role="radiogroup" aria-labelledby="parcelas-label" className="grid grid-cols-3 gap-2 mb-5">
          {PARCELAS.map((p) => {
            const on = parcelas === p;
            return (
              <button key={p} role="radio" aria-checked={on} onClick={() => setParcelas(p)}
                className="min-h-14 rounded-2xl px-2 py-2 text-center"
                style={{ background: on ? theme.tagBg : theme.inputBg, border: `2px solid ${on ? theme.accent : theme.border}` }}>
                <span className="block text-sm font-bold" style={{ color: theme.text }}>{p === 1 ? "À vista" : `${p}x`}</span>
                <span className="block text-xs" style={{ color: theme.muted }}>{p === 1 ? "parcela única" : hidden ? "mensais" : `${brl(conta.saldo / p)}/mês`}</span>
              </button>
            );
          })}
        </div>

        {PLANO.resgateEncerraPlano && (
          <div className="rounded-2xl p-4 mb-4 flex gap-3" style={{ background: theme.dangerBg, border: `1px solid ${theme.dangerBorder}`, color: theme.danger }}>
            <span className="flex-shrink-0 mt-0.5"><Icon.Alert /></span>
            <p className="text-xs leading-relaxed">
              <strong>O resgate encerra a participação de {primeiroNome} no plano.</strong> Os benefícios de aposentadoria e pensão deixam de existir.
              Se o objetivo é trocar de instituição, prefira a portabilidade, que não tem IR.
            </p>
          </div>
        )}

        <label className="flex items-start gap-3 mb-1 text-xs leading-relaxed cursor-pointer" style={{ color: theme.text }}>
          <input type="checkbox" checked={ciente} onChange={(e) => setCiente(e.target.checked)}
            aria-invalid={tentou && !ciente} aria-describedby="resgate-ciente-msg"
            className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ accentColor: theme.accent }} />
          Entendi que o resgate é tributado pelo IR e encerra a participação no plano.
        </label>
        <p id="resgate-ciente-msg" className="text-xs mb-5 min-h-4" role={tentou && !ciente ? "alert" : undefined} style={{ color: theme.danger }}>
          {tentou && !ciente ? "Confirme que leu o aviso para continuar." : ""}
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: theme.inputBg, color: theme.text }}>
            Cancelar
          </button>
          <button onClick={() => { setTentou(true); if (!ciente) return; haptic("medium"); setEtapa("enviado"); }}
            className="flex-1 min-h-12 py-3.5 rounded-2xl text-white text-sm font-bold" style={{ background: cor }}>
            Enviar pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <p className="text-base font-bold mb-1 pr-10" style={{ color: theme.text }}>Regras de resgate</p>
      <p className="text-xs mb-5" style={{ color: theme.muted }}>
        Conta aberta em {conta.anoAbertura} · {Math.floor(meses / 12)} {Math.floor(meses / 12) === 1 ? "ano" : "anos"} de plano
      </p>

      <div className="rounded-2xl p-4 mb-5 text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}BB)` }}>
        <p className="text-xs text-white/85 mb-1">{liberado ? "Resgate disponível" : "Resgate ainda não disponível"}</p>
        <p className="text-2xl font-bold">{liberado ? m(conta.saldo) : `Faltam ${faltam} ${faltam === 1 ? "mês" : "meses"}`}</p>
        <p className="text-xs text-white/85 mt-1">
          {liberado ? "Valor bruto, antes do imposto de renda" : `A carência é de ${PLANO.carenciaMeses} meses de plano`}
        </p>
      </div>

      <ul className="space-y-2 mb-5">
        {[
          `Carência de ${PLANO.carenciaMeses} meses de plano para pedir resgate ou portabilidade.`,
          `Pagamento em parcela única ou em até ${PLANO.resgateParcelasMax} parcelas mensais.`,
          ...(PLANO.resgateEncerraPlano ? ["O resgate encerra a participação no plano."] : []),
          `Ao se aposentar, é possível receber até ${PLANO.saqueNaAposentadoriaPct}% do saldo à vista, sem sair do plano.`,
        ].map((t) => (
          <li key={t} className="flex items-start gap-3 rounded-2xl px-4 py-3 text-sm" style={{ background: theme.inputBg, color: theme.text }}>
            <span className="mt-0.5 flex-shrink-0" style={{ color: theme.accentText }}><Icon.Check /></span>{t}
          </li>
        ))}
      </ul>

      <div className="rounded-2xl p-4 mb-5" style={{ background: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
        <p className="text-xs font-semibold mb-2" style={{ color: theme.warning }}>IR na tabela regressiva (por tempo de cada contribuição)</p>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1">
          {TABELA_REGRESSIVA.map((f) => (
            <p key={f.ate} className="text-xs" style={{ color: theme.text }}>{f.ate}: <strong>{f.aliquota}%</strong></p>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: theme.inputBg, color: theme.text }}>
          Fechar
        </button>
        {liberado && (
          <button onClick={() => setEtapa("pedido")} className="flex-1 min-h-12 py-3.5 rounded-2xl text-white text-sm font-bold" style={{ background: cor }}>
            Solicitar resgate
          </button>
        )}
      </div>
    </div>
  );
}
