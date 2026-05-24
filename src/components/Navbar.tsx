import { NavLink, useLocation } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import { Swords, ClipboardList, History, Settings, Trophy, Users, BarChart3 } from 'lucide-react';
import LiveShare from './LiveShare';
import './Navbar.css';

export default function Navbar() {
  const match = useMatchStore((s) => s.match);
  const location = useLocation();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <div className="nav-tabs" role="tablist">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          aria-label="New Match"
          role="tab"
        >
          <Swords size={14} />
          <span className="nav-tab-label">New</span>
        </NavLink>
        <NavLink
          to="/scorer"
          className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          aria-label="Scorer"
          role="tab"
        >
          <ClipboardList size={14} />
          <span className="nav-tab-label">Scorer</span>
          {match && !match.complete && <span className="nav-tab-dot" />}
        </NavLink>
        <NavLink
          to="/tournament"
          className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          aria-label="Tournament"
          role="tab"
        >
          <Trophy size={14} />
          <span className="nav-tab-label">Cup</span>
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          aria-label="Match History"
          role="tab"
        >
          <History size={14} />
          <span className="nav-tab-label">History</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          aria-label="Menu"
          role="tab"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          <span className="nav-tab-label">Menu</span>
        </NavLink>
        {match && <LiveShare />}
      </div>
    </nav>
  );
}
