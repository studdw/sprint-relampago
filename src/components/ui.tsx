import { createContext, useCallback, useContext, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { fmt } from '../lib/useRoom';

// ===== Tema (Branco e vermelho / Azul e preto) =====
export type ThemeName = 'vermelho' | 'azul';
const THEME_KEY = 'sr_theme';
function readTheme(): ThemeName {
  try {
    return localStorage.getItem(THEME_KEY) === 'azul' ? 'azul' : 'vermelho';
  } catch {
    return 'vermelho';
  }
}
export function applyStoredTheme() {
  document.documentElement.dataset.theme = readTheme();
}

/** Seletor de tema que fica no topo de todas as telas */
export function ThemeSwitch() {
  const [theme, setTheme] = useState<ThemeName>(readTheme);
  const pick = (t: ThemeName) => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* ignore */
    }
  };
  const opt = (t: ThemeName, label: string, a: string, b: string) => (
    <button
      type="button"
      onClick={() => pick(t)}
      aria-pressed={theme === t}
      className={`flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${theme === t ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg'}`}
    >
      <span className="flex overflow-hidden rounded-full ring-1 ring-line">
        <span className="h-3.5 w-2" style={{ background: a }} />
        <span className="h-3.5 w-2" style={{ background: b }} />
      </span>
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1">
      <span className="hidden px-1.5 text-xs text-muted sm:inline">Tema</span>
      {opt('vermelho', 'Branco e vermelho', '#ffffff', '#d62828')}
      {opt('azul', 'Azul e preto', '#0a0a0c', '#2563eb')}
    </div>
  );
}

export function Shell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const w = wide ? 'max-w-[1400px]' : 'max-w-5xl';
  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="border-b border-line bg-surface">
        <div className={`mx-auto flex items-center justify-end px-4 py-1.5 sm:px-6 ${w}`}>
          <ThemeSwitch />
        </div>
      </div>
      <div className={`mx-auto px-4 py-6 sm:px-6 ${w}`}>{children}</div>
    </div>
  );
}

export function Glass({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl ${className}`}>{children}</div>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};
export function Button({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...rest }: BtnProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer select-none';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5', lg: 'px-7 py-4 text-lg' }[size];
  const variants = {
    primary: 'bg-accent text-on-accent hover:brightness-110',
    success: 'bg-accent text-on-accent hover:brightness-110',
    danger: 'bg-danger text-on-accent hover:brightness-110',
    ghost: 'text-fg border border-line bg-surface hover:bg-surface-2',
    soft: 'text-accent bg-accent-soft border border-accent hover:brightness-95',
  }[variant];
  return (
    <button className={`${base} ${sizes} ${variants} ${className}`} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Etiqueta simples; `accent` destaca na cor do tema. */
export function Badge({ children, accent, className = '' }: { children: ReactNode; accent?: boolean; color?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        accent ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface-2 text-fg'
      } ${className}`}
    >
      {children}
    </span>
  );
}

export const ROLE_LABEL = { po: 'Product Owner', sm: 'Scrum Master', dev: 'Developer' } as const;
export function RoleBadge({ role }: { role: 'po' | 'sm' | 'dev' }) {
  const icon = role === 'po' ? '👑' : role === 'sm' ? '🛡️' : '💻';
  return (
    <Badge accent={role === 'po'}>
      {icon} {role === 'dev' ? 'Dev' : role.toUpperCase()}
    </Badge>
  );
}

/** Cronômetro circular */
export function TimerRing({ remaining, total, size = 180, label }: { remaining: number; total: number; size?: number; label?: string }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const danger = remaining <= 30;
  return (
    <div className={`relative inline-grid place-items-center rounded-full ${danger && remaining > 0 ? 'pulse-ring' : ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-3)" strokeWidth="10" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={danger ? 'var(--danger)' : 'var(--accent)'}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.4s' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={`font-mono font-extrabold tabular-nums ${danger ? 'text-danger' : 'text-fg'}`} style={{ fontSize: size * 0.24 }}>
          {fmt(remaining)}
        </div>
        {label && <div className="text-[11px] uppercase tracking-widest text-muted">{label}</div>}
      </div>
    </div>
  );
}

export function Spinner({ text = 'Carregando…' }: { text?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center text-muted">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" /> {text}
      </div>
    </div>
  );
}

export function StepBar({ status }: { status: string }) {
  const steps = [
    ['lobby', 'Entrada'],
    ['planning', 'Planning'],
    ['sprint', 'Sprint'],
    ['review', 'Review'],
    ['results', 'Resultado'],
  ];
  const idx = steps.findIndex((s) => s[0] === status);
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scroll-thin">
      {steps.map(([id, label], i) => (
        <div key={id} className="flex items-center gap-1.5">
          <div
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              i < idx ? 'bg-surface-2 text-fg' : i === idx ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted opacity-60'
            }`}
          >
            {i < idx ? '✓ ' : ''}
            {label}
          </div>
          {i < steps.length - 1 && <div className="h-px w-4 bg-line" />}
        </div>
      ))}
    </div>
  );
}

// ===== Toasts =====
type Toast = { id: number; kind: 'error' | 'success'; text: string };
const ToastCtx = createContext<{ error: (t: string) => void; success: (t: string) => void }>({ error: () => {}, success: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const api = { error: (t: string) => push('error', t), success: (t: string) => push('success', t) };
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`glass pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg ${t.kind === 'error' ? 'border-danger' : 'border-ok'}`}
            >
              {t.kind === 'error' ? <AlertTriangle className="h-5 w-5 shrink-0 text-danger" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-ok" />}
              <span>{t.text}</span>
              <button className="ml-1 text-muted hover:text-fg" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`grid place-items-center rounded-2xl bg-accent text-on-accent ${small ? 'h-9 w-9 text-lg' : 'h-12 w-12 text-2xl'}`}>⚡</div>
      <div className="leading-tight">
        <div className={`font-extrabold tracking-tight ${small ? 'text-base' : 'text-xl'}`}>Sprint Relâmpago</div>
        {!small && <div className="text-xs text-muted">Scrum na prática · tema surpresa</div>}
      </div>
    </div>
  );
}
