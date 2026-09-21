import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLoan, useLedger } from '../hooks/useData';
import { loanStats, nextEmiNumber } from '../lib/portfolio';
import { emiSchedule } from '../lib/emi';
import { inr, fmtDate, fmtPhone, todayISO } from '../lib/format';
import { LOAN_TYPE_LABELS, RATE_TYPE_LABELS } from '../types';
import { Page, Card, Spinner, Empty, StatusBadge, EntryBadge } from '../components/ui';

export default function LoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loan, loading: loanLoading, refresh: refreshLoan } = useLoan(id);
  const { entries, loading: ledgerLoading, refresh: refreshLedger } = useLedger(id);
  const [busy, setBusy] = useState(false);

  const loading = loanLoading || ledgerLoading;

  const toggleStatus = async () => {
    if (!loan) return;
    setBusy(true);
    const next = loan.status === 'active' ? 'closed' : 'active';
    const { error } = await db()
      .from('loans')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', loan.id);
    setBusy(false);
    if (!error) void refreshLoan();
  };

  const removeLoan = async () => {
    if (!loan) return;
    if (!window.confirm(`Delete the loan for ${loan.client_name}? All its ledger entries will be removed too.`)) return;
    setBusy(true);
    const { error } = await db().from('loans').delete().eq('id', loan.id);
    setBusy(false);
    if (!error) navigate('/loans');
  };

  const deleteEntry = async (entryId: string) => {
    if (!window.confirm('Delete this ledger entry?')) return;
    const { error } = await db().from('ledger_entries').delete().eq('id', entryId);
    if (!error) void refreshLedger();
  };

  const markEmiPaid = async () => {
    if (!loan || !user) return;
    const schedule = emiSchedule(
      Number(loan.principal),
      Number(loan.interest_rate),
      loan.rate_type,
      Number(loan.tenure_months),
      loan.disbursement_date
    );
    const n = nextEmiNumber(entries);
    const row = schedule[n - 1];
    if (!row) {
      window.alert('All scheduled EMIs appear to be paid.');
      return;
    }
    if (!window.confirm(`Mark EMI #${n} as paid?\nPrincipal ${inr(row.principal)} + Interest ${inr(row.interest)} = ${inr(row.emi)}`)) return;
    setBusy(true);
    const { error } = await db().from('ledger_entries').insert([
      {
        user_id: user.id,
        loan_id: loan.id,
        entry_type: 'principal_payment',
        amount: row.principal,
        entry_date: todayISO(),
        note: `EMI #${n} — principal`,
      },
      {
        user_id: user.id,
        loan_id: loan.id,
        entry_type: 'interest_payment',
        amount: row.interest,
        entry_date: todayISO(),
        note: `EMI #${n} — interest`,
      },
    ]);
    setBusy(false);
    if (!error) void refreshLedger();
  };

  if (loading) {
    return (
      <Page title="Loan">
        <Spinner />
      </Page>
    );
  }
  if (!loan) {
    return (
      <Page title="Loan">
        <Empty text="Loan not found." action={<Link to="/loans" className="btn primary">Back to loans</Link>} />
      </Page>
    );
  }

  const stats = loanStats(loan, entries);
  const schedule =
    loan.emi_amount && Number(loan.tenure_months) > 0
      ? emiSchedule(
          Number(loan.principal),
          Number(loan.interest_rate),
          loan.rate_type,
          Number(loan.tenure_months),
          loan.disbursement_date
        )
      : [];

  return (
    <Page
      title={loan.client_name}
      subtitle={`${LOAN_TYPE_LABELS[loan.loan_type]} loan · disbursed ${fmtDate(loan.disbursement_date)}`}
      right={<StatusBadge status={loan.status} />}
    >
      <Card className="detail-hero">
        <div className="detail-hero-row">
          <div>
            <span className="stat-label">Outstanding principal</span>
            <span className="stat-value">{inr(stats.outstanding)}</span>
          </div>
          <div className="detail-hero-right">
            <span className="stat-label">Interest due</span>
            <span className="stat-value warn sm">{inr(stats.interestDue)}</span>
          </div>
        </div>
        <dl className="kv">
          <div><dt>Principal</dt><dd>{inr(loan.principal)}</dd></div>
          <div><dt>Rate</dt><dd>{loan.interest_rate}% {RATE_TYPE_LABELS[loan.rate_type]}</dd></div>
          <div><dt>Tenure</dt><dd>{loan.tenure_months} months</dd></div>
          <div><dt>Phone</dt><dd>{fmtPhone(loan.phone)}</dd></div>
          {loan.pan && <div><dt>PAN</dt><dd>{loan.pan}</dd></div>}
          {loan.emi_amount && <div><dt>EMI</dt><dd>{inr(loan.emi_amount)} / month</dd></div>}
          <div><dt>Principal paid</dt><dd className="pos">{inr(stats.principalPaid)}</dd></div>
          <div><dt>Interest paid</dt><dd className="pos">{inr(stats.interestPaid)}</dd></div>
          {stats.charges > 0 && <div><dt>Charges</dt><dd>{inr(stats.charges)}</dd></div>}
        </dl>
        {loan.notes && <p className="notes">{loan.notes}</p>}
      </Card>

      <div className="action-row">
        {schedule.length > 0 && loan.status === 'active' && (
          <button className="btn primary grow" onClick={markEmiPaid} disabled={busy}>
            Mark EMI paid
          </button>
        )}
        <Link to={`/loans/${loan.id}/ledger/new`} className="btn grow">
          + Entry
        </Link>
        <Link to={`/loans/${loan.id}/edit`} className="btn ghost">
          Edit
        </Link>
      </div>

      {schedule.length > 0 && (
        <Card>
          <h3 className="card-title">EMI schedule</h3>
          <div className="table-wrap">
            <table className="sched">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Due</th>
                  <th>EMI</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((r) => (
                  <tr key={r.n}>
                    <td>{r.n}</td>
                    <td>{fmtDate(r.date)}</td>
                    <td>{inr(r.emi)}</td>
                    <td>{inr(r.principal)}</td>
                    <td>{inr(r.interest)}</td>
                    <td>{inr(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <h3 className="section-title">Ledger</h3>
      {entries.length === 0 ? (
        <Empty text="No ledger entries yet." />
      ) : (
        <div className="entry-list">
          {entries.map((e) => (
            <Card key={e.id} className="entry-row">
              <div>
                <EntryBadge type={e.entry_type} />
                <div className="muted small">{fmtDate(e.entry_date)}{e.note ? ` · ${e.note}` : ''}</div>
              </div>
              <div className="entry-right">
                <b className={e.entry_type === 'principal_payment' || e.entry_type === 'interest_payment' ? 'pos' : ''}>
                  {inr(e.amount)}
                </b>
                <div className="entry-actions">
                  <Link to={`/loans/${loan.id}/ledger/${e.id}/edit`} className="link sm">Edit</Link>
                  <button className="link sm danger" onClick={() => deleteEntry(e.id)}>Delete</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="danger-zone">
        <button className="btn ghost" onClick={toggleStatus} disabled={busy}>
          {loan.status === 'active' ? 'Mark as closed' : 'Reopen loan'}
        </button>
        <button className="btn danger-ghost" onClick={removeLoan} disabled={busy}>
          Delete loan
        </button>
      </div>
    </Page>
  );
}
