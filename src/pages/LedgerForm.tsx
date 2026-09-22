import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLoan } from '../hooks/useData';
import { todayISO } from '../lib/format';
import { ENTRY_TYPE_LABELS, type EntryType } from '../types';
import { Page, Card, Field, SegmentedControl, SkeletonList } from '../components/ui';

const ENTRY_TYPES = Object.keys(ENTRY_TYPE_LABELS) as EntryType[];

export default function LedgerForm() {
  const { id: loanId, entryId } = useParams();
  const isEdit = Boolean(entryId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loan, loading } = useLoan(loanId);

  const [entryType, setEntryType] = useState<EntryType>('principal_payment');
  const [amount, setAmount] = useState('');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !loanId) return;
    (async () => {
      const { data } = await db().from('ledger_entries').select('*').eq('id', entryId).maybeSingle();
      if (data) {
        const e = data as { entry_type: EntryType; amount: number; entry_date: string; note: string | null };
        setEntryType(e.entry_type);
        setAmount(String(e.amount));
        setEntryDate(e.entry_date);
        setNote(e.note ?? '');
      }
    })();
  }, [isEdit, entryId, loanId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) return setError('Amount must be greater than zero.');
    if (!entryDate) return setError('Please pick a date.');
    if (!user || !loanId) return setError('Something went wrong — please try again.');

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        loan_id: loanId,
        entry_type: entryType,
        amount: Math.round(amt * 100) / 100,
        entry_date: entryDate,
        note: note.trim() || null,
      };
      if (isEdit) {
        const { error } = await db().from('ledger_entries').update(payload).eq('id', entryId);
        if (error) throw error;
      } else {
        const { error } = await db().from('ledger_entries').insert(payload);
        if (error) throw error;
      }
      navigate(`/loans/${loanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the entry.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Page eyebrow="Entry" title={isEdit ? 'Edit entry' : 'New entry'}>
        <SkeletonList rows={3} />
      </Page>
    );
  }

  return (
    <Page
      eyebrow="Entry"
      title={isEdit ? 'Edit entry' : 'New entry'}
      subtitle={loan ? `For ${loan.client_name}` : undefined}
    >
      <form onSubmit={save}>
        <Card>
          <span className="field"><span>Entry type *</span></span>
          <SegmentedControl<EntryType>
            ariaLabel="Entry type"
            scroll
            value={entryType}
            onChange={setEntryType}
            options={ENTRY_TYPES.map((t) => ({ value: t, label: ENTRY_TYPE_LABELS[t] }))}
          />
          <Field label="Amount (₹) *">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000"
              inputMode="decimal"
            />
          </Field>
          <Field label="Date *">
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </Field>
          <Field label="Note">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. UPI payment, cash received…"
            />
          </Field>
          {entryType === 'adjustment' && (
            <p className="hint">
              Adjustments are signed: use a negative amount to reduce the outstanding principal, positive to increase it.
            </p>
          )}
        </Card>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn primary grow" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add entry'}
          </button>
        </div>
      </form>
    </Page>
  );
}
