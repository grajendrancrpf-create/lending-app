import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActivityFeed } from '../hooks/useData';
import { inr, fmtDate } from '../lib/format';
import { ENTRY_TYPE_LABELS, type EntryType } from '../types';
import { Page, Empty, SkeletonList, SegmentedControl, EntryLabel, entryDotClass } from '../components/ui';

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
    <Page
      eyebrow="Timeline"
      title="Activity"
      subtitle="Latest ledger entries across all loans"
    >
      <SegmentedControl<Filter>
        ariaLabel="Filter activity"
        scroll
        value={filter}
        onChange={setFilter}
        options={filters.map((f) => ({
          value: f,
          label: f === 'all' ? 'All' : ENTRY_TYPE_LABELS[f],
        }))}
      />

      {loading ? (
        <SkeletonList rows={5} />
      ) : filtered.length === 0 ? (
        <Empty
          illo="activity"
          title="Nothing here yet"
          text="Record a payment or charge from a loan's page and it will show up here."
        />
      ) : (
        <ul className="timeline">
          {filtered.map((e) => (
            <li key={e.id} className="tl-item">
              <span className={`tl-dot ${entryDotClass(e.entry_type)}`} />
              <Link to={`/loans/${e.loan_id}`} className="tl-card">
                <div className="tl-top">
                  <div>
                    <b style={{ fontSize: 15 }}>{e.client_name}</b>
                    <div style={{ marginTop: 2 }}><EntryLabel type={e.entry_type} /></div>
                  </div>
                  <span className={`tl-amt ${e.entry_type === 'principal_payment' || e.entry_type === 'interest_payment' ? 'pos' : ''}`}>
                    {inr(e.amount)}
                  </span>
                </div>
                <div className="tl-meta">{fmtDate(e.entry_date)}{e.note ? ` · ${e.note}` : ''}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
