import { useState, type ReactNode } from "react";
import { Icon, haptic, type Theme } from "../shared";
import type { MetaRascunho, QuizId } from "../lib/explorar";
import { AVISO_RENTABILIDADE, FUSESC, RODAPE_LEGAL } from "../lib/regras";
import Sheet from "../components/Sheet";
import TrilhasSheet from "../components/TrilhasSheet";
import MetasSheet from "../components/MetasSheet";
import PlanosSheet from "../components/PlanosSheet";
import QuizSheet from "../components/QuizSheet";
import Chat from "./Chat";

type Painel = "trilhas" | "metas" | "planos" | QuizId | null;

const TITULO_PAINEL: Record<Exclude<Painel, null>, string> = {
  trilhas: "Jornadas de conhecimento",
  metas: "Simulador de metas",
  planos: "Nossos planos",
  plano: "Qual plano combina com você?",
  perfil: "Perfil de investidor",
};

export default function ExplorarPage({ theme, dark, onToggleTema, onEntrar, onCadastro, onDemo }: {
  theme: Theme;
  dark: boolean;
  onToggleTema: () => void;
  onEntrar: () => void;
  onCadastro: (meta?: MetaRascunho) => void;
  onDemo: () => void;
}) {
  const [painel, setPainel] = useState<Painel>(null);
  const [chat, setChat] = useState(false);

  const abrir = (p: Painel) => { haptic("light"); setPainel(p); };
  const cadastro = (meta?: MetaRascunho) => { setPainel(null); setChat(false); onCadastro(meta); };

  return (
    <div className="size-full flex flex-col relative overflow-hidden" style={{ background: theme.bg, color: theme.text }}>
      <main className="flex-1 overflow-y-auto">
        {/* hero */}
        <section className="relative overflow-hidden px-5 pt-6 pb-8 rounded-b-[2rem]"
          style={{ background: "linear-gradient(160deg, #0D2118 0%, #1A3D28 60%, #0D2118 100%)" }}>
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10" aria-hidden="true"
            style={{ background: "radial-gradient(circle, #4A9E6A 0%, transparent 70%)" }} />

          <header className="relative flex items-center justify-between gap-2 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2A5C40, #4A9E6A)", boxShadow: "0 6px 20px rgba(42,92,64,0.5)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="white" fillOpacity="0.9" />
                  <path d="M9 12l2 2 4-4" stroke="#2A5C40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight tracking-wide">FUSESC</p>
                <p className="text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.65)" }}>PREVIDÊNCIA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onToggleTema} aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: "rgba(255,255,255,0.1)" }}>
                {dark ? <Icon.Sun /> : <Icon.Moon />}
              </button>
              <button onClick={onEntrar} className="min-h-11 px-4 rounded-full text-sm font-semibold text-white flex items-center gap-1.5"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <Icon.User size={16} /> Entrar
              </button>
            </div>
          </header>

          <h1 className="relative text-white text-[1.75rem] font-bold leading-tight">
            Explore sem cadastro.<br />
            <span style={{ color: "#7DD3A0" }}>Aprenda no seu tempo.</span>
          </h1>
          <p className="relative text-sm leading-relaxed mt-2" style={{ color: "rgba(255,255,255,0.75)" }}>
            Trilhas rápidas, simulador de metas e um assistente para tirar dúvidas, antes mesmo de abrir sua conta.
          </p>
        </section>

        {/* pilares */}
        <section className="px-4 pt-5 space-y-3" aria-label="O que você pode explorar">
          <Pilar theme={theme} cor="#2A5C40" selo="Grátis" icon={<Icon.Doc size={24} />}
            titulo="Jornadas de conhecimento" desc="Finanças, previdência e proteção familiar em lições curtas."
            onClick={() => abrir("trilhas")} />
          <Pilar theme={theme} cor="#C8962A" selo="Interativo" icon={<Icon.Target size={24} />}
            titulo="Simulador de metas" desc="Descubra quanto poupar por mês para chegar ao seu objetivo."
            onClick={() => abrir("metas")} />
          <Pilar theme={theme} cor="#1A6A8A" selo="Ao vivo" icon={<Icon.Headset size={24} />}
            titulo="Assistente FUSESC" desc="Dúvidas sobre IR, benefícios e resgates, ou fale com uma pessoa."
            onClick={() => { haptic("light"); setChat(true); }} />

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Mini theme={theme} icon={<Icon.Wallet size={18} />} titulo="Nossos planos" desc="Futuro, Bem-Estar, Pais e Filhos" onClick={() => abrir("planos")} />
            <Mini theme={theme} icon={<Icon.Star size={18} />} titulo="Qual plano combina?" desc="Quiz em 3 perguntas" onClick={() => abrir("plano")} />
            <Mini theme={theme} icon={<Icon.Pie size={18} />} titulo="Perfil de investidor" desc="Quiz em 4 perguntas" onClick={() => abrir("perfil")} />
            <Mini theme={theme} icon={<Icon.Monitor />} titulo="Experimente o app" desc="Conta de demonstração" onClick={onDemo} />
          </div>
        </section>

        <p className="text-center text-xs leading-relaxed px-6 pt-6 pb-4" style={{ color: theme.muted }}>
          {AVISO_RENTABILIDADE}<br />
          {RODAPE_LEGAL}<br />
          Central de Atendimento {FUSESC.telefone} · {FUSESC.email}
        </p>
      </main>

      {/* CTA fixo */}
      <div className="flex-shrink-0 px-5 pt-3 pb-5" style={{ background: theme.navBg, borderTop: `1px solid ${theme.border}`, boxShadow: theme.navShadow }}>
        <button onClick={() => cadastro()}
          className="w-full h-14 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #2A5C40, #4A9E6A)", boxShadow: "0 8px 24px rgba(42,92,64,0.35)" }}>
          Abrir minha conta em 30s <Icon.ChevronRight />
        </button>
        <button onClick={onEntrar} className="w-full min-h-11 text-sm font-medium mt-1" style={{ color: theme.muted }}>
          Já sou cliente
        </button>
      </div>

      {painel && (
        <Sheet theme={theme} label={TITULO_PAINEL[painel]} onClose={() => setPainel(null)}>
          {painel === "trilhas" && <TrilhasSheet theme={theme} onSignup={() => cadastro()} />}
          {painel === "metas" && <MetasSheet theme={theme} onSignup={cadastro} />}
          {painel === "planos" && <PlanosSheet theme={theme} onSignup={() => cadastro()} />}
          {(painel === "plano" || painel === "perfil") && <QuizSheet key={painel} theme={theme} quizId={painel} onSignup={() => cadastro()} />}
        </Sheet>
      )}

      {chat && <Chat theme={theme} onClose={() => setChat(false)} />}
    </div>
  );
}

