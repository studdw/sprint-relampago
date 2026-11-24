import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { MessageCircleQuestion, Send, Trophy, Sparkles, Medal } from 'lucide-react';
import { CARD_BY_ID, CHANGE_CARD, type CardDef } from '../lib/cards';
import { THEMES, themeOf } from '../lib/themes';
import { rpc, type Player, type Question, type Result, type Team } from '../lib/supabase';
import { Badge, Button, Glass, RoleBadge } from './ui';

export function CardTile({ card, owner, highlight, compact, doubled }: { card: CardDef; owner?: string; highlight?: boolean; compact?: boolean; doubled?: boolean }) {
  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      className={`relative overflow-hidden rounded-2xl border p-4 transition-colors ${highlight ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2'}`}
    >
      <div className="relative flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-xl`}>{card.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="font-bold">{card.title}</div>
            {card.type === 'draw' ? <Badge>✏️ desenho</Badge> : <Badge>⚙️ automática</Badge>}
            {doubled && <Badge>×2</Badge>}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted">{card.concept}</div>
          {!compact && <p className="mt-1.5 text-sm text-muted">{card.summary}</p>}
          {owner && <div className="mt-2 inline-flex rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold">👤 {owner}</div>}
        </div>
      </div>
    </motion.div>
  );
}

export function TeamBoard({ team, players, meId, showDaily }: { team: Team; players: Player[]; meId?: string; showDaily?: boolean }) {
  const members = players.filter((p) => p.team_id === team.id);
  return (
    <Glass className="overflow-hidden">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--accent)' }}>
          <span className="h-3 w-3 rounded-full" style={{ background: 'var(--accent)' }} /> {team.name}
        </div>
        <div className="text-xs text-muted">{members.length}/6</div>
      </div>
      <div className="space-y-1.5 px-3 pb-3">
        {members.map((p) => {
          const card = p.card_id ? CARD_BY_ID[p.card_id] : null;
          return (
            <motion.div layout key={p.id} className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${p.id === meId ? 'bg-surface-3' : 'bg-surface-2'}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{p.name}</span>
                  {p.id === meId && <span className="text-[10px] text-muted">(você)</span>}
                </div>
                {card && (
                  <div className="truncate text-xs text-muted">
                    {card.emoji} {card.title}
                  </div>
                )}
              </div>
              {showDaily && p.daily_status && (
                <span className="text-xs">{p.daily_status === 'feito' ? '✅' : p.daily_status === 'fazendo' ? '🔨' : '🚧'}</span>
              )}
              <RoleBadge role={p.role} />
            </motion.div>
          );
        })}
        {members.length === 0 && <div className="px-2 py-3 text-sm text-muted">Ninguém ainda.</div>}
      </div>
    </Glass>
  );
}

