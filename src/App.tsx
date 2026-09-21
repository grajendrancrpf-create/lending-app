import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import BottomNav from './components/BottomNav';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Loans from './pages/Loans';
import LoanForm from './pages/LoanForm';
import LoanDetail from './pages/LoanDetail';
import LedgerForm from './pages/LedgerForm';
import Activity from './pages/Activity';
import Settings from './pages/Settings';
import Calculator from './pages/Calculator';

function SetupNotice() {
  return (
    <div className="setup-wrap">
      <h1>Almost there</h1>
      <p>
        LendTrack needs its Supabase credentials before it can run. Create a{' '}
        <code>VITE_SUPABASE_URL=…{'\n'}VITE_SUPABASE_ANON_KEY=…</code>
        <code style={{ whiteSpace: 'normal' }}>
          1. Copy <b>.env.example</b> to <b>.env</b>
          <br />
          2. Paste your Supabase project URL and anon key
          <br />
          3. Restart the dev server
        </code>
      </p>
      <p className="muted small">
        Find the values in your Supabase dashboard under Project Settings → API. See README.md for the full setup guide.
      </p>
    </div>
  );
}

function Shell() {
  return (
    <div className="app-shell">
      <Outlet />
      <BottomNav />
    </div>
  );
}

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Auth />;
  return <Shell />;
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Protected />}>
            <Route index element={<Dashboard />} />
            <Route path="loans" element={<Loans />} />
            <Route path="loans/new" element={<LoanForm />} />
            <Route path="loans/:id" element={<LoanDetail />} />
            <Route path="loans/:id/edit" element={<LoanForm />} />
            <Route path="loans/:id/ledger/new" element={<LedgerForm />} />
            <Route path="loans/:id/ledger/:entryId/edit" element={<LedgerForm />} />
            <Route path="activity" element={<Activity />} />
            <Route path="settings" element={<Settings />} />
            <Route path="calculator" element={<Calculator />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
