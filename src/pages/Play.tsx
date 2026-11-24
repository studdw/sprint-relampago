import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCircle2, CloudUpload, Crown, Hourglass, Lock, Shield, Target, Code2, AlertCircle } from 'lucide-react';
import { Button, Glass, Logo, RoleBadge, Shell, Spinner, StepBar, TimerRing, useToast, ROLE_LABEL } from '../components/ui';
import { CardTile, ChangeBanner, QuestionsPanel, ResultsBoard, TeamBoard, TopicOverlay, useResults } from '../components/game';
import { CardPlayer, type Answer } from '../components/CardPlayer';
import { CARD_BY_ID, CHANGE_CARD } from '../lib/cards';
import { getCard, getCards, themeOf } from '../lib/themes';
import { rpc, sessions, type Player, type Room, type Team, type Question } from '../lib/supabase';
import { fmt, reviewClock, sprintClock, useNow, useRoom } from '../lib/useRoom';

export default function Play() {
  const { code = '' } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const session = useMemo(() => sessions.player(code), [code]);
  const state = useRoom({ code });
  const { room, teams, players, questions, loading, notFound, offset } = state;

  useEffect(() => {
    if (!session) nav(`/?sala=${code}`, { replace: true });
  }, [session, code, nav]);

  const me = players.find((p) => p.id === session?.playerId);
  const myTeam = teams.find((t) => t.id === me?.team_id);

  // Se o jogador foi removido da sala
  useEffect(() => {
    if (!loading && room && session && players.length > 0 && !me) {
      const t = window.setTimeout(async () => {
        try {
          await rpc('check_session', { p_player: session.playerId, p_token: session.token });
        } catch {
          sessions.clearPlayer(code);
          toast.error('Você não está mais nesta sala.');
          nav(`/?sala=${code}`, { replace: true });
        }
      }, 1500);
      return () => window.clearTimeout(t);
    }
  }, [loading, room, session, players.length, me, code, nav, toast]);

  const call = useCallback(
    async (fn: string, args: Record<string, unknown> = {}) => {
      if (!session) return;
      try {
        await rpc(fn, { p_player: session.playerId, p_token: session.token, ...args });
        state.refresh();
      } catch (e) {
        toast.error((e as Error).message);
        throw e;
      }
    },
    [session, toast, state],
  );

  // Carta do tema da rodada: abre sozinha para todos quando o Planning começa (antes da Sprint)
  const topicKey = `sr_topic_${room?.id}_${session?.playerId}`;
  const [topicOpen, setTopicOpen] = useState(false);
  const [rollTopic, setRollTopic] = useState(false);
  useEffect(() => {
    if (room?.status !== 'planning') return;
    let seen = false;
    try {
      seen = localStorage.getItem(topicKey) === '1';
    } catch {
      /* */
    }
    if (!seen) {
      setRollTopic(true);
      setTopicOpen(true);
    }
  }, [room?.status, topicKey]);
  const closeTopic = () => {
    setTopicOpen(false);
    setRollTopic(false);
    try {
      localStorage.setItem(topicKey, '1');
    } catch {
      /* */
    }
  };

  if (notFound) {
    return (
      <Shell>
        <Glass className="mx-auto mt-20 max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-danger"/>
          <h2 className="mt-3 text-xl font-bold">Sala não encontrada</h2>
          <Button className="mt-5" onClick={() => nav('/')}>Voltar ao início</Button>
        </Glass>
      </Shell>
    );
  }
  if (loading || !room || !me || !myTeam || !session) {
    return (
      <Shell>
        <Spinner text="Entrando na sala…"/>
      </Shell>
    );
  }

  return (
    <Shell wide>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Logo small />
        <StepBar status={room.status} />
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-sm">{room.code}</span>
          <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            {myTeam.name}
          </span>
          <RoleBadge role={me.role} />
          {room.status !== 'lobby' && (
            <Button size="sm" variant="soft" onClick={() => setTopicOpen(true)}>
              📌 Tema da rodada
            </Button>
          )}
        </div>
      </header>
      <AnimatePresence>{topicOpen && <TopicOverlay theme={room.theme} roll={rollTopic} onClose={closeTopic} />}</AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div key={room.status} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
          {room.status === 'lobby' && <Lobby me={me} team={myTeam} teams={teams} players={players} call={call} />}
          {room.status === 'planning' && <Planning theme={room.theme} me={me} team={myTeam} players={players} questions={questions} call={call} />}
          {room.status === 'sprint' && (
            <Sprint room={room} me={me} team={myTeam} players={players} questions={questions} offset={offset} call={call} session={session} />
          )}
          {room.status === 'review' && <Review room={room} me={me} offset={offset} call={call} />}
          {room.status === 'results' && <Results room={room} team={myTeam} />}
        </motion.div>
      </AnimatePresence>
    </Shell>
  );
}

