import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Card, DESTAQUE, HOJE, Icon, MASK, brl, haptic, type Conta, type Theme, type ToastMsg, corConta } from "../shared";
import {
  BRAND_LABEL, cardBrand, copyText, esc, expStatus, fmtCard, fmtExp, fmtMoneyCents, hhmm, luhn, onlyDigits, parseReaisParaCentavos, printHtml,
  type CardBrand,
} from "../lib/format";
import { usePersisted } from "../lib/storage";
import StickyFooter from "../components/StickyFooter";
import PixQr from "../components/PixQr";
import { PRODUTOS } from "../lib/produtos";
import { AVISO_RENTABILIDADE, FUSESC, PLANO } from "../lib/regras";

const pctTaxa = String(PLANO.rentabilidadeSimulacao * 100).replace(".", ",");

type Pagamento = "pix" | "credito" | "debito";
type Step = "form" | "pagamento" | "confirm" | "processing" | "pix" | "error" | "done";
type SavedCard = { id: string; tipo: "credito" | "debito"; brand: CardBrand; last4: string; name: string; exp: string };

const MIN_CENTS = PLANO.aporteMinimo * 100;
const MAX_CENTS = PLANO.aporteMaximo * 100;
const PIX_TTL = 5 * 60;
const CHIPS = [200, 500, 1000, 2000, 5000];
const STEPS = ["Valor", "Pagamento", "Confirmação"];

function montarPix(cents: number, contaId: number) {
  const id = Math.random().toString(36).slice(2, 12).toUpperCase();
  const base = `00020126360014BR.GOV.BCB.PIX0114FUSESC${contaId}${id}5204000053039865406${(cents / 100).toFixed(2)}5802BR5906FUSESC6009FLORIANOP62070503***6304`;
  return base + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, "0");
}

function Stepper({ theme, cor, idx, recorrente }: { theme: Theme; cor: string; idx: number; recorrente: boolean }) {
  return (
    <ol className="flex items-center justify-center gap-0 mb-1" aria-label="Etapas do aporte">
      {STEPS.map((label, i) => (
        <Fragment key={label}>
          <li className="flex flex-col items-center gap-1" aria-current={i === idx ? "step" : undefined}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: i < idx ? theme.accent : i === idx ? cor : theme.border,
                color: i <= idx ? "#fff" : theme.muted,
                boxShadow: i === idx ? `0 0 0 3px ${theme.surface}, 0 0 0 5px ${DESTAQUE.dourado}` : "none",
              }}>
              {i < idx ? <Icon.Check size={12} sw={3} /> : i + 1}
            </div>
            <span className="text-xs font-medium flex items-center gap-1" style={{ color: i === idx ? theme.accentText : theme.muted }}>
              {label}
              {i === 0 && recorrente && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: theme.accentTag, color: theme.accentText }}>
                  Recorrente
                </span>
              )}
            </span>
          </li>
          {i < STEPS.length - 1 && (
            <div className="h-px w-8 mb-5 mx-1 flex-shrink-0" style={{ background: i < idx ? theme.accent : theme.border }} />
          )}
        </Fragment>
      ))}
    </ol>
  );
}

function CampoCartao({ theme, id, label, erro, right, children }: {
  theme: Theme; id: string; label: string; erro: string; right?: ReactNode; children: ReactNode;
}) {
  return (
    <div>
      <div className="rounded-2xl border-2 px-4 py-3" style={{ borderColor: erro ? theme.danger : theme.border, background: theme.inputBg }}>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={id} className="text-xs" style={{ color: theme.muted }}>{label}</label>
          {right}
        </div>
        {children}
      </div>
      {erro && <p id={`${id}-msg`} role="alert" className="text-xs mt-1 px-1" style={{ color: theme.danger }}>{erro}</p>}
    </div>
  );
}

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3" />
      <path d="M12 3a9 9 0 019 9" strokeLinecap="round" />
    </svg>
  );
}

