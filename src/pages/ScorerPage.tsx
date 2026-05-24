import { useMatchStore } from '../store/matchStore';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import Scoreboard from '../components/Scoreboard';
import ActionPad from '../components/ActionPad';
import WicketModal from '../components/modals/WicketModal';
import BowlerSelectModal from '../components/modals/BowlerSelectModal';
import BatterSelectModal from '../components/modals/BatterSelectModal';
import OverSummaryModal from '../components/modals/OverSummaryModal';
import ResultModal from '../components/modals/ResultModal';
import ScorecardModal from '../components/modals/ScorecardModal';
import DLSModal from '../components/modals/DLSModal';
import ExtrasModal from '../components/modals/ExtrasModal';
import WagonWheelModal from '../components/modals/WagonWheelModal';
import CelebrationOverlay from '../components/CelebrationOverlay';
import { useState, useEffect } from 'react';
import { Play, CloudRain, DownloadCloud, AlertTriangle } from 'lucide-react';
import { fetchMatch, listenToActiveScorer } from '../lib/firebase';

export default function ScorerPage() {
  const navigate = useNavigate();
  const match = useMatchStore((s) => s.match);
  const endInnings = useMatchStore((s) => s.endInnings);
  
  const showBowlerSelect = useMatchStore((s) => s.showBowlerSelect);
  const showBatterSelect = useMatchStore((s) => s.showBatterSelect);
  const showOverSummary = useMatchStore((s) => s.showOverSummary);
  const showInningsBreak = useMatchStore((s) => s.showInningsBreak);
  
  const dismissBowlerSelect = useMatchStore((s) => s.dismissBowlerSelect);
  const dismissBatterSelect = useMatchStore((s) => s.dismissBatterSelect);
  const dismissOverSummary = useMatchStore((s) => s.dismissOverSummary);
  const dismissInningsBreak = useMatchStore((s) => s.dismissInningsBreak);

  const celebrationsEnabled = useAppStore((s) => s.settings.autoPlayCelebrations);
  
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showDLS, setShowDLS] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [selectedExtraType, setSelectedExtraType] = useState<'wide' | 'noball' | 'bye' | 'legbye' | 'penalty'>('wide');
  const [showWagonWheel, setShowWagonWheel] = useState(false);
  
  const setLastDeliveryRegion = useMatchStore((s) => s.setLastDeliveryRegion);
  const [importCode, setImportCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  const resumeMatch = useMatchStore((s) => s.resumeMatch);
  
  const deviceId = useAppStore((s) => s.deviceId);
  const [remoteScorerId, setRemoteScorerId] = useState<string | undefined>(match?.activeScorerId);
  const [isTakingOver, setIsTakingOver] = useState(false);

  useEffect(() => {
    if (match) {
      setRemoteScorerId(match.activeScorerId);
      return listenToActiveScorer(match.id.toString(), (id) => {
        setRemoteScorerId(id);
      });
    }
  }, [match?.id]);

  const isActiveScorer = !remoteScorerId || remoteScorerId === deviceId;

  async function handleTakeOverLive() {
    if (!match) return;
    setIsTakingOver(true);
    const m = await fetchMatch(match.id.toString());
    setIsTakingOver(false);
    if (m) {
      m.activeScorerId = deviceId;
      resumeMatch(m);
      setRemoteScorerId(deviceId);
    }
  }

  async function handleImport() {
    if (!importCode.trim()) return;
    setIsImporting(true);
    const m = await fetchMatch(importCode.trim());
    setIsImporting(false);
    if (m) {
      m.activeScorerId = deviceId;
      resumeMatch(m);
      setImportCode('');
    } else {
      alert("Match not found or invalid code!");
    }
  }

  if (!match) {
    return (
      <div className="view-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center', padding: '0 20px' }}>
        <h2 style={{ fontSize: 24, color: 'var(--gold)', marginBottom: 16 }}>No Active Match</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Start a new match from the setup screen.</p>
        <button className="btn-primary" onClick={() => navigate('/setup')} style={{ maxWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          <Play size={18} /> START MATCH
        </button>

        <div className="glass-card" style={{ maxWidth: 300, width: '100%', padding: '20px' }}>
          <div className="card-title" style={{ fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DownloadCloud size={18} /> JOIN MATCH
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Enter a live match code to view the match or take over scoring duties.</p>
          <input 
            placeholder="Match Code" 
            value={importCode}
            onChange={e => setImportCode(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: '#fff', marginBottom: 16, textAlign: 'center', fontSize: 16, letterSpacing: 1 }}
          />
          <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
            <button 
              className="btn-primary-small" 
              onClick={() => navigate(`/live/${importCode.trim()}`)}
              disabled={!importCode.trim()}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              JOIN AS VIEWER
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleImport}
              disabled={isImporting || !importCode.trim()}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px' }}
            >
              {isImporting ? 'SYNCING...' : 'TAKE OVER SCORING'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ci = match.currentInnings;
  const inn = match.innings[ci];
  const needsStriker = !inn.striker;
  const needsNonStriker = !!inn.striker && !inn.nonStriker;
  const needsBowler = !inn.currentBowler;
  
  // Enforce required selections
  const showBatterSelectForced = (needsStriker || needsNonStriker) && inn.wickets < match.settings.maxWickets && !match.complete;
  const showBowlerSelectForced = needsBowler && !match.complete && inn.wickets < match.settings.maxWickets;

  return (
    <div className="scoring-section">
      
      {!isActiveScorer && !match.complete && (
        <div style={{ padding: '12px 20px', background: 'rgba(231, 76, 60, 0.15)', borderBottom: '1px solid var(--leather)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--leather)' }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Another device is currently scoring.</span>
          </div>
          <button 
            onClick={handleTakeOverLive}
            disabled={isTakingOver}
            className="btn-primary-small"
            style={{ padding: '6px 12px', fontSize: 12, margin: 0, width: 'auto' }}
          >
            {isTakingOver ? 'SYNCING...' : 'TAKE OVER'}
          </button>
        </div>
      )}

      <div className="scoreboard-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6 }}>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>MATCH CODE:</span>
            <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{match.id}</span>
          </div>
          <button 
            onClick={() => setShowDLS(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, 
              background: 'var(--panel)', color: 'var(--blue)', 
              border: '1px solid var(--border)', borderRadius: 20, 
              padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' 
            }}
          >
            <CloudRain size={14} /> DLS / RAIN DELAY
          </button>
        </div>
        <Scoreboard />
      </div>
      
      <div className="actionpad-container">
        <ActionPad 
          onWicket={() => setShowWicketModal(true)} 
          onEndInnings={() => {
            if (window.confirm('Are you sure you want to end the innings now?')) {
              endInnings();
            }
          }}
          onExtra={(type) => {
             if (type === 'penalty') {
                useMatchStore.getState().addExtra('penalty', 5);
             } else {
                setSelectedExtraType(type);
                setShowExtrasModal(true);
             }
          }}
          onBoundary={() => {
             setShowWagonWheel(true);
          }}
          disabled={!isActiveScorer || showBatterSelectForced || showBowlerSelectForced || match.complete} 
        />
      </div>

      {/* Celebration Overlay */}
      {celebrationsEnabled && <CelebrationOverlay />}

      {/* Modals */}
      {showWicketModal && (
        <WicketModal onClose={() => setShowWicketModal(false)} />
      )}
      
      {(showBatterSelect || showBatterSelectForced) && (
        <BatterSelectModal onClose={() => dismissBatterSelect()} />
      )}
      
      {(showBowlerSelect || showBowlerSelectForced) && !showBatterSelectForced && !showWicketModal && (
        <BowlerSelectModal onClose={() => dismissBowlerSelect()} />
      )}
      
      {showOverSummary && !showWicketModal && (
        <OverSummaryModal onClose={() => dismissOverSummary()} />
      )}
      
      {showDLS && (
        <DLSModal onClose={() => setShowDLS(false)} />
      )}
      
      {match.complete && (
        <ResultModal 
          onClose={() => {}} 
          onViewScorecard={() => setShowScorecard(true)} 
        />
      )}

      {showScorecard && (
        <ScorecardModal onClose={() => setShowScorecard(false)} />
      )}

      {showInningsBreak && (
        <ScorecardModal onClose={() => dismissInningsBreak()} initialInnings={0} />
      )}

      {showExtrasModal && (
        <ExtrasModal 
           initialType={selectedExtraType}
           onClose={() => setShowExtrasModal(false)} 
        />
      )}

      {showWagonWheel && (
        <WagonWheelModal
           onSelectRegion={(r) => {
             setLastDeliveryRegion(r);
             setShowWagonWheel(false);
           }}
           onSkip={() => setShowWagonWheel(false)}
        />
      )}

      {/* Floating Action Button for Scorecard (only if not complete) */}
      {!match.complete && (
        <button 
          onClick={() => setShowScorecard(true)}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '48px',
            height: '48px',
            borderRadius: '24px',
            background: 'var(--panel-solid)',
            border: '1px solid var(--border)',
            color: 'var(--gold)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 90,
          }}
          aria-label="View Full Scorecard"
        >
          📊
        </button>
      )}
    </div>
  );
}