type Call = (fn: string, args?: Record<string, unknown>) => Promise<void>;

// ================= Entrada =================
function Lobby({ me, team, teams, players, call }: { me: Player; team: Team; teams: Team[]; players: Player[]; call: Call }) {
  const [busy, setBusy] = useState<string | null>(null);
  const members = players.filter((p) => p.team_id === team.id);
  const po = members.find((p) => p.role === 'po');
  const sm = members.find((p) => p.role === 'sm');
  const act = async (key: string, fn: string, args: Record<string, unknown>) => {
    setBusy(key);
    try {
      await call(fn, args);
    } catch {
      /* toast já exibido */
    } finally {
      setBusy(null);
    }
  };
  const roles = [
    { id: 'po', icon: Crown, title: 'Product Owner', desc: 'Líder: distribui as cartas, define a Meta e envia a pergunta anônima.', taken: po && po.id !== me.id ? po.name : null, color: '#fbbf24' },
    { id: 'sm', icon: Shield, title: 'Scrum Master', desc: 'Acompanha o quadro, garante a Daily e a Retrospectiva e ajuda quem travar.', taken: sm && sm.id !== me.id ? sm.name : null, color: '#22d3ee' },
    { id: 'dev', icon: Code2, title: 'Developer', desc: 'Resolve a carta recebida no seu computador.', taken: null, color: '#a5b4fc' },
  ] as const;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        <Glass className="p-6">
          <h2 className="text-2xl font-bold">Você entrou! 🎉</h2>
          <p className="text-muted">
            Escolham juntos quem será o <b>Product Owner</b> e o <b>Scrum Master</b> da {team.name}. Depois é só esperar a Empresa iniciar o Planning.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {roles.map((r) => {
              const active = me.role === r.id;
              const Icon = r.icon;
              return (
                <motion.button
                  key={r.id}
                  whileHover={{ y: r.taken ? 0 : -3 }}
                  disabled={!!r.taken || !!busy}
                  onClick={() => act(r.id, 'set_role', { p_role: r.id })}
                  className={`relative rounded-2xl border p-4 text-left transition-all disabled:opacity-50 ${active ? 'border-transparent' : 'border-line bg-surface-2 hover:bg-surface-2'}`}
                  style={active ? { background: 'var(--accent-soft)', boxShadow: '0 0 0 2px var(--accent)' } : undefined}
                >
                  {active && <CheckCircle2 className="absolute right-3 top-3 h-5 w-5" style={{ color: 'var(--accent)' }} />}
                  <Icon className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                  <div className="mt-2 font-bold">{r.title}</div>
                  <div className="mt-1 text-xs text-muted">{r.desc}</div>
                  {r.taken && <div className="mt-2 text-xs font-semibold text-muted">Já é: {r.taken}</div>}
                </motion.button>
              );
            })}
          </div>
        </Glass>
        <Glass className="p-5">
          <div className="mb-3 font-bold">Trocar de equipe</div>
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => {
              const n = players.filter((p) => p.team_id === t.id).length;
              const mine = t.id === team.id;
              return (
                <button
                  key={t.id}
                  disabled={mine || n >= 6 || !!busy}
                  onClick={() => act(t.id, 'set_team', { p_team: t.id })}
                  className="rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-default"
                  style={{ borderColor: mine ? 'var(--accent)' : 'var(--line)', background: mine ? 'var(--accent-soft)' : 'transparent', color: mine ? 'var(--accent)' : 'var(--fg)', opacity: !mine && n >= 6 ? 0.4 : 1 }}
                >
                  {t.name} · {n}/6
                </button>
              );
            })}
          </div>
        </Glass>
      </div>
      <div className="space-y-4">
        <TeamBoard team={team} players={players} meId={me.id} />
        <Glass className="flex items-center gap-3 p-4 text-sm text-muted">
          <Hourglass className="h-5 w-5 animate-pulse text-accent"/> Aguardando a Empresa iniciar o jogo…
        </Glass>
      </div>
    </div>
  );
}

