import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://pagtvweenqhljtoqtivm.supabase.co';
// Chave pública (anon). Ela pode ficar no navegador: o acesso real é controlado pelas regras do banco (RLS e funções).
const ANON =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhZ3R2d2VlbnFobGp0b3F0aXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5Mjg2NDgsImV4cCI6MjExMDUwNDY0OH0.aZ2X7nUqUNjclObGhme-uCG-HQnLzGfv428WBGiMPJw';

export const supabase = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 20 } },
});

export async function rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(friendly(error.message));
  return data as T;
}

function friendly(msg: string) {
  if (/Failed to fetch|NetworkError|fetch/i.test(msg)) return 'Sem conexão com o servidor. Verifique a internet.';
  return msg;
}

export type RoomStatus = 'lobby' | 'planning' | 'sprint' | 'review' | 'results';

export type Room = {
  id: string;
  code: string;
  status: RoomStatus;
  theme: string;
  team_count: number;
  sprint_seconds: number;
  review_seconds: number;
  change_at_seconds: number;
  daily_at_seconds: number;
  planning_started_at: string | null;
  sprint_started_at: string | null;
  sprint_ends_at: string | null;
  review_started_at: string | null;
};
export type Team = {
  id: string;
  room_id: string;
  idx: number;
  name: string;
  color: string;
  meta: number | null;
  ready: boolean;
  question_used: boolean;
};
export type Player = {
  id: string;
  room_id: string;
  team_id: string;
  name: string;
  role: 'po' | 'sm' | 'dev';
  card_id: string | null;
  card_assigned_at: string | null;
  daily_status: 'feito' | 'fazendo' | 'impedimento' | null;
  retro_kind: 'bem' | 'atrapalhou' | 'mudaria' | null;
  retro_text: string | null;
  joined_at: string;
};
export type Question = { id: string; room_id: string; text: string; answer: string | null; created_at: string; answered_at: string | null };
export type Result = {
  team_id: string;
  name: string;
  color: string;
  members: number;
  cards_score: number;
  meta: number | null;
  meta_hits: number;
  meta_bonus: number;
  daily_bonus: number;
  retro_bonus: number;
  total: number;
  fives: number;
  place: number;
};
export type Submission = {
  sub_id: string | null;
  player_id: string;
  player_name: string;
  team_id: string;
  team_name: string;
  card_id: string | null;
  score: number | null;
  answer: Record<string, unknown> | null;
  updated_at: string | null;
};

// ===== Sessões salvas no navegador =====
export type PlayerSession = { playerId: string; token: string; roomId: string; code: string };
export type AdminSession = { roomId: string; key: string; code: string; createdAt: number };

const safe = {
  get(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  del(k: string) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

export const sessions = {
  player(code: string): PlayerSession | null {
    const raw = safe.get(`sr_player_${code.toUpperCase()}`);
    return raw ? (JSON.parse(raw) as PlayerSession) : null;
  },
  savePlayer(s: PlayerSession) {
    safe.set(`sr_player_${s.code.toUpperCase()}`, JSON.stringify(s));
  },
  clearPlayer(code: string) {
    safe.del(`sr_player_${code.toUpperCase()}`);
  },
  admins(): AdminSession[] {
    const raw = safe.get('sr_admin_rooms');
    return raw ? (JSON.parse(raw) as AdminSession[]) : [];
  },
  admin(roomId: string): AdminSession | null {
    return sessions.admins().find((a) => a.roomId === roomId) ?? null;
  },
  saveAdmin(s: AdminSession) {
    const list = sessions.admins().filter((a) => a.roomId !== s.roomId);
    list.unshift(s);
    safe.set('sr_admin_rooms', JSON.stringify(list.slice(0, 20)));
  },
};