export function QuestionsPanel({
  questions,
  canAsk,
  used,
  onAsk,
}: {
  questions: Question[];
  canAsk?: boolean;
  used?: boolean;
  onAsk?: (t: string) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const answered = questions.filter((q) => q.answer);
  return (
    <Glass className="p-4">
      <div className="mb-3 flex items-center gap-2 font-bold">
        <MessageCircleQuestion className="h-5 w-5 text-accent"/> Perguntas à Empresa
        <span className="ml-auto text-xs font-normal text-muted">anônimas · respostas para todos</span>
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1 scroll-thin">
        <AnimatePresence initial={false}>
          {answered.map((q) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-surface-2 p-3 text-sm">
              <div className="text-muted">❓ {q.text}</div>
              <div className="mt-1.5 rounded-xl bg-accent text-on-accent px-3 py-2 font-medium">💬 {q.answer}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        {answered.length === 0 && <div className="text-sm text-muted">Nenhuma resposta ainda.</div>}
      </div>
      {onAsk && (
        <div className="mt-3 border-t border-line pt-3">
          {used ? (
            <div className="text-sm text-muted">✔️ Sua equipe já usou a pergunta.</div>
          ) : canAsk ? (
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!text.trim()) return;
                setBusy(true);
                try {
                  await onAsk(text.trim());
                  setText('');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={280}
                placeholder="Sua única pergunta (anônima)…"
                className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <Button size="sm" loading={busy} disabled={!text.trim()}>
                <Send className="h-4 w-4"/>
              </Button>
            </form>
          ) : (
            <div className="text-sm text-muted">Só o Product Owner pode enviar a pergunta da equipe.</div>
          )}
        </div>
      )}
    </Glass>
  );
}

export function ChangeBanner() {
  const c = CARD_BY_ID[CHANGE_CARD];
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-center gap-3 rounded-2xl border border-accent bg-accent text-on-accent px-4 py-3"
    >
      <span className="text-2xl">📢</span>
      <div className="text-sm">
        <b className="text-accent">Mudança de Requisito!</b> O cliente mudou de ideia: a carta <b>{c.emoji} {c.title}</b> agora vale o <b>dobro</b>.
      </div>
    </motion.div>
  );
}

export function useResults(roomId: string | undefined, key: string | undefined, enabled: boolean) {
  const [results, setResults] = useState<Result[] | null>(null);
  useEffect(() => {
    if (!roomId || !enabled) return;
    let alive = true;
    const load = () =>
      rpc<Result[]>('get_results', { p_room: roomId, p_key: key ?? null })
        .then((r) => alive && setResults(r))
        .catch(() => {});
    load();
    const i = window.setInterval(load, 4000);
    return () => {
      alive = false;
      window.clearInterval(i);
    };
  }, [roomId, key, enabled]);
  return results;
}

export function fireConfetti() {
  const end = Date.now() + 1800;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#d62828';
  const colors = [accent, '#ffffff', '#111111'];
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function ResultsBoard({ results, myTeamId, big, celebrate = true }: { results: Result[]; myTeamId?: string; big?: boolean; celebrate?: boolean }) {
  useEffect(() => {
    if (results.length && celebrate) fireConfetti();
  }, [results.length, celebrate]);
  const top = results.filter((r) => r.place <= 3).slice(0, 3);
  const podium = [top[1], top[0], top[2]].filter(Boolean) as Result[];
  const heights = { 1: big ? 260 : 190, 2: big ? 200 : 145, 3: big ? 160 : 115 } as Record<number, number>;
  const winner = results.find((r) => r.place === 1);
  return (
    <div className="space-y-6">
      {winner && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 text-sm font-semibold text-accent">
            <Trophy className="h-4 w-4"/> Equipe vencedora
          </div>
          <h2 className={`mt-3 font-black tracking-tight ${big ? 'text-7xl' : 'text-5xl'}`} style={{ color: 'var(--accent)' }}>
            {winner.name}
          </h2>
          <div className="mt-1 text-muted">{Number(winner.total).toFixed(1)} pontos</div>
        </motion.div>
      )}
      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {podium.map((r, i) => (
          <div key={r.team_id} className="flex w-28 flex-col items-center sm:w-40">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.2 }} className="mb-2 text-center">
              <div className="text-3xl">{r.place === 1 ? '🥇' : r.place === 2 ? '🥈' : '🥉'}</div>
              <div className="font-bold" style={{ color: 'var(--accent)' }}>
                {r.name}
              </div>
              <div className="font-mono text-sm text-muted">{Number(r.total).toFixed(1)}</div>
            </motion.div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: heights[r.place] ?? 100 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.9, type: 'spring', bounce: 0.25 }}
              className="w-full rounded-t-2xl"
              style={{ background: r.place === 1 ? 'var(--accent)' : 'var(--surface-3)' }}
            />
          </div>
        ))}
      </div>
      <Glass className="overflow-x-auto p-2">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th className="p-2">#</th>
              <th className="p-2">Equipe</th>
              <th className="p-2 text-right">Cartas (0–50)</th>
              <th className="p-2 text-right">Meta</th>
              <th className="p-2 text-right">Daily</th>
              <th className="p-2 text-right">Retro</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <motion.tr
                key={r.team_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.08 }}
                className={`border-t border-line ${r.team_id === myTeamId ? 'bg-accent-soft' : ''}`}
              >
                <td className="p-2 font-bold">{r.place}º</td>
                <td className="p-2 font-semibold" style={{ color: 'var(--accent)' }}>
                  {r.name} {r.team_id === myTeamId && <span className="text-xs text-muted">(sua equipe)</span>}
                </td>
                <td className="p-2 text-right font-mono">{Number(r.cards_score).toFixed(1)}</td>
                <td className="p-2 text-right font-mono">
                  {r.meta_bonus ? <span className="text-ok">+5</span> : <span className="text-muted">0</span>}
                  <span className="ml-1 text-xs text-muted">
                    ({r.meta_hits}/{r.meta ?? '–'})
                  </span>
                </td>
                <td className="p-2 text-right font-mono">{r.daily_bonus ? <span className="text-ok">+2</span> : <span className="text-muted">0</span>}</td>
                <td className="p-2 text-right font-mono">{r.retro_bonus ? <span className="text-ok">+2</span> : <span className="text-muted">0</span>}</td>
                <td className="p-2 text-right font-mono text-base font-extrabold">{Number(r.total).toFixed(1)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </Glass>
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5"/> Cartas = média das notas × 10 (Árvore de Problemas com peso 2)</span>
        <span className="flex items-center gap-1"><Medal className="h-3.5 w-3.5"/> Meta = cartas com nota 4+ / prometido</span>
      </div>
    </div>
  );
}

