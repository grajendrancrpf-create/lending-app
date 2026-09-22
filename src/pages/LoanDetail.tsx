import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLoan, useLedger } from '../hooks/useData';
import { loanStats, nextEmiNumber } from '../lib/portfolio';
import { emiSchedule } from '../lib/emi';
import { inr, fmtDate, fmtPhone, todayISO } from '../lib/format';
import { LOAN_TYPE_LABELS, RATE_TYPE_LABELS } from '../types';
import { Page, Card, Avatar, ProgressRing, Empty, StatusBadge, EntryLabel, entryDotClass, Icon, ICONS, SectionHead, SkeletonList } from '../components/ui';

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
      <Page eyebrow="Loan" title="Loading…">
        <div className="skel" style={{ height: 150, borderRadius: 28, marginBottom: 14 }} />
        <SkeletonList rows={3} />
      </Page>
    );
  }
  if (!loan) {
    return (
      <Page eyebrow="Loan" title="Not found">
        <Empty
          illo="search"
          title="Loan not found"
          text="This loan may have been deleted."
          action={<Link to="/loans" className="btn primary">Back to loans</Link>}
        />
      </Page>
    );
  }

  const stats = loanStats(loan, entries);
  const principalNum = Number(loan.principal) || 0;
  const repaidPct = principalNum > 0 ? Math.min(100, (stats.principalPaid / principalNum) * 100) : 0;
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
      eyebrow="Loan"
      title={loan.client_name}
      subtitle={`${LOAN_TYPE_LABELS[loan.loan_type]} loan · disbursed ${fmtDate(loan.disbursement_date)}`}
      right={<StatusBadge status={loan.status} />}
    >
      {/* identity + repayment hero */}
      <div className="detail-hero">
        <div className="dh-top">
          <Avatar name={loan.client_name} size="lg" />
          <div className="dh-mid">
            <span className="k">Outstanding</span>
            <span className="dh-interest">
              Interest due <b className="warn">{inr(stats.interestDue)}</b>
            </span>
          </div>
          <ProgressRing pct={repaidPct} size={88} />
        </div>
        <div className="amt">{inr(stats.outstanding)}</div>
      </div>

      <div className="action-row">
        {schedule.length > 0 && loan.status === 'active' && (
          <button className="btn primary grow" onClick={markEmiPaid} disabled={busy}>
            <Icon d={ICONS.check} /> Mark EMI paid
          </button>
        )}
        <Link to={`/loans/${loan.id}/ledger/new`} className="btn ghost" aria-label="Add ledger entry">
          <Icon d={ICONS.plus} />
        </Link>
        <Link to={`/loans/${loan.id}/edit`} className="btn ghost" aria-label="Edit loan">
          <Icon d={ICONS.pencil} />
        </Link>
      </div>

      {/* details */}
      <SectionHead title="Details" />
      <Card>
        <dl className="kv">
          <div><dt>Principal</dt><dd>{inr(loan.principal)}</dd></div>
          <div><dt>Rate</dt><dd>{loan.interest_rate}% {RATE_TYPE_LABELS[loan.rate_type].replace(' %', '')}</dd></div>
          <div><dt>Tenure</dt><dd>{loan.tenure_months} months</dd></div>
          {loan.emi_amount && <div><dt>EMI</dt><dd>{inr(loan.emi_amount)} / month</dd></div>}
          <div><dt>Principal paid</dt><dd className="pos">{inr(stats.principalPaid)}</dd></div>
          <div><dt>Interest paid</dt><dd className="pos">{inr(stats.interestPaid)}</dd></div>
          {stats.charges > 0 && <div><dt>Charges</dt><dd>{inr(stats.charges)}</dd></div>}
          {loan.phone && <div><dt>Phone</dt><dd>{fmtPhone(loan.phone)}</dd></div>}
          {loan.pan && <div><dt>PAN</dt><dd>{loan.pan}</dd></div>}
        </dl>
        {loan.notes && <p className="notes">{loan.notes}</p>}
      </Card>

      {/* EMI schedule */}
      {schedule.length > 0 && (
        <>
          <SectionHead title="EMI schedule" />
          <Card>
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
        </>
      )}

      {/* ledger timeline */}
      <SectionHead
        title="Ledger"
        action={<Link to={`/loans/${loan.id}/ledger/new`} className="link sm">+ Add entry</Link>}
      />
      {entries.length === 0 ? (
        <Empty illo="activity" title="No entries yet" text="Record the first payment, charge or adjustment for this loan." />
      ) : (
        <ul className="timeline">
          {entries.map((e) => (
            <li key={e.id} className="tl-item">
              <span className={`tl-dot ${entryDotClass(e.entry_type)}`} />
              <div className="tl-card">
                <div className="tl-top">
                  <EntryLabel type={e.entry_type} />
                  <span className={`tl-amt ${e.entry_type === 'principal_payment' || e.entry_type === 'interest_payment' ? 'pos' : ''}`}>
                    {inr(e.amount)}
                  </span>
                </div>
                <div className="tl-meta">{fmtDate(e.entry_date)}{e.note ? ` · ${e.note}` : ''}</div>
                <div className="tl-actions">
                  <Link to={`/loans/${loan.id}/ledger/${e.id}/edit`} className="link sm">Edit</Link>
                  <button className="link sm danger" onClick={() => deleteEntry(e.id)}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
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
