import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Briefcase, Users } from 'lucide-react';
import { Button, Glass, Logo, Shell, useToast } from '../components/ui';
import { rpc, sessions, supabase, type Team } from '../lib/supabase';

export default function Home() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const [code, setCode] = useState((params.get('sala') ?? '').toUpperCase());
  const [name, setName] = useState('');
  const [step, setStep] = useState<'code' | 'team'>('code');
  const [room, setRoom] = useState<{ id: string; code: string } | null>(null);
  const [teams, setTeams] = useState<(Team & { count: number })[]>([]);
  const [busy, setBusy] = useState(false);

  const normalized = () => {
    const raw = code.trim().toUpperCase().replace(/\s/g, '');
    if (/^\d{4}$/.test(raw)) return `FZ-${raw}`;
    if (/^FZ\d{4}$/.test(raw)) return `FZ-${raw.slice(2)}`;
    return raw;
  };

  const loadTeams = async (roomId: string) => {
    const [t, p] = await Promise.all([
      supabase.from('teams').select('*').eq('room_id', roomId).order('idx'),
      supabase.from('players').select('team_id').eq('room_id', roomId),
    ]);
    const counts: Record<string, number> = {};
    (p.data ?? []).forEach((x: { team_id: string }) => (counts[x.team_id] = (counts[x.team_id] ?? 0) + 1));
    setTeams(((t.data ?? []) as Team[]).map((x) => ({ ...x, count: counts[x.id] ?? 0 })));
  };

  useEffect(() => {
    if (step !== 'team' || !room) return;
    const i = window.setInterval(() => loadTeams(room.id), 2500);
    return () => window.clearInterval(i);
  }, [step, room]);

  const goCode = async () => {
    const c = normalized();
    if (!c) return toast.error('Digite o código da sala.');
    if (name.trim().length < 2) return toast.error('Digite seu nome.');
    setBusy(true);
    try {
      const existing = sessions.player(c);
      if (existing) {
        try {
          await rpc('check_session', { p_player: existing.playerId, p_token: existing.token });
          nav(`/sala/${c}`);
          return;
        } catch {
          sessions.clearPlayer(c);
        }
      }
      const { data } = await supabase.from('rooms').select('id, code, status').eq('code', c).maybeSingle();
      if (!data) throw new Error('Sala não encontrada. Confira o código no telão.');
      if (data.status !== 'lobby') throw new Error('Essa sala já começou o jogo.');
      setRoom({ id: data.id, code: data.code });
      await loadTeams(data.id);
      setStep('team');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const join = async (teamId: string) => {
    if (!room) return;
    setBusy(true);
    try {
      const r = await rpc<{ player_id: string; token: string; room_id: string; code: string }>('join_room', {
        p_code: room.code,
        p_name: name,
        p_team: teamId,
      });
      sessions.savePlayer({ playerId: r.player_id, token: r.token, roomId: r.room_id, code: r.code });
      nav(`/sala/${r.code}`);
    } catch (e) {
      toast.error((e as Error).message);
      loadTeams(room.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <header className="flex items-center justify-between">
        <Logo />
        <Link to="/admin" className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2 px-4 py-2 text-sm text-muted hover:bg-surface-3">
          <Briefcase className="h-4 w-4"/> Sou da Empresa
        </Link>
      </header>

      <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent"/> Gamificação · Aprimoramento de Processos
          </div>
          <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Uma Sprint.
            <br />
            <span className="text-accent">5 minutos.</span>
            <br />
            Uma carta por pessoa.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted">
            Sua equipe é o Time Scrum de uma startup. No começo do jogo um <b className="text-fg">tema surpresa</b> é sorteado; o Product Owner distribui as cartas e cada um aplica uma ferramenta do semestre para resolver o problema.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {['👑 Product Owner', '🛡️ Scrum Master', '💻 Developers', '⏱️ Daily', '🔁 Retrospectiva'].map((t, i) => (
              <motion.span key={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }} className="rounded-full border border-line bg-surface-2 px-3 py-1">
                {t}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <Glass className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {step === 'code' ? (
                <motion.form
                  key="code"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    goCode();
                  }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-bold">Entrar na sala</h2>
                    <p className="text-sm text-muted">O código aparece no telão da Empresa.</p>
                  </div>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted">Código da sala</span>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="FZ-1234"
                      autoFocus
                      className="mt-1.5 w-full rounded-2xl border border-line bg-surface-2 px-4 py-4 text-center font-mono text-3xl font-extrabold tracking-[0.2em] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted">Seu nome</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={30}
                      placeholder="Como a equipe te chama?"
                      className="mt-1.5 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-lg outline-none transition focus:border-accent focus:ring-4 focus:ring-accent"
                    />
                  </label>
                  <Button type="submit" size="lg" className="w-full" loading={busy}>
                    Continuar <ArrowRight className="h-5 w-5"/>
                  </Button>
                </motion.form>
              ) : (
                <motion.div key="team" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold">Escolha sua equipe</h2>
                      <p className="text-sm text-muted">
                        Olá, <b className="text-fg">{name.trim()}</b>! Equipes de até 6 pessoas.
                      </p>
                    </div>
                    <button onClick={() => setStep('code')} className="text-sm text-accent hover:text-fg">
                      Voltar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {teams.map((t, i) => {
                      const full = t.count >= 6;
                      return (
                        <motion.button
                          key={t.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ y: full ? 0 : -3 }}
                          disabled={full || busy}
                          onClick={() => join(t.id)}
                          className="group relative overflow-hidden rounded-2xl border border-line bg-surface-2 p-4 text-left transition disabled:opacity-40"
                        >
                          <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'var(--accent)' }} />
                          <div className="font-bold" style={{ color: 'var(--accent)' }}>
                            {t.name}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                            <Users className="h-4 w-4"/> {t.count}/6 {full && '· cheia'}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Glass>
        </motion.div>
      </div>
    </Shell>
  );
}
