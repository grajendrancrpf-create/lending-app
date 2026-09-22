import { Link } from 'react-router-dom';
import { useLoans, useLedger, useActivityFeed } from '../hooks/useData';
import { useAuth } from '../context/AuthContext';
import { portfolioTotals } from '../lib/portfolio';
import { inr, fmtDate } from '../lib/format';
import { Page, Card, Avatar, Empty, SkeletonList, Icon, ICONS, useCountUp, entryDotClass, SectionHead } from '../components/ui';

export default function Dashboard() {
  const { profile } = useAuth();
  const { loans, loading: loansLoading } = useLoans();
  const { entries, loading: ledgerLoading } = useLedger();
  const { entries: feed, loading: feedLoading } = useActivityFeed();

  const loading = loansLoading || ledgerLoading || feedLoading;
  const totals = portfolioTotals(loans, entries);
  const firstName = profile?.full_name?.split(' ')[0];
  const outstanding = useCountUp(totals.outstanding);
  const recent = feed.slice(0, 4);

  return (
    <Page
      eyebrow="Portfolio"
      title={firstName ? `Namaste, ${firstName}` : 'Your portfolio'}
      subtitle="Your lending business at a glance"
      right={
        <Link to="/settings" aria-label="Settings">
          <Avatar name={profile?.full_name || 'You'} />
        </Link>
      }
    >
      {loading ? (
        <>
          <div className="skel" style={{ height: 208, borderRadius: 28, marginBottom: 14 }} />
          <SkeletonList rows={3} />
        </>
      ) : loans.length === 0 ? (
        <Empty
          illo="loans"
          title="Your ledger is empty"
          text="Add your first loan and LendTrack will handle the EMIs, interest and payment history for you."
          action={
            <Link to="/loans/new" className="btn brass">
              <Icon d={ICONS.plus} /> Add your first loan
            </Link>
          }
        />
      ) : (
        <>
          {/* portfolio hero */}
          <div className="hero">
            <span className="eyebrow">Total outstanding</span>
            <div className="hero-amount count-up">{inr(outstanding)}</div>
            <div className="hero-sub">
              across {totals.activeCount} active loan{totals.activeCount === 1 ? '' : 's'}
            </div>
            <div className="hero-foot">
              <div className="hero-chip">
                <div className="k">Disbursed</div>
                <div className="v">{inr(totals.totalDisbursed)}</div>
              </div>
              <div className="hero-chip">
                <div className="k">Interest due</div>
                <div className="v">{inr(totals.interestDue)}</div>
              </div>
            </div>
          </div>

          {/* quick actions */}
          <div className="quick-actions">
            <Link to="/loans/new" className="quick-action">
              <span className="dot-ico tint-cyan">
                <Icon d={ICONS.plus} />
              </span>
              New loan
            </Link>
            <Link to="/loans" className="quick-action">
              <span className="dot-ico tint-emerald">
                <Icon d={ICONS.arrowUp} />
              </span>
              Record payment
            </Link>
            <Link to="/calculator" className="quick-action">
              <span className="dot-ico tint-amber">
                <Icon d={ICONS.calc} />
              </span>
              EMI calculator
            </Link>
          </div>

          {/* portfolio breakdown */}
          <SectionHead title="Breakdown" action={<Link to="/activity" className="link sm">View activity</Link>} />
          <Card>
            <div className="stat-row">
              <span className="lbl">
                <span className="dot-ico tint-amber">
                  <Icon d={ICONS.clock} size={17} />
                </span>
                <span>Interest due<span className="sub">Yet to be collected</span></span>
              </span>
              <span className="val warn tnum">{inr(totals.interestDue)}</span>
            </div>
            <div className="stat-row">
              <span className="lbl">
                <span className="dot-ico tint-emerald">
                  <Icon d={ICONS.trend} size={17} />
                </span>
                <span>Interest collected<span className="sub">Earnings so far</span></span>
              </span>
              <span className="val pos tnum">{inr(totals.interestCollected)}</span>
            </div>
            <div className="stat-row">
              <span className="lbl">
                <span className="dot-ico tint-white">
                  <Icon d={ICONS.wallet} size={17} />
                </span>
                <span>Charges & fees</span>
              </span>
              <span className="val tnum">{inr(totals.charges)}</span>
            </div>
            <div className="stat-row">
              <span className="lbl">
                <span className="dot-ico tint-cyan">
                  <Icon d={ICONS.check} size={17} />
                </span>
                <span>Closed loans</span>
              </span>
              <span className="val tnum">{totals.closedCount}</span>
            </div>
          </Card>

          {/* recent activity */}
          {recent.length > 0 && (
            <>
              <SectionHead title="Recent activity" action={<Link to="/activity" className="link sm">See all</Link>} />
              <ul className="timeline">
                {recent.map((e) => (
                  <li key={e.id} className="tl-item">
                    <span className={`tl-dot ${entryDotClass(e.entry_type)}`} />
                    <Link to={`/loans/${e.loan_id}`} className="tl-card">
                      <div className="tl-top">
                        <b>{e.client_name}</b>
                        <span className={`tl-amt ${e.entry_type === 'principal_payment' || e.entry_type === 'interest_payment' ? 'pos' : ''}`}>
                          {inr(e.amount)}
                        </span>
                      </div>
                      <div className="tl-meta">{fmtDate(e.entry_date)}{e.note ? ` · ${e.note}` : ''}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Page>
  );
}
