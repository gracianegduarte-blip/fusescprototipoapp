import { HOJE, Icon, MASK, brl, type Conta, type Theme, type ToastMsg, corConta } from "../shared";
import { esc, printHtml } from "../lib/format";
import { FUSESC, PLANO_LABEL } from "../lib/regras";

const ANOS = [2025, 2024, 2023];

export default function InformeSheet({ theme, conta, hidden, onClose, showToast }: {
  theme: Theme; conta: Conta; hidden: boolean; onClose: () => void;
  showToast: (text: string, type?: ToastMsg["type"]) => void;
}) {
  const cor = corConta(conta);

  const dados = (ano: number) => {
    const idx = 2026 - ano;
    const saldoFim = Math.round(conta.saldo * Math.pow(0.86, idx));
    const contribuicoes = conta.aporteMensal * 12 + (idx === 1 ? 2000 : 0);
    const rendimentos = Math.round(saldoFim * (conta.rendimento12m / 100) * 0.8);
    return { saldoFim, contribuicoes, rendimentos };
  };

  const baixar = (ano: number) => {
    const d = dados(ano);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Informe de rendimentos ${ano} — ${esc(conta.nome)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Inter, Arial, sans-serif; color: #1A2A1E; padding: 40px; }
        h1 { font-size: 20px; margin-bottom: 4px; } .sub { color: #5B7062; font-size: 12px; margin-bottom: 28px; }
        .box { border: 1px solid #E2EDE5; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F0F8F3; font-size: 14px; }
        .row:last-child { border-bottom: 0; } .row b { font-weight: 700; }
        .note { font-size: 11px; color: #5B7062; margin-top: 24px; line-height: 1.5; }
      </style></head><body>
      <h1>Informe de rendimentos — ano-base ${ano}</h1>
      <p class="sub">${esc(conta.nome)} · ${PLANO_LABEL} · Emitido em ${HOJE}</p>
      <div class="box">
        <div class="row"><span>Saldo em 31/12/${ano}</span><b>${brl(d.saldoFim)}</b></div>
        <div class="row"><span>Contribuições no ano</span><b>${brl(d.contribuicoes)}</b></div>
        <div class="row"><span>Rendimentos no ano</span><b>${brl(d.rendimentos)}</b></div>
      </div>
      <p class="note">Documento para uso na Declaração de Imposto de Renda. ${FUSESC.nome} — CNPJ ${FUSESC.cnpj}.</p>
      <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`;
    if (!printHtml(html)) showToast("Permita pop-ups neste site para baixar o informe", "error");
  };

  return (
    <div className="flex flex-col">
      <p className="text-base font-bold mb-1 pr-10" style={{ color: theme.text }}>Informe de rendimentos</p>
      <p className="text-xs mb-5" style={{ color: theme.muted }}>
        Para a declaração do Imposto de Renda · {conta.nome}
      </p>

      <div className="space-y-3 mb-5">
        {ANOS.map((ano) => {
          const d = dados(ano);
          return (
            <div key={ano} className="rounded-2xl p-4" style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: cor }}>
                    <Icon.Doc />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: theme.text }}>Ano-base {ano}</p>
                    <p className="text-xs" style={{ color: theme.muted }}>Disponível desde jan/{ano + 1}</p>
                  </div>
                </div>
                <button onClick={() => baixar(ano)} aria-label={`Baixar informe ${ano}`}
                  className="min-h-11 flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold"
                  style={{ background: theme.tagBg, color: theme.accentText }}>
                  <Icon.Download size={14} /> PDF
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  ["Saldo em 31/12", d.saldoFim],
                  ["Contribuições", d.contribuicoes],
                  ["Rendimentos", d.rendimentos],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <p style={{ color: theme.muted }}>{k}</p>
                    <p className="font-semibold mt-0.5" style={{ color: theme.text }}>{hidden ? MASK : brl(v as number)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onClose} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-semibold"
        style={{ background: theme.inputBg, color: theme.text }}>
        Fechar
      </button>
    </div>
  );
}
