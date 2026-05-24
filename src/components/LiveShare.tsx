import { QRCodeSVG } from 'qrcode.react';
import { useMatchStore } from '../store/matchStore';
import { db } from '../lib/firebase';
import { QrCode, WifiOff } from 'lucide-react';
import { useState } from 'react';
import './LiveShare.css';

export default function LiveShare() {
  const match = useMatchStore(s => s.match);
  const [isOpen, setIsOpen] = useState(false);

  if (!match) return null;

  // The URL spectators will visit to watch this specific match live
  const shareUrl = `${window.location.origin}/live/${match.id}`;

  return (
    <>
      <button 
        className="live-share-toggle" 
        onClick={() => setIsOpen(true)}
        title="Share Live Score"
      >
        <QrCode size={18} />
      </button>

      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>LIVE SYNC</h2>
            
            {!db ? (
              <div className="firebase-warning">
                <WifiOff size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p><strong>Cloud Sync Disabled</strong></p>
                <p style={{ fontSize: 13, marginTop: 8 }}>
                  To enable real-time spectator mode and cloud backups, you must configure your Firebase project keys in <code>src/lib/firebase.ts</code>.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                  Scan this QR code to watch the match live!
                </p>
                
                <div style={{ background: 'white', padding: 16, borderRadius: 12, display: 'inline-block', marginBottom: 24 }}>
                  <QRCodeSVG 
                    value={shareUrl} 
                    size={200}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"Q"}
                  />
                </div>

                <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8, fontSize: 12, wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                  {shareUrl}
                </div>
              </>
            )}

            <button 
              className="btn-secondary" 
              style={{ width: '100%', marginTop: 24 }}
              onClick={() => setIsOpen(false)}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
}
