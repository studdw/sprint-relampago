import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Hourglass, Users } from 'lucide-react';
import { Glass, Logo, RoleBadge, Shell, Spinner, StepBar, TimerRing } from '../components/ui';
import { ChangeBanner, ResultsBoard, ThemeReveal, useResults } from '../components/game';
import { reviewClock, sprintClock, useNow, useRoom } from '../lib/useRoom';

export default function Telao() {
  const { code = '' } = useParams();
  const { room, teams, players, questions, loading, notFound, offset } = useRoom({ code });
  const now = useNow(offset);
  const results = useResults(room?.id, undefined, room?.status === 'results');

  if (notFound) return <Shell><div className="mt-32 text-center text-3xl font-bold">Sala não encontrada</div></Shell>;
  if (loading || !room) return <Shell><Spinner /></Shell>;

  const host = window.location.host;
  const s = sprintClock(room, now);
  const r = reviewClock(room, now);
  const active = teams.filter((t) => players.some((p) => p.team_id === t.id) || room.status === 'lobby');
  const answered = questions.filter((q) => q.answer);

  return (
    <Shell wide>
      <header className="mb-6 flex items-center justify-between">
        <Logo />
        <StepBar status={room.status} />
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-muted">Entre em</div>
          <div className="font-mono text-lg font-bold">{host} · <span className="text-accent">{room.code}</span></div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={room.status} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          {room.status === 'lobby' && (
            <div className="text-center">
              <div className="text-2xl text-muted">Abra no navegador</div>
              <div className="mt-2 font-mono text-5xl font-extrabold">{host}</div>
              <div className="mt-6 text-xl text-muted">e digite o código</div>
              <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 2.4 }} className="mt-2 font-mono text-[9rem] font-black leading-none tracking-wider text-accent">
                {room.code}
              </motion.div>
              <div className="mt-4 flex items-center justify-center gap-2 text-2xl"><Users className="h-7 w-7"/> {players.length} conectados</div>
            </div>
          )}

          {room.status === 'planning' && (
            <div className="space-y-4">
              <ThemeReveal theme={room.theme} big roll={!!room.planning_started_at && now - new Date(room.planning_started_at).getTime() < 20000} />
              <p className="text-center text-2xl font-semibold text-muted">Product Owners: distribuam as cartas e definam a Meta da Sprint.</p>
            </div>
          )}

          {room.status === 'sprint' && (
            <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]">
              <div className="flex justify-center"><TimerRing remaining={s.remaining} total={s.total} size={380} label="Sprint"/></div>
              <div className="space-y-4">
                {s.elapsed >= room.change_at_seconds && <ChangeBanner />}
                {s.elapsed >= room.daily_at_seconds && !s.over && (
                  <div className="rounded-2xl border border-accent bg-accent-soft px-5 py-4 text-2xl font-bold">⏱️ Hora da Daily! Marquem como está a carta de vocês.</div>
                )}
                <Glass className="p-5">
                  <div className="mb-2 text-lg font-bold">💬 Respostas da Empresa</div>
                  {answered.length === 0 && <div className="text-muted">Nenhuma pergunta respondida ainda.</div>}
                  <div className="space-y-2">
                    {answered.slice(-4).map((q) => (
                      <div key={q.id} className="rounded-xl bg-surface-2 p-3 text-lg">
                        <div className="text-muted">❓ {q.text}</div>
                        <div className="font-semibold">💬 {q.answer}</div>
                      </div>
                    ))}
                  </div>
                </Glass>
              </div>
            </div>
          )}

          {room.status === 'review' && (
            <div className="flex flex-col items-center text-center">
              <h1 className="text-6xl font-black">Tempo esgotado! ⏰</h1>
              <p className="mt-3 text-2xl text-muted">A Empresa está avaliando. Enquanto isso, façam a Retrospectiva.</p>
              <div className="mt-8"><TimerRing remaining={r.remaining} total={r.total} size={300} label="avaliação"/></div>
            </div>
          )}

          {room.status === 'results' && (results ? <ResultsBoard results={results} big /> : <Spinner text="Calculando o placar…"/>)}
        </motion.div>
      </AnimatePresence>

      {room.status !== 'results' && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {active.map((t, i) => {
            const members = players.filter((p) => p.team_id === t.id);
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Glass className="overflow-hidden">
                  <div className="h-1.5" style={{ background: 'var(--accent)' }} />
                  <div className="flex items-center justify-between px-4 pt-3">
                    <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{t.name}</div>
                    {room.status === 'planning' && members.length > 0 && (t.ready ? <CheckCircle2 className="h-6 w-6 text-ok"/> : <Hourglass className="h-5 w-5 animate-pulse text-muted"/>)}
                    {room.status === 'sprint' && <span className="text-sm text-muted">{members.filter((m) => m.daily_status).length}/{members.length} na Daily</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-4 pt-2">
                    <AnimatePresence>
                      {members.map((p) => (
                        <motion.span key={p.id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-sm">
                          {p.name} {p.role !== 'dev' && <RoleBadge role={p.role} />}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                    {members.length === 0 && <span className="text-sm text-muted">aguardando…</span>}
                  </div>
                </Glass>
              </motion.div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
