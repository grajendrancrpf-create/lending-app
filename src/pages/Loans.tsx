import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoans, useLedger } from '../hooks/useData';
import { loanStats } from '../lib/portfolio';
import { inr, fmtDate, fmtPhone } from '../lib/format';
import { LOAN_TYPE_LABELS } from '../types';
import { Page, Spinner, Empty, StatusBadge } from '../components/ui';

type Filter = 'all' | 'active' | 'closed';

export default function Loans() {
  const { loans, loading } = useLoans();
  const { entries } = useLedger();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('active');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return loans.filter((l) => {
      if (filter !== 'all' && l.status !== filter) return false;
      if (!q) return true;
      return (
        l.client_name.toLowerCase().includes(q) ||
        (l.phone ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (l.notes ?? '').toLowerCase().includes(q)
      );
    });
  }, [loans, query, filter]);

  return (
    <Page
      title="Loans"
      subtitle={`${loans.filter((l) => l.status === 'active').length} active`}
      right={
        <Link to="/loans/new" className="btn primary sm">
          + New
        </Link>
      }
    >
      <div className="search-row">
        <input
          className="search"
          placeholder="Search name, phone, notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="filter-tabs" role="tablist">
        {(['active', 'all', 'closed'] as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`filter-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Empty
          text={query ? 'No loans match your search.' : 'No loans in this view yet.'}
          action={
            !query ? (
              <Link to="/loans/new" className="btn primary">
                Add a loan
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="loan-list">
          {filtered.map((loan) => {
            const s = loanStats(loan, entries);
            return (
              <Link key={loan.id} to={`/loans/${loan.id}`} className="loan-row">
                <div className="loan-row-main">
                  <div className="loan-row-top">
                    <b>{loan.client_name}</b>
                    <StatusBadge status={loan.status} />
                  </div>
                  <div className="loan-row-sub muted">
                    {LOAN_TYPE_LABELS[loan.loan_type]} · {inr(loan.principal)} · {fmtPhone(loan.phone)}
                  </div>
                  <div className="loan-row-sub muted small">
                    Disbursed {fmtDate(loan.disbursement_date)}
                    {loan.emi_amount ? ` · EMI ${inr(loan.emi_amount)}` : ''}
                  </div>
                </div>
                <div className="loan-row-amt">
                  <span className="muted small">Outstanding</span>
                  <b>{inr(s.outstanding)}</b>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Page>
  );
}
