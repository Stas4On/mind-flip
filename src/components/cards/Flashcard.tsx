import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('typescript', ts);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('json', json);

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

  // Custom component mappings for ReactMarkdown
  const markdownComponents = {
    code(props: any) {
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      
      return match ? (
        <SyntaxHighlighter
          PreTag="div"
          language={match[1]}
          style={vscDarkPlus}
          customStyle={{
            margin: '12px 0',
            borderRadius: '12px',
            border: '2px solid var(--color-border)',
            fontSize: '0.85rem',
            fontFamily: 'Fira Code, Courier New, monospace',
            padding: '12px',
            width: '100%',
            textAlign: 'left',
          }}
          {...rest}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...rest}>
          {children}
        </code>
      );
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
              <ReactMarkdown components={markdownComponents}>{front}</ReactMarkdown>
            </div>
          </div>
          <span className="card-hint">Кликни, чтобы перевернуть 🔄</span>
        </div>

        {/* Back Side */}
        <div className="flashcard-back">
          <span className="card-badge">Ответ</span>
          <div className="card-content-wrapper" onClick={handleContentClick}>
            <div className="markdown-content">
              <ReactMarkdown components={markdownComponents}>{back}</ReactMarkdown>
            </div>
          </div>
          <span className="card-hint">Кликни, чтобы вернуть вопрос 🔄</span>
        </div>

      </div>
    </div>
  );
};
