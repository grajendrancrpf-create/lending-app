import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Page, Card, Avatar, Field, Icon, ICONS } from '../components/ui';

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
    <Page eyebrow="Account" title="Settings" subtitle={user?.email}>
      <div className="profile-card">
        <Avatar name={profile?.full_name || user?.email || 'You'} size="lg" />
        <div>
          <b>{profile?.full_name || 'Lender'}</b>
          <span className="muted">{user?.email}</span>
        </div>
      </div>

      <Card>
        <h3 className="card-title">Profile</h3>
        <Field label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </Field>
        <button className="btn primary" onClick={saveName} disabled={saving} style={{ marginTop: 2 }}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save name'}
        </button>
      </Card>

      <Card>
        <h3 className="card-title">Tools</h3>
        <Link to="/calculator" className="menu-row">
          <span className="lbl">
            <span className="dot-ico" style={{ background: 'var(--brass-100)', color: 'var(--brass-700)' }}>
              <Icon d={ICONS.calc} size={17} />
            </span>
            EMI calculator
          </span>
          <span className="chev">›</span>
        </Link>
        <Link to="/loans/new" className="menu-row">
          <span className="lbl">
            <span className="dot-ico" style={{ background: 'var(--pine-50)', color: 'var(--pine-800)' }}>
              <Icon d={ICONS.plus} size={17} />
            </span>
            Add a new loan
          </span>
          <span className="chev">›</span>
        </Link>
      </Card>

      <Card>
        <h3 className="card-title">About LendTrack</h3>
        <p className="muted small" style={{ margin: '0 0 8px', lineHeight: 1.6 }}>
          Your data lives in your own Supabase project. Amounts use Indian
          numbering (lakh/crore), dates are DD/MM/YYYY, and phone numbers use +91.
        </p>
        <p className="muted small" style={{ margin: 0 }}>Signed in as {user?.email}</p>
      </Card>

      <button className="btn danger-ghost block" onClick={logout}>
        Sign out
      </button>
    </Page>
  );
}
