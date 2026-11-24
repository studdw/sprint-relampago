import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, Eraser, GripVertical, Paintbrush, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { SYMBOLS, type CardDef, type ClassifyPart, type FlowPart, type OrderPart, type SinglePart } from '../lib/cards';
import { seededShuffle } from '../lib/useRoom';

export type Answer = Record<string, unknown>;

type Props = { card: CardDef; value: Answer; onChange: (a: Answer) => void; locked: boolean; seed: string };

export function CardPlayer({ card, value, onChange, locked, seed }: Props) {
  if (card.type === 'draw' && card.draw) {
    return <DrawView mode={card.draw.mode} screenLabel={card.draw.screenLabel} value={value} onChange={onChange} locked={locked} />;
  }
  return (
    <div className="space-y-6">
      {card.parts!.map((part, i) => (
        <motion.section
          key={part.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-3xl border border-line bg-surface-2 p-4 sm:p-5"
        >
          <div className="mb-3">
            <h3 className="text-lg font-bold">{part.title}</h3>
            <p className="text-sm text-muted">{part.instructions}</p>
          </div>
          {part.kind === 'classify' && (
            <ClassifyView part={part} value={(value[part.id] as Record<string, string>) ?? {}} locked={locked} seed={seed} onChange={(v) => onChange({ ...value, [part.id]: v })} />
          )}
          {part.kind === 'order' && (
            <OrderView part={part} value={value[part.id] as string[] | undefined} locked={locked} seed={seed} onChange={(v) => onChange({ ...value, [part.id]: v })} />
          )}
          {part.kind === 'flow' && (
            <FlowView part={part} value={value[part.id] as FlowValue | undefined} locked={locked} seed={seed} onChange={(v) => onChange({ ...value, [part.id]: v })} />
          )}
          {part.kind === 'single' && (
            <SingleView part={part} value={value[part.id] as string | undefined} locked={locked} seed={seed} onChange={(v) => onChange({ ...value, [part.id]: v })} />
          )}
        </motion.section>
      ))}
    </div>
  );
}

// ================= Classificar (arrastar para colunas ou ligar) =================
function ClassifyView({ part, value, onChange, locked, seed }: { part: ClassifyPart; value: Record<string, string>; onChange: (v: Record<string, string>) => void; locked: boolean; seed: string }) {
  const items = useMemo(() => seededShuffle(part.items, seed + part.id), [part, seed]);
  const cats = useMemo(() => (part.layout === 'match' ? seededShuffle(part.categories, seed + part.id + 'c') : part.categories), [part, seed]);
  const [selected, setSelected] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const assign = (itemId: string, cat: string | null) => {
    if (locked) return;
    const next = { ...value };
    if (cat) next[itemId] = cat;
    else delete next[itemId];
    onChange(next);
    setSelected(null);
  };

  if (part.layout === 'match') {
    return (
      <div className="space-y-2.5">
        {items.map((it) => {
          const chosen = value[it.id];
          return (
            <div key={it.id} className={`grid gap-2 rounded-2xl border p-3 sm:grid-cols-[1fr_1.2fr] sm:items-center ${chosen ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2'}`}>
              <div className="font-medium">{it.text}</div>
              <select
                className="nice w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
                value={chosen ?? ''}
                disabled={locked}
                onChange={(e) => assign(it.id, e.target.value || null)}
              >
                <option value="">Escolha…</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    );
  }

  const pool = items.filter((i) => !value[i.id]);
  const onDrop = (cat: string | null) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) assign(id, cat);
    setOver(null);
  };
  const chip = (id: string, text: string) => (
    <motion.button
      layout
      layoutId={`chip-${part.id}-${id}`}
      key={id}
      type="button"
      draggable={!locked}
      onDragStart={(e) => (e as unknown as DragEvent).dataTransfer?.setData('text/plain', id)}
      onClick={() => !locked && setSelected(selected === id ? null : id)}
      className={`cursor-grab rounded-xl border px-3 py-2 text-left text-sm font-medium shadow-sm transition-colors active:cursor-grabbing ${
        selected === id ? 'border-accent bg-accent-soft ring-2 ring-accent' : 'border-line bg-surface-3 hover:bg-surface-3'
      }`}
    >
      {text}
    </motion.button>
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver('__pool');
        }}
        onDragLeave={() => setOver(null)}
        onDrop={onDrop(null)}
        onClick={() => selected && value[selected] && assign(selected, null)}
        className={`min-h-[64px] rounded-2xl border border-dashed p-3 transition-colors ${over === '__pool' ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2'}`}
      >
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
          {pool.length ? 'Itens para encaixar · arraste ou toque no item e depois na coluna' : 'Tudo encaixado! Toque num item para mudar de lugar.'}
        </div>
        <div className="flex flex-wrap gap-2">{pool.map((i) => chip(i.id, i.text))}</div>
      </div>
      <div className={`grid gap-3 ${cats.length >= 5 ? 'sm:grid-cols-3 lg:grid-cols-5' : cats.length === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-2'}`}>
        {cats.map((c) => {
          const inCat = items.filter((i) => value[i.id] === c.id);
          return (
            <div
              key={c.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(c.id);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={onDrop(c.id)}
              onClick={() => selected && assign(selected, c.id)}
              className={`min-h-[120px] rounded-2xl border p-3 transition-all ${
                over === c.id ? 'scale-[1.02] border-accent bg-accent-soft' : selected ? 'cursor-pointer border-accent bg-accent-soft hover:bg-accent-soft' : 'border-line bg-surface-2'
              }`}
            >
              <div className="mb-2">
                <div className="font-bold">{c.label}</div>
                {c.hint && <div className="text-xs text-muted">{c.hint}</div>}
              </div>
              <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                {inCat.map((i) => chip(i.id, i.text))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ================= Ordenar =================
function useOrder(ids: string[], value: string[] | undefined, seed: string) {
  return useMemo(() => {
    if (value && value.length === ids.length && ids.every((i) => value.includes(i))) return value;
    return seededShuffle(ids, seed);
  }, [ids, value, seed]);
}

function OrderView({ part, value, onChange, locked, seed }: { part: OrderPart; value?: string[]; onChange: (v: string[]) => void; locked: boolean; seed: string }) {
  const ids = useMemo(() => part.items.map((i) => i.id), [part]);
  const order = useOrder(ids, value, seed + part.id);
  const text = (id: string) => part.items.find((i) => i.id === id)?.text ?? id;
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <Reorder.Group axis="y" values={order} onReorder={(v) => !locked && onChange(v)} className="space-y-2">
      {order.map((id, i) => (
        <Reorder.Item key={id} value={id} dragListener={!locked} className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3 shadow-sm" whileDrag={{ scale: 1.03, boxShadow: '0 12px 30px rgba(0,0,0,.45)' }}>
          <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted"/>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-on-accent text-sm font-bold">{i + 1}</div>
          <div className="flex-1 font-medium">{text(id)}</div>
          <div className="flex gap-1">
            <button type="button" disabled={locked || i === 0} onClick={() => move(i, -1)} className="rounded-lg p-1.5 text-muted hover:bg-surface-3 disabled:opacity-20">
              <ArrowUp className="h-4 w-4"/>
            </button>
            <button type="button" disabled={locked || i === order.length - 1} onClick={() => move(i, 1)} className="rounded-lg p-1.5 text-muted hover:bg-surface-3 disabled:opacity-20">
              <ArrowDown className="h-4 w-4"/>
            </button>
          </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

// ================= Fluxograma (ordem + símbolo) =================
type FlowValue = { order: string[]; symbols: Record<string, string> };

function Shape({ symbol, children, active = true }: { symbol?: string; children?: React.ReactNode; active?: boolean }) {
  const base = 'grid min-h-[52px] place-items-center px-5 py-2 text-center text-sm font-semibold transition-all';
  if (symbol === 'inicio_fim') return <div className={`${base} rounded-full border-2 border-accent bg-accent-soft`}>{children}</div>;
  if (symbol === 'decisao')
    return (
      <div className="relative grid min-h-[70px] place-items-center px-10">
        <div className="absolute inset-y-0 left-1/2 aspect-square h-full -translate-x-1/2 rotate-45 scale-[0.72] rounded-md border-2 border-accent bg-accent-soft"/>
        <div className="relative text-center text-sm font-semibold">{children}</div>
      </div>
    );
  if (symbol === 'atividade') return <div className={`${base} rounded-md border-2 border-accent bg-accent-soft`}>{children}</div>;
  return <div className={`${base} rounded-xl border-2 border-dashed ${active ? 'border-line' : 'border-line'} bg-surface-2`}>{children}</div>;
}

function FlowView({ part, value, onChange, locked, seed }: { part: FlowPart; value?: FlowValue; onChange: (v: FlowValue) => void; locked: boolean; seed: string }) {
  const ids = useMemo(() => part.items.map((i) => i.id), [part]);
  const order = useOrder(ids, value?.order, seed + part.id);
  const symbols = value?.symbols ?? {};
  const text = (id: string) => part.items.find((i) => i.id === id)?.text ?? id;
  const set = (o: string[], s: Record<string, string>) => onChange({ order: o, symbols: s });
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    set(next, symbols);
  };
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-6 rounded-full border-2 border-accent"/> Início/Fim (oval)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-6 rounded-sm border-2 border-accent"/> Atividade (retângulo)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rotate-45 border-2 border-accent"/> Decisão (losango)</span>
      </div>
      <Reorder.Group axis="y" values={order} onReorder={(v) => !locked && set(v, symbols)} className="space-y-1">
        {order.map((id, i) => (
          <Reorder.Item key={id} value={id} dragListener={!locked} className="list-none">
            <div className="grid items-center gap-2 rounded-2xl border border-line bg-surface-2 p-2.5 sm:grid-cols-[auto_1fr_auto]">
              <div className="flex items-center gap-1">
                <GripVertical className="h-5 w-5 cursor-grab text-muted"/>
                <button type="button" disabled={locked || i === 0} onClick={() => move(i, -1)} className="rounded-lg p-1 text-muted hover:bg-surface-3 disabled:opacity-20"><ArrowUp className="h-4 w-4"/></button>
                <button type="button" disabled={locked || i === order.length - 1} onClick={() => move(i, 1)} className="rounded-lg p-1 text-muted hover:bg-surface-3 disabled:opacity-20"><ArrowDown className="h-4 w-4"/></button>
              </div>
              <Shape symbol={symbols[id]}>{text(id)}</Shape>
              <div className="flex gap-1">
                {SYMBOLS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={locked}
                    title={s.label}
                    onClick={() => set(order, { ...symbols, [id]: s.id })}
                    className={`grid h-9 w-11 place-items-center rounded-xl border transition-all ${symbols[id] === s.id ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2 hover:bg-surface-3'}`}
                  >
                    {s.id === 'inicio_fim' && <span className="h-3.5 w-7 rounded-full border-2 border-accent"/>}
                    {s.id === 'atividade' && <span className="h-3.5 w-7 rounded-[3px] border-2 border-accent"/>}
                    {s.id === 'decisao' && <span className="h-3.5 w-3.5 rotate-45 border-2 border-accent"/>}
                  </button>
                ))}
              </div>
            </div>
            {i < order.length - 1 && <div className="mx-auto h-4 w-px bg-line"/>}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

// ================= Escolha única =================
function SingleView({ part, value, onChange, locked, seed }: { part: SinglePart; value?: string; onChange: (v: string) => void; locked: boolean; seed: string }) {
  const opts = useMemo(() => seededShuffle(part.options, seed + part.id), [part, seed]);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={locked}
          onClick={() => onChange(o.id)}
          className={`flex items-center gap-3 rounded-2xl border p-3 text-left font-medium transition-all ${value === o.id ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2 hover:bg-surface-3'}`}
        >
          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${value === o.id ? 'border-accent' : 'border-line'}`}>
            {value === o.id && <span className="h-2.5 w-2.5 rounded-full bg-accent"/>}
          </span>
          {o.text}
        </button>
      ))}
    </div>
  );
}

// ================= Desenho na tela =================
const W = 1200;
const H = 720;
const COLORS = ['#111827', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'];

export function drawGuides(ctx: CanvasRenderingContext2D, mode: 'storyboard' | 'logo', screenLabel = 'TELA DO APP') {
  ctx.save();
  ctx.strokeStyle = '#cbd5e1';
  ctx.fillStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.font = 'bold 30px Outfit, sans-serif';
  if (mode === 'storyboard') {
    ctx.beginPath();
    ctx.moveTo(W / 2, 20);
    ctx.lineTo(W / 2, H - 20);
    ctx.moveTo(20, H / 2);
    ctx.lineTo(W - 20, H / 2);
    ctx.stroke();
    [[30, 50], [W / 2 + 30, 50], [30, H / 2 + 50], [W / 2 + 30, H / 2 + 50]].forEach(([x, y], i) => ctx.fillText(String(i + 1), x, y));
  } else {
    ctx.strokeRect(40, 150, 420, 420);
    ctx.fillText('LOGO', 50, 135);
    ctx.setLineDash([]);
    ctx.lineWidth = 4;
    const px = 690, py = 70, pw = 340, ph = 620;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(px + 120, py + 18, 100, 14, 7);
    ctx.stroke();
    ctx.fillText(screenLabel, px + 40, 52);
  }
  ctx.restore();
}

function DrawView({ mode, screenLabel, value, onChange, locked }: { mode: 'storyboard' | 'logo'; screenLabel?: string; value: Answer; onChange: (a: Answer) => void; locked: boolean }) {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const history = useRef<ImageData[]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(6);
  const [eraser, setEraser] = useState(false);
  const captions = (value.captions as string[] | undefined) ?? ['', '', '', ''];
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const bg = bgRef.current!.getContext('2d')!;
    bg.fillStyle = '#ffffff';
    bg.fillRect(0, 0, W, H);
    drawGuides(bg, mode, screenLabel);
    const ink = inkRef.current!.getContext('2d')!;
    const src = value.ink as string | undefined;
    if (src) {
      const img = new Image();
      img.onload = () => ink.drawImage(img, 0, 0, W, H);
      img.src = src;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const pos = (e: React.PointerEvent) => {
    const r = inkRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const exportAll = () => {
    const ink = inkRef.current!;
    const out = document.createElement('canvas');
    out.width = 900;
    out.height = 540;
    const o = out.getContext('2d')!;
    o.drawImage(bgRef.current!, 0, 0, 900, 540);
    o.drawImage(ink, 0, 0, 900, 540);
    const small = document.createElement('canvas');
    small.width = 900;
    small.height = 540;
    small.getContext('2d')!.drawImage(ink, 0, 0, 900, 540);
    onChange({ ...valueRef.current, drawing: out.toDataURL('image/jpeg', 0.72), ink: small.toDataURL('image/png') });
  };

  const start = (e: React.PointerEvent) => {
    if (locked) return;
    const ctx = inkRef.current!.getContext('2d')!;
    history.current.push(ctx.getImageData(0, 0, W, H));
    if (history.current.length > 25) history.current.shift();
    drawing.current = true;
    last.current = pos(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    stroke(e);
  };
  const stroke = (e: React.PointerEvent) => {
    if (!drawing.current || locked) return;
    const ctx = inkRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = eraser ? size * 4 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    exportAll();
  };
  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    inkRef.current!.getContext('2d')!.putImageData(prev, 0, 0);
    exportAll();
  };
  const clear = () => {
    const ctx = inkRef.current!.getContext('2d')!;
    history.current.push(ctx.getImageData(0, 0, W, H));
    ctx.clearRect(0, 0, W, H);
    exportAll();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface-2 p-2">
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={locked}
              onClick={() => {
                setColor(c);
                setEraser(false);
              }}
              className={`h-8 w-8 rounded-full border-2 transition-transform ${color === c && !eraser ? 'scale-110 border-accent' : 'border-line'}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="mx-1 h-6 w-px bg-surface-3"/>
        {[3, 6, 12].map((s) => (
          <button key={s} type="button" disabled={locked} onClick={() => setSize(s)} className={`grid h-9 w-9 place-items-center rounded-xl ${size === s ? 'bg-surface-3' : 'hover:bg-surface-3'}`}>
            <span className="rounded-full bg-white" style={{ width: s + 2, height: s + 2 }} />
          </button>
        ))}
        <div className="mx-1 h-6 w-px bg-surface-3"/>
        <button type="button" disabled={locked} onClick={() => setEraser(false)} className={`rounded-xl p-2 ${!eraser ? 'bg-surface-3' : 'hover:bg-surface-3'}`} title="Caneta"><Paintbrush className="h-5 w-5"/></button>
        <button type="button" disabled={locked} onClick={() => setEraser(true)} className={`rounded-xl p-2 ${eraser ? 'bg-surface-3' : 'hover:bg-surface-3'}`} title="Borracha"><Eraser className="h-5 w-5"/></button>
        <button type="button" disabled={locked} onClick={undo} className="rounded-xl p-2 hover:bg-surface-3" title="Desfazer"><Undo2 className="h-5 w-5"/></button>
        <button type="button" disabled={locked} onClick={clear} className="rounded-xl p-2 text-danger hover:bg-accent-soft" title="Limpar tudo"><Trash2 className="h-5 w-5"/></button>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-line shadow-2xl" style={{ aspectRatio: `${W}/${H}` }}>
        <canvas ref={bgRef} width={W} height={H} className="absolute inset-0 h-full w-full"/>
        <canvas
          ref={inkRef}
          width={W}
          height={H}
          className={`absolute inset-0 h-full w-full touch-none ${locked ? 'cursor-not-allowed' : eraser ? 'cursor-cell' : 'cursor-crosshair'}`}
          onPointerDown={start}
          onPointerMove={stroke}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
        />
        <AnimatePresence>
          {locked && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 grid place-items-center bg-surface-2 text-lg font-bold">
              <span className="flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2"><RotateCcw className="h-4 w-4"/> Desenho entregue</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {mode === 'storyboard' && (
        <div className="grid gap-2 sm:grid-cols-2">
          {captions.map((c, i) => (
            <label key={i} className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2 px-3 py-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent text-on-accent text-sm font-bold">{i + 1}</span>
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                placeholder={`Legenda do quadro ${i + 1}`}
                maxLength={80}
                disabled={locked}
                value={c}
                onChange={(e) => {
                  const next = [...captions];
                  next[i] = e.target.value;
                  onChange({ ...valueRef.current, captions: next });
                }}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
