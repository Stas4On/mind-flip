import React from 'react';

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
  // Determine skin color and shadow based on Leon's mood
  let skinColor = 'var(--color-leon)';
  let darkSkinColor = 'var(--color-leon-dark)';
  let eyeScaleY = 1.0;
  let mouthPath = 'M 65 65 Q 75 75 85 65'; // Happy smile default
  let blushOpacity = 0.5;

  switch (mood) {
    case 'happy':
      skinColor = 'var(--color-success)';
      darkSkinColor = 'var(--color-success-dark)';
      eyeScaleY = 0.3; // Happy closed eyes (arcs)
      mouthPath = 'M 63 60 Q 75 82 87 60'; // Wide open happy mouth
      blushOpacity = 0.8;
      break;
    case 'sad':
      skinColor = 'var(--color-danger)';
      darkSkinColor = 'var(--color-danger-dark)';
      eyeScaleY = 1.0;
      mouthPath = 'M 65 72 Q 75 60 85 72'; // Frown mouth
      blushOpacity = 0.1;
      break;
    case 'doubt':
      skinColor = 'var(--color-warning)';
      darkSkinColor = 'var(--color-warning-dark)';
      eyeScaleY = 1.0;
      mouthPath = 'M 65 65 L 85 65'; // Neutral straight-line mouth
      blushOpacity = 0.3;
      break;
    case 'default':
    default:
      skinColor = 'var(--color-leon)';
      darkSkinColor = 'var(--color-leon-dark)';
      eyeScaleY = 1.0;
      mouthPath = 'M 65 65 Q 75 73 85 65';
      blushOpacity = 0.5;
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
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          transition: 'transform 0.3s var(--transition-bounce)',
          filter: 'drop-shadow(0 4px 0px var(--color-border))'
        }}
      >
        {/* Curled Tail (Back layer) */}
        <path
          d="M 120 110 C 145 110 145 75 125 75 C 110 75 105 90 115 100 C 120 105 130 100 128 92 C 127 88 122 88 120 90"
          stroke="var(--color-border)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'stroke 0.5s ease' }}
        />
        <path
          d="M 120 110 C 145 110 145 75 125 75 C 110 75 105 90 115 100 C 120 105 130 100 128 92 C 127 88 122 88 120 90"
          stroke={skinColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'stroke 0.5s ease' }}
        />

        {/* Back feet */}
        <circle cx="50" cy="120" r="10" fill={darkSkinColor} stroke="var(--color-border)" strokeWidth="3" style={{ transition: 'fill 0.5s ease' }} />
        <circle cx="100" cy="120" r="10" fill={darkSkinColor} stroke="var(--color-border)" strokeWidth="3" style={{ transition: 'fill 0.5s ease' }} />

        {/* Body (Main Oval) */}
        <ellipse
          cx="75"
          cy="95"
          rx="35"
          ry="28"
          fill={skinColor}
          stroke="var(--color-border)"
          strokeWidth="3.5"
          style={{ transition: 'fill 0.5s ease' }}
        />

        {/* Stripes on Body */}
        <path d="M 60 70 Q 65 80 62 90" stroke={darkSkinColor} strokeWidth="3.5" strokeLinecap="round" style={{ transition: 'stroke 0.5s ease' }} />
        <path d="M 75 68 Q 80 80 77 92" stroke={darkSkinColor} strokeWidth="3.5" strokeLinecap="round" style={{ transition: 'stroke 0.5s ease' }} />
        <path d="M 90 73 Q 95 83 91 93" stroke={darkSkinColor} strokeWidth="3.5" strokeLinecap="round" style={{ transition: 'stroke 0.5s ease' }} />

        {/* Head */}
        <circle
          cx="60"
          cy="60"
          r="26"
          fill={skinColor}
          stroke="var(--color-border)"
          strokeWidth="3.5"
          style={{ transition: 'fill 0.5s ease' }}
        />

        {/* Crests / Chameleon Spikes on Head */}
        <path
          d="M 40 42 Q 38 32 46 36 Q 54 28 58 38 Q 66 32 68 40"
          fill={skinColor}
          stroke="var(--color-border)"
          strokeWidth="3"
          strokeLinejoin="round"
          style={{ transition: 'fill 0.5s ease' }}
        />

        {/* Front feet */}
        <circle cx="65" cy="122" r="10" fill={skinColor} stroke="var(--color-border)" strokeWidth="3.5" style={{ transition: 'fill 0.5s ease' }} />
        <circle cx="85" cy="122" r="10" fill={skinColor} stroke="var(--color-border)" strokeWidth="3.5" style={{ transition: 'fill 0.5s ease' }} />

        {/* Cute blush */}
        <circle cx="45" cy="68" r="5" fill="hsl(350, 100%, 75%)" opacity={blushOpacity} style={{ transition: 'opacity 0.5s ease' }} />
        <circle cx="75" cy="68" r="5" fill="hsl(350, 100%, 75%)" opacity={blushOpacity} style={{ transition: 'opacity 0.5s ease' }} />

        {/* Big Chameleon Eye */}
        <circle
          cx="60"
          cy="52"
          r="11"
          fill="var(--color-card-bg)"
          stroke="var(--color-border)"
          strokeWidth="3"
        />
        {/* Pupil (Scales based on mood) */}
        {mood === 'happy' ? (
          // Arc eyes for happy mood
          <path
            d="M 54 52 Q 60 46 66 52"
            stroke="var(--color-border)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ) : (
          <ellipse
            cx={mood === 'doubt' ? '58' : '62'}
            cy="52"
            rx="4"
            ry={4 * eyeScaleY}
            fill="var(--color-border)"
            style={{ transition: 'ry 0.3s ease, cx 0.3s ease' }}
          />
        )}

        {/* Mouth */}
        <path
          d={mouthPath}
          stroke="var(--color-border)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill={mood === 'happy' ? 'hsl(355, 75%, 60%)' : 'none'}
          style={{ transition: 'd 0.3s ease, fill 0.3s ease' }}
        />
      </svg>
    </div>
  );
};
