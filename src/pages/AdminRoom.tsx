import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Copy, Hourglass, Monitor, RefreshCw, Send, UserX, Star, Image as ImageIcon } from 'lucide-react';
import { Badge, Button, Glass, Logo, RoleBadge, Shell, Spinner, StepBar, TimerRing, useToast } from '../components/ui';
import { ResultsBoard, useResults } from '../components/game';
import { CARD_BY_ID, CHANGE_CARD } from '../lib/cards';
import { themeOf } from '../lib/themes';
import { rpc, sessions, type Question, type Submission } from '../lib/supabase';
import { reviewClock, sprintClock, useNow, useRoom } from '../lib/useRoom';

export default function AdminRoom() {
  const { roomId = '' } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [key, setKey] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1)).get('k');
    const k = hash ?? sessions.admin(roomId)?.key ?? null;
    if (!k) {
      setChecked(true);
      return;
    }
    rpc<{ code: string }>('admin_check', { p_room: roomId, p_key: k })
      .then((r) => {
        sessions.saveAdmin({ roomId, key: k, code: r.code, createdAt: sessions.admin(roomId)?.createdAt ?? Date.now() });
        setKey(k);
        if (hash) window.history.replaceState(null, '', window.location.pathname);
      })
      .catch(() => toast.error('Acesso de administrador inválido.'))
      .finally(() => setChecked(true));
  }, [roomId, toast]);

  if (!checked) return <Shell><Spinner /></Shell>;
  if (!key)
    return (
      <Shell>
        <Glass className="mx-auto mt-20 max-w-md p-8 text-center">
          <h2 className="text-xl font-bold">Sem acesso a esta sala</h2>
          <p className="mt-2 text-muted">Abra pelo computador que criou a sala ou pelo link de administrador.</p>
          <Button className="mt-5" onClick={() => nav('/admin')}>Ir para o painel</Button>
        </Glass>
      </Shell>
    );
  return <Panel roomId={roomId} adminKey={key} />;
}

