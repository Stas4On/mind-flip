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
  // Используем CSS-фильтры для небольшой визуальной обратной связи (отзывчивости) в зависимости от настроения
  let filterStyle = 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))';
  
  switch (mood) {
    case 'happy':
      filterStyle += ' brightness(1.1) saturate(1.2) scale(1.05)';
      break;
    case 'sad':
      filterStyle += ' grayscale(0.5) opacity(0.8) scale(0.95)';
      break;
    case 'doubt':
      filterStyle += ' sepia(0.3) contrast(1.1)';
      break;
    case 'default':
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
        position: 'relative'
      }}
    >
      <img
        src={leonImg}
        alt="Leon the Mascot"
        style={{ 
          width: '100%',
          height: '100%',
          objectFit: 'cover', // cover лучше скроет фон картинки, если она квадратная
          borderRadius: '50%', // Скругляем края картинки, чтобы она смотрелась аккуратным аватаром/иконкой
          border: '2px solid var(--color-border)',
          transition: 'all var(--transition-normal)',
          filter: filterStyle
        }}
      />
    </div>
  );
};
