import React from 'react';
import leonImg from '../../assets/leon.webp';

export type LeonMood = 'default' | 'happy' | 'sad' | 'doubt';

export interface LeonProps {
  mood?: LeonMood;
  size?: number;
  className?: string;
}

export const Leon: React.FC<LeonProps> = ({
  mood = 'default',
  size = 180,
  className = '',
}) => {
  // Выбираем класс LED-индикатора в зависимости от настроения
  let ledClass = 'led-blue';
  switch (mood) {
    case 'happy':
      ledClass = 'led-green';
      break;
    case 'doubt':
      ledClass = 'led-amber';
      break;
    case 'sad':
      ledClass = 'led-red';
      break;
    default:
      break;
  }

  return (
    <div 
      className={`leon-mascot-wrapper ${className}`} 
      style={{ '--leon-size': `${size}px` } as React.CSSProperties}
    >
      <img
        src={leonImg}
        alt="Leon the Mascot"
        className="leon-image"
      />
      {/* LED-индикатор настроения */}
      <div 
        className={`leon-led-dot ${ledClass}`}
        title={`Статус: ${mood}`}
      />
    </div>
  );
};
