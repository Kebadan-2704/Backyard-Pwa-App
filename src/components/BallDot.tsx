import type { Delivery } from '../types/cricket';
import { getDeliveryLabel, getDeliveryClass, getDeliveryShape } from '../utils/scoring';
import './BallDot.css';

interface Props {
  delivery: Delivery;
  animate?: boolean;
  showShape?: boolean;
}

export default function BallDot({ delivery, animate = false, showShape = false }: Props) {
  const label = getDeliveryLabel(delivery);
  const shape = getDeliveryShape(delivery);
  const className = `ball-dot ${getDeliveryClass(delivery)} ${animate ? 'animate-pop' : ''} ${delivery.isFreeHit ? 'free-hit-dot' : ''}`;

  return (
    <div 
      className={className} 
      title={`${label}${delivery.isFreeHit ? ' (Free Hit)' : ''}`} 
      aria-label={`${label}${delivery.isFreeHit ? ' free hit' : ''}`}
      role="listitem"
    >
      {showShape ? <span className="ball-shape">{shape}</span> : null}
      <span className="ball-label">{label}</span>
    </div>
  );
}
