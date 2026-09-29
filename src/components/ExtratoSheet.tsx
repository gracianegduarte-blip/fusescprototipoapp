import { useState } from "react";
import { Icon, MASK, HOJE, brl, type Conta, type Theme, type ToastMsg, corConta } from "../shared";
import { copyText, esc, printHtml } from "../lib/format";
import { FUSESC, PLANO_LABEL } from "../lib/regras";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago"];

type Mov = { data: string; mes: number; desc: string; tipo: "E" | "R"; v: number };

export default function ExtratoSheet({ theme, conta, hidden, onClose, showToast }: {
  theme: Theme; conta: Conta; hidden: boolean; onClose: () => void;
  showToast: (text: string, type?: ToastMsg["type"]) => void;
}) {
  const cor = corConta(conta);
  const [mesSel, setMesSel] = useState<number | null>(null);

  const movimentos: Mov[] = [
    { data: "28/08/2026", mes: 7, desc: "Aporte avulso",     tipo: "E", v: 2000 },
    { data: "01/08/2026", mes: 7, desc: "Aporte recorrente", tipo: "E", v: conta.aporteMensal },
    { data: "01/08/2026", mes: 7, desc: "Rendimento do mês", tipo: "R", v: Math.round(conta.saldo * 0.012) },
    { data: "01/07/2026", mes: 6, desc: "Aporte recorrente", tipo: "E", v: conta.aporteMensal },
    { data: "01/07/2026", mes: 6, desc: "Rendimento do mês", tipo: "R", v: Math.round(conta.saldo * 0.011) },
    { data: "01/06/2026", mes: 5, desc: "Aporte recorrente", tipo: "E", v: conta.aporteMensal },
    { data: "01/06/2026", mes: 5, desc: "Rendimento do mês", tipo: "R", v: Math.round(conta.saldo * 0.010) },
  ];
  const visiveis = mesSel === null ? movimentos : movimentos.filter((m) => m.mes === mesSel);

  const handleShare = async () => {
    const text = hidden ? `Extrato de ${conta.nome}` : `Extrato de ${conta.nome} — saldo ${brl(conta.saldo)}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Extrato Previdência", text }); } catch { /* cancelado */ }
      return;
    }
    const ok = await copyText(text);
    showToast(ok ? "Resumo do extrato copiado" : "Não foi possível compartilhar neste navegador", ok ? "success" : "error");
  };

  const handleDownload = () => {
    const rows = visiveis.map((m) => `
      <tr>
        <td>${m.data}</td>
        <td>${esc(m.desc)}</td>
        <td style="text-align:center;color:${m.tipo === "E" ? "#2A5C40" : "#8A5A00"};font-weight:600">${m.tipo === "E" ? "Entrada" : "Rendimento"}</td>
        <td style="text-align:right;font-weight:600">${brl(m.v)}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Extrato — ${esc(conta.nome)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Inter, sans-serif; color: #1A2A1E; background: #fff; padding: 40px; }
        .header { background: linear-gradient(135deg, ${cor}, ${cor}CC); color: #fff; border-radius: 16px; padding: 28px 32px; margin-bottom: 32px; }
        .header .label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.85; margin-bottom: 4px; }
        .header h1 { font-size: 20px; font-weight: 700; margin-bottom: 20px; }
        .header .row { display: flex; justify-content: space-between; }
        .header .col .sub { font-size: 10px; opacity: 0.8; margin-bottom: 2px; }
        .header .col .val { font-size: 22px; font-weight: 700; }
        .header .col .val-sm { font-size: 14px; font-weight: 600; }
        .section-title { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #5B7062; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        th { font-size: 11px; font-weight: 600; color: #5B7062; text-align: left; padding: 0 12px 10px; border-bottom: 2px solid #E2EDE5; }
        td { font-size: 13px; padding: 12px; border-bottom: 1px solid #F0F8F3; }
        .footer { font-size: 10px; color: #5B7062; text-align: center; margin-top: 24px; border-top: 1px solid #E2EDE5; padding-top: 16px; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>
      <div class="header">
        <div class="label">Extrato de Previdência Complementar</div>
        <h1>${esc(conta.nome)}</h1>
        <div class="row">
          <div class="col"><div class="sub">Saldo atual</div><div class="val">${brl(conta.saldo)}</div></div>
          <div class="col" style="text-align:right"><div class="sub">Emissão</div><div class="val-sm">${HOJE}</div></div>
        </div>
      </div>
      <div class="section-title">Movimentações${mesSel !== null ? ` — ${MESES[mesSel]}/2026` : ""}</div>
      <table>
        <thead><tr><th>Data</th><th>Descrição</th><th style="text-align:center">Tipo</th><th style="text-align:right">Valor</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">${FUSESC.nome} &nbsp;|&nbsp; CNPJ ${FUSESC.cnpj} &nbsp;|&nbsp; Documento gerado em ${HOJE}</div>
      <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`;
    if (!printHtml(html)) showToast("Permita pop-ups neste site para baixar o PDF", "error");
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4 pr-10">
        <p className="text-base font-bold" style={{ color: theme.text }}>Extrato</p>
        <p className="text-xs" style={{ color: theme.muted }}>{conta.nome}</p>
      </div>
      <div className="flex gap-2 mb-5">
        <button onClick={handleShare}
          className="flex-1 min-h-11 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: theme.tagBg, color: theme.accentText }}>
          <Icon.Share size={14} />
          Compartilhar
        </button>
        <button onClick={handleDownload}
          className="flex-1 min-h-11 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: theme.accent, color: "#fff" }}>
          <Icon.Download size={14} />
          Baixar PDF
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: `1px solid ${theme.border}` }}>
        <div className="px-5 py-4 text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}CC)` }}>
          <p className="text-xs text-white/85 tracking-widest uppercase mb-1">Extrato de Previdência Complementar</p>
          <p className="text-base font-bold">{conta.nome}</p>
          <div className="flex justify-between mt-3">
            <div>
              <p className="text-xs text-white/85">Saldo atual</p>
              <p className="text-xl font-bold">{hidden ? MASK : brl(conta.saldo)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/85">Emissão</p>
              <p className="text-sm font-semibold">{HOJE}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 overflow-x-auto" style={{ background: theme.inputBg }} role="group" aria-label="Filtrar por mês">
          {[null, ...MESES.map((_, i) => i)].map((i) => {
            const on = mesSel === i;
            return (
              <button key={i === null ? "tudo" : MESES[i]} onClick={() => setMesSel(i)} aria-pressed={on}
                className="flex-shrink-0 min-h-9 px-3.5 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: on ? cor : theme.surface, color: on ? "#fff" : theme.muted }}>
                {i === null ? "Tudo" : MESES[i]}
              </button>
            );
          })}
        </div>

        <div style={{ background: theme.surface }}>
          {visiveis.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center" style={{ color: theme.muted }}>
              Nenhuma movimentação em {mesSel !== null ? MESES[mesSel] : "este período"}.
            </p>
          ) : visiveis.map((m, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b last:border-0"
              style={{ borderColor: theme.rowBorder }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: m.tipo === "R" ? theme.positiveBg : theme.tagBg, color: m.tipo === "R" ? theme.positive : theme.accentText }}>
                  {m.tipo === "R" ? <Icon.Trend size={15} /> : <Icon.ArrowUp size={15} />}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.text }}>{m.desc}</p>
                  <p className="text-xs" style={{ color: theme.muted }}>{m.data}</p>
                </div>
              </div>
              <p className="text-sm font-bold" style={{ color: m.tipo === "R" ? theme.positive : theme.text }}>
                {hidden ? "••••••" : `+${brl(m.v)}`}
              </p>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 flex justify-between text-xs" style={{ background: theme.inputBg, color: theme.muted }}>
          <span>{PLANO_LABEL}</span>
          <span>Gerado em {HOJE}</span>
        </div>
      </div>

      <button onClick={onClose} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-semibold"
        style={{ background: theme.inputBg, color: theme.text }}>
        Fechar
      </button>
    </div>
  );
}
