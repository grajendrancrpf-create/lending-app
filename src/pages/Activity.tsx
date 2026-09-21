import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActivityFeed } from '../hooks/useData';
import { inr, fmtDate } from '../lib/format';
import { ENTRY_TYPE_LABELS, type EntryType } from '../types';
import { Page, Card, Spinner, Empty, EntryBadge } from '../components/ui';

type Filter = 'all' | EntryType;

export default function Activity() {
  const { entries, loading } = useActivityFeed();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? entries : entries.filter((e) => e.entry_type === filter)),
    [entries, filter]
  );

  const filters: Filter[] = ['all', 'principal_payment', 'interest_payment', 'disbursement', 'charge', 'adjustment'];

  return (
    <Page title="Activity" subtitle="Latest ledger entries across all loans">
      <div className="filter-tabs scroll">
        {filters.map((f) => (
          <button
            key={f}
            className={`filter-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : ENTRY_TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Empty text="No entries yet. Record a payment or charge from a loan's page." />
      ) : (
        <div className="entry-list">
          {filtered.map((e) => (
            <Link key={e.id} to={`/loans/${e.loan_id}`} className="entry-link">
              <Card className="entry-row">
                <div>
                  <b className="entry-client">{e.client_name}</b>
                  <div>
                    <EntryBadge type={e.entry_type} />
                  </div>
                  <div className="muted small">
                    {fmtDate(e.entry_date)}{e.note ? ` · ${e.note}` : ''}
                  </div>
                </div>
                <b className={e.entry_type === 'principal_payment' || e.entry_type === 'interest_payment' ? 'pos' : ''}>
                  {inr(e.amount)}
                </b>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
