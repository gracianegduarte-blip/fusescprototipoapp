import { useEffect, useRef, useState } from "react";
import { Icon, brl, type Conta, type Theme } from "../shared";
import { digitsToCents, fmtMoneyCents } from "../lib/format";

const ORIGENS = [
  "Bradesco Vida e Previdência", "Itaú Vida e Previdência", "Brasilprev",
  "Caixa Vida e Previdência", "Outra instituição",
];

export default function PortabilidadeSheet({ theme, conta, onClose }: {
  theme: Theme; conta: Conta; onClose: () => void;
}) {
  const [etapa, setEtapa] = useState<"form" | "enviando" | "ok">("form");
  const [origem, setOrigem] = useState("");
  const [tipo, setTipo] = useState<"total" | "parcial">("total");
  const [cents, setCents] = useState(0);
  const [aceite, setAceite] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [protocolo] = useState(() => `PORT-2026-${Math.floor(100000 + Math.random() * 900000)}`);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const faltas: string[] = [];
  if (!origem) faltas.push("instituição de origem");
  if (tipo === "parcial" && cents < 100000) faltas.push("valor a transferir (mínimo R$ 1.000,00)");
  if (!aceite) faltas.push("declaração de titularidade");

  const enviar = () => {
    setTentou(true);
    if (faltas.length) return;
    setEtapa("enviando");
    timer.current = window.setTimeout(() => setEtapa("ok"), 1400);
  };

  if (etapa === "ok") {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: theme.positiveBg, color: theme.positive }}>
          <Icon.CheckCircle size={32} />
        </div>
        <p className="text-lg font-bold mb-1" style={{ color: theme.text }}>Solicitação enviada</p>
        <p className="text-sm mb-5" style={{ color: theme.muted }}>
          Vamos solicitar a transferência à instituição de origem. Prazo estimado: até 10 dias úteis.
        </p>
        <div className="w-full rounded-2xl p-4 mb-5 text-left space-y-2" style={{ background: theme.inputBg }}>
          {[["Protocolo", protocolo], ["Origem", origem], ["Valor", tipo === "total" ? "Saldo total" : brl(cents / 100)]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 text-sm">
              <span style={{ color: theme.muted }}>{k}</span>
              <span className="font-semibold text-right" style={{ color: theme.text }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: theme.accent }}>
          Concluir
        </button>
      </div>
    );
  }

  const campo = (id: string, erro: boolean) => ({
    id, style: { background: theme.inputBg, border: `1.5px solid ${erro ? theme.danger : theme.border}`, color: theme.text },
  });

  return (
    <div className="flex flex-col">
      <p className="text-base font-bold mb-1 pr-10" style={{ color: theme.text }}>Portabilidade</p>
      <p className="text-xs mb-5" style={{ color: theme.muted }}>
        Traga seu plano de outra instituição para a FUSESC, sem custo e sem incidência de imposto.
      </p>

      <ol className="mb-5 space-y-2.5">
        {["Escolha a instituição de origem", "Informe quanto quer transferir", "Nós cuidamos do restante e avisamos você"].map((t, i) => (
          <li key={t} className="flex items-center gap-3 text-sm" style={{ color: theme.text }}>
            <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
              style={{ background: theme.tagBg, color: theme.accentText }}>{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>

      <div className="space-y-4 mb-4">
        <div>
          <label htmlFor="port-origem" className="block text-xs font-medium mb-1.5" style={{ color: theme.muted }}>Instituição de origem</label>
          <select value={origem} onChange={(e) => setOrigem(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none min-h-12"
            {...campo("port-origem", tentou && !origem)}>
            <option value="">Selecione…</option>
            {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div role="radiogroup" aria-label="Quanto transferir" className="grid grid-cols-2 gap-2">
          {(["total", "parcial"] as const).map((t) => (
            <button key={t} role="radio" aria-checked={tipo === t} onClick={() => setTipo(t)}
              className="min-h-11 py-3 rounded-2xl text-sm font-bold"
              style={{ background: tipo === t ? theme.accent : theme.tagBg, color: tipo === t ? "#fff" : theme.text }}>
              {t === "total" ? "Saldo total" : "Valor parcial"}
            </button>
          ))}
        </div>

        {tipo === "parcial" && (
          <div>
            <label htmlFor="port-valor" className="block text-xs font-medium mb-1.5" style={{ color: theme.muted }}>Valor a transferir (R$)</label>
            <input inputMode="numeric" autoComplete="off" value={fmtMoneyCents(cents)}
              onChange={(e) => setCents(digitsToCents(e.target.value, 100000000))}
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none min-h-12"
              {...campo("port-valor", tentou && cents < 100000)} />
          </div>
        )}

        <label className="flex items-start gap-3 text-xs leading-relaxed cursor-pointer" style={{ color: theme.muted }}>
          <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)}
            className="mt-0.5 w-5 h-5 flex-shrink-0" style={{ accentColor: theme.accent }} />
          Declaro que sou o titular do plano de origem de {conta.nome.split(" ")[0]} e autorizo a solicitação de portabilidade.
        </label>
      </div>

      {tentou && faltas.length > 0 && (
        <p role="alert" className="text-xs mb-4 rounded-xl px-3 py-2.5"
          style={{ background: theme.dangerBg, color: theme.danger, border: `1px solid ${theme.dangerBorder}` }}>
          Falta preencher: {faltas.join(", ")}.
        </p>
      )}

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background: theme.inputBg, color: theme.text }}>
          Cancelar
        </button>
        <button onClick={enviar} disabled={etapa === "enviando"} aria-busy={etapa === "enviando"}
          className="flex-1 min-h-12 py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: theme.accent }}>
          {etapa === "enviando" ? (
            <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3" /><path d="M12 3a9 9 0 019 9" strokeLinecap="round" />
            </svg>Enviando…</>
          ) : "Solicitar portabilidade"}
        </button>
      </div>
    </div>
  );
}
