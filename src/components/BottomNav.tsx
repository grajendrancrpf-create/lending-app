import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Home', end: true, icon: HomeIcon },
  { to: '/loans', label: 'Loans', icon: LoansIcon },
  { to: '/loans/new', label: 'Add', icon: AddIcon },
  { to: '/activity', label: 'Activity', icon: ActivityIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map(({ to, label, end, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}
function LoansIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10.5h18" />
      <path d="M7 15h4" />
    </svg>
  );
}
function AddIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l2.5-6 4 12L16 12h5" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09A1.7 1.7 0 0 0 10.14 3V3a2 2 0 1 1 4 0v.09c0 .68.4 1.3 1.04 1.56.6.25 1.3.11 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09c.25.6.88 1.04 1.56 1.04H21a2 2 0 1 1 0 4h-.09c-.68 0-1.3.4-1.51 1.04Z" />
    </svg>
  );
}
