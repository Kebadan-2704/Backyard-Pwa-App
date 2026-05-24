import { useEffect, useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show splash for 1.8 seconds, then fade out
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1800);

    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, 2200); // 400ms after fade starts

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`splash-screen ${fading ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo">
          <div className="cricket-ball"></div>
        </div>
        <h1 className="splash-brand">
          <span>BACKYARD</span> CRICKET
        </h1>
        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
      </div>
    </div>
  );
}
