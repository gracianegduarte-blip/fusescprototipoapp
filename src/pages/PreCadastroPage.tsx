import { useRef, useState } from "react";
import { ANO_ATUAL, Icon, haptic } from "../shared";
import { fmtCel, onlyDigits } from "../lib/format";
import { writeJson } from "../lib/storage";
import { brl0, type MetaRascunho, type PreCadastro } from "../lib/explorar";
import { NIVEIS } from "../lib/regras";

type Campo = "nome" | "email" | "celular" | "nascimento";

const PASSOS: {
  campo: Campo; pergunta: string; placeholder: string; type: string;
  inputMode?: "text" | "email" | "tel" | "numeric"; autoComplete: string; dica?: string;
  mascara?: (v: string) => string; validar: (v: string) => string;
}[] = [
  {
    campo: "nome", pergunta: "Como podemos te chamar?", placeholder: "Seu nome", type: "text", autoComplete: "name",
    validar: (v) => (v.trim().length < 2 ? "Informe seu nome." : ""),
  },
  {
    campo: "email", pergunta: "Qual é o seu melhor e-mail?", placeholder: "voce@email.com", type: "email",
    inputMode: "email", autoComplete: "email",
    validar: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Informe um e-mail válido."),
  },
  {
    campo: "celular", pergunta: "E o seu celular?", placeholder: "(48) 99999-9999", type: "tel",
    inputMode: "tel", autoComplete: "tel", mascara: fmtCel, dica: "Enviamos avisos importantes do seu plano por aqui.",
    validar: (v) => (onlyDigits(v).length === 11 ? "" : "Informe DDD e número, com 11 dígitos."),
  },
  {
    campo: "nascimento", pergunta: "Em que ano você nasceu?", placeholder: "1987", type: "text",
    inputMode: "numeric", autoComplete: "bday-year", mascara: (v) => onlyDigits(v).slice(0, 4),
    dica: "Usamos para sugerir o plano, as simulações e o tamanho do texto mais confortável para você.",
    validar: (v) => {
      const ano = Number(v);
      if (v.length !== 4 || ano < 1900 || ano > ANO_ATUAL) return "Informe um ano válido.";
      if (ANO_ATUAL - ano < 18) return "O titular precisa ter 18 anos ou mais.";
      return "";
    },
  },
];

const Fundo = ({ children }: { children: React.ReactNode }) => (
  <div className="size-full flex flex-col relative overflow-hidden"
    style={{ background: "linear-gradient(160deg, #0D2118 0%, #1A3D28 60%, #0D2118 100%)" }}>
    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" aria-hidden="true"
      style={{ background: "radial-gradient(circle, #4A9E6A 0%, transparent 70%)" }} />
    {children}
  </div>
);

const BOTAO_ATIVO = { background: "linear-gradient(135deg, #2A5C40, #4A9E6A)", color: "#fff", boxShadow: "0 8px 32px rgba(42,92,64,0.5)" };

