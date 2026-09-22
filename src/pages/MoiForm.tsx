import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useMoiEntry } from '../hooks/useData';
import { todayISO } from '../lib/format';
import { MOI_OCCASION_LABELS, type MoiOccasionType } from '../types';
import { Page, Card, Field, SegmentedControl, SkeletonList } from '../components/ui';

const OCCASIONS = Object.keys(MOI_OCCASION_LABELS) as MoiOccasionType[];

export default function MoiForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entry, loading } = useMoiEntry(id);

  const [familyName, setFamilyName] = useState('');
  const [occasionType, setOccasionType] = useState<MoiOccasionType>('marriage');
  const [occasionOf, setOccasionOf] = useState('');
  const [amount, setAmount] = useState('');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setFamilyName(entry.family_name);
      setOccasionType(entry.occasion_type);
      setOccasionOf(entry.occasion_of ?? '');
      setAmount(String(entry.amount));
      setEntryDate(entry.entry_date);
      setNotes(entry.notes ?? '');
    }
  }, [entry]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount) || 0;
    if (!familyName.trim()) return setError('Family name is required.');
    if (amountNum <= 0) return setError('Amount must be greater than zero.');
    if (!entryDate) return setError('Date is required.');
    if (!user) return setError('You must be signed in.');

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        family_name: familyName.trim(),
        occasion_type: occasionType,
        occasion_of: occasionOf.trim() || null,
        amount: amountNum,
        entry_date: entryDate,
        notes: notes.trim() || null,
      };

      if (isEdit) {
        const { error } = await db().from('moi_entries').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await db().from('moi_entries').insert(payload);
        if (error) throw error;
      }
      navigate('/moi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the MOI entry.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!isEdit || !id) return;
    if (!window.confirm('Delete this MOI entry?')) return;
    setSaving(true);
    try {
      const { error } = await db().from('moi_entries').delete().eq('id', id);
      if (error) throw error;
      navigate('/moi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the entry.');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading) {
    return (
      <Page eyebrow="MOI" title="Edit entry">
        <SkeletonList rows={4} />
      </Page>
    );
  }

  return (
    <Page
      eyebrow={isEdit ? 'Edit' : 'New'}
      title={isEdit ? 'Edit MOI entry' : 'New MOI entry'}
      subtitle="Record money given at a family occasion"
    >
      <form onSubmit={save}>
        <Card>
          <Field label="Family name *">
            <input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g. Ravi Shankar family"
            />
          </Field>
          <span className="field"><span>Occasion</span></span>
          <SegmentedControl<MoiOccasionType>
            ariaLabel="Occasion type"
            scroll
            value={occasionType}
            onChange={setOccasionType}
            options={OCCASIONS.map((o) => ({ value: o, label: MOI_OCCASION_LABELS[o] }))}
          />
          <Field label="Occasion of (person)">
            <input
              value={occasionOf}
              onChange={(e) => setOccasionOf(e.target.value)}
              placeholder="e.g. Bride / groom name"
            />
          </Field>
          <div className="grid2">
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
          </div>
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Envelope no., who handed it over…"
              rows={3}
            />
          </Field>
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

        {isEdit && (
          <button
            type="button"
            className="btn danger-ghost"
            onClick={remove}
            disabled={saving}
            style={{ width: '100%', marginTop: 4 }}
          >
            Delete entry
          </button>
        )}
      </form>
    </Page>
  );
}
