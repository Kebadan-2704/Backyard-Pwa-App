import { NavLink, useLocation } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import { Swords, ClipboardList, History, Settings, Trophy, Users } from 'lucide-react';
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
          className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''} ${!match && !isActive ? 'disabled' : ''}`}
          aria-label="Scorer"
          role="tab"
        >
          <ClipboardList size={14} />
          <span className="nav-tab-label">Scorer</span>
          {match && !match.complete && <span className="nav-tab-dot" />}
        </NavLink>
        <NavLink
          to="/draft"
          className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          aria-label="Draft"
          role="tab"
        >
          <Users size={14} />
          <span className="nav-tab-label">Draft</span>
        </NavLink>
        <NavLink
          to="/stats"
          className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          aria-label="Stats"
          role="tab"
        >
          <Trophy size={14} />
          <span className="nav-tab-label">Stats</span>
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
          aria-label="Settings"
          role="tab"
        >
          <Settings size={14} />
        </NavLink>
        {match && <LiveShare />}
      </div>
    </nav>
  );
}
