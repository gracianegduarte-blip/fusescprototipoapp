import { useState } from "react";
import { Icon, type Theme } from "../shared";
import { QUIZZES, RESULTADO_QUIZ, type QuizId } from "../lib/explorar";

export default function QuizSheet({ theme, quizId, onSignup }: { theme: Theme; quizId: QuizId; onSignup: () => void }) {
  const quiz = QUIZZES[quizId];
  const [idx, setIdx] = useState(0);
  const [pontos, setPontos] = useState<Record<string, number>[]>([]);

  const total = pontos.reduce<Record<string, number>>((acc, p) => {
    for (const [k, v] of Object.entries(p)) acc[k] = (acc[k] ?? 0) + v;
    return acc;
  }, {});
  const fim = pontos.length === quiz.perguntas.length;
  const vencedor = fim ? Object.entries(total).sort((a, b) => b[1] - a[1])[0][0] : null;

  const responder = (pesos: Record<string, number>) => {
    setPontos([...pontos.slice(0, idx), pesos]);
    if (idx + 1 < quiz.perguntas.length) setIdx(idx + 1);
  };
  const voltar = () => { setPontos(pontos.slice(0, idx - 1)); setIdx(idx - 1); };
  const refazer = () => { setPontos([]); setIdx(0); };

  if (vencedor) {
    const r = RESULTADO_QUIZ[vencedor];
    return (
      <div className="text-center pt-2" role="status">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: theme.accentTag, color: theme.accentText }}>
          <Icon.Star size={28} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>Seu resultado</p>
        <p className="text-2xl font-bold mt-1 mb-2" style={{ color: theme.accentText }}>{r.titulo}</p>
        <p className="text-sm leading-relaxed mb-6" style={{ color: theme.muted }}>{r.desc}</p>
        <button onClick={onSignup} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white mb-2" style={{ background: theme.accent }}>
          Fazer pré-cadastro em 30s
        </button>
        <button onClick={refazer} className="w-full min-h-11 text-sm font-medium" style={{ color: theme.muted }}>Refazer o quiz</button>
      </div>
    );
  }

  const q = quiz.perguntas[idx];
  return (
    <div>
      <p className="text-base font-bold pr-10" style={{ color: theme.text }}>{quiz.titulo}</p>
      <div className="flex gap-1.5 my-4" role="img" aria-label={`Pergunta ${idx + 1} de ${quiz.perguntas.length}`}>
        {quiz.perguntas.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= idx ? theme.accentMid : theme.border }} />
        ))}
      </div>
      <p className="text-xs mb-1" style={{ color: theme.muted }}>{idx + 1} de {quiz.perguntas.length}</p>
      <h3 className="text-lg font-bold leading-snug mb-4" style={{ color: theme.text }}>{q.pergunta}</h3>
      <div className="space-y-2">
        {q.opcoes.map((o) => (
          <button key={o.label} onClick={() => responder(o.pesos)}
            className="w-full min-h-14 rounded-2xl px-4 py-3 text-left text-sm font-medium"
            style={{ background: theme.inputBg, border: `1.5px solid ${theme.border}`, color: theme.text }}>
            {o.label}
          </button>
        ))}
      </div>
      {idx > 0 && (
        <button onClick={voltar} className="min-h-11 mt-3 flex items-center gap-1 text-sm font-semibold" style={{ color: theme.accentText }}>
          <Icon.ChevronLeft /> Pergunta anterior
        </button>
      )}
    </div>
  );
}