function Panel({ roomId, adminKey }: { roomId: string; adminKey: string }) {
  const toast = useToast();
  const { room, teams, players, questions, loading, offset, refresh } = useRoom({ id: roomId });
  const now = useNow(offset, 500);
  const [busy, setBusy] = useState(false);
  const [force, setForce] = useState(false);
  const [subs, setSubs] = useState<Submission[]>([]);
  const status = room?.status;

  const loadSubs = useCallback(
    async (withAnswers: boolean) => {
      try {
        const s = await rpc<Submission[]>('admin_get_submissions', { p_room: roomId, p_key: adminKey, p_with_answers: withAnswers });
        setSubs(s);
      } catch {
        /* */
      }
    },
    [roomId, adminKey],
  );

  useEffect(() => {
    if (status === 'sprint') {
      loadSubs(false);
      const i = window.setInterval(() => loadSubs(false), 3000);
      return () => window.clearInterval(i);
    }
    if (status === 'review' || status === 'results') loadSubs(true);
  }, [status, loadSubs]);

  const results = useResults(roomId, adminKey, status === 'review' || status === 'results');

  const advance = async () => {
    if (!room) return;
    if (room.status === 'sprint' && sprintClock(room, now).remaining > 1 && !window.confirm('A Sprint ainda não acabou. Encerrar agora?')) return;
    setBusy(true);
    try {
      await rpc('admin_advance', { p_room: roomId, p_key: adminKey, p_force: force });
      setForce(false);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !room) return <Shell wide><Spinner /></Shell>;

  const joinUrl = `${window.location.origin}/?sala=${room.code}`;
  const adminUrl = `${window.location.origin}/admin/${room.id}#k=${adminKey}`;
  const activeTeams = teams.filter((t) => players.some((p) => p.team_id === t.id));
  const readyCount = activeTeams.filter((t) => t.ready).length;
  const sclock = sprintClock(room, now);
  const rclock = reviewClock(room, now);
  const savedBy = new Set(subs.filter((s) => s.updated_at).map((s) => s.player_id));

  const actionLabel = {
    lobby: 'Iniciar Planning',
    planning: 'Iniciar Sprint (5 min)',
    sprint: 'Encerrar Sprint → Review',
    review: 'Mostrar resultado',
    results: '',
  }[room.status];

  const copy = (t: string, msg: string) => {
    navigator.clipboard?.writeText(t).then(() => toast.success(msg)).catch(() => toast.error('Não foi possível copiar.'));
  };

  return (
    <Shell wide>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link to="/admin"><Logo small /></Link>
          <Badge>Painel da Empresa</Badge>
        </div>
        <StepBar status={room.status} />
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => copy(adminUrl, 'Link de administrador copiado.')}>
            <Copy className="h-4 w-4"/> Link admin
          </Button>
          <a href={`/telao/${room.code}`} target="_blank" rel="noreferrer">
            <Button size="sm" variant="soft"><Monitor className="h-4 w-4"/> Abrir telão</Button>
          </a>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Controle */}
          <Glass className="relative overflow-hidden p-6">
            <div className="relative flex flex-wrap items-center gap-6">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted">Código da sala</div>
                <div className="font-mono text-6xl font-black tracking-wider text-accent">{room.code}</div>
                <button onClick={() => copy(joinUrl, 'Link de entrada copiado.')} className="mt-1 flex items-center gap-1.5 text-sm text-muted hover:text-fg">
                  <Copy className="h-3.5 w-3.5"/> {joinUrl}
                </button>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {room.status !== 'lobby' && <Badge accent>{themeOf(room.theme).emoji} Tema: {themeOf(room.theme).name}</Badge>}
                  <Badge>{players.length} alunos</Badge>
                  <Badge>{activeTeams.length} equipes com gente</Badge>
                  {room.status === 'planning' && <Badge>{readyCount}/{activeTeams.length} prontas</Badge>}
                </div>
              </div>
              {room.status === 'sprint' && <TimerRing remaining={sclock.remaining} total={sclock.total} size={150} label="Sprint"/>}
              {room.status === 'review' && <TimerRing remaining={rclock.remaining} total={rclock.total} size={150} label="avaliação"/>}
              {room.status !== 'results' && (
                <div className="flex flex-col items-stretch gap-2">
                  <Button size="lg" loading={busy} onClick={advance} disabled={room.status === 'lobby' && players.length === 0}>
                    {actionLabel} <ArrowRight className="h-5 w-5"/>
                  </Button>
                  {room.status === 'planning' && readyCount < activeTeams.length && (
                    <label className="flex items-center gap-2 text-xs text-muted">
                      <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-[var(--accent)]"/>
                      Iniciar mesmo com equipes não prontas
                    </label>
                  )}
                  <Button size="sm" variant="ghost" onClick={refresh}><RefreshCw className="h-4 w-4"/> Atualizar</Button>
                </div>
              )}
            </div>
            {room.status === 'sprint' && (
              <div className="relative mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div className={`rounded-xl px-3 py-2 ${sclock.elapsed >= room.change_at_seconds ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>📢 Mudança de Requisito (Árvore de Problemas ×2) aos 2:00 — automática</div>
                <div className={`rounded-xl px-3 py-2 ${sclock.elapsed >= room.daily_at_seconds ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>⏱️ Daily aos 3:00 — automática</div>
              </div>
            )}
          </Glass>

          {/* Review: desenhos para dar nota */}
          {(room.status === 'review' || room.status === 'results') && <Grading subs={subs} roomId={roomId} adminKey={adminKey} reload={() => loadSubs(true)} />}

          {/* Resultado */}
          {(room.status === 'review' || room.status === 'results') && results && (
            <div>
              <h3 className="mb-3 text-lg font-bold">{room.status === 'review' ? 'Prévia do placar (só a Empresa vê)' : 'Resultado final'}</h3>
              <ResultsBoard results={results} celebrate={room.status === 'results'} />
            </div>
          )}

          {/* Equipes */}
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {teams.map((t) => {
              const members = players.filter((p) => p.team_id === t.id);
              return (
                <Glass key={t.id} className="overflow-hidden">
                  <div className="h-1" style={{ background: 'var(--accent)' }} />
                  <div className="flex items-center justify-between px-4 pt-3">
                    <div className="font-bold" style={{ color: 'var(--accent)' }}>{t.name}</div>
                    <div className="flex items-center gap-1.5">
                      {t.question_used && <Badge>❓ usou</Badge>}
                      {t.meta && <Badge>🎯 {t.meta}</Badge>}
                      {room.status === 'planning' && members.length > 0 && (t.ready ? <Badge>✓ pronta</Badge> : <Badge>planejando</Badge>)}
                      <span className="text-xs text-muted">{members.length}/6</span>
                    </div>
                  </div>
                  <div className="space-y-1 p-3">
                    {members.map((p) => {
                      const c = p.card_id ? CARD_BY_ID[p.card_id] : null;
                      return (
                        <div key={p.id} className="group flex items-center gap-2 rounded-xl bg-surface-2 px-2.5 py-1.5 text-sm">
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{p.name}</div>
                            {c && <div className="truncate text-xs text-muted">{c.emoji} {c.title}{c.id === CHANGE_CARD ? ' (×2)' : ''}</div>}
                          </div>
                          {room.status === 'sprint' && (savedBy.has(p.id) ? <span title="já salvou algo">💾</span> : <span title="ainda não mexeu" className="opacity-40">…</span>)}
                          {p.daily_status && <span>{p.daily_status === 'feito' ? '✅' : p.daily_status === 'fazendo' ? '🔨' : '🚧'}</span>}
                          {p.retro_kind && <span title="Retrospectiva enviada">🔁</span>}
                          <RoleBadge role={p.role} />
                          {(room.status === 'lobby' || room.status === 'planning') && (
                            <button
                              title="Remover aluno"
                              className="rounded-lg p-1 text-danger opacity-0 transition hover:bg-accent-soft group-hover:opacity-100"
                              onClick={async () => {
                                if (!window.confirm(`Remover ${p.name} da sala?`)) return;
                                try {
                                  await rpc('admin_remove_player', { p_room: roomId, p_key: adminKey, p_player: p.id });
                                  refresh();
                                } catch (e) {
                                  toast.error((e as Error).message);
                                }
                              }}
                            >
                              <UserX className="h-4 w-4"/>
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {members.length === 0 && <div className="px-2 py-2 text-sm text-muted">Vazia</div>}
                  </div>
                </Glass>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <AdminQuestions questions={questions} roomId={roomId} adminKey={adminKey} refresh={refresh} />
          <Glass className="p-4 text-sm text-muted">
            <div className="mb-2 font-bold text-fg">Roteiro rápido</div>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Projete o telão e peça para todos entrarem com o código.</li>
              <li>Cada equipe escolhe PO e Scrum Master.</li>
              <li><b>Iniciar Planning</b>: o PO distribui as cartas e define a Meta.</li>
              <li>Com todas prontas, <b>Iniciar Sprint</b> (5 min).</li>
              <li>Na Review (3 min), dê nota aos desenhos.</li>
              <li><b>Mostrar resultado</b> e comemorar!</li>
            </ol>
          </Glass>
        </div>
      </div>
    </Shell>
  );
}

function AdminQuestions({ questions, roomId, adminKey, refresh }: { questions: Question[]; roomId: string; adminKey: string; refresh: () => void }) {
  const toast = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const pending = questions.filter((q) => !q.answer).length;
  return (
    <Glass className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-bold">Chat · perguntas anônimas</div>
        {pending > 0 && <Badge>{pending} nova(s)</Badge>}
      </div>
      <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 scroll-thin">
        <AnimatePresence initial={false}>
          {[...questions].reverse().map((q) => (
            <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`rounded-2xl p-3 text-sm ${q.answer ? 'bg-surface-2' : 'bg-accent-soft ring-1 ring-accent'}`}>
              <div className="font-medium">❓ {q.text}</div>
              {q.answer ? (
                <div className="mt-1.5 text-ok">💬 {q.answer}</div>
              ) : (
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await rpc('admin_answer_question', { p_room: roomId, p_key: adminKey, p_question: q.id, p_answer: drafts[q.id] ?? '' });
                      refresh();
                    } catch (err) {
                      toast.error((err as Error).message);
                    }
                  }}
                >
                  <input
                    value={drafts[q.id] ?? ''}
                    onChange={(e) => setDrafts({ ...drafts, [q.id]: e.target.value })}
                    placeholder="Responder para todos…"
                    className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2 outline-none focus:border-accent"
                  />
                  <Button size="sm"><Send className="h-4 w-4"/></Button>
                </form>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {questions.length === 0 && <div className="text-sm text-muted">Nenhuma pergunta ainda. Cada equipe pode enviar uma, sem identificação.</div>}
      </div>
    </Glass>
  );
}

function Grading({ subs, roomId, adminKey, reload }: { subs: Submission[]; roomId: string; adminKey: string; reload: () => void }) {
  const toast = useToast();
  const draws = useMemo(() => subs.filter((s) => s.card_id && CARD_BY_ID[s.card_id]?.type === 'draw'), [subs]);
  const autos = useMemo(() => subs.filter((s) => s.card_id && CARD_BY_ID[s.card_id]?.type === 'auto'), [subs]);
  const [saving, setSaving] = useState<string | null>(null);

  const score = async (sub: string, v: number) => {
    setSaving(sub);
    try {
      await rpc('admin_score', { p_room: roomId, p_key: adminKey, p_sub: sub, p_score: v });
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Glass className="p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold"><ImageIcon className="h-5 w-5 text-accent"/> Cartas de desenho · dê a nota (0 a 5)</h3>
        <Button size="sm" variant="ghost" onClick={reload}><RefreshCw className="h-4 w-4"/></Button>
      </div>
      <p className="mb-4 text-sm text-muted">Critérios: mostra a ideia pedida, está completo e está claro.</p>
      {draws.length === 0 && <div className="text-sm text-muted">Nenhuma carta de desenho nesta partida.</div>}
      <div className="grid gap-4 md:grid-cols-2">
        {draws.map((s) => {
          const c = CARD_BY_ID[s.card_id!];
          const img = s.answer?.drawing as string | undefined;
          const caps = (s.answer?.captions as string[] | undefined)?.filter(Boolean) ?? [];
          return (
            <div key={s.player_id} className="overflow-hidden rounded-2xl border border-line bg-surface-2">
              {img ? <img src={img} alt={c.title} className="aspect-[5/3] w-full bg-white object-contain"/> : <div className="grid aspect-[5/3] place-items-center bg-surface-2 text-muted">Não desenhou nada</div>}
              <div className="p-3">
                <div className="flex items-center justify-between text-sm">
                  <span><b>{s.player_name}</b> · {s.team_name}</span>
                  <span className="text-muted">{c.emoji} {c.title}</span>
                </div>
                {caps.length > 0 && <ol className="mt-1 list-decimal pl-5 text-xs text-muted">{caps.map((t, i) => <li key={i}>{t}</li>)}</ol>}
                <div className="mt-3 flex items-center gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      disabled={!s.sub_id || saving === s.sub_id}
                      onClick={() => s.sub_id && score(s.sub_id, v)}
                      className={`h-9 flex-1 rounded-xl font-bold transition disabled:opacity-30 ${Number(s.score) === v && s.score !== null ? 'bg-accent text-on-accent' : 'bg-surface-2 hover:bg-surface-3'}`}
                    >
                      {v}
                    </button>
                  ))}
                  {s.score !== null ? <CheckCircle2 className="h-5 w-5 text-ok"/> : <Hourglass className="h-5 w-5 text-muted"/>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {autos.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2 font-semibold"><Star className="h-4 w-4 text-accent"/> Cartas automáticas (já corrigidas)</div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {autos.map((s) => (
              <div key={s.player_id} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-1.5 text-sm">
                <span className="truncate">{CARD_BY_ID[s.card_id!].emoji} <b>{s.player_name}</b> <span className="text-muted">· {s.team_name}</span></span>
                <span className="font-mono font-bold">{s.score === null ? '0,00' : Number(s.score).toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Glass>
  );
}