// ================= Planning =================
function Planning({ theme, me, team, players, questions, call }: { theme: string; me: Player; team: Team; players: Player[]; questions: Question[]; call: Call }) {
  const CARDS = getCards(theme);
  const T = themeOf(theme);
  const members = players.filter((p) => p.team_id === team.id);
  const isPO = me.role === 'po';
  const owners = Object.fromEntries(members.filter((m) => m.card_id).map((m) => [m.card_id!, m.name]));
  const allAssigned = members.every((m) => m.card_id);
  const [busy, setBusy] = useState(false);
  const run = async (fn: string, args: Record<string, unknown>) => {
    setBusy(true);
    try {
      await call(fn, args);
    } catch {
      /* */
    } finally {
      setBusy(false);
    }
  };
  const myCard = me.card_id ? getCard(theme, me.card_id) : null;
  const hasPO = members.some((m) => m.role === 'po');

  return (
    <div className="space-y-5">
      <Glass className="relative overflow-hidden p-6">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-accent">Sprint Planning · Problema da rodada</div>
            <h2 className="mt-1 text-3xl font-black">{T.emoji} {T.name}: {T.question}</h2>
            <p className="mt-1 max-w-2xl text-muted">
              {isPO
                ? 'Você é o Product Owner: escolha uma carta do Product Backlog para cada pessoa da equipe (inclusive você), defina a Meta da Sprint e confirme.'
                : 'O Product Owner está montando o Sprint Backlog. Você vai receber uma carta para resolver em 5 minutos.'}
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold ${team.ready ? 'bg-accent-soft text-ok' : 'bg-surface-2 text-muted'}`}>
            {team.ready ? <CheckCircle2 className="h-5 w-5"/> : <Hourglass className="h-5 w-5 animate-pulse"/>}
            {team.ready ? 'Equipe pronta!' : 'Planejando…'}
          </div>
        </div>
      </Glass>

      {!hasPO && (
        <Glass className="flex items-center gap-3 border-accent p-4 text-accent">
          <AlertCircle className="h-5 w-5"/> Sua equipe ainda não tem Product Owner.
          <Button size="sm" variant="soft" onClick={() => run('set_role', { p_role: 'po' })}>Quero ser o PO</Button>
        </Glass>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {isPO ? (
            <Glass className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold">Sprint Backlog · quem faz o quê</h3>
                <span className="text-sm text-muted">
                  {members.filter((m) => m.card_id).length}/{members.length} com carta
                </span>
              </div>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="grid items-center gap-2 rounded-2xl border border-line bg-surface-2 p-3 sm:grid-cols-[1fr_1.3fr]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{m.name}</span>
                      <RoleBadge role={m.role} />
                    </div>
                    <select
                      className="nice w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
                      value={m.card_id ?? ''}
                      disabled={team.ready || busy}
                      onChange={(e) => run('po_assign', { p_target: m.id, p_card: e.target.value || null })}
                    >
                      <option value="">— escolher carta —</option>
                      {CARDS.map((c) => (
                        <option key={c.id} value={c.id} disabled={!!owners[c.id] && owners[c.id] !== m.name}>
                          {c.emoji} {c.title} {owners[c.id] && owners[c.id] !== m.name ? `(com ${owners[c.id]})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-line bg-surface-2 p-4">
                <div className="flex items-center gap-2 font-bold">
                  <Target className="h-5 w-5 text-accent"/> Meta da Sprint
                </div>
                <p className="text-sm text-muted">Quantas cartas a equipe promete tirar nota 4 ou mais? Cumprindo, ganha +5 pontos. Não prometa demais!</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {members.map((_, i) => (
                    <button
                      key={i}
                      disabled={team.ready || busy}
                      onClick={() => run('po_set_meta', { p_meta: i + 1 })}
                      className={`h-11 w-11 rounded-xl font-bold transition ${team.meta === i + 1 ? 'bg-accent text-on-accent shadow-lg ' : 'bg-surface-2 hover:bg-surface-3'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {team.ready ? (
                  <Button variant="ghost" loading={busy} onClick={() => run('po_set_ready', { p_ready: false })}>
                    Desfazer “Equipe pronta”
                  </Button>
                ) : (
                  <Button variant="success" size="lg" loading={busy} disabled={!allAssigned || !team.meta} onClick={() => run('po_set_ready', { p_ready: true })}>
                    <Check className="h-5 w-5"/> Equipe pronta
                  </Button>
                )}
                {!team.ready && (!allAssigned || !team.meta) && (
                  <span className="text-sm text-muted">{!allAssigned ? 'Dê uma carta para cada pessoa.' : 'Defina a Meta da Sprint.'}</span>
                )}
              </div>
            </Glass>
          ) : (
            <Glass className="p-5">
              <h3 className="mb-3 text-lg font-bold">Sua carta</h3>
              {myCard ? (
                <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: 'spring', duration: 0.8 }}>
                  <CardTile card={myCard} highlight />
                  <p className="mt-3 text-sm text-muted">A carta abre quando a Sprint começar. Prepare-se!</p>
                </motion.div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line p-5 text-muted">
                  <Hourglass className="h-5 w-5 animate-pulse"/> Aguardando o Product Owner te dar uma carta…
                </div>
              )}
              <div className="mt-4 text-sm text-muted">Meta da Sprint: {team.meta ? <b className="text-fg">{team.meta} carta(s) com nota 4+</b> : 'ainda não definida'}</div>
            </Glass>
          )}

          <div>
            <h3 className="mb-3 text-lg font-bold">Product Backlog · 10 cartas</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {CARDS.map((c) => (
                <CardTile key={c.id} card={c} owner={owners[c.id]} highlight={!!owners[c.id]} />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <TeamBoard team={team} players={players} meId={me.id} />
          <QuestionsPanel questions={questions} canAsk={isPO} used={team.question_used} onAsk={(t) => call('send_question', { p_text: t })} />
        </div>
      </div>
    </div>
  );
}

// ================= Sprint =================
function Sprint({
  room,
  me,
  team,
  players,
  questions,
  offset,
  call,
  session,
}: {
  room: Room;
  me: Player;
  team: Team;
  players: Player[];
  questions: Question[];
  offset: number;
  call: Call;
  session: { playerId: string; token: string };
}) {
  const now = useNow(offset);
  const clock = sprintClock(room, now);
  const card = me.card_id ? getCard(room.theme, me.card_id) : null;
  const toast = useToast();
  const [answer, setAnswer] = useState<Answer>({});
  const [loaded, setLoaded] = useState(false);
  const [save, setSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const pending = useRef<Answer | null>(null);
  const timer = useRef<number | null>(null);
  const changed = clock.elapsed >= room.change_at_seconds;
  const dailyTime = clock.elapsed >= room.daily_at_seconds;
  const members = players.filter((p) => p.team_id === team.id);
  const teamHasChange = members.some((m) => m.card_id === CHANGE_CARD);
  const [swapTarget, setSwapTarget] = useState('');

  // Carrega o que o aluno já tinha feito (se recarregar a página, nada se perde)
  useEffect(() => {
    let alive = true;
    setLoaded(false);
    rpc<Answer | null>('get_my_answer', { p_player: session.playerId, p_token: session.token })
      .then((a) => {
        if (alive) {
          setAnswer(a ?? {});
          setLoaded(true);
        }
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [me.card_id, me.card_assigned_at, session]);

  const flush = useCallback(async () => {
    if (timer.current) window.clearTimeout(timer.current);
    const a = pending.current;
    if (!a) return;
    pending.current = null;
    setSave('saving');
    try {
      await rpc('save_answer', { p_player: session.playerId, p_token: session.token, p_answer: a });
      setSave('saved');
    } catch (e) {
      setSave('error');
      toast.error((e as Error).message);
    }
  }, [session, toast]);

  const onChange = (a: Answer) => {
    if (clock.over) return;
    setAnswer(a);
    pending.current = a;
    setSave('saving');
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 700);
  };

  useEffect(() => {
    if (clock.over && pending.current) flush();
  }, [clock.over, flush]);

  const doubled = card?.id === CHANGE_CARD && changed;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="glass sticky top-2 z-30 flex items-center justify-between rounded-2xl px-4 py-2.5 lg:hidden">
          <span className="text-sm text-muted">{clock.over ? 'Tempo esgotado' : 'Sprint'}</span>
          <span className={`font-mono text-2xl font-extrabold tabular-nums ${clock.remaining <= 30 ? 'text-danger' : ''}`}>{fmt(clock.remaining)}</span>
        </div>
        <AnimatePresence>{changed && <ChangeBanner />}</AnimatePresence>

        {me.role === 'po' && changed && !clock.over && !teamHasChange && (
          <Glass className="flex flex-wrap items-center gap-3 border-accent p-4">
            <div className="text-sm">
              <b>Decisão do PO:</b> trocar a carta de alguém pela Árvore de Problemas (vale o dobro)? A pessoa recomeça do zero.
            </div>
            <select value={swapTarget} onChange={(e) => setSwapTarget(e.target.value)} className="nice rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm">
              <option value="">Escolha quem troca…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.card_id ? `(${CARD_BY_ID[m.card_id]?.title})` : ''}
                </option>
              ))}
            </select>
            <Button size="sm" variant="soft" disabled={!swapTarget} onClick={() => call('po_assign', { p_target: swapTarget, p_card: CHANGE_CARD }).catch(() => {})}>
              Trocar carta
            </Button>
          </Glass>
        )}

        {card ? (
          <Glass className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-accent text-on-accent text-3xl shadow-xl `}>{card.emoji}</div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted">{card.concept}</div>
                  <h2 className="text-2xl font-black">
                    {card.title} {doubled && <span className="ml-1 rounded-lg bg-accent px-2 py-0.5 text-sm text-black">×2</span>}
                  </h2>
                  {card.draw && <p className="text-sm text-muted">{card.draw.instructions}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {clock.over ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-surface-3 px-3 py-1"><Lock className="h-4 w-4"/> Entregue</span>
                ) : save === 'saving' ? (
                  <span className="flex items-center gap-1.5 text-muted"><CloudUpload className="h-4 w-4 animate-pulse"/> salvando…</span>
                ) : save === 'saved' ? (
                  <span className="flex items-center gap-1.5 text-ok"><Check className="h-4 w-4"/> salvo</span>
                ) : save === 'error' ? (
                  <span className="text-danger">erro ao salvar</span>
                ) : (
                  <span className="text-muted">salva automaticamente</span>
                )}
              </div>
            </div>
            {loaded ? (
              <CardPlayer key={`${card.id}-${me.card_assigned_at}`} card={card} value={answer} onChange={onChange} locked={clock.over} seed={me.id} />
            ) : (
              <Spinner text="Abrindo sua carta…"/>
            )}
          </Glass>
        ) : (
          <Glass className="p-8 text-center text-muted">Você não recebeu carta nesta Sprint. Ajude sua equipe conversando em voz baixa!</Glass>
        )}
      </div>

      <div className="space-y-4">
        <Glass className="flex flex-col items-center p-5">
          <TimerRing remaining={clock.remaining} total={clock.total} label={clock.over ? 'tempo esgotado' : 'Sprint'} />
          <div className="mt-3 grid w-full grid-cols-2 gap-2 text-center text-xs">
            <div className={`rounded-xl px-2 py-2 ${changed ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>📢 Mudança aos {fmt(room.change_at_seconds)}</div>
            <div className={`rounded-xl px-2 py-2 ${dailyTime ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>⏱️ Daily aos {fmt(room.daily_at_seconds)}</div>
          </div>
        </Glass>

        <AnimatePresence>
          {dailyTime && !clock.over && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Glass className={`p-4 ${!me.daily_status ? 'ring-2 ring-accent' : ''}`}>
                <div className="font-bold">⏱️ Daily · como está sua carta?</div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(
                    [
                      ['feito', '✅', 'Feito'],
                      ['fazendo', '🔨', 'Fazendo'],
                      ['impedimento', '🚧', 'Impedimento'],
                    ] as const
                  ).map(([id, e, l]) => (
                    <button
                      key={id}
                      onClick={() => call('set_daily', { p_status: id }).catch(() => {})}
                      className={`rounded-xl px-2 py-2.5 text-sm font-semibold transition ${me.daily_status === id ? 'bg-accent-soft ring-2 ring-accent' : 'bg-surface-2 hover:bg-surface-3'}`}
                    >
                      <div className="text-xl">{e}</div>
                      {l}
                    </button>
                  ))}
                </div>
              </Glass>
            </motion.div>
          )}
        </AnimatePresence>

        <TeamBoard team={team} players={players} meId={me.id} showDaily />
        <div className="text-center text-xs text-muted">Meta da Sprint: {team.meta} carta(s) com nota 4+</div>
        <QuestionsPanel questions={questions} canAsk={me.role === 'po'} used={team.question_used} onAsk={(t) => call('send_question', { p_text: t })} />
      </div>
    </div>
  );
}

// ================= Review + Retrospectiva =================
function Review({ room, me, offset, call }: { room: Room; me: Player; offset: number; call: Call }) {
  const now = useNow(offset);
  const clock = reviewClock(room, now);
  const [text, setText] = useState(me.retro_text ?? '');
  const [kind, setKind] = useState<string | null>(me.retro_kind);
  const [busy, setBusy] = useState(false);
  const opts = [
    ['bem', '🌟', 'O que foi bem'],
    ['atrapalhou', '🧱', 'O que atrapalhou'],
    ['mudaria', '🔧', 'O que eu mudaria'],
  ] as const;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Glass className="p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-accent">Sprint Retrospectiva</div>
        <h2 className="mt-1 text-3xl font-black">Tempo esgotado! ⏰</h2>
        <p className="text-muted">Sua carta foi entregue. Enquanto a Empresa avalia, faça a Retrospectiva: todos da equipe respondendo vale +2 pontos.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {opts.map(([id, e, l]) => (
            <motion.button
              key={id}
              whileHover={{ y: -3 }}
              onClick={() => setKind(id)}
              className={`rounded-2xl border p-4 text-left transition ${kind === id ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2'}`}
            >
              <div className="text-3xl">{e}</div>
              <div className="mt-1 font-bold">{l}</div>
            </motion.button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={140}
          rows={2}
          placeholder="Conte em poucas palavras (opcional)"
          className="mt-4 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 outline-none focus:border-accent"
        />
        <div className="mt-3 flex items-center gap-3">
          <Button
            disabled={!kind}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await call('set_retro', { p_kind: kind, p_text: text });
              } catch {
                /* */
              } finally {
                setBusy(false);
              }
            }}
          >
            {me.retro_kind ? 'Atualizar resposta' : 'Enviar Retrospectiva'}
          </Button>
          {me.retro_kind && <span className="flex items-center gap-1 text-sm text-ok"><CheckCircle2 className="h-4 w-4"/> enviada</span>}
        </div>
      </Glass>
      <Glass className="flex flex-col items-center justify-center p-6 text-center">
        <TimerRing remaining={clock.remaining} total={clock.total} size={160} label="avaliação"/>
        <p className="mt-3 text-sm text-muted">A Empresa está avaliando as cartas. As automáticas já foram corrigidas!</p>
        <div className="mt-2 text-xs text-muted">Você é {ROLE_LABEL[me.role]}</div>
      </Glass>
    </div>
  );
}

// ================= Resultado =================
function Results({ room, team }: { room: Room; team: Team }) {
  const results = useResults(room.id, undefined, true);
  if (!results) return <Spinner text="Calculando o placar…"/>;
  return <ResultsBoard results={results} myTeamId={team.id} />;
}
