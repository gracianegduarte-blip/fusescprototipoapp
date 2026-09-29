import { useEffect, useRef, useState } from "react";
import { Icon, brl, type Theme } from "../shared";
import { FUSESC, PLANO, TEXTO_REGIME } from "../lib/regras";

type Msg = {
  id: number;
  from: "user" | "ai" | "human" | "system";
  text: string;
  feedback?: "up" | "down";
  status?: "ok" | "failed";
};

const AI_RESPONSES: Record<string, string> = {
  default: `Posso ajudar com dúvidas sobre o ${PLANO.nome}: aportes, dedução no IR, tributação, resgate, portabilidade e aposentadoria. Se preferir, chame um atendente ou ligue ${FUSESC.telefone}.`,
  resgate: `O resgate pode ser pedido depois de ${PLANO.carenciaMeses} meses de plano. Você recebe o saldo das suas contribuições em parcela única ou em até ${PLANO.resgateParcelasMax} parcelas, com desconto de IR. Atenção: o resgate encerra a participação no plano. Se quer mudar de instituição, a portabilidade não tem IR.`,
  aporte: `Você pode aportar a qualquer momento via PIX ou cartão, a partir de ${brl(PLANO.aporteMinimo)}. Também dá para programar um aporte recorrente todo mês. Quanto mais cedo você aporta, mais os juros compostos trabalham a seu favor.`,
  ir: `${TEXTO_REGIME} Na regressiva, a alíquota cai de 35% para 10% depois de 10 anos de cada contribuição.`,
  deducao: `Quem faz a declaração completa do IR pode deduzir as contribuições ao plano até ${PLANO.deducaoIrPct}% da renda bruta tributável, desde que também contribua para o INSS ou regime próprio. O imposto é pago depois, ao receber o benefício.`,
  aposentadoria: `A aposentadoria pode ser pedida a partir dos ${PLANO.idadeMinimaAposentadoria} anos. Você escolhe como receber: renda vitalícia, renda por ${PLANO.rendaPrazoAnos[0]} a ${PLANO.rendaPrazoAnos[1]} anos ou um percentual de ${PLANO.rendaPercentualMin}% a ${PLANO.rendaPercentualMax}% do saldo ao mês. Na concessão, até ${PLANO.saqueNaAposentadoriaPct}% do saldo pode ser pago à vista.`,
  portabilidade: `A portabilidade leva o seu saldo para outro plano de previdência, sem cobrança de IR. Para trazer um plano de outra instituição para a FUSESC, use Menu › Aportes e resgates › Portabilidade.`,
  saldo: "Seu saldo fica disponível no app a qualquer momento. Rentabilidade, alocação e projeções estão na aba Fundos, e o histórico de aportes no Extrato.",
};

const RESPOSTAS_HUMANO = [
  "Entendi. Vou verificar isso para você.",
  "Só um instante, estou consultando o seu cadastro.",
  "Certo. Posso ajudar com mais alguma coisa?",
];

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function getAIReply(msg: string): string {
  const t = normalizar(msg);
  if (/\bresgat/.test(t)) return AI_RESPONSES.resgate;
  if (/\baport/.test(t)) return AI_RESPONSES.aporte;
  if (/\b(pgbl|vgbl|deduz\w*|deducao|12)\b/.test(t)) return AI_RESPONSES.deducao;
  if (/\bportab/.test(t)) return AI_RESPONSES.portabilidade;
  if (/\b(aposent\w*|renda|beneficio)\b/.test(t)) return AI_RESPONSES.aposentadoria;
  if (/\b(ir|imposto|impostos|tribut\w*|regressiva|progressiva)\b/.test(t)) return AI_RESPONSES.ir;
  if (/\b(saldo|extrato)\b/.test(t)) return AI_RESPONSES.saldo;
  return AI_RESPONSES.default;
}

const pedeAtendente = (msg: string) => /\b(atendente|humano|pessoa|alguem|assessor)\b/.test(normalizar(msg));

const SUGESTOES = ["Como funciona o resgate?", "Dedução no IR", "Regressiva ou progressiva?", "Como me aposento?", "Falar com atendente"];
const MSG_SISTEMA = "Conectando você a um atendente. Tempo médio de espera: 2 minutos. Atendimento de segunda a sexta, das 8h às 18h.";

function ChatIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.03 2 11c0 2.67 1.19 5.07 3.09 6.76L4 22l4.48-1.5C9.56 20.82 10.76 21 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="8.5" cy="11" r="1" fill="white" /><circle cx="12" cy="11" r="1" fill="white" /><circle cx="15.5" cy="11" r="1" fill="white" />
    </svg>
  );
}

export default function Chat({ theme, onClose, startHuman = false }: { theme: Theme; onClose: () => void; startHuman?: boolean }) {
  const nextId = useRef(3);
  const nid = () => nextId.current++;
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { id: 1, from: "ai", text: "Olá! Sou a assistente virtual da FUSESC. Como posso te ajudar hoje?" },
    ...(startHuman ? [{ id: 2, from: "system" as const, text: MSG_SISTEMA }] : []),
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [agent, setAgent] = useState<string | null>(null);
  const [conectando, setConectando] = useState(startHuman);
  const logRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);
  const respostasHumano = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const entrarAtendente = () => {
    setConectando(false);
    setAgent("Marina");
    setMsgs((m) => [...m, { id: nid(), from: "human", text: "Olá, aqui é a Marina, do atendimento da FUSESC. Como posso ajudar?" }]);
  };

  const conectarAtendente = () => {
    if (agent || conectando) return;
    setConectando(true);
    setMsgs((m) => [...m, { id: nid(), from: "system", text: MSG_SISTEMA }]);
    later(entrarAtendente, 2600);
  };

  useEffect(() => {
    if (startHuman) later(entrarAtendente, 2600);
    return () => { timers.current.forEach((id) => window.clearTimeout(id)); timers.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Rola só a lista de mensagens. scrollIntoView rolaria também a tela do app (que tem overflow oculto) e a deixaria presa.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const responder = (txt: string) => {
    if (!agent && pedeAtendente(txt)) { conectarAtendente(); return; }
    if (conectando) return;
    setTyping(true);
    later(() => {
      setTyping(false);
      const texto = agent ? RESPOSTAS_HUMANO[respostasHumano.current++ % RESPOSTAS_HUMANO.length] : getAIReply(txt);
      setMsgs((m) => [...m, { id: nid(), from: agent ? "human" : "ai", text: texto }]);
    }, agent ? 1600 : 1100);
  };

  const send = (raw?: string) => {
    const txt = (raw ?? input).trim();
    if (!txt) return;
    const falhou = !navigator.onLine;
    setMsgs((m) => [...m, { id: nid(), from: "user", text: txt, status: falhou ? "failed" : "ok" }]);
    setInput("");
    if (!falhou) responder(txt);
  };

  const tentarNovamente = (msg: Msg) => {
    if (!navigator.onLine) return;
    setMsgs((m) => m.map((x) => (x.id === msg.id ? { ...x, status: "ok" } : x)));
    responder(msg.text);
  };

  const avaliar = (id: number, feedback: "up" | "down") =>
    setMsgs((m) => m.map((x) => (x.id === id ? { ...x, feedback } : x)));

  const podeEnviar = input.trim().length > 0;

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Chat com a FUSESC"
      className="absolute inset-0 z-50 flex flex-col outline-none" style={{ background: theme.bg }}>
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 flex-shrink-0" style={{ background: theme.accent }}>
        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-white">
          {agent ? <Icon.Headset size={20} /> : <ChatIcon size={20} />}
        </div>
        <div className="flex-1 min-w-0 text-white">
          <p className="font-bold text-sm leading-tight">{agent ? `${agent} · Atendimento` : "Assistente FUSESC"}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <p className="text-white/85 text-xs">
              {agent ? "Atendente humano" : conectando ? "Conectando a um atendente…" : "Assistente virtual"}
            </p>
          </div>
        </div>
        {!agent && !conectando && (
          <button onClick={conectarAtendente}
            className="min-h-11 flex items-center gap-1.5 px-3 rounded-xl bg-white/15 text-white text-xs font-semibold flex-shrink-0">
            <Icon.Headset size={16} /> Atendente
          </button>
        )}
        <button onClick={onClose} aria-label="Fechar chat"
          className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-white flex-shrink-0">
          <Icon.Close />
        </button>
      </div>

      <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" role="log" aria-live="polite" aria-label="Mensagens">
        {msgs.map((m, i) => {
          if (m.from === "system") {
            return (
              <p key={m.id} className="self-center text-center text-xs px-4 py-2 rounded-2xl max-w-[90%]"
                style={{ background: theme.tagBg, color: theme.muted }}>{m.text}</p>
            );
          }
          const isUser = m.from === "user";
          return (
            <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
              <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl flex-shrink-0 mr-2 flex items-center justify-center mt-1 text-white" style={{ background: theme.accent }}>
                    {m.from === "human" ? <Icon.Headset size={13} /> : <ChatIcon size={13} />}
                  </div>
                )}
                <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                  style={{
                    background: isUser ? theme.accent : theme.surface, color: isUser ? "#fff" : theme.text,
                    border: isUser ? "none" : `1px solid ${theme.border}`,
                    opacity: m.status === "failed" ? 0.7 : 1,
                  }}>
                  {m.text}
                </div>
              </div>

              {m.status === "failed" && (
                <p role="alert" className="text-xs mt-1 flex items-center gap-2" style={{ color: theme.danger }}>
                  <Icon.Wifi size={13} /> Não enviada. Sem conexão.
                  <button onClick={() => tentarNovamente(m)} className="min-h-9 px-2 font-semibold underline">Tentar novamente</button>
                </p>
              )}

              {m.from === "ai" && i > 0 && (
                <div className="ml-9 mt-1.5 flex items-center gap-1.5 flex-wrap">
                  {!m.feedback ? (
                    <>
                      <span className="text-xs" style={{ color: theme.muted }}>Isso ajudou?</span>
                      <button onClick={() => avaliar(m.id, "up")} aria-label="Sim, ajudou"
                        className="w-11 h-9 rounded-lg flex items-center justify-center" style={{ background: theme.tagBg, color: theme.accentText }}>
                        <Icon.ThumbUp />
                      </button>
                      <button onClick={() => avaliar(m.id, "down")} aria-label="Não ajudou"
                        className="w-11 h-9 rounded-lg flex items-center justify-center" style={{ background: theme.tagBg, color: theme.accentText }}>
                        <Icon.ThumbDown />
                      </button>
                    </>
                  ) : m.feedback === "up" ? (
                    <span className="text-xs" style={{ color: theme.muted }}>Obrigado pelo feedback.</span>
                  ) : (
                    <>
                      <span className="text-xs" style={{ color: theme.muted }}>Sentimos muito.</span>
                      {!agent && !conectando && (
                        <button onClick={conectarAtendente} className="min-h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                          style={{ background: theme.accent, color: "#fff" }}>
                          <Icon.Headset size={14} /> Falar com atendente
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {typing && (
          <div className="flex justify-start items-end gap-2" role="status" aria-label="Digitando">
            <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-white" style={{ background: theme.accent }}>
              {agent ? <Icon.Headset size={13} /> : <ChatIcon size={13} />}
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
              {[0, 1, 2].map((d) => (
                <span key={d} className="w-2 h-2 rounded-full" style={{ background: theme.accent, opacity: 0.5, animation: `bounce 1.2s ${d * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {msgs.length === 1 && !typing && (
          <div className="flex flex-wrap gap-2 mt-1">
            {SUGESTOES.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="min-h-11 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95"
                style={{ background: theme.tagBg, color: theme.accentText, borderColor: theme.accent + "44" }}>
                {s}
              </button>
            ))}
          </div>
        )}

      </div>

      <div className="px-4 pb-8 pt-3 flex-shrink-0" style={{ background: theme.surface, borderTop: `1px solid ${theme.border}` }}>
        {!agent && (
          <p className="text-xs mb-2 px-1" style={{ color: theme.muted }}>
            Respostas automáticas. Não substituem a orientação de um assessor.
          </p>
        )}
        <div className="flex gap-2">
          <label htmlFor="chat-input" className="sr-only">Mensagem</label>
          <input id="chat-input" value={input} onChange={(e) => setInput(e.target.value)} enterKeyHint="send"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) send(); }}
            placeholder={agent ? `Escreva para ${agent}...` : "Pergunte à FUSESC..."}
            className="flex-1 min-w-0 px-4 py-3 rounded-2xl text-sm outline-none min-h-12"
            style={{ background: theme.inputBg, color: theme.text, border: `1.5px solid ${theme.border}` }} />
          <button onClick={() => send()} aria-label="Enviar mensagem" disabled={!podeEnviar}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 text-white"
            style={{ background: podeEnviar ? theme.accent : theme.switchOff }}>
            <Icon.Send />
          </button>
        </div>
      </div>
    </div>
  );
}
