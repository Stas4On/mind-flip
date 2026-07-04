import React from 'react';
import ReactMarkdown from 'react-markdown';

export interface FlashcardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  front,
  back,
  isFlipped,
  onFlip,
}) => {
  // Prevent click propagation when clicking on code blocks or links (for scroll / copy ease)
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('pre') || target.closest('code') || target.closest('a')) {
      e.stopPropagation();
    }
  };

  return (
    <div className="flashcard-container" onClick={onFlip}>
      <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
        
        {/* Front Side */}
        <div className="flashcard-front">
          <span className="card-badge">Вопрос</span>
          <div className="card-content-wrapper" onClick={handleContentClick}>
            <div className="markdown-content">
              <ReactMarkdown>{front}</ReactMarkdown>
            </div>
          </div>
          <span className="card-hint">Кликни, чтобы перевернуть 🔄</span>
        </div>

        {/* Back Side */}
        <div className="flashcard-back">
          <span className="card-badge">Ответ</span>
          <div className="card-content-wrapper" onClick={handleContentClick}>
            <div className="markdown-content">
              <ReactMarkdown>{back}</ReactMarkdown>
            </div>
          </div>
          <span className="card-hint">Кликни, чтобы вернуть вопрос 🔄</span>
        </div>

      </div>
    </div>
  );
};
