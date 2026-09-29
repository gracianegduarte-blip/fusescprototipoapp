import { useEffect, useRef, useState } from "react";
import { Icon, type Theme, type ToastMsg } from "../shared";
import { digitsToCents, fmtCep, fmtMoneyCents, onlyDigits } from "../lib/format";

type CepStatus = "idle" | "buscando" | "ok" | "nao-encontrado" | "erro";

function Field({ theme, id, label, value, onChange, placeholder, inputMode, erro, autoComplete, hint }: {
  theme: Theme; id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string;
  inputMode?: "numeric" | "text"; erro?: string; autoComplete?: string; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1.5" style={{ color: theme.muted }}>{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        inputMode={inputMode} autoComplete={autoComplete} aria-invalid={!!erro} aria-describedby={`${id}-msg`}
        className="w-full px-4 py-3 rounded-2xl text-sm outline-none min-h-12"
        style={{ background: theme.inputBg, border: `1.5px solid ${erro ? theme.danger : theme.border}`, color: theme.text }} />
      <p id={`${id}-msg`} className="text-xs mt-1" role={erro ? "alert" : undefined}
        style={{ color: erro ? theme.danger : theme.muted }}>
        {erro || hint || ""}
      </p>
    </div>
  );
}

function DocUpload({ theme, label, file, onFile, erro }: {
  theme: Theme; label: string; file: string; onFile: (name: string) => void; erro: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const done = !!file;
  return (
    <div>
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" tabIndex={-1}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f.name); }} />
      <button type="button" onClick={() => ref.current?.click()}
        className="w-full flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed transition-all"
        style={{ borderColor: done ? theme.accent : erro ? theme.danger : theme.border, background: done ? theme.tagBg : theme.inputBg }}>
        <span style={{ color: done ? theme.accent : erro ? theme.danger : theme.muted }}>
          {done ? <Icon.CheckCircle size={22} /> : <Icon.Doc size={22} />}
        </span>
        <span className="text-xs font-semibold" style={{ color: done ? theme.accent : erro ? theme.danger : theme.muted }}>
          {done ? "Enviado" : `Enviar ${label}`}
        </span>
        {done && <span className="text-xs px-2 truncate max-w-full" style={{ color: theme.muted }}>{file}</span>}
      </button>
    </div>
  );
}

function SimNao({ theme, label, desc, value, onChange, erro }: {
  theme: Theme; label: string; desc: string; value: "nao" | "sim" | null; onChange: (v: "nao" | "sim") => void; erro: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>{label}</p>
      <p className="text-xs mb-3 leading-relaxed" style={{ color: theme.muted }}>{desc}</p>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2">
        {(["nao", "sim"] as const).map((v) => (
          <button key={v} role="radio" aria-checked={value === v} onClick={() => onChange(v)}
            className="min-h-12 py-3 rounded-2xl text-sm font-bold transition-all"
            style={{
              background: value === v ? theme.accent : theme.tagBg, color: value === v ? "#fff" : theme.text,
              outline: erro ? `2px solid ${theme.danger}` : "none",
            }}>
            {v === "nao" ? "Não" : "Sim"}
          </button>
        ))}
      </div>
    </div>
  );
}

function Faltas({ theme, itens }: { theme: Theme; itens: string[] }) {
  if (itens.length === 0) return null;
  return (
    <p role="alert" className="text-xs rounded-xl px-3 py-2.5"
      style={{ background: theme.dangerBg, color: theme.danger, border: `1px solid ${theme.dangerBorder}` }}>
      Falta preencher: {itens.join(", ")}.
    </p>
  );
}

function Voltar({ theme, onClick }: { theme: Theme; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Voltar" className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ color: theme.text }}>
      <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: theme.tagBg }}>
        <Icon.ChevronLeft size={14} />
      </span>
    </button>
  );
}

