import { Link } from 'react-router-dom';
import { useLoans, useLedger } from '../hooks/useData';
import { useAuth } from '../context/AuthContext';
import { portfolioTotals } from '../lib/portfolio';
import { inr } from '../lib/format';
import { Page, Card, Spinner, Empty } from '../components/ui';

export default function Dashboard() {
  const { profile } = useAuth();
  const { loans, loading: loansLoading } = useLoans();
  const { entries, loading: ledgerLoading } = useLedger();

  const loading = loansLoading || ledgerLoading;
  const totals = portfolioTotals(loans, entries);
  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <Page
      title={firstName ? `Namaste, ${firstName}` : 'Dashboard'}
      subtitle="Your lending portfolio at a glance"
      right={
        <Link to="/calculator" className="btn ghost sm">
          EMI calc
        </Link>
      }
    >
      {loading ? (
        <Spinner />
      ) : loans.length === 0 ? (
        <Empty
          text="No loans yet. Add your first loan to start tracking."
          action={
            <Link to="/loans/new" className="btn primary">
              Add your first loan
            </Link>
          }
        />
      ) : (
        <>
          <div className="stat-grid">
            <Card className="stat hero">
              <span className="stat-label">Principal outstanding</span>
              <span className="stat-value">{inr(totals.outstanding)}</span>
              <span className="stat-sub">
                {totals.activeCount} active loan{totals.activeCount === 1 ? '' : 's'}
              </span>
            </Card>
            <Card className="stat">
              <span className="stat-label">Total disbursed</span>
              <span className="stat-value">{inr(totals.totalDisbursed)}</span>
            </Card>
            <Card className="stat">
              <span className="stat-label">Interest due</span>
              <span className="stat-value warn">{inr(totals.interestDue)}</span>
            </Card>
            <Card className="stat">
              <span className="stat-label">Interest collected</span>
              <span className="stat-value pos">{inr(totals.interestCollected)}</span>
            </Card>
            <Card className="stat">
              <span className="stat-label">Charges</span>
              <span className="stat-value">{inr(totals.charges)}</span>
            </Card>
          </div>

          <div className="count-row">
            <Card className="count-chip">
              <b>{totals.activeCount}</b>
              <span>Active</span>
            </Card>
            <Card className="count-chip">
              <b>{totals.closedCount}</b>
              <span>Closed</span>
            </Card>
            <Link to="/loans/new" className="btn primary grow">
              + New loan
            </Link>
          </div>
        </>
      )}
    </Page>
  );
}
