import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoans, useLedger } from '../hooks/useData';
import { loanStats } from '../lib/portfolio';
import { inr, fmtDate } from '../lib/format';
import { LOAN_TYPE_LABELS } from '../types';
import { Page, Avatar, Empty, StatusBadge, SegmentedControl, SkeletonList, Icon, ICONS } from '../components/ui';

type Filter = 'active' | 'all' | 'closed';

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

  const activeCount = loans.filter((l) => l.status === 'active').length;

  return (
    <Page
      eyebrow="Ledger"
      title="Loans"
      subtitle={`${activeCount} active · ${loans.length - activeCount} closed`}
      right={
        <Link to="/loans/new" className="btn primary sm">
          <Icon d={ICONS.plus} size={16} /> New
        </Link>
      }
    >
      <div className="search-row">
        <Icon d={ICONS.search} size={18} />
        <input
          className="search"
          placeholder="Search name, phone, notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search loans"
        />
      </div>
      <SegmentedControl<Filter>
        ariaLabel="Filter loans"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'all', label: 'All' },
          { value: 'closed', label: 'Closed' },
        ]}
      />

      {loading ? (
        <SkeletonList rows={5} />
      ) : filtered.length === 0 ? (
        <Empty
          illo={query ? 'search' : 'loans'}
          title={query ? 'No matches found' : filter === 'closed' ? 'No closed loans' : 'No loans yet'}
          text={query ? `Nothing matches “${query}”. Try a different name or phone number.` : 'Add a loan to start tracking repayments and interest.'}
          action={
            !query ? (
              <Link to="/loans/new" className="btn primary">
                <Icon d={ICONS.plus} /> Add a loan
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="loan-list">
          {filtered.map((loan) => {
            const s = loanStats(loan, entries);
            const principalNum = Number(loan.principal) || 0;
            const repaidPct = principalNum > 0 ? Math.min(100, (s.principalPaid / principalNum) * 100) : 0;
            return (
              <Link key={loan.id} to={`/loans/${loan.id}`} className="loan-row">
                <Avatar name={loan.client_name} />
                <div className="loan-row-main">
                  <div className="loan-row-top">
                    <b>{loan.client_name}</b>
                    {filter === 'all' && <StatusBadge status={loan.status} />}
                  </div>
                  <div className="loan-row-sub">
                    {LOAN_TYPE_LABELS[loan.loan_type]} · {inr(loan.principal)}
                  </div>
                  <div className="loan-row-sub small muted" style={{ marginTop: 2 }}>
                    Disbursed {fmtDate(loan.disbursement_date)}
                  </div>
                  {loan.status === 'active' && (
                    <div className="pbar" aria-hidden>
                      <i style={{ width: `${repaidPct}%` }} />
                    </div>
                  )}
                </div>
                <div className="loan-row-amt">
                  <span className="k">Outstanding</span>
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
