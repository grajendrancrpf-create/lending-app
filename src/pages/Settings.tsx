import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Page, Card } from '../components/ui';

export default function Settings() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveName = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { error } = await db()
      .from('profiles')
      .upsert({ id: user.id, full_name: name.trim() }, { onConflict: 'id' });
    setSaving(false);
    if (!error) {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const logout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <Page title="Settings" subtitle={user?.email}>
      <Card>
        <h3 className="card-title">Profile</h3>
        <label className="field">
          <span>Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </label>
        <button className="btn primary" onClick={saveName} disabled={saving}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save name'}
        </button>
      </Card>

      <Card>
        <h3 className="card-title">Tools</h3>
        <Link to="/calculator" className="menu-row">
          <span>EMI calculator</span>
          <span className="chev">›</span>
        </Link>
        <Link to="/loans/new" className="menu-row">
          <span>Add a new loan</span>
          <span className="chev">›</span>
        </Link>
      </Card>

      <Card>
        <h3 className="card-title">About</h3>
        <p className="muted small">
          LendTrack stores your data in your own Supabase project. Amounts use Indian
          numbering (lakh/crore), dates are DD/MM/YYYY, and phone numbers use +91.
        </p>
        <p className="muted small">Signed in as {user?.email}</p>
      </Card>

      <button className="btn danger-ghost block" onClick={logout}>
        Sign out
      </button>
    </Page>
  );
}
