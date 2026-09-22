import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ENTRY_TYPE_LABELS, type EntryType } from '../types';

/* ---------------- page shell ---------------- */
export function Page({
  eyebrow,
  title,
  subtitle,
  right,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page">
      <header className="page-head">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {subtitle && <p className="sub">{subtitle}</p>}
        </div>
        {right}
      </header>
      {children}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <h3>{title}</h3>
      {action}
    </div>
  );
}

/* ---------------- avatar ---------------- */
const AVATAR_HUES = ['#6366f1', '#0ea5e9', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444'];

export function Avatar({ name, size = '' }: { name: string; size?: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const bg = AVATAR_HUES[h % AVATAR_HUES.length];
  return (
    <span className={`avatar ${size}`} style={{ background: `linear-gradient(150deg, ${bg}, ${bg}cc)` }} aria-hidden>
      {initials || '–'}
    </span>
  );
}

/* ---------------- progress ring ---------------- */
export function ProgressRing({ pct, size = 92 }: { pct: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * clamped) / 100}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,0.9,0.3,1)', filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.5))' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>
      <span className="ring-center">
        <b>{Math.round(clamped)}%</b>
        <span>repaid</span>
      </span>
    </span>
  );
}

/* ---------------- segmented control ---------------- */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  scroll = false,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  scroll?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className={`seg${scroll ? ' scroll' : ''}`} role="tablist" aria-label={ariaLabel} style={{ marginBottom: 14 }}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- field ---------------- */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small className="muted" style={{ display: 'block', marginTop: 6, fontSize: 12.5 }}>{hint}</small>}
    </label>
  );
}

/* ---------------- badges ---------------- */
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${status}`}>{status === 'active' ? 'Active' : 'Closed'}</span>;
}

const ENTRY_DOT: Record<EntryType, string> = {
  disbursement: 't-neg',
  principal_payment: 't-pos',
  interest_payment: 't-pos',
  charge: 't-neg',
  adjustment: 't-warn',
};

export function entryDotClass(type: EntryType) {
  return ENTRY_DOT[type];
}

export function EntryLabel({ type }: { type: EntryType }) {
  return <b style={{ fontSize: 14 }}>{ENTRY_TYPE_LABELS[type]}</b>;
}

/* ---------------- loading ---------------- */
export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel-row">
          <div className="skel" style={{ width: 46, height: 46, borderRadius: 16 }} />
          <div style={{ flex: 1 }}>
            <div className="skel" style={{ width: '55%', marginBottom: 8 }} />
            <div className="skel" style={{ width: '35%', minHeight: 14 }} />
          </div>
          <div className="skel" style={{ width: 72, minHeight: 22 }} />
        </div>
      ))}
    </div>
  );
}

/* ---------------- empty state ---------------- */
function IlloLoans() {
  return (
    <svg className="empty-illo" viewBox="0 0 120 96" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="14" y="22" width="92" height="58" rx="12" />
      <path d="M14 38h92" />
      <path d="M28 60h22" />
      <circle cx="88" cy="60" r="7" />
      <path d="M88 56.5v7M84.5 60h7" strokeWidth="2" />
    </svg>
  );
}
function IlloActivity() {
  return (
    <svg className="empty-illo" viewBox="0 0 120 96" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 48h18l10-22 14 44 10-30 6 8h34" />
      <circle cx="60" cy="48" r="34" strokeDasharray="5 7" opacity="0.5" />
    </svg>
  );
}
function IlloSearch() {
  return (
    <svg className="empty-illo" viewBox="0 0 120 96" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="52" cy="44" r="24" />
      <path d="m70 62 20 20" />
      <path d="M44 44h16M52 36v16" />
    </svg>
  );
}

export function Empty({
  illo = 'loans',
  title,
  text,
  action,
}: {
  illo?: 'loans' | 'activity' | 'search';
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      {illo === 'loans' && <IlloLoans />}
      {illo === 'activity' && <IlloActivity />}
      {illo === 'search' && <IlloSearch />}
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

/* ---------------- icons ---------------- */
export function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export const ICONS = {
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
  calc: 'M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 15h.01M12 15h.01M15 15h.01M9 18h.01M12 18h.01M15 18h.01M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
  arrowUp: 'M12 19V5m-7 7 7-7 7 7',
  chevR: 'm9 6 6 6-6 6',
  pencil: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
  check: 'M20 6 9 17l-5-5',
  wallet: 'M20 7H4a2 2 0 0 1 0-4h14v4Zm0 0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5',
  trend: 'm22 7-8.5 8.5-5-5L2 17',
  clock: 'M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
};

/* ---------------- count-up ---------------- */
export function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}
