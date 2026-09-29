import { useState } from "react";
import { Icon, MASK, brl, type Conta, type Theme } from "../shared";

export default function RecorrenciaSheet({ theme, conta, hidden, onClose, onCancelar, onAlterar }: {
  theme: Theme; conta: Conta; hidden: boolean; onClose: () => void; onCancelar: () => void; onAlterar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const nome = conta.nome.split(" ")[0];
  const dia = String(conta.recorrenteDia).padStart(2, "0");

  if (!conta.recorrenteAtiva) {
    return (
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: theme.tagBg, color: theme.accentText }}>
          <Icon.Repeat size={26} />
        </div>
        <p className="text-base font-bold mb-1" style={{ color: theme.text }}>Sem aporte recorrente</p>
        <p className="text-sm mb-6" style={{ color: theme.muted }}>
          Aportar todo mês, no automático, é a forma mais simples de chegar na meta de {nome}.
        </p>
        <button onClick={onAlterar} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white mb-3" style={{ background: theme.accent }}>
          Criar aporte recorrente
        </button>
        <button onClick={onClose} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: theme.inputBg, color: theme.text }}>
          Fechar
        </button>
      </div>
    );
  }

  if (confirmando) {
    return (
      <div className="flex flex-col">
        <p className="text-base font-bold mb-2 pr-10" style={{ color: theme.text }}>Cancelar aporte recorrente?</p>
        <div className="rounded-2xl p-4 mb-5 flex gap-3" style={{ background: theme.warningBg, border: `1px solid ${theme.warningBorder}`, color: theme.warning }}>
          <span className="flex-shrink-0 mt-0.5"><Icon.Alert /></span>
          <p className="text-xs leading-relaxed">
            A cobrança de {hidden ? MASK : brl(conta.aporteMensal)} todo dia {conta.recorrenteDia} deixará de acontecer. Você pode criar outra recorrência quando quiser.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setConfirmando(false)} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: theme.inputBg, color: theme.text }}>
            Manter
          </button>
          <button onClick={onCancelar} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: "#B42318" }}>
            Sim, cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <p className="text-base font-bold mb-1 pr-10" style={{ color: theme.text }}>Aporte recorrente</p>
      <p className="text-xs mb-5" style={{ color: theme.muted }}>{conta.nome}</p>

      <div className="rounded-2xl p-4 mb-5 space-y-3" style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: theme.muted }}>Situação</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: theme.positiveBg, color: theme.positive }}>Ativo</span>
        </div>
        {[
          ["Valor mensal", hidden ? MASK : brl(conta.aporteMensal)],
          ["Cobrança", `Todo dia ${conta.recorrenteDia}`],
          ["Próxima cobrança", `${dia}/09/2026`],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-sm" style={{ color: theme.muted }}>{k}</span>
            <span className="text-sm font-semibold" style={{ color: theme.text }}>{v}</span>
          </div>
        ))}
      </div>

      <button onClick={onAlterar} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white mb-3" style={{ background: theme.accent }}>
        Alterar valor ou dia
      </button>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-semibold" style={{ background: theme.inputBg, color: theme.text }}>
          Fechar
        </button>
        <button onClick={() => setConfirmando(true)} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background: theme.dangerBg, color: theme.danger, border: `1px solid ${theme.dangerBorder}` }}>
          Cancelar recorrência
        </button>
      </div>
    </div>
  );
}
