import type { ReactNode } from 'react';
import { ENTRY_TYPE_LABELS, type EntryType } from '../types';

export function Page({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
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

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <p>{text}</p>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${status}`}>{status === 'active' ? 'Active' : 'Closed'}</span>;
}

const ENTRY_SIGNS: Record<EntryType, { sign: string; cls: string }> = {
  disbursement: { sign: '−', cls: 'neg' },
  principal_payment: { sign: '+', cls: 'pos' },
  interest_payment: { sign: '+', cls: 'pos' },
  charge: { sign: '−', cls: 'neg' },
  adjustment: { sign: '±', cls: 'warn' },
};

export function EntryBadge({ type }: { type: EntryType }) {
  const s = ENTRY_SIGNS[type];
  return (
    <span className={`entry-badge ${s.cls}`}>
      <b>{s.sign}</b> {ENTRY_TYPE_LABELS[type]}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}
