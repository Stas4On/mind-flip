import React from 'react';
import leonImg from '../../assets/leon.png';

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
      style={{ 
        width: size, 
        height: size, 
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--color-border)',
        overflow: 'visible', // позволяет LED светиться за пределами рамки
        backgroundColor: 'var(--color-card-bg)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <img
        src={leonImg}
        alt="Leon the Mascot"
        style={{ 
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 'var(--border-radius-md)',
          transition: 'all var(--transition-normal)'
        }}
      />
      {/* LED-индикатор настроения */}
      <div 
        className={ledClass}
        style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          border: '2px solid var(--color-card-bg)',
          zIndex: 5
        }}
        title={`Статус: ${mood}`}
      />
    </div>
  );
};
