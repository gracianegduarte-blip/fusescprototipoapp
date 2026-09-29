import { useEffect, useRef, useState } from "react";
import { Icon, T } from "../shared";
import { fmtCpf } from "../lib/format";
import { readJson, writeJson } from "../lib/storage";
import { AVISO_RENTABILIDADE, RODAPE_LEGAL } from "../lib/regras";
import Sheet from "../components/Sheet";

const Fundo = ({ children }: { children: React.ReactNode }) => (
  <div className="size-full flex flex-col relative overflow-hidden"
    style={{ background: "linear-gradient(160deg, #0D2118 0%, #1A3D28 60%, #0D2118 100%)" }}>
    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
      style={{ background: "radial-gradient(circle, #4A9E6A 0%, transparent 70%)" }} />
    <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
      style={{ background: "radial-gradient(circle, #2A5C40, transparent)", transform: "translate(-30%, 30%)" }} />
    {children}
  </div>
);

function EsqueciSenha({ onClose }: { onClose: () => void }) {
  const theme = T.light;
  const [cpf, setCpf] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [tentou, setTentou] = useState(false);
  const incompleto = cpf.replace(/\D/g, "").length !== 11;

  return (
    <div className="flex flex-col">
      <p className="text-base font-bold mb-1 pr-10" style={{ color: theme.text }}>Recuperar senha</p>
      {enviado ? (
        <>
          <p className="text-sm my-4 leading-relaxed" style={{ color: theme.muted }} role="status">
            Se o CPF estiver cadastrado, enviamos as instruções para o e-mail g•••@email.com. Confira também a caixa de spam.
          </p>
          <button onClick={onClose} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: theme.accent }}>
            Voltar ao login
          </button>
        </>
      ) : (
        <>
          <p className="text-xs mb-4" style={{ color: theme.muted }}>Informe seu CPF e enviaremos um link para criar uma nova senha.</p>
          <label htmlFor="rec-cpf" className="block text-xs font-medium mb-1.5" style={{ color: theme.muted }}>CPF</label>
          <input id="rec-cpf" value={cpf} onChange={(e) => setCpf(fmtCpf(e.target.value))} inputMode="numeric" autoComplete="username"
            placeholder="000.000.000-00" aria-invalid={tentou && incompleto} aria-describedby="rec-cpf-msg"
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none min-h-12 mb-1"
            style={{ background: theme.inputBg, border: `1.5px solid ${tentou && incompleto ? theme.danger : theme.border}`, color: theme.text }} />
          <p id="rec-cpf-msg" className="text-xs mb-4 h-4" role={tentou && incompleto ? "alert" : undefined} style={{ color: theme.danger }}>
            {tentou && incompleto ? "Informe os 11 dígitos do CPF." : ""}
          </p>
          <button onClick={() => { setTentou(true); if (!incompleto) setEnviado(true); }}
            className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: theme.accent }}>
            Enviar instruções
          </button>
        </>
      )}
    </div>
  );
}

