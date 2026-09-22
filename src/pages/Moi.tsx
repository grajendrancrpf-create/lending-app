import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMoiEntries } from '../hooks/useData';
import { inr, fmtDate } from '../lib/format';
import { MOI_OCCASION_LABELS, type MoiOccasionType } from '../types';
import { Page, Avatar, Empty, SegmentedControl, SkeletonList, Icon, ICONS } from '../components/ui';

const OCCASIONS = Object.keys(MOI_OCCASION_LABELS) as MoiOccasionType[];
type Filter = 'all' | MoiOccasionType;

export default function Moi() {
  const { moiEntries, loading } = useMoiEntries();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const total = useMemo(
    () => moiEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [moiEntries]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return moiEntries.filter((e) => {
      if (filter !== 'all' && e.occasion_type !== filter) return false;
      if (!q) return true;
      return (
        e.family_name.toLowerCase().includes(q) ||
        (e.occasion_of ?? '').toLowerCase().includes(q) ||
        (e.notes ?? '').toLowerCase().includes(q)
      );
    });
  }, [moiEntries, query, filter]);

  return (
    <Page
      eyebrow="Family"
      title="MOI"
      subtitle={
        moiEntries.length === 0
          ? 'Gifts given at family occasions'
          : `${inr(total)} given · ${moiEntries.length} occasion${moiEntries.length === 1 ? '' : 's'}`
      }
      right={
        <Link to="/moi/new" className="btn primary sm">
          <Icon d={ICONS.plus} size={16} /> New
        </Link>
      }
    >
      <div className="search-row">
        <Icon d={ICONS.search} size={18} />
        <input
          className="search"
          placeholder="Search family, person, notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search MOI entries"
        />
      </div>
      <SegmentedControl<Filter>
        ariaLabel="Filter by occasion"
        scroll
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          ...OCCASIONS.map((o) => ({ value: o as Filter, label: MOI_OCCASION_LABELS[o] })),
        ]}
      />

      {loading ? (
        <SkeletonList rows={5} />
      ) : filtered.length === 0 ? (
        <Empty
          illo={query ? 'search' : 'activity'}
          title={query ? 'No matches found' : 'No MOI entries yet'}
          text={
            query
              ? `Nothing matches “${query}”. Try a different family or person name.`
              : 'Record money you give at marriages, housewarmings and other family occasions — so you always know what went where.'
          }
          action={
            !query ? (
              <Link to="/moi/new" className="btn primary">
                <Icon d={ICONS.plus} /> Add MOI entry
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="loan-list">
          {filtered.map((e) => (
            <Link key={e.id} to={`/moi/${e.id}/edit`} className="loan-row">
              <Avatar name={e.family_name} />
              <div className="loan-row-main">
                <div className="loan-row-top">
                  <b>{e.family_name}</b>
                </div>
                <div className="loan-row-sub">
                  {MOI_OCCASION_LABELS[e.occasion_type]}
                  {e.occasion_of ? ` · ${e.occasion_of}` : ''}
                </div>
                <div className="loan-row-sub small muted" style={{ marginTop: 2 }}>
                  {fmtDate(e.entry_date)}
                  {e.notes ? ` · ${e.notes}` : ''}
                </div>
              </div>
              <div className="loan-row-amt">
                <span className="k">Given</span>
                <b>{inr(e.amount)}</b>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