// =====================================================================
// Tema da rodada: roleta de sorteio + carta grande explicando o tema
// =====================================================================

/** Roleta horizontal de cartas que desacelera e para no tema sorteado */
export function ThemeRoulette({ theme, onDone, big }: { theme: string; onDone: () => void; big?: boolean }) {
  const chosen = themeOf(theme);
  const W = big ? 300 : 220; // largura de cada carta
  const G = 20; // espaço entre cartas
  const LOOPS = 9;
  const strip = Array.from({ length: LOOPS + 2 }, () => THEMES).flat();
  const target = (LOOPS - 1) * THEMES.length + THEMES.findIndex((t) => t.id === chosen.id);
  const box = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(0);
  const [stopped, setStopped] = useState(false);
  useLayoutEffect(() => {
    setVw(box.current?.clientWidth ?? 0);
  }, []);
  const finalX = vw / 2 - W / 2 - target * (W + G);
  const startX = vw / 2 - W / 2;

  return (
    <div className="w-full">
      <div className="mb-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.2em] text-on-accent">
          🎲 Sorteando o tema da rodada…
        </div>
      </div>
      <div ref={box} className="relative overflow-hidden py-6">
        {/* marcador central */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 -translate-x-1/2 rounded-3xl border-4 border-accent" style={{ width: W + 16 }} />
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 text-3xl text-accent">▼</div>
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 text-3xl text-accent">▲</div>
        {vw > 0 && (
          <motion.div
            className="flex"
            style={{ gap: G }}
            initial={{ x: startX }}
            animate={{ x: finalX }}
            transition={{ duration: 4.2, ease: [0.12, 0.75, 0.12, 1] }}
            onAnimationComplete={() => {
              setStopped(true);
              fireConfetti();
              window.setTimeout(onDone, 1400);
            }}
          >
            {strip.map((t, i) => {
              const win = stopped && i === target;
              return (
                <motion.div
                  key={i}
                  animate={win ? { scale: 1.08 } : { scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className={`flex shrink-0 flex-col items-center justify-center rounded-3xl border-2 p-5 text-center ${win ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface-2'}`}
                  style={{ width: W, height: big ? 320 : 240 }}
                >
                  <div className={big ? 'text-8xl' : 'text-6xl'}>{t.emoji}</div>
                  <div className={`mt-3 font-black leading-tight ${big ? 'text-3xl' : 'text-2xl'}`}>{t.name}</div>
                  <div className={`mt-1 text-sm font-semibold ${win ? '' : 'text-muted'}`}>{t.place}</div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {stopped && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 text-center font-black ${big ? 'text-5xl' : 'text-3xl'}`}>
            Tema sorteado: <span className="text-accent">{chosen.emoji} {chosen.name}</span>!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Carta grande com o tema da rodada, para ninguém deixar passar em branco */
export function TopicCard({ theme, onClose, big }: { theme: string; onClose?: () => void; big?: boolean }) {
  const T = themeOf(theme);
  const txt = big ? 'text-xl' : 'text-base sm:text-lg';
  return (
    <div className={`overflow-hidden rounded-3xl border-4 border-accent bg-surface shadow-2xl ${big ? 'p-10' : 'p-6 sm:p-10'}`}>
      <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.2em] text-on-accent">
        📌 Tema da rodada · {T.place}
      </div>
      <h1 className={`mt-5 font-black leading-[1.05] tracking-tight ${big ? 'text-7xl' : 'text-4xl sm:text-6xl'}`}>
        {T.emoji} <span className="text-accent">{T.name}</span>
      </h1>
      <p className={`mt-3 font-bold leading-snug ${big ? 'text-4xl' : 'text-2xl sm:text-3xl'}`}>{T.question}</p>

      <div className={`mt-7 grid gap-4 ${big ? 'grid-cols-3' : 'md:grid-cols-3'}`}>
        <div className="rounded-2xl bg-surface-2 p-5">
          <div className="text-sm font-extrabold uppercase tracking-widest text-accent">😩 O problema</div>
          <p className={`mt-2 ${txt}`}>{T.problem}</p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-5">
          <div className="text-sm font-extrabold uppercase tracking-widest text-accent">🎯 A missão da equipe</div>
          <p className={`mt-2 ${txt}`}>
            Vocês são o <b>Time Scrum</b> contratado pela Empresa. {T.mission}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-5">
          <div className="text-sm font-extrabold uppercase tracking-widest text-accent">⚡ Como funciona</div>
          <ol className={`mt-2 list-decimal space-y-1 pl-5 ${txt}`}>
            <li>O <b>Product Owner</b> entrega <b>1 carta</b> para cada pessoa.</li>
            <li>Cada carta aplica uma <b>ferramenta do semestre</b> ao tema.</li>
            <li>Vocês têm <b>5 minutos</b> de Sprint.</li>
          </ol>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {['Scrum', 'Fluxograma', 'SIPOC', 'AS-IS / TO-BE', 'Mapa de Empatia', 'Árvore de Problemas e de Soluções', 'Storyboard', 'Conflitos e Tempo'].map((t) => (
          <span key={t} className="rounded-full border border-line bg-surface-2 px-3 py-1 text-sm font-semibold">
            {t}
          </span>
        ))}
      </div>

      {onClose && (
        <button onClick={onClose} className="mt-8 w-full rounded-2xl bg-accent px-6 py-5 text-xl font-extrabold text-on-accent transition hover:brightness-110 active:scale-[0.99]">
          Entendi o tema! 👍
        </button>
      )}
    </div>
  );
}

/** Roleta (opcional) e depois a carta do tema. */
export function ThemeReveal({ theme, roll, big, onClose }: { theme: string; roll: boolean; big?: boolean; onClose?: () => void }) {
  const [phase, setPhase] = useState<'roll' | 'card'>(roll ? 'roll' : 'card');
  return (
    <AnimatePresence mode="wait">
      {phase === 'roll' ? (
        <motion.div key="roll" exit={{ opacity: 0, scale: 0.95 }}>
          <ThemeRoulette theme={theme} big={big} onDone={() => setPhase('card')} />
        </motion.div>
      ) : (
        <motion.div key="card" initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ type: 'spring', duration: 0.8 }}>
          <TopicCard theme={theme} big={big} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function TopicOverlay({ theme, roll, onClose }: { theme: string; roll: boolean; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] overflow-y-auto bg-black/70 p-3 sm:p-8">
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.3 }} className="mx-auto max-w-5xl">
        {roll ? (
          <div className="rounded-3xl bg-surface p-4 sm:p-8">
            <ThemeReveal theme={theme} roll onClose={onClose} />
          </div>
        ) : (
          <TopicCard theme={theme} onClose={onClose} />
        )}
      </motion.div>
    </motion.div>
  );
}

