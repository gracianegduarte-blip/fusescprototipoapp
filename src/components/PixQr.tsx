import { useMemo } from "react";

const N = 29;

function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function prng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// QR ilustrativo: gerado a partir do código PIX, com os três marcadores de canto.
export default function PixQr({ code, size = 176 }: { code: string; size?: number }) {
  const path = useMemo(() => {
    const rnd = prng(hashSeed(code));
    const dark: boolean[][] = Array.from({ length: N }, () => Array.from({ length: N }, () => rnd() > 0.52));
    const finder = (r0: number, c0: number) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = r0 + r, cc = c0 + c;
          if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
          if (r === -1 || c === -1 || r === 7 || c === 7) { dark[rr][cc] = false; continue; }
          const d = Math.max(Math.abs(r - 3), Math.abs(c - 3));
          dark[rr][cc] = d !== 2;
        }
      }
    };
    finder(0, 0);
    finder(0, N - 7);
    finder(N - 7, 0);
    for (let i = 8; i < N - 8; i++) { dark[6][i] = i % 2 === 0; dark[i][6] = i % 2 === 0; }
    let d = "";
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (dark[r][c]) d += `M${c + 2} ${r + 2}h1v1h-1z`;
    return d;
  }, [code]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${N + 4} ${N + 4}`} role="img"
      aria-label="QR Code PIX" shapeRendering="crispEdges" style={{ background: "#fff", borderRadius: 12 }}>
      <path d={path} fill="#111" />
    </svg>
  );
}
