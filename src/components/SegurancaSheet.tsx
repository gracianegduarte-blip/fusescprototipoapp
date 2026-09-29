import { useState } from "react";
import { Icon, Toggle, type Theme, type ToastMsg } from "../shared";
import { usePersisted } from "../lib/storage";

export default function SegurancaSheet({ theme, onClose, showToast }: {
  theme: Theme; onClose: () => void; showToast: (text: string, type?: ToastMsg["type"]) => void;
}) {
  const [biometria, setBiometria] = usePersisted("fusesc:biometria", true);
  const [bioAporte, setBioAporte] = usePersisted("fusesc:bio-aporte", false);
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [conf, setConf] = useState("");
  const [tentou, setTentou] = useState(false);

  const erros = {
    atual: atual.length < 1 ? "Informe a senha atual." : "",
    nova: nova.length < 8 ? "Use pelo menos 8 caracteres." : !/[A-Za-z]/.test(nova) || !/\d/.test(nova) ? "Inclua letras e números." : "",
    conf: conf !== nova ? "As senhas não conferem." : "",
  };
  const ok = !erros.atual && !erros.nova && !erros.conf;

  const salvar = () => {
    setTentou(true);
    if (!ok) return;
    setAtual(""); setNova(""); setConf(""); setTentou(false);
    showToast("Senha alterada com sucesso");
  };

  const campo = (id: string, label: string, value: string, set: (v: string) => void, erro: string, auto: string) => (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1.5" style={{ color: theme.muted }}>{label}</label>
      <input id={id} type="password" value={value} onChange={(e) => set(e.target.value)} autoComplete={auto}
        aria-invalid={tentou && !!erro} aria-describedby={`${id}-msg`}
        className="w-full px-4 py-3 rounded-2xl text-sm outline-none min-h-12"
        style={{ background: theme.inputBg, border: `1.5px solid ${tentou && erro ? theme.danger : theme.border}`, color: theme.text }} />
      {tentou && erro && <p id={`${id}-msg`} role="alert" className="text-xs mt-1" style={{ color: theme.danger }}>{erro}</p>}
    </div>
  );

  return (
    <div className="flex flex-col">
      <p className="text-base font-bold mb-1 pr-10" style={{ color: theme.text }}>Segurança</p>
      <p className="text-xs mb-5" style={{ color: theme.muted }}>Proteja o acesso à sua conta.</p>

      <div className="space-y-2 mb-6">
        {[
          { label: "Entrar com biometria", desc: "Use digital ou rosto no lugar da senha neste aparelho", on: biometria, set: setBiometria },
          { label: "Confirmar aportes com biometria", desc: "Peça autenticação antes de concluir cada aporte", on: bioAporte, set: setBioAporte },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-2xl px-4 py-3.5"
            style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
            <div className="mr-3">
              <p className="text-sm font-medium" style={{ color: theme.text }}>{r.label}</p>
              <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{r.desc}</p>
            </div>
            <Toggle on={r.on} onToggle={() => r.set(!r.on)} accent={theme.accent} off={theme.switchOff} label={r.label} />
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold tracking-wide uppercase mb-3 flex items-center gap-1.5" style={{ color: theme.muted }}>
        <Icon.Key size={14} /> Alterar senha
      </p>
      <div className="space-y-3 mb-5">
        {campo("sg-atual", "Senha atual", atual, setAtual, erros.atual, "current-password")}
        {campo("sg-nova", "Nova senha", nova, setNova, erros.nova, "new-password")}
        {campo("sg-conf", "Confirmar nova senha", conf, setConf, erros.conf, "new-password")}
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background: theme.inputBg, color: theme.text }}>
          Fechar
        </button>
        <button onClick={salvar} className="flex-1 min-h-12 py-3.5 rounded-2xl text-white text-sm font-bold"
          style={{ background: theme.accent }}>
          Salvar nova senha
        </button>
      </div>
    </div>
  );
}
