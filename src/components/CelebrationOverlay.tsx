import { useEffect, useState } from 'react';
import { useMatchStore } from '../store/matchStore';
import { Trophy } from 'lucide-react';
import './CelebrationOverlay.css';

export default function CelebrationOverlay() {
  const pendingMilestones = useMatchStore((s) => s.pendingMilestones);
  const clearMilestones = useMatchStore((s) => s.clearMilestones);
  
  const [activeMessage, setActiveMessage] = useState<{ message: string; emoji: string } | null>(null);

  useEffect(() => {
    if (pendingMilestones.length > 0 && !activeMessage) {
      // Pop the first milestone
      const milestone = pendingMilestones[0];
      setActiveMessage(milestone);
      
      // Clear it after 4 seconds
      const timer = setTimeout(() => {
        setActiveMessage(null);
        clearMilestones(); // We'll just clear all for simplicity, or we could pop one by one
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [pendingMilestones, activeMessage, clearMilestones]);

  if (!activeMessage) return null;

  return (
    <div className="celebration-overlay">
      <div className="celebration-content">
        <div className="celebration-emoji">{activeMessage.emoji}</div>
        <div className="celebration-text">{activeMessage.message}</div>
      </div>
      
      {/* CSS Confetti */}
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <div key={i} className={`confetti c-${i % 5}`} style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${Math.random() * 2 + 2}s`
          }} />
        ))}
      </div>
    </div>
  );
}
