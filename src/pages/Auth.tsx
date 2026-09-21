import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkMail, setCheckMail] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        const err = await signIn(email.trim(), password);
        if (err) setError(err);
        else navigate('/', { replace: true });
      } else {
        if (!name.trim()) {
          setError('Please enter your name.');
          return;
        }
        const err = await signUp(email.trim(), password, name.trim());
        if (err) setError(err);
        else setCheckMail(true);
      }
    } finally {
      setBusy(false);
    }
  };

  if (checkMail) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="brand">₹</div>
          <h1>Check your inbox</h1>
          <p className="muted">
            We sent a confirmation link to <b>{email}</b>. Tap it, then sign in here.
          </p>
          <button className="btn primary block" onClick={() => { setCheckMail(false); setMode('signin'); }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand">₹</div>
        <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted">LendTrack — lending manager for Indian lenders</p>

        {mode === 'signup' && (
          <label className="field">
            <span>Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              autoComplete="name"
            />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="btn primary block" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>

        <p className="switch-mode">
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button type="button" className="link" onClick={() => setMode('signup')}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" className="link" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </>
          )}
        </p>
        <p className="fineprint">
          Secured by Supabase Auth. Your data stays in your own database.
        </p>
      </form>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <AuthGate />;
  return <>{children}</>;
}

function AuthGate() {
  return <Auth />;
}
