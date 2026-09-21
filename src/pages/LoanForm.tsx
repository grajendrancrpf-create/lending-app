import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLoan } from '../hooks/useData';
import { calcEmi } from '../lib/emi';
import { inr, todayISO, normalizePhone, isValidPan } from '../lib/format';
import {
  LOAN_TYPE_LABELS,
  RATE_TYPE_LABELS,
  type LoanType,
  type RateType,
} from '../types';
import { Page, Card, Spinner } from '../components/ui';

const LOAN_TYPES = Object.keys(LOAN_TYPE_LABELS) as LoanType[];
const RATE_TYPES = Object.keys(RATE_TYPE_LABELS) as RateType[];

export default function LoanForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loan, loading } = useLoan(id);

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('personal');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [rateType, setRateType] = useState<RateType>('monthly');
  const [disbDate, setDisbDate] = useState(todayISO());
  const [tenure, setTenure] = useState('12');
  const [emiOn, setEmiOn] = useState(true);
  const [status, setStatus] = useState<'active' | 'closed'>('active');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loan) {
      setClientName(loan.client_name);
      setPhone(loan.phone ?? '');
      setPan(loan.pan ?? '');
      setLoanType(loan.loan_type);
      setPrincipal(String(loan.principal));
      setRate(String(loan.interest_rate));
      setRateType(loan.rate_type);
      setDisbDate(loan.disbursement_date);
      setTenure(String(loan.tenure_months));
      setEmiOn(loan.emi_amount != null && Number(loan.emi_amount) > 0);
      setStatus(loan.status);
      setNotes(loan.notes ?? '');
    }
  }, [loan]);

  const principalNum = parseFloat(principal) || 0;
  const rateNum = parseFloat(rate) || 0;
  const tenureNum = parseInt(tenure, 10) || 0;
  const emiPreview =
    emiOn && principalNum > 0 && tenureNum > 0
      ? calcEmi(principalNum, rateNum, rateType, tenureNum)
      : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientName.trim()) return setError('Client name is required.');
    if (principalNum <= 0) return setError('Principal must be greater than zero.');
    if (rateNum < 0) return setError('Interest rate cannot be negative.');
    if (tenureNum < 1) return setError('Tenure must be at least 1 month.');
    if (pan.trim() && !isValidPan(pan))
      return setError('PAN looks invalid — expected format ABCDE1234F.');
    if (!user) return setError('You must be signed in.');

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        client_name: clientName.trim(),
        phone: normalizePhone(phone) || null,
        pan: pan.trim() ? pan.trim().toUpperCase() : null,
        loan_type: loanType,
        principal: principalNum,
        interest_rate: rateNum,
        rate_type: rateType,
        disbursement_date: disbDate,
        tenure_months: tenureNum,
        emi_amount: emiOn ? Math.round(emiPreview * 100) / 100 : null,
        status,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        const { error } = await db().from('loans').update(payload).eq('id', id);
        if (error) throw error;
        navigate(`/loans/${id}`);
      } else {
        const { data, error } = await db().from('loans').insert(payload).select('id').single();
        if (error) throw error;
        // Seed the ledger with the disbursement entry.
        await db().from('ledger_entries').insert({
          user_id: user.id,
          loan_id: (data as { id: string }).id,
          entry_type: 'disbursement',
          amount: principalNum,
          entry_date: disbDate,
          note: 'Loan disbursed',
        });
        navigate(`/loans/${(data as { id: string }).id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the loan.');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading) {
    return (
      <Page title="Edit loan">
        <Spinner />
      </Page>
    );
  }

  return (
    <Page title={isEdit ? 'Edit loan' : 'New loan'} subtitle={isEdit ? loan?.client_name : 'Enter the loan details'}>
      <form onSubmit={save}>
        <Card>
          <label className="field">
            <span>Client name *</span>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Rajesh Kumar" />
          </label>
          <div className="grid2">
            <label className="field">
              <span>Phone</span>
              <div className="phone-wrap">
                <span className="phone-prefix">+91</span>
                <input
                  value={phone.replace(/^\+91/, '')}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  inputMode="numeric"
                  maxLength={12}
                />
              </div>
            </label>
            <label className="field">
              <span>PAN (optional)</span>
              <input
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />
            </label>
          </div>
          <label className="field">
            <span>Loan type</span>
            <select value={loanType} onChange={(e) => setLoanType(e.target.value as LoanType)}>
              {LOAN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LOAN_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        </Card>

        <Card>
          <label className="field">
            <span>Principal (₹) *</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="100000"
              inputMode="decimal"
            />
          </label>
          <div className="grid2">
            <label className="field">
              <span>Interest rate *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="2"
                inputMode="decimal"
              />
            </label>
            <label className="field">
              <span>Rate type</span>
              <select value={rateType} onChange={(e) => setRateType(e.target.value as RateType)}>
                {RATE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {RATE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid2">
            <label className="field">
              <span>Disbursement date</span>
              <input type="date" value={disbDate} onChange={(e) => setDisbDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Tenure (months)</span>
              <input
                type="number"
                min="1"
                step="1"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                inputMode="numeric"
              />
            </label>
          </div>

          <label className="toggle-row">
            <span>
              <b>EMI loan</b>
              <small className="muted">Calculate EMI on reducing balance</small>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={emiOn}
              className={`switch${emiOn ? ' on' : ''}`}
              onClick={() => setEmiOn((v) => !v)}
            >
              <i />
            </button>
          </label>
          {emiOn && emiPreview > 0 && (
            <div className="emi-preview">
              Monthly EMI <b>{inr(emiPreview)}</b>
              <small className="muted">
                {' '}
                · {tenureNum} months · total {inr(emiPreview * tenureNum)}
              </small>
            </div>
          )}
        </Card>

        <Card>
          <div className="grid2">
            <label className="field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'closed')}>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Notes / reference</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reference number, guarantor, remarks…"
              rows={3}
            />
          </label>
        </Card>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn primary grow" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create loan'}
          </button>
        </div>
      </form>
    </Page>
  );
}
