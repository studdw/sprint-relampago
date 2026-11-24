import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, rpc, type Player, type Question, type Room, type Team } from './supabase';

export type RoomState = {
  room: Room | null;
  teams: Team[];
  players: Player[];
  questions: Question[];
  loading: boolean;
  notFound: boolean;
  offset: number; // diferença (ms) entre o relógio do servidor e o do navegador
  refresh: () => void;
};

/** Carrega a sala e mantém tudo sincronizado em tempo real (Supabase Realtime + verificação periódica). */
export function useRoom(by: { code?: string; id?: string }): RoomState {
  const [room, setRoom] = useState<Room | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [offset, setOffset] = useState(0);
  const roomIdRef = useRef<string | null>(null);
  const timer = useRef<number | null>(null);

  const fetchAll = useCallback(async (id: string) => {
    const [r, t, p, q] = await Promise.all([
      supabase.from('rooms').select('*').eq('id', id).maybeSingle(),
      supabase.from('teams').select('*').eq('room_id', id).order('idx'),
      supabase.from('players').select('*').eq('room_id', id).order('joined_at'),
      supabase.from('questions').select('*').eq('room_id', id).order('created_at'),
    ]);
    if (r.data) setRoom(r.data as Room);
    if (t.data) setTeams(t.data as Team[]);
    if (p.data) setPlayers(p.data as Player[]);
    if (q.data) setQuestions(q.data as Question[]);
  }, []);

  const schedule = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (roomIdRef.current) fetchAll(roomIdRef.current).catch(() => {});
    }, 120);
  }, [fetchAll]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let poll: number | null = null;

    (async () => {
      setLoading(true);
      let id = by.id ?? null;
      if (!id && by.code) {
        const { data } = await supabase.from('rooms').select('id').eq('code', by.code.toUpperCase()).maybeSingle();
        id = data?.id ?? null;
      }
      if (cancelled) return;
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      roomIdRef.current = id;
      await fetchAll(id);
      if (cancelled) return;
      setLoading(false);

      // Sincroniza o relógio com o servidor (cronômetro igual em todas as telas)
      try {
        const t0 = Date.now();
        const server = await rpc<string>('server_now');
        const t1 = Date.now();
        setOffset(new Date(server).getTime() - (t0 + t1) / 2);
      } catch {
        /* usa o relógio local */
      }

      channel = supabase
        .channel(`room-${id}-${Math.random().toString(36).slice(2, 8)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${id}` }, schedule)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `room_id=eq.${id}` }, schedule)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${id}` }, schedule)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `room_id=eq.${id}` }, schedule)
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') schedule();
        });

      // Rede de segurança: se o tempo real cair, atualiza a cada 4 s
      poll = window.setInterval(() => fetchAll(id!).catch(() => {}), 4000);
    })();

    const onVisible = () => {
      if (document.visibilityState === 'visible') schedule();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (channel) supabase.removeChannel(channel);
      if (poll) window.clearInterval(poll);
    };
  }, [by.code, by.id, fetchAll, schedule]);

  return { room, teams, players, questions, loading, notFound, offset, refresh: schedule };
}

/** Relógio que atualiza a cada `ms` e já vem corrigido pela diferença do servidor. */
export function useNow(offset: number, ms = 250) {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    setNow(Date.now() + offset);
    const i = window.setInterval(() => setNow(Date.now() + offset), ms);
    return () => window.clearInterval(i);
  }, [offset, ms]);
  return now;
}

export function sprintClock(room: Room | null, now: number) {
  if (!room?.sprint_started_at || !room.sprint_ends_at) {
    return { elapsed: 0, remaining: room?.sprint_seconds ?? 300, total: room?.sprint_seconds ?? 300, over: false };
  }
  const start = new Date(room.sprint_started_at).getTime();
  const end = new Date(room.sprint_ends_at).getTime();
  const total = (end - start) / 1000;
  const elapsed = Math.max(0, (now - start) / 1000);
  const remaining = Math.max(0, (end - now) / 1000);
  return { elapsed, remaining, total, over: remaining <= 0 || room.status !== 'sprint' };
}

export function reviewClock(room: Room | null, now: number) {
  if (!room?.review_started_at) return { remaining: room?.review_seconds ?? 180, total: room?.review_seconds ?? 180 };
  const end = new Date(room.review_started_at).getTime() + room.review_seconds * 1000;
  return { remaining: Math.max(0, (end - now) / 1000), total: room.review_seconds };
}

export function fmt(sec: number) {
  const s = Math.ceil(sec);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
