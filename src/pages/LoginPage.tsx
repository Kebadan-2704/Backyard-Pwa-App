import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { User } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import './SetupPage.css'; 

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleLogin() {
    if (!auth) {
      setError('Firebase is not configured.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
      navigate('/setup');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  }

  return (
    <div className="view-container setup-page" style={{ justifyContent: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="slide-down">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            background: 'rgba(245, 166, 35, 0.1)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '2px solid var(--gold)'
          }}>
            <User size={40} color="var(--gold)" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: 1, color: 'var(--chalk)', margin: 0 }}>
            Welcome
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Sign in to sync your stats to the cloud
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 0, 0, 0.1)', border: '1px solid var(--red)', color: 'var(--red)', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button 
          className="btn-primary" 
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{ 
            marginTop: 8, 
            padding: '16px', 
            fontSize: 18, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 12,
            background: 'var(--panel-solid)',
            border: '1px solid var(--border)',
            width: '100%'
          }}
        >
          <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path></svg>
          {loading ? 'SIGNING IN...' : 'SIGN IN WITH GOOGLE'}
        </button>

        <div style={{ textAlign: 'center', margin: '24px 0', color: 'var(--text-muted)', fontSize: 12 }}>
          — OR —
        </div>

        <button 
          className="btn-secondary" 
          onClick={() => {
            useAppStore.getState().setFirebaseUser({
              uid: 'local_offline',
              displayName: 'Offline Player',
              photoURL: null
            });
            navigate('/setup');
          }}
          disabled={loading}
          style={{ width: '100%', padding: '16px', fontSize: 14 }}
        >
          PLAY OFFLINE (LOCAL STORAGE)
        </button>
      </div>
    </div>
  );
}