export default function NivelSheet({ theme, nivel, onNivelChange, onClose, showToast }: {
  theme: Theme; nivel: 1 | 2; onNivelChange: (n: 1 | 2) => void; onClose: () => void;
  showToast: (text: string, type?: ToastMsg["type"]) => void;
}) {
  const [step, setStep] = useState<"menu" | "n1" | "n2">("menu");
  const [tentou, setTentou] = useState(false);

  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");
  const [docFront, setDocFront] = useState("");
  const [docBack, setDocBack] = useState("");

  const [pep, setPep] = useState<"nao" | "sim" | null>(null);
  const [fatca, setFatca] = useState<"nao" | "sim" | null>(null);
  const [rendaCents, setRendaCents] = useState(0);
  const [docRenda, setDocRenda] = useState("");

  useEffect(() => {
    const d = onlyDigits(cep);
    if (d.length !== 8) { setCepStatus("idle"); return; }
    const ctrl = new AbortController();
    setCepStatus("buscando");
    fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j: { erro?: boolean; logradouro?: string; localidade?: string; uf?: string }) => {
        if (j.erro) { setCepStatus("nao-encontrado"); return; }
        setRua(j.logradouro || "");
        setCidade(j.localidade ? `${j.localidade} / ${j.uf}` : "");
        setCepStatus("ok");
      })
      .catch((e: Error) => { if (e.name !== "AbortError") setCepStatus("erro"); });
    return () => ctrl.abort();
  }, [cep]);

  const goto = (s: "menu" | "n1" | "n2") => { setTentou(false); setStep(s); };

  // ── Nível 1 ────────────────────────────────────────────────────────────────
  if (step === "n1") {
    const erroCep = onlyDigits(cep).length !== 8 ? "Informe os 8 dígitos do CEP." : cepStatus === "nao-encontrado" ? "CEP não encontrado." : "";
    const faltas = [
      erroCep && "CEP", !rua.trim() && "logradouro", !numero.trim() && "número", !cidade.trim() && "cidade / UF",
      !docFront && "frente do documento", !docBack && "verso do documento",
    ].filter(Boolean) as string[];

    const confirmar = () => {
      if (faltas.length) { setTentou(true); return; }
      onNivelChange(1);
      goto("menu");
      showToast("Nível 1 confirmado");
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 pr-10">
          <Voltar theme={theme} onClick={() => goto("menu")} />
          <div>
            <p className="text-base font-bold" style={{ color: theme.text }}>Nível 1 — Endereço & Documento</p>
            <p className="text-xs" style={{ color: theme.muted }}>Preencha para confirmar sua identidade</p>
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>Endereço residencial</p>
        <Field theme={theme} id="n1-cep" label="CEP" value={cep} onChange={(v) => setCep(fmtCep(v))} placeholder="00000-000"
          inputMode="numeric" autoComplete="postal-code"
          erro={tentou ? erroCep : cepStatus === "nao-encontrado" ? "CEP não encontrado." : ""}
          hint={cepStatus === "buscando" ? "Buscando endereço…" : cepStatus === "ok" ? "Endereço preenchido pelo CEP." : cepStatus === "erro" ? "Não foi possível buscar o CEP. Preencha o endereço manualmente." : "Digite o CEP e preenchemos o endereço para você."} />
        <Field theme={theme} id="n1-rua" label="Logradouro" value={rua} onChange={setRua} placeholder="Rua, Av., Travessa..."
          autoComplete="address-line1" erro={tentou && !rua.trim() ? "Informe o logradouro." : ""} />
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <Field theme={theme} id="n1-num" label="Número" value={numero} onChange={setNumero} placeholder="123" inputMode="numeric"
            autoComplete="address-line2" erro={tentou && !numero.trim() ? "Obrigatório." : ""} />
          <Field theme={theme} id="n1-cid" label="Cidade / UF" value={cidade} onChange={setCidade} placeholder="Florianópolis / SC"
            autoComplete="address-level2" erro={tentou && !cidade.trim() ? "Informe a cidade." : ""} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>Documento com foto (RG ou CNH)</p>
        <div className="grid grid-cols-2 gap-3">
          <DocUpload theme={theme} label="Frente" file={docFront} onFile={setDocFront} erro={tentou && !docFront} />
          <DocUpload theme={theme} label="Verso" file={docBack} onFile={setDocBack} erro={tentou && !docBack} />
        </div>
        {tentou && <Faltas theme={theme} itens={faltas} />}
        <button onClick={confirmar}
          className="w-full min-h-12 py-4 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg,${theme.accent},${theme.accentMid})` }}>
          Confirmar Nível 1
        </button>
      </div>
    );
  }

  // ── Nível 2 ────────────────────────────────────────────────────────────────
  if (step === "n2") {
    const faltas = [!pep && "declaração PEP", !fatca && "declaração FATCA", rendaCents < 100 && "renda mensal", !docRenda && "comprovante de renda"].filter(Boolean) as string[];

    const confirmar = () => {
      if (faltas.length) { setTentou(true); return; }
      onNivelChange(2);
      showToast("Nível 2 confirmado");
      onClose();
    };

    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 pr-10">
          <Voltar theme={theme} onClick={() => goto("menu")} />
          <div>
            <p className="text-base font-bold" style={{ color: theme.text }}>Nível 2 — Conformidade & Renda</p>
            <p className="text-xs" style={{ color: theme.muted }}>Declarações obrigatórias por regulação</p>
          </div>
        </div>
        <SimNao theme={theme} label="Você é uma Pessoa Politicamente Exposta (PEP)?"
          desc="Cargo público eletivo, dirigente de partido, alto funcionário de governo ou familiar direto."
          value={pep} onChange={setPep} erro={tentou && !pep} />
        <SimNao theme={theme} label="Possui vínculo fiscal com os EUA? (FATCA)"
          desc="Cidadania, residência, green card ou conta bancária nos Estados Unidos."
          value={fatca} onChange={setFatca} erro={tentou && !fatca} />
        <Field theme={theme} id="n2-renda" label="Renda mensal bruta (R$)" value={rendaCents ? fmtMoneyCents(rendaCents) : ""}
          onChange={(v) => setRendaCents(digitsToCents(v, 100000000))} placeholder="Ex: 8.500,00" inputMode="numeric"
          erro={tentou && rendaCents < 100 ? "Informe sua renda mensal." : ""} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.muted }}>Comprovante de renda</p>
          <DocUpload theme={theme} label="comprovante" file={docRenda} onFile={setDocRenda} erro={tentou && !docRenda} />
        </div>
        {tentou && <Faltas theme={theme} itens={faltas} />}
        <button onClick={confirmar}
          className="w-full min-h-12 py-4 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg,${theme.accent},${theme.accentMid})` }}>
          Confirmar Nível 2
        </button>
      </div>
    );
  }

  // ── menu ───────────────────────────────────────────────────────────────────
  const niveis = [
    { n: "Nível 1", desc: "Endereço & Documento com foto", done: nivel >= 1, step: "n1" as const,
      items: ["Endereço residencial", "RG ou CNH (frente e verso)"] },
    { n: "Nível 2", desc: "Conformidade & Renda", done: nivel >= 2, step: "n2" as const,
      items: ["Declaração PEP", "Declaração FATCA", "Comprovante de renda"] },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="pr-10">
        <p className="text-base font-bold" style={{ color: theme.text }}>Evolução do Nível de Conta</p>
        <p className="text-xs" style={{ color: theme.muted }}>Complete para desbloquear mais limites</p>
      </div>

      <div>
        <div className="flex items-center gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={2} aria-valuenow={nivel}
          aria-label="Níveis concluídos">
          {[1, 2].map((i) => (
            <div key={i} className="flex-1 h-2 rounded-full" style={{ background: nivel >= i ? theme.accent : theme.border }} />
          ))}
        </div>
        <p className="text-xs text-center mt-2" style={{ color: theme.muted }}>Nível {nivel} de 2 concluído</p>
      </div>

      {niveis.map((lv) => (
        <div key={lv.n} className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${lv.done ? theme.accent + "55" : theme.border}` }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ background: lv.done ? theme.tagBg : theme.inputBg }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs"
                style={{ background: lv.done ? theme.accent : theme.border }}>
                {lv.done ? <Icon.Check size={14} sw={3} /> : <span style={{ color: theme.muted }}>2</span>}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: lv.done ? theme.accentText : theme.text }}>{lv.n}</p>
                <p className="text-xs" style={{ color: theme.muted }}>{lv.desc}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: lv.done ? theme.positiveBg : theme.warningBg, color: lv.done ? theme.positive : theme.warning }}>
              {lv.done ? "Concluído" : "Pendente"}
            </span>
          </div>
          <div className="px-4 py-3" style={{ background: theme.surface }}>
            <ul className="space-y-1.5 mb-3">
              {lv.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs" style={{ color: theme.muted }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: lv.done ? theme.accent : theme.border }} />
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={() => goto(lv.step)}
              className="w-full min-h-11 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{ background: lv.done ? theme.tagBg : `linear-gradient(135deg,${theme.accent},${theme.accentMid})`, color: lv.done ? theme.accentText : "#fff" }}>
              {lv.done ? "Revisar dados" : "Preencher agora"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