function Pilar({ theme, cor, selo, icon, titulo, desc, onClick }: {
  theme: Theme; cor: string; selo: string; icon: ReactNode; titulo: string; desc: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full rounded-2xl overflow-hidden text-left transition-all active:scale-[0.98]"
      style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
      <div className="h-24 relative flex items-end p-4" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}99)` }}>
        <svg className="absolute right-0 top-0 h-full opacity-20" viewBox="0 0 120 96" fill="none" aria-hidden="true">
          <circle cx="100" cy="10" r="48" stroke="white" strokeWidth="1.5" />
          <circle cx="100" cy="10" r="30" stroke="white" strokeWidth="1.5" />
        </svg>
        <span className="absolute top-3 right-3 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
          style={{ background: "rgba(255,255,255,0.22)" }}>
          {selo}
        </span>
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: theme.surface, color: cor }}>
          {icon}
        </span>
      </div>
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: theme.text }}>{titulo}</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: theme.muted }}>{desc}</p>
        </div>
        <span className="mt-0.5" style={{ color: theme.muted }}><Icon.ChevronRight /></span>
      </div>
    </button>
  );
}

function Mini({ theme, icon, titulo, desc, onClick }: {
  theme: Theme; icon: ReactNode; titulo: string; desc: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="rounded-2xl p-3 min-h-16 text-left flex items-start gap-2.5 transition-all active:scale-[0.97]"
      style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
      <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: theme.accentTag, color: theme.accentText }}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold leading-tight" style={{ color: theme.text }}>{titulo}</span>
        <span className="block text-xs mt-0.5" style={{ color: theme.muted }}>{desc}</span>
      </span>
    </button>
  );
}
