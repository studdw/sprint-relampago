import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Play, Users } from 'lucide-react';
import { Button, Glass, Logo, Shell, useToast } from '../components/ui';
import { rpc, sessions } from '../lib/supabase';

export default function AdminHome() {
  const nav = useNavigate();
  const toast = useToast();
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const rooms = sessions.admins();

  const create = async () => {
    setBusy(true);
    try {
      const r = await rpc<{ room_id: string; code: string; admin_key: string }>('create_room', { p_team_count: count });
      sessions.saveAdmin({ roomId: r.room_id, key: r.admin_key, code: r.code, createdAt: Date.now() });
      nav(`/admin/${r.room_id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <header className="flex items-center justify-between">
        <Logo />
        <Link to="/" className="flex items-center gap-2 text-sm text-muted hover:text-fg">
          <ArrowLeft className="h-4 w-4"/> Início
        </Link>
      </header>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Glass className="p-7">
            <div className="text-xs font-semibold uppercase tracking-widest text-accent">Painel da Empresa</div>
            <h1 className="mt-1 text-3xl font-black">Criar nova sala</h1>
            <p className="mt-1 text-muted">Escolha quantas equipes vão jogar. Cada equipe aceita de 5 a 6 pessoas (máximo 6).</p>
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold">
                  <Users className="h-5 w-5 text-accent"/> Equipes
                </span>
                <span className="font-mono text-4xl font-extrabold text-accent">{count}</span>
              </div>
              <input type="range" min={2} max={8} value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-3 w-full accent-[var(--accent)]"/>
              <div className="mt-1 text-sm text-muted">Cabem até {count * 6} alunos.</div>
            </div>
            <Button size="lg" className="mt-6 w-full" loading={busy} onClick={create}>
              <Plus className="h-5 w-5"/> Criar sala
            </Button>
          </Glass>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Glass className="p-7">
            <h2 className="text-xl font-bold">Suas salas neste computador</h2>
            <div className="mt-4 space-y-2">
              {rooms.length === 0 && <div className="text-muted">Nenhuma sala criada ainda.</div>}
              {rooms.map((r) => (
                <Link key={r.roomId} to={`/admin/${r.roomId}`} className="flex items-center justify-between rounded-2xl border border-line bg-surface-2 px-4 py-3 transition hover:bg-surface-3">
                  <div>
                    <div className="font-mono text-lg font-bold">{r.code}</div>
                    <div className="text-xs text-muted">{new Date(r.createdAt).toLocaleString('pt-BR')}</div>
                  </div>
                  <Play className="h-5 w-5 text-accent"/>
                </Link>
              ))}
            </div>
          </Glass>
        </motion.div>
      </div>
    </Shell>
  );
}