export default function PreCadastroPage({ meta, onVoltar, onConcluir }: {
  meta?: MetaRascunho; onVoltar: () => void; onConcluir: (dados: PreCadastro) => void;
}) {
  const inicio = useRef(Date.now());
  const [passo, setPasso] = useState(0);
  const [dados, setDados] = useState<Record<Campo, string>>({ nome: "", email: "", celular: "", nascimento: "" });
  const [erro, setErro] = useState("");
  const [segundos, setSegundos] = useState<number | null>(null);

  const cadastro: PreCadastro = { ...dados, nome: dados.nome.trim(), email: dados.email.trim(), meta };

  if (segundos !== null) {
    const primeiroNome = cadastro.nome.split(" ")[0];
    return (
      <Fundo>
        <div className="flex-1 flex flex-col px-6 pt-16 pb-8 z-10 overflow-y-auto">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "rgba(74,158,106,0.15)", border: "1.5px solid rgba(74,158,106,0.3)", color: "#7DD3A0" }}>
            <Icon.CheckCircle size={32} />
          </div>
          <h1 className="text-white text-2xl font-bold leading-tight mb-2" role="status">Pronto, {primeiroNome}!</h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.75)" }}>
            Seu pré-cadastro foi feito em {segundos} segundos. Enviamos um link de confirmação para {cadastro.email}.
          </p>

          {meta && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(200,150,42,0.14)", border: "1px solid rgba(200,150,42,0.35)" }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#E8B840" }}>Sua meta foi salva</p>
              <p className="text-white text-sm font-semibold">{meta.objetivo}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                {brl0(meta.meta)} em {meta.anos} anos · aporte de {brl0(meta.mensal)}/mês
              </p>
            </div>
          )}

          <div className="space-y-2">
            {[
              { n: 1, t: NIVEIS[0].titulo, d: "Explore, simule e aprenda com seu progresso salvo.", feito: true },
              { n: 2, t: NIVEIS[1].titulo, d: `${NIVEIS[1].desc}. Libera os aportes.`, feito: false },
              { n: 3, t: NIVEIS[2].titulo, d: `${NIVEIS[2].desc}. Libera todos os limites.`, feito: false },
            ].map((s) => (
              <div key={s.n} className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${s.feito ? "rgba(74,158,106,0.45)" : "rgba(255,255,255,0.1)"}` }}>
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={s.feito ? { background: "#4A9E6A", color: "#fff" } : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                  {s.feito ? <Icon.Check /> : s.n}
                </span>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold">{s.t}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="z-10 px-6 pb-8 pt-2">
          <button onClick={() => { haptic("medium"); onConcluir(cadastro); }}
            className="w-full h-14 rounded-2xl font-bold text-sm transition-all active:scale-95" style={BOTAO_ATIVO}>
            Conhecer o app
          </button>
          <button onClick={onVoltar} className="w-full min-h-11 mt-1 text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
            Continuar explorando
          </button>
        </div>
      </Fundo>
    );
  }

  const p = PASSOS[passo];
  const valor = dados[p.campo];
  const ultimo = passo === PASSOS.length - 1;

  const avancar = () => {
    const e = p.validar(valor);
    setErro(e);
    if (e) return;
    haptic("light");
    if (!ultimo) { setPasso(passo + 1); return; }
    writeJson("fusesc:pre-cadastro", cadastro);
    writeJson("fusesc:user", { nome: cadastro.nome.split(" ")[0] });
    setSegundos(Math.max(1, Math.round((Date.now() - inicio.current) / 1000)));
  };

  const voltar = () => { setErro(""); if (passo === 0) onVoltar(); else setPasso(passo - 1); };

  return (
    <Fundo>
      <div className="z-10 px-6 pt-5 flex items-center justify-between">
        <button onClick={voltar} aria-label={passo === 0 ? "Voltar para explorar" : "Pergunta anterior"}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: "rgba(255,255,255,0.1)" }}>
          <Icon.ChevronLeft />
        </button>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(74,158,106,0.18)", color: "#7DD3A0" }}>
          Pré-cadastro em 30s
        </span>
      </div>

      <form key={p.campo} noValidate className="flex-1 flex flex-col justify-between px-6 pt-8 pb-8 z-10 tab-enter"
        onSubmit={(e) => { e.preventDefault(); avancar(); }}>
        <div>
          <div className="flex gap-1.5 mb-8" role="img" aria-label={`Passo ${passo + 1} de ${PASSOS.length}`}>
            {PASSOS.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full transition-all"
                style={{ background: i <= passo ? "#4A9E6A" : "rgba(255,255,255,0.18)" }} />
            ))}
          </div>
          {meta && passo === 0 && (
            <p className="text-xs mb-3" style={{ color: "#E8B840" }}>Vamos salvar sua meta: {meta.objetivo}</p>
          )}
          <label htmlFor={`pre-${p.campo}`} className="block text-white text-[1.7rem] font-bold leading-tight mb-6">
            {p.pergunta}
          </label>
          <input id={`pre-${p.campo}`} autoFocus type={p.type} inputMode={p.inputMode} autoComplete={p.autoComplete}
            value={valor} placeholder={p.placeholder}
            aria-invalid={!!erro} aria-describedby={`pre-${p.campo}-msg`}
            onChange={(e) => { setErro(""); setDados({ ...dados, [p.campo]: p.mascara ? p.mascara(e.target.value) : e.target.value }); }}
            className="w-full bg-transparent outline-none py-3 text-2xl font-semibold text-white placeholder:text-white/30 transition-colors"
            style={{ borderBottom: `2px solid ${erro ? "#F87171" : valor ? "#4A9E6A" : "rgba(255,255,255,0.25)"}` }} />
          <p id={`pre-${p.campo}-msg`} className="text-xs mt-2 min-h-4 leading-relaxed" role={erro ? "alert" : undefined}
            style={{ color: erro ? "#FCA5A5" : "rgba(255,255,255,0.65)" }}>
            {erro || p.dica || ""}
          </p>
        </div>

        <div>
          {ultimo && (
            <p className="text-xs text-center leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
              Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade da FUSESC.
            </p>
          )}
          <button type="submit" className="w-full h-14 rounded-2xl font-bold text-sm transition-all active:scale-95"
            style={valor ? BOTAO_ATIVO : { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
            {ultimo ? "Concluir pré-cadastro" : "Continuar"}
          </button>
          <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.6)" }}>
            Sem CPF e sem burocracia agora. Só o essencial.
          </p>
        </div>
      </form>
    </Fundo>
  );
}