export default function LoginPage({ onLogin, onVoltar }: { onLogin: () => void; onVoltar?: () => void }) {
  const salvo = readJson<{ nome: string } | null>("fusesc:user", null);
  const biometriaAtiva = readJson("fusesc:biometria", true);
  const [etapa, setEtapa] = useState<"login" | "biometria">(salvo && biometriaAtiva ? "biometria" : "login");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const entrar = () => {
    setTentou(true);
    if (!cpf || !senha || loading) return;
    setLoading(true);
    timer.current = window.setTimeout(() => {
      writeJson("fusesc:user", { nome: "Graciane" });
      setLoading(false);
      onLogin();
    }, 1200);
  };

  const lerBiometria = () => {
    if (lendo) return;
    setLendo(true);
    timer.current = window.setTimeout(() => { setLendo(false); onLogin(); }, 1300);
  };

  if (etapa === "biometria") {
    return (
      <Fundo>
        <div className="flex-1 flex flex-col items-center justify-center px-8 z-10">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(74,158,106,0.15)", border: "1.5px solid rgba(74,158,106,0.3)", color: "#4A9E6A" }}>
              <Icon.Shield size={38} sw={1.5} />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold mb-2">Olá, {salvo?.nome ?? "de volta"}</h1>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }} aria-live="polite">
                {lendo ? "Verificando…" : <>Use sua impressão digital ou<br />reconhecimento facial para entrar</>}
              </p>
            </div>

            <button onClick={lerBiometria} disabled={lendo} aria-label="Entrar com biometria" aria-busy={lendo}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #2A5C40, #4A9E6A)",
                boxShadow: lendo ? "0 0 0 18px rgba(74,158,106,0.22), 0 8px 32px rgba(42,92,64,0.5)" : "0 0 0 12px rgba(74,158,106,0.12), 0 8px 32px rgba(42,92,64,0.5)",
                transition: "box-shadow 0.3s",
              }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2a7 7 0 00-7 7v1a5 5 0 0014 0V9a7 7 0 00-7-7z" stroke="white" strokeWidth="1.5" />
                <path d="M5 12c0 1.5.4 3 1.1 4.3M8 17.7A7 7 0 0012 19a7 7 0 004-1.3M19 12c0 1.5-.4 3-1.1 4.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 10v4M10 12h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <button onClick={() => setEtapa("login")} disabled={lendo}
              className="min-h-11 px-4 text-sm font-medium underline underline-offset-4" style={{ color: "rgba(255,255,255,0.75)" }}>
              Entrar com CPF e senha
            </button>
          </div>
        </div>
      </Fundo>
    );
  }

  const erroCpf = tentou && !cpf ? "Informe o CPF." : "";
  const erroSenha = tentou && !senha ? "Informe a senha." : "";
  const pronto = !!cpf && !!senha;
  const campo = (erro: string) => ({
    background: "rgba(255,255,255,0.08)",
    border: `1.5px solid ${erro ? "#F87171" : "rgba(255,255,255,0.18)"}`,
  });

  return (
    <Fundo>
      {onVoltar && (
        <button onClick={onVoltar} aria-label="Voltar para explorar"
          className="absolute top-5 left-5 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          <Icon.ChevronLeft />
        </button>
      )}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(rgba(74,158,106,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,106,0.8) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-6 z-10 overflow-y-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2A5C40, #4A9E6A)", boxShadow: "0 8px 24px rgba(42,92,64,0.5)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="white" fillOpacity="0.9" />
              <path d="M9 12l2 2 4-4" stroke="#2A5C40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight tracking-wide">FUSESC</p>
            <p className="text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.65)" }}>PREVIDÊNCIA</p>
          </div>
        </div>

        <div className="relative mb-10" aria-hidden="true">
          <div className="w-40 h-40 rounded-full flex items-center justify-center"
            style={{ background: "radial-gradient(circle at 40% 35%, rgba(74,158,106,0.2), rgba(42,92,64,0.08))", border: "1px solid rgba(74,158,106,0.15)" }}>
            <div className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: "radial-gradient(circle at 40% 35%, rgba(74,158,106,0.25), rgba(42,92,64,0.12))", border: "1px solid rgba(74,158,106,0.2)" }}>
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
                <path d="M32 52V28" stroke="#4A9E6A" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M32 36c0 0-8-4-8-12s8-10 16-6" stroke="#4A9E6A" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M32 42c0 0 8-4 8-12" stroke="#3A7A55" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M20 52h24" stroke="#4A9E6A" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="44" cy="20" r="3" fill="#4A9E6A" fillOpacity="0.6" />
                <circle cx="18" cy="26" r="2" fill="#3A7A55" fillOpacity="0.5" />
              </svg>
            </div>
          </div>
          <div className="absolute -top-2 -right-6 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(74,158,106,0.18)", border: "1px solid rgba(74,158,106,0.35)", color: "#7DD3A0" }}>
            Longo prazo
          </div>
          <div className="absolute -bottom-2 -left-8 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(200,150,42,0.18)", border: "1px solid rgba(200,150,42,0.35)", color: "#E8B840" }}>
            IR regressivo
          </div>
        </div>

        <h1 className="text-white text-2xl font-bold text-center leading-tight mb-2">
          Seu futuro começa<br />com um aporte hoje
        </h1>
        <p className="text-center text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
          Previdência complementar individual<br />para construir patrimônio no longo prazo
        </p>
      </div>

      <form className="z-10 px-6 pb-8 pt-6 flex flex-col gap-3" noValidate
        style={{ background: "linear-gradient(to top, rgba(13,33,24,0.98) 80%, transparent)" }}
        onSubmit={(e) => { e.preventDefault(); entrar(); }}>
        <div>
          <label htmlFor="login-cpf" className="text-xs font-semibold mb-2 block tracking-wide" style={{ color: "rgba(255,255,255,0.75)" }}>CPF</label>
          <div className="flex items-center gap-3 px-4 rounded-2xl h-14" style={campo(erroCpf)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <input id="login-cpf" value={cpf} onChange={(e) => setCpf(fmtCpf(e.target.value))} placeholder="000.000.000-00"
              className="flex-1 min-w-0 bg-transparent text-sm outline-none text-white placeholder:text-white/40"
              inputMode="numeric" autoComplete="username" aria-invalid={!!erroCpf} aria-describedby="login-cpf-msg" />
          </div>
          <p id="login-cpf-msg" className="text-xs mt-1 h-4" role={erroCpf ? "alert" : undefined} style={{ color: "#FCA5A5" }}>{erroCpf}</p>
        </div>

        <div>
          <label htmlFor="login-senha" className="text-xs font-semibold mb-2 block tracking-wide" style={{ color: "rgba(255,255,255,0.75)" }}>SENHA</label>
          <div className="flex items-center gap-3 pl-4 pr-1 rounded-2xl h-14" style={campo(erroSenha)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <input id="login-senha" value={senha} onChange={(e) => setSenha(e.target.value)} type={showSenha ? "text" : "password"}
              placeholder="••••••••" autoComplete="current-password" aria-invalid={!!erroSenha} aria-describedby="login-senha-msg"
              className="flex-1 min-w-0 bg-transparent text-sm outline-none text-white placeholder:text-white/40" />
            <button type="button" onClick={() => setShowSenha(!showSenha)} aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showSenha}
              className="w-11 h-11 flex items-center justify-center" style={{ color: "rgba(255,255,255,0.7)" }}>
              {showSenha ? <Icon.EyeOff size={17} /> : <Icon.Eye size={17} />}
            </button>
          </div>
          <p id="login-senha-msg" className="text-xs mt-1 h-4" role={erroSenha ? "alert" : undefined} style={{ color: "#FCA5A5" }}>{erroSenha}</p>
        </div>

        <div className="flex items-center justify-between -mt-1">
          {salvo && biometriaAtiva ? (
            <button type="button" onClick={() => setEtapa("biometria")} className="min-h-11 pr-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
              Usar biometria
            </button>
          ) : <span />}
          <button type="button" onClick={() => setRecuperar(true)} className="min-h-11 pl-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
            Esqueci minha senha
          </button>
        </div>

        <button type="submit" aria-busy={loading}
          className="w-full h-14 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: pronto ? "linear-gradient(135deg, #2A5C40, #4A9E6A)" : "rgba(255,255,255,0.12)",
            color: pronto ? "#fff" : "rgba(255,255,255,0.7)",
            boxShadow: pronto ? "0 8px 32px rgba(42,92,64,0.5)" : "none",
          }}>
          {loading ? (
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-label="Entrando">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3" />
              <path d="M12 3a9 9 0 019 9" strokeLinecap="round" />
            </svg>
          ) : "Entrar na conta"}
        </button>

        <p className="text-center text-xs leading-relaxed mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          {AVISO_RENTABILIDADE}<br />
          {RODAPE_LEGAL}
        </p>
      </form>

      {recuperar && (
        <Sheet theme={T.light} label="Recuperar senha" onClose={() => setRecuperar(false)}>
          <EsqueciSenha onClose={() => setRecuperar(false)} />
        </Sheet>
      )}
    </Fundo>
  );
}