export default function AportesPage({ theme, conta, hidden, isTitular, initialValor, initialTipo, onDone, showToast, planos = [], onTrocarPlano }: {
  theme: Theme; conta: Conta; hidden: boolean; isTitular: boolean;
  initialValor?: number; initialTipo?: "extra" | "recorrente";
  onDone: () => void; showToast: (text: string, type?: ToastMsg["type"]) => void;
  // Planos da mesma pessoa, para escolher onde aportar.
  planos?: Conta[]; onTrocarPlano?: (id: number) => void;
}) {
  const cor = corConta(conta);
  const primeiroNome = conta.nome.split(" ")[0];

  const [step, setStep] = useState<Step>("form");
  const [cents, setCents] = useState(Math.round((initialValor ?? conta.aporteMensal) * 100));
  // Texto do campo de valor: livre enquanto a pessoa digita, formatado ao sair do campo (lei de Postel).
  const [valorTxt, setValorTxt] = useState(() => (cents > 0 ? fmtMoneyCents(cents) : ""));
  const definirCents = (c: number) => { setCents(c); setValorTxt(c > 0 ? fmtMoneyCents(c) : ""); };
  const [tipo, setTipo] = useState<"extra" | "recorrente">(initialTipo ?? "extra");
  const [dia, setDia] = useState(conta.recorrenteDia || 5);
  const [pagamento, setPagamento] = useState<Pagamento>("pix");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [savedCards, setSavedCards] = usePersisted<SavedCard[]>("fusesc:cartoes", []);
  const [cardMode, setCardMode] = useState<"list" | "form">("form");
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [salvarCartao, setSalvarCartao] = useState(true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tentouPag, setTentouPag] = useState(false);
  const [valorTocado, setValorTocado] = useState(false);
  const [protocolo, setProtocolo] = useState("");
  const [concluidoEm, setConcluidoEm] = useState<Date | null>(null);
  const [pix, setPix] = useState<{ code: string; expiresAt: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [verificando, setVerificando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  useEffect(() => {
    if (step !== "pix") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step === "done") showToast("Aporte realizado com sucesso!");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (pagamento === "pix") return;
    const filtered = savedCards.filter((c) => c.tipo === pagamento);
    setCardMode(filtered.length > 0 ? "list" : "form");
    setSelectedSavedId(filtered.length > 0 ? filtered[0].id : null);
    setCardNum(""); setCardName(""); setCardExp(""); setCardCvv("");
    setTouched({}); setTentouPag(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagamento]);

  const v = cents / 100;
  const valorErro = cents === 0 ? "Informe o valor do aporte." : cents < MIN_CENTS ? `Valor mínimo: ${brl(MIN_CENTS / 100)}.` : "";
  const mostrarErroValor = (valorTocado || cents > 0) && !!valorErro;

  const numDigits = onlyDigits(cardNum);
  const brand = cardBrand(numDigits);
  const cvvLen = brand === "amex" ? 4 : 3;
  const expSt = expStatus(cardExp);
  const cardErrors = {
    num: numDigits.length >= 13 && numDigits.length <= 19 && luhn(numDigits) && (brand !== "amex" || numDigits.length === 15) ? "" : "Número de cartão inválido.",
    name: cardName.trim().split(/\s+/).filter(Boolean).length >= 2 ? "" : "Informe o nome como está no cartão.",
    exp: expSt === "ok" ? "" : expSt === "vencido" ? "Cartão vencido." : "Validade inválida (MM/AA).",
    cvv: onlyDigits(cardCvv).length === cvvLen ? "" : `O CVV tem ${cvvLen} dígitos.`,
  };
  const usaCartao = pagamento !== "pix";
  const filteredCards = usaCartao ? savedCards.filter((c) => c.tipo === pagamento) : [];
  const usandoSalvo = usaCartao && cardMode === "list" && !!selectedSavedId;
  const selectedCard = filteredCards.find((c) => c.id === selectedSavedId) || null;
  const cartaoOk = !usaCartao || usandoSalvo || Object.values(cardErrors).every((e) => !e);
  const erroCampo = (k: keyof typeof cardErrors) => (tentouPag || touched[k] ? cardErrors[k] : "");
  const tocar = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const removerCartao = (id: string) => {
    setSavedCards((cs) => cs.filter((c) => c.id !== id));
    if (selectedSavedId !== id) return;
    const resto = filteredCards.filter((c) => c.id !== id);
    if (resto.length > 0) setSelectedSavedId(resto[0].id);
    else { setSelectedSavedId(null); setCardMode("form"); }
  };

  const pagLabel = pagamento === "pix"
    ? "PIX"
    : usandoSalvo && selectedCard
      ? `${pagamento === "credito" ? "Crédito" : "Débito"} ${BRAND_LABEL[selectedCard.brand]} ••••${selectedCard.last4}`
      : `${pagamento === "credito" ? "Crédito" : "Débito"} ${BRAND_LABEL[brand]} ••••${numDigits.slice(-4)}`.replace("  ", " ");
  const restante = pix ? Math.max(0, Math.ceil((pix.expiresAt - now) / 1000)) : 0;
  const expirado = step === "pix" && pix !== null && restante === 0 && !verificando;
  const mmss = `${String(Math.floor(restante / 60)).padStart(2, "0")}:${String(restante % 60).padStart(2, "0")}`;
  const stepperIdx = step === "form" ? 0 : step === "pagamento" ? 1 : 2;

  const irParaPagamento = () => {
    setValorTocado(true);
    if (valorErro) return;
    setStep("pagamento");
  };
  const revisar = () => {
    setTentouPag(true);
    if (!cartaoOk) return;
    if (usaCartao && !usandoSalvo && salvarCartao && brand !== "desconhecida") {
      const novo: SavedCard = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tipo: pagamento as "credito" | "debito",
        brand, last4: numDigits.slice(-4), name: cardName.trim(), exp: fmtExp(cardExp),
      };
      setSavedCards((cs) => [novo, ...cs]);
      setSelectedSavedId(novo.id);
      setCardMode("list");
    }
    setStep("confirm");
  };
  const gerarPix = () => {
    setPix({ code: montarPix(cents, conta.id), expiresAt: Date.now() + PIX_TTL * 1000 });
    setNow(Date.now());
    setVerificando(false);
    setCopiado(false);
    setStep("pix");
  };
  const finalizar = () => {
    setProtocolo(`FUS-2026-${Math.floor(100000 + Math.random() * 900000)}`);
    setConcluidoEm(new Date());
    setStep("done");
    haptic("medium");
  };
  const confirmar = () => {
    haptic("medium");
    if (pagamento === "pix") { gerarPix(); return; }
    setStep("processing");
    later(() => {
      if (cardNum.endsWith("0002")) setStep("error");
      else finalizar();
    }, 1700);
  };
  const jaPaguei = () => {
    setVerificando(true);
    later(() => { setVerificando(false); finalizar(); }, 1800);
  };
  const copiar = async () => {
    if (!pix) return;
    const ok = await copyText(pix.code);
    if (ok) {
      setCopiado(true);
      showToast("Código PIX copiado");
      later(() => setCopiado(false), 2500);
    } else {
      showToast("Não foi possível copiar. Selecione o código e copie manualmente.", "error");
    }
  };
  const reiniciar = () => {
    setStep("form");
    definirCents(Math.round(conta.aporteMensal * 100));
    setTipo("extra");
    setPagamento("pix");
    setCardNum(""); setCardName(""); setCardExp(""); setCardCvv("");
    setTouched({}); setTentouPag(false); setValorTocado(false);
    setCardMode("form"); setSelectedSavedId(null); setSalvarCartao(true);
    setPix(null); setProtocolo("");
  };

  const botaoPrimario = "flex-1 min-h-14 py-4 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]";
  const botaoSecundario = "flex-1 min-h-14 py-4 rounded-2xl text-sm font-semibold";
  const estiloSecundario = { background: theme.surface, color: theme.text, border: `1px solid ${theme.border}` };
  const estiloPrimario = { background: `linear-gradient(135deg, ${cor}, ${theme.accentMid})`, boxShadow: `0 6px 20px ${cor}55` };

  // ── concluído ──────────────────────────────────────────────────────────────
  if (step === "done") {
    const dataHora = `${HOJE} · ${hhmm(concluidoEm ?? new Date())}`;
    const linhas: [string, string][] = [
      ["Protocolo", protocolo],
      ["Data e hora", dataHora],
      ["Valor", brl(v)],
      ["Tipo", tipo === "extra" ? "Aporte avulso" : `Aporte recorrente · todo dia ${dia}`],
      ["Pagamento", pagLabel],
      ["Conta", `${conta.nome} (${conta.parentesco})`],
      ["Plano", `${PLANO.nome} · ${PRODUTOS[conta.produto].nome}`],
    ];
    const compartilhar = async () => {
      const text = `Comprovante de aporte FUSESC — ${brl(v)} — protocolo ${protocolo}`;
      if (navigator.share) { try { await navigator.share({ title: "Comprovante de aporte", text }); } catch { /* cancelado */ } return; }
      const ok = await copyText(text);
      showToast(ok ? "Resumo do comprovante copiado" : "Não foi possível compartilhar neste navegador", ok ? "success" : "error");
    };
    const baixar = () => {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Comprovante ${esc(protocolo)}</title>
        <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,Arial,sans-serif;color:#1A2A1E;padding:40px}
        h1{font-size:20px;margin-bottom:4px}.sub{color:#5B7062;font-size:12px;margin-bottom:24px}
        .row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #E2EDE5;font-size:14px}
        .row b{font-weight:700;text-align:right}.note{font-size:11px;color:#5B7062;margin-top:24px}</style></head><body>
        <h1>Comprovante de aporte</h1><p class="sub">${FUSESC.nome} · CNPJ ${FUSESC.cnpj}</p>
        ${linhas.map(([k, val]) => `<div class="row"><span>${esc(k)}</span><b>${esc(val)}</b></div>`).join("")}
        <p class="note">Documento gerado em ${HOJE}.</p>
        <script>window.onload = () => { window.print(); }<\/script></body></html>`;
      if (!printHtml(html)) showToast("Permita pop-ups neste site para baixar o comprovante", "error");
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: theme.positiveBg, color: theme.positive }}>
            <Icon.CheckCircle size={40} sw={1.6} />
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: theme.text }}>
            {pagamento === "pix" ? "Pagamento confirmado!" : "Aporte realizado!"}
          </h2>
          <p className="text-sm" style={{ color: theme.muted }}>
            {brl(v)} para a conta de <strong style={{ color: theme.text }}>{primeiroNome}</strong>.
          </p>
        </div>

        <Card theme={theme}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold" style={{ color: theme.text }}>Comprovante</p>
            <div className="flex gap-2">
              <button onClick={compartilhar} className="min-h-11 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold"
                style={{ background: theme.tagBg, color: theme.accentText }}>
                <Icon.Share size={14} /> Compartilhar
              </button>
              <button onClick={baixar} aria-label="Baixar comprovante em PDF" className="min-h-11 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold"
                style={{ background: theme.tagBg, color: theme.accentText }}>
                <Icon.Download size={14} /> PDF
              </button>
            </div>
          </div>
          {linhas.map(([k, val]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 border-b last:border-0" style={{ borderColor: theme.rowBorder }}>
              <span className="text-sm flex-shrink-0" style={{ color: theme.muted }}>{k}</span>
              <span className="text-sm font-semibold text-right" style={{ color: theme.text }}>{val}</span>
            </div>
          ))}
        </Card>

        {tipo === "recorrente" && (
          <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5" style={{ background: theme.accentTag, color: theme.accentText }}>
            <span className="mt-0.5"><Icon.Repeat size={16} /></span>
            <p className="text-xs leading-relaxed" style={{ color: theme.text }}>
              Próxima cobrança em <strong>{String(dia).padStart(2, "0")}/09/2026</strong>. Para cancelar ou alterar, vá em Conta › Serviços › Aporte recorrente.
            </p>
          </div>
        )}

        <StickyFooter theme={theme}>
          <div className="flex gap-3">
            <button onClick={reiniciar} className={botaoSecundario} style={estiloSecundario}>Fazer outro aporte</button>
            <button onClick={onDone} className={botaoPrimario} style={estiloPrimario}>Voltar ao início</button>
          </div>
        </StickyFooter>
      </div>
    );
  }

  // ── processando cartão ─────────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="space-y-4">
        <Stepper theme={theme} cor={cor} idx={2} recorrente={tipo === "recorrente"} />
        <Card theme={theme}>
          <div className="flex flex-col items-center text-center py-10" role="status" aria-live="polite">
            <span style={{ color: cor }}><Spinner size={36} /></span>
            <p className="text-base font-bold mt-4" style={{ color: theme.text }}>Processando pagamento…</p>
            <p className="text-xs mt-1" style={{ color: theme.muted }}>Não feche o aplicativo. Isso leva alguns segundos.</p>
          </div>
        </Card>
      </div>
    );
  }

  // ── cartão recusado ────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="space-y-4">
        <Stepper theme={theme} cor={cor} idx={2} recorrente={tipo === "recorrente"} />
        <Card theme={theme}>
          <div className="flex flex-col items-center text-center py-6" role="alert">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: theme.dangerBg, color: theme.danger }}>
              <Icon.Alert size={30} />
            </div>
            <p className="text-lg font-bold mb-1" style={{ color: theme.text }}>Pagamento não autorizado</p>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: theme.muted }}>
              O emissor recusou a transação. Nenhum valor foi cobrado. Confira os dados, tente outro cartão ou pague com PIX.
            </p>
          </div>
        </Card>
        <StickyFooter theme={theme}>
          <div className="flex gap-3">
            <button onClick={() => setStep("pagamento")} className={botaoSecundario} style={estiloSecundario}>Trocar forma</button>
            <button onClick={confirmar} className={botaoPrimario} style={estiloPrimario}>Tentar novamente</button>
          </div>
        </StickyFooter>
      </div>
    );
  }

  // ── PIX ────────────────────────────────────────────────────────────────────
  if (step === "pix" && pix) {
    return (
      <div className="space-y-4">
        <Stepper theme={theme} cor={cor} idx={2} recorrente={tipo === "recorrente"} />
        <Card theme={theme}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold" style={{ color: theme.text }}>Pague com PIX</p>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
              style={{
                background: expirado ? theme.dangerBg : theme.warningBg,
                color: expirado ? theme.danger : theme.warning,
              }} role="status">
              {verificando ? <><Spinner size={12} /> Verificando pagamento…</> : expirado ? "Código expirado" : "Aguardando pagamento"}
            </span>
          </div>

          <p className="text-3xl font-bold tracking-tight text-center" style={{ color: theme.text }}>{brl(v)}</p>

          {expirado ? (
            <div className="flex flex-col items-center text-center py-8" role="alert">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: theme.dangerBg, color: theme.danger }}>
                <Icon.Alert size={26} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>O tempo para pagar acabou</p>
              <p className="text-xs" style={{ color: theme.muted }}>Nenhum valor foi cobrado. Gere um novo código para continuar.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-center mt-1 mb-4" style={{ color: theme.muted }}>
                Expira em <strong style={{ color: restante <= 60 ? theme.danger : theme.text }}>{mmss}</strong>
              </p>
              <div className="flex justify-center mb-4"><PixQr code={pix.code} /></div>

              <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: theme.muted }}>PIX copia e cola</p>
              <div className="flex items-stretch gap-2 mb-4">
                <code className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-xs leading-snug break-all select-all"
                  style={{ background: theme.inputBg, color: theme.text, border: `1px solid ${theme.border}`, maxHeight: 64, overflow: "hidden" }}>
                  {pix.code}
                </code>
                <button onClick={copiar} className="min-h-11 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
                  style={{ background: theme.tagBg, color: theme.accentText }}>
                  {copiado ? <><Icon.Check size={14} /> Copiado</> : <><Icon.Copy size={14} /> Copiar</>}
                </button>
              </div>

              <ol className="space-y-1.5 text-xs" style={{ color: theme.muted }}>
                <li>1. Abra o app do seu banco e escolha pagar com PIX.</li>
                <li>2. Escaneie o QR Code ou cole o código acima.</li>
                <li>3. Confirme o pagamento e volte aqui.</li>
              </ol>
            </>
          )}
        </Card>

        <StickyFooter theme={theme}>
          {expirado ? (
            <div className="flex gap-3">
              <button onClick={() => { setPix(null); setStep("pagamento"); }} className={botaoSecundario} style={estiloSecundario}>Trocar forma</button>
              <button onClick={gerarPix} className={botaoPrimario} style={estiloPrimario}>Gerar novo PIX</button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => { setPix(null); setStep("pagamento"); }} disabled={verificando} className={`${botaoSecundario} disabled:opacity-50`} style={estiloSecundario}>Cancelar</button>
              <button onClick={jaPaguei} disabled={verificando} aria-busy={verificando} className={botaoPrimario} style={estiloPrimario}>
                {verificando ? <><Spinner /> Verificando…</> : "Já fiz o pagamento"}
              </button>
            </div>
          )}
        </StickyFooter>
      </div>
    );
  }

  // ── confirmação ────────────────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <Stepper theme={theme} cor={cor} idx={2} recorrente={tipo === "recorrente"} />
        <Card theme={theme}>
          <p className="text-base font-bold mb-1" style={{ color: theme.text }}>Confirmar aporte</p>
          <p className="text-xs mb-5" style={{ color: theme.muted }}>Verifique os dados antes de confirmar.</p>
          <div className="rounded-2xl p-5 space-y-4" style={{ background: theme.inputBg }}>
            <div className="flex items-center gap-3 pb-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: cor }}>
                {conta.initials}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: theme.text }}>{conta.nome}</p>
                <p className="text-xs" style={{ color: theme.muted }}>{conta.parentesco}</p>
              </div>
            </div>
            {[
              ["Valor", brl(v)],
              ["Tipo", tipo === "extra" ? "Aporte avulso" : `Recorrente · todo dia ${dia}`],
              ["Pagamento", pagLabel],
              ["Plano", `${PLANO.nome} · ${PRODUTOS[conta.produto].nome}`],
              ["Data", `Hoje, ${HOJE.replace("/08/", " ago ")}`],
            ].map(([k, val]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-sm" style={{ color: theme.muted }}>{k}</span>
                <span className="text-sm font-semibold text-right" style={{ color: theme.text }}>{val}</span>
              </div>
            ))}
          </div>
          {!isTitular && (
            <div className="rounded-xl px-3.5 py-3 mt-4 flex items-start gap-2.5" style={{ background: theme.warningBg, color: theme.warning, border: `1px solid ${theme.warningBorder}` }}>
              <span className="mt-0.5"><Icon.Alert size={16} /></span>
              <p className="text-xs leading-relaxed">Você está aportando na conta de outra pessoa ({conta.nome}).</p>
            </div>
          )}
          {pagamento === "pix" && (
            <p className="text-xs mt-4 leading-relaxed" style={{ color: theme.muted }}>
              Vamos gerar um código PIX válido por 5 minutos. O aporte só é concluído depois do pagamento.
            </p>
          )}
        </Card>
        <StickyFooter theme={theme}>
          <div className="flex gap-3">
            <button onClick={() => setStep("pagamento")} className={botaoSecundario} style={estiloSecundario}>Voltar</button>
            <button onClick={confirmar} className={botaoPrimario} style={estiloPrimario}>
              {pagamento === "pix" ? "Gerar PIX" : "Confirmar e pagar"}
            </button>
          </div>
        </StickyFooter>
      </div>
    );
  }

  // ── forma de pagamento ─────────────────────────────────────────────────────
  if (step === "pagamento") {
    const opcoes: { id: Pagamento; label: string; desc: string; icon: ReactNode }[] = [
      { id: "pix", label: "PIX", desc: "Transferência instantânea, disponível 24h", icon: <Icon.Zap size={22} /> },
      { id: "credito", label: "Cartão de crédito", desc: tipo === "recorrente" ? "Cobrança automática todo mês" : "Débito único na fatura", icon: <Icon.Card /> },
      { id: "debito", label: "Cartão de débito", desc: "Débito imediato na conta", icon: <Icon.Card /> },
    ];
    return (
      <div className="space-y-4">
        <Stepper theme={theme} cor={cor} idx={1} recorrente={tipo === "recorrente"} />
        <Card theme={theme}>
          <p className="text-base font-bold mb-1" style={{ color: theme.text }}>Forma de pagamento</p>
          <p className="text-xs mb-5" style={{ color: theme.muted }}>Escolha como deseja realizar o aporte de {brl(v)}.</p>

          <div role="radiogroup" aria-label="Forma de pagamento" className="space-y-3 mb-6">
            {opcoes.map((op) => {
              const on = pagamento === op.id;
              return (
                <button key={op.id} role="radio" aria-checked={on} onClick={() => setPagamento(op.id)}
                  className="w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all"
                  style={{ background: on ? theme.tagBg : theme.inputBg, border: `2px solid ${on ? theme.accent : theme.border}` }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: theme.surface, color: theme.accentText }}>{op.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>{op.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{op.desc}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: on ? theme.accent : theme.border }}>
                    {on && <div className="w-2.5 h-2.5 rounded-full" style={{ background: theme.accent }} />}
                  </div>
                </button>
              );
            })}
          </div>

          {usaCartao && (
            <div className="pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
              {cardMode === "list" ? (
                <>
                  <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: theme.muted }}>Cartão</p>
                  <div role="radiogroup" aria-label="Cartão salvo" className="space-y-2 mb-2">
                    {filteredCards.map((c) => {
                      const on = selectedSavedId === c.id;
                      return (
                        <div key={c.id} className="flex items-center gap-2">
                          <button type="button" role="radio" aria-checked={on} onClick={() => setSelectedSavedId(c.id)}
                            className="flex-1 min-w-0 flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all"
                            style={{ background: on ? theme.tagBg : theme.inputBg, border: `2px solid ${on ? theme.accent : theme.border}` }}>
                            <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: theme.surface, color: theme.accentText }}>
                              <Icon.Card size={20} />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-semibold truncate" style={{ color: theme.text }}>{BRAND_LABEL[c.brand]} •••• {c.last4}</span>
                              <span className="block text-xs mt-0.5 truncate" style={{ color: theme.muted }}>{c.name} · vence {c.exp}</span>
                            </span>
                            <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                              style={{ borderColor: on ? theme.accent : theme.border }}>
                              {on && <span className="w-2.5 h-2.5 rounded-full" style={{ background: theme.accent }} />}
                            </span>
                          </button>
                          <button type="button" onClick={() => removerCartao(c.id)} aria-label={`Remover cartão terminado em ${c.last4}`}
                            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ color: theme.muted }}>
                            <Icon.Trash size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => { setCardMode("form"); setSelectedSavedId(null); }}
                    className="w-full min-h-14 flex items-center gap-3 rounded-2xl p-3.5 text-left border-2 border-dashed transition-all"
                    style={{ borderColor: theme.border, color: theme.accentText }}>
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: theme.tagBg }}>
                      <Icon.Plus size={18} />
                    </span>
                    <span className="text-sm font-semibold">Adicionar novo cartão</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: theme.muted }}>Dados do cartão</p>
                    {filteredCards.length > 0 && (
                      <button type="button" onClick={() => { setCardMode("list"); setSelectedSavedId(filteredCards[0].id); }}
                        className="min-h-9 text-xs font-semibold" style={{ color: theme.accentText }}>
                        Usar cartão salvo
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <CampoCartao theme={theme} id="cartao-num" label="Número do cartão" erro={erroCampo("num")}
                      right={brand !== "desconhecida" ? <span className="text-xs font-bold" style={{ color: theme.accentText }}>{BRAND_LABEL[brand]}</span> : undefined}>
                      <input id="cartao-num" type="text" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000"
                        value={fmtCard(cardNum)} aria-invalid={!!erroCampo("num")} aria-describedby="cartao-num-msg"
                        onChange={(e) => { const d = onlyDigits(e.target.value); setCardNum(d.slice(0, cardBrand(d) === "amex" ? 15 : 16)); }}
                        onBlur={() => tocar("num")}
                        className="w-full bg-transparent text-base font-semibold outline-none tracking-widest" style={{ color: theme.text }} />
                    </CampoCartao>
                    <CampoCartao theme={theme} id="cartao-nome" label="Nome no cartão" erro={erroCampo("name")}>
                      <input id="cartao-nome" type="text" autoComplete="cc-name" placeholder="COMO ESTÁ NO CARTÃO"
                        value={cardName} aria-invalid={!!erroCampo("name")} aria-describedby="cartao-nome-msg"
                        onChange={(e) => setCardName(e.target.value.toUpperCase())} onBlur={() => tocar("name")}
                        className="w-full bg-transparent text-base font-semibold outline-none uppercase" style={{ color: theme.text }} />
                    </CampoCartao>
                    <div className="grid grid-cols-2 gap-3 items-start">
                      <CampoCartao theme={theme} id="cartao-val" label="Validade" erro={erroCampo("exp")}>
                        <input id="cartao-val" type="text" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA"
                          value={fmtExp(cardExp)} aria-invalid={!!erroCampo("exp")} aria-describedby="cartao-val-msg"
                          onChange={(e) => setCardExp(onlyDigits(e.target.value).slice(0, 4))} onBlur={() => tocar("exp")}
                          className="w-full bg-transparent text-base font-semibold outline-none" style={{ color: theme.text }} />
                      </CampoCartao>
                      <CampoCartao theme={theme} id="cartao-cvv" label="CVV" erro={erroCampo("cvv")}>
                        <input id="cartao-cvv" type="text" inputMode="numeric" autoComplete="cc-csc" placeholder="•••"
                          value={cardCvv} aria-invalid={!!erroCampo("cvv")} aria-describedby="cartao-cvv-msg"
                          onChange={(e) => setCardCvv(onlyDigits(e.target.value).slice(0, 4))} onBlur={() => tocar("cvv")}
                          className="w-full bg-transparent text-base font-semibold outline-none tracking-widest" style={{ color: theme.text }} />
                      </CampoCartao>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 mt-4 text-xs cursor-pointer" style={{ color: theme.muted }}>
                    <input type="checkbox" checked={salvarCartao} onChange={(e) => setSalvarCartao(e.target.checked)}
                      className="w-5 h-5 flex-shrink-0" style={{ accentColor: theme.accent }} />
                    Salvar este cartão para os próximos aportes
                  </label>
                </>
              )}
            </div>
          )}

          {pagamento === "pix" && (
            <div className="rounded-2xl p-4 flex items-start gap-3 mt-2" style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
              <span className="mt-0.5" style={{ color: theme.accentText }}><Icon.Zap /></span>
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.text }}>Pagamento via PIX</p>
                <p className="text-xs mt-1" style={{ color: theme.muted }}>
                  Na próxima etapa você recebe um QR Code e o código copia e cola. O aporte é creditado assim que o pagamento é identificado.
                </p>
              </div>
            </div>
          )}
        </Card>

        <StickyFooter theme={theme}>
          <div className="flex gap-3">
            <button onClick={() => setStep("form")} className={botaoSecundario} style={estiloSecundario}>Voltar</button>
            <button onClick={revisar} className={botaoPrimario} style={estiloPrimario}>Revisar aporte</button>
          </div>
        </StickyFooter>
      </div>
    );
  }

  // ── valor ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Stepper theme={theme} cor={cor} idx={0} recorrente={tipo === "recorrente"} />

      {planos.length > 1 && onTrocarPlano ? (
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase mb-2 px-1" id="plano-aporte" style={{ color: theme.muted }}>Em qual plano?</p>
          <div role="radiogroup" aria-labelledby="plano-aporte" className="grid grid-cols-2 gap-2">
            {planos.map((p) => {
              const on = p.id === conta.id;
              return (
                <button key={p.id} role="radio" aria-checked={on} onClick={() => { if (!on) onTrocarPlano(p.id); }}
                  className="relative rounded-2xl p-3 text-left min-h-16"
                  style={{ background: on ? theme.tagBg : theme.surface, border: `2px solid ${on ? theme.accent : theme.border}` }}>
                  {on && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: DESTAQUE.menta, color: DESTAQUE.noite, boxShadow: `0 0 0 2px ${theme.bg}` }} aria-hidden="true">
                      <Icon.Check size={12} sw={3} />
                    </span>
                  )}
                  <span className="block text-sm font-bold pr-3" style={{ color: theme.text }}>{PRODUTOS[p.produto].nome}</span>
                  <span className="block text-xs" style={{ color: theme.muted }}>Saldo: {hidden ? MASK : brl(p.saldo)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: cor }}>
            {conta.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: theme.text }}>Aportar para {primeiroNome}</p>
            <p className="text-xs" style={{ color: theme.muted }}>{PRODUTOS[conta.produto].nome} · Saldo: {hidden ? MASK : brl(conta.saldo)}</p>
          </div>
        </div>
      )}

      {!isTitular && (
        <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5" style={{ background: theme.warningBg, color: theme.warning, border: `1px solid ${theme.warningBorder}` }}>
          <span className="mt-0.5"><Icon.Info size={16} /></span>
          <p className="text-xs leading-relaxed">Você está aportando na conta de outra pessoa. Confira o nome antes de continuar.</p>
        </div>
      )}

      <Card theme={theme}>
        <p className="text-xs font-semibold tracking-wide uppercase mb-3" id="tipo-aporte" style={{ color: theme.muted }}>Tipo de aporte</p>
        <div role="radiogroup" aria-labelledby="tipo-aporte" className="flex gap-2 mb-6 p-1 rounded-2xl" style={{ background: theme.inputBg }}>
          {(["extra", "recorrente"] as const).map((t) => (
            <button key={t} role="radio" aria-checked={tipo === t} onClick={() => setTipo(t)}
              className="flex-1 min-h-11 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={tipo === t ? { background: cor, color: "#fff", boxShadow: `0 2px 8px ${cor}44` } : { background: "transparent", color: theme.muted }}>
              {t === "extra" ? "Avulso" : "Recorrente"}
            </button>
          ))}
        </div>

        {tipo === "recorrente" && (
          <div className="rounded-xl px-4 py-3 mb-5" style={{ background: theme.accentTag }}>
            <label htmlFor="dia-cobranca" className="block text-xs font-semibold mb-2" style={{ color: theme.text }}>Dia da cobrança mensal</label>
            <select id="dia-cobranca" value={dia} onChange={(e) => setDia(Number(e.target.value))}
              className="w-full min-h-12 px-4 rounded-xl text-sm font-semibold outline-none mb-3"
              style={{ background: theme.surface, color: theme.text, border: `1.5px solid ${theme.border}` }}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Todo dia {d}</option>)}
            </select>
            <p className="text-xs leading-relaxed flex items-start gap-2" style={{ color: theme.muted }}>
              <span className="mt-0.5 flex-shrink-0"><Icon.Info size={14} /></span>
              <span>Cobrança automática todo dia {dia}. Para cancelar ou alterar, vá em <strong style={{ color: theme.text }}>Conta › Serviços › Aporte recorrente</strong>.</span>
            </p>
          </div>
        )}

        <label htmlFor="valor-aporte" className="block text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: theme.muted }}>Valor</label>
        <div className="flex items-center rounded-2xl border-2 px-5 py-4 mb-2 transition-all"
          style={{ borderColor: mostrarErroValor ? theme.danger : cor, background: theme.inputBg }}>
          <span className="text-base font-semibold mr-2" style={{ color: theme.muted }}>R$</span>
          <input id="valor-aporte" inputMode="decimal" autoComplete="off" value={valorTxt} placeholder="0,00"
            onChange={(e) => {
              const txt = e.target.value.replace(/[^\d.,]/g, "");
              setValorTxt(txt);
              setCents(Math.min(parseReaisParaCentavos(txt), MAX_CENTS));
            }}
            onBlur={() => { setValorTocado(true); setValorTxt(cents > 0 ? fmtMoneyCents(cents) : ""); }}
            aria-invalid={mostrarErroValor} aria-describedby="valor-aporte-msg"
            className="flex-1 min-w-0 bg-transparent text-3xl font-bold outline-none tracking-tight" style={{ color: theme.text }} />
        </div>
        <p id="valor-aporte-msg" className="text-xs mb-5" role={mostrarErroValor ? "alert" : undefined}
          style={{ color: mostrarErroValor ? theme.danger : theme.muted }}>
          {mostrarErroValor ? valorErro : `Mínimo ${brl(MIN_CENTS / 100)} · máximo ${brl(MAX_CENTS / 100)} por aporte`}
        </p>

        <div className="grid grid-cols-5 gap-2">
          {CHIPS.map((vv) => {
            const on = cents === vv * 100;
            return (
              <button key={vv} onClick={() => definirCents(vv * 100)} aria-pressed={on} aria-label={`Usar ${brl(vv)}`}
                className="min-h-11 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: on ? cor : theme.inputBg, color: on ? "#fff" : theme.accentText }}>
                {vv >= 1000 ? `${vv / 1000}K` : vv}
              </button>
            );
          })}
        </div>
      </Card>

      {v >= MIN_CENTS / 100 && (
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${DESTAQUE.noite} 0%, ${DESTAQUE.noiteMid} 100%)` }}>
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20" aria-hidden="true"
            style={{ background: `radial-gradient(circle, ${DESTAQUE.menta} 0%, transparent 70%)` }} />
          <p className="relative text-xs font-semibold tracking-wide uppercase mb-3 flex items-center gap-1.5" style={{ color: DESTAQUE.dourado }}>
            <Icon.Trend size={14} /> Impacto deste aporte
          </p>
          <div className="relative grid grid-cols-2 gap-3">
            {[
              { l: "Novo saldo", v: hidden ? MASK : brl(conta.saldo + v), c: "#FFFFFF" },
              { l: "Rendimento est. em 12 meses*", v: `+${brl(v * PLANO.rentabilidadeSimulacao)}`, c: DESTAQUE.menta },
            ].map((s) => (
              <div key={s.l} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>{s.l}</p>
                <p className="text-sm font-bold" style={{ color: s.c }}>{s.v}</p>
              </div>
            ))}
          </div>
          <p className="relative text-xs mt-3" style={{ color: "rgba(255,255,255,0.7)" }}>* Simulação com {pctTaxa}% a.a. {AVISO_RENTABILIDADE}</p>
        </div>
      )}

      <Card theme={theme}>
        <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: theme.muted }}>Aportes recentes</p>
        {[
          { d: "28 ago 2026", desc: "Aporte avulso", v: 2000 },
          { d: "01 ago 2026", desc: "Aporte recorrente", v: conta.aporteMensal },
          { d: "01 jul 2026", desc: "Aporte recorrente", v: conta.aporteMensal },
        ].map((t, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: theme.rowBorder }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: theme.tagBg, color: theme.accentText }}>
                <Icon.ArrowUp size={15} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: theme.text }}>{t.desc}</p>
                <p className="text-xs" style={{ color: theme.muted }}>{t.d}</p>
              </div>
            </div>
            <p className="text-sm font-semibold" style={{ color: theme.text }}>{hidden ? "••••••" : `+${brl(t.v)}`}</p>
          </div>
        ))}
      </Card>

      <StickyFooter theme={theme}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-shrink-0">
            <p className="text-xs" style={{ color: theme.muted }}>{tipo === "recorrente" ? "Aporte mensal" : "Aporte avulso"}</p>
            <p className="text-base font-bold" style={{ color: theme.text }}>{cents > 0 ? brl(v) : "—"}</p>
          </div>
          <button onClick={irParaPagamento} disabled={!!valorErro} className={botaoPrimario} style={estiloPrimario}>
            Continuar
          </button>
        </div>
      </StickyFooter>
    </div>
  );
}
