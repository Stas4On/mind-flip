import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDeckCards, updateCardProgress, type Card } from '../services/db';
import { Flashcard } from '../components/cards/Flashcard';
import { Leon, type LeonMood } from '../components/mascot/Leon';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { isCardDue } from '../lib/leitner';
import { ArrowLeft, Check, X, RefreshCw, Award, Eye } from 'lucide-react';

export const StudySession: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  
  const [cards, setCards] = useState<Card[]>([]);
  const [studyQueue, setStudyQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [leonMood, setLeonMood] = useState<LeonMood>('default');
  const [sessionFinished, setSessionFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Statistics
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [cramMode, setCramMode] = useState(false); // Study all cards instead of only due cards

  useEffect(() => {
    loadCards();
  }, [deckId, cramMode]);

  const loadCards = async () => {
    if (!deckId) return;
    setLoading(true);
    try {
      const allCards = await getDeckCards(deckId);
      setCards(allCards);
      
      // Filter for cards due today, or take all if cramMode is activated
      const queue = cramMode 
        ? allCards 
        : allCards.filter(c => isCardDue(c.nextReviewDate));
        
      setStudyQueue(queue);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionFinished(false);
      setCorrectCount(0);
      setIncorrectCount(0);
      setLeonMood('default');
    } catch (err) {
      console.error('Failed to load session cards', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (!deckId || studyQueue.length === 0) return;
    
    const currentCard = studyQueue[currentIndex];
    
    // Update Leon's reaction
    if (isCorrect) {
      setLeonMood('happy');
      setCorrectCount(prev => prev + 1);
    } else {
      setLeonMood('sad');
      setIncorrectCount(prev => prev + 1);
    }

    try {
      // Save progress to database / localStorage
      await updateCardProgress(deckId, currentCard.id, isCorrect);
    } catch (err) {
      console.error('Error updating card progress', err);
    }

    // Delay transitioning to the next card slightly so user sees Leon's reaction
    setTimeout(() => {
      if (currentIndex + 1 < studyQueue.length) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
        setLeonMood('default');
      } else {
        setSessionFinished(true);
        setLeonMood('happy');
      }
    }, 600);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h2 style={{ fontWeight: 800, color: 'var(--color-text-muted)' }}>Загрузка сессии...</h2>
      </div>
    );
  }

  if (studyQueue.length === 0 && cards.length > 0 && !cramMode) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto 0 auto', padding: '30px', background: 'var(--color-card-bg)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius-lg)', boxShadow: '0 var(--shadow-depth) 0 var(--color-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }} className="animate-pop">
        <Leon mood="happy" size={150} className="animate-float" />
        <h2 style={{ fontSize: '1.8rem' }}>🎉 Всё изучено!</h2>
        <p style={{ fontWeight: 600, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          На сегодня в этой колоде не осталось карточек для повторения. Вы большой молодец!
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: '10px' }}>
          <Button variant="outline" onClick={() => navigate('/')}>На главную</Button>
          <Button variant="primary" icon={<RefreshCw size={18} />} onClick={() => setCramMode(true)}>Повторить все ({cards.length})</Button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto 0 auto', padding: '30px', background: 'var(--color-card-bg)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius-lg)', boxShadow: '0 var(--shadow-depth) 0 var(--color-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }} className="animate-pop">
        <Leon mood="doubt" size={150} />
        <h2 style={{ fontSize: '1.8rem' }}>📭 Колода пуста</h2>
        <p style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
          В этой колоде пока нет карточек. Добавьте карточки в редакторе колоды, чтобы начать обучение!
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <Button variant="outline" onClick={() => navigate('/')}>На главную</Button>
          <Button variant="success" onClick={() => navigate(`/edit/${deckId}`)}>Редактор колоды</Button>
        </div>
      </div>
    );
  }

  if (sessionFinished) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto 0 auto', padding: '40px 30px', background: 'var(--color-card-bg)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius-lg)', boxShadow: '0 var(--shadow-depth) 0 var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }} className="animate-pop">
        <div className="animate-float">
          <Leon mood="happy" size={180} />
        </div>
        <h2 style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={36} color="var(--color-warning)" /> Отличный результат!
        </h2>
        <p style={{ fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Сессия успешно завершена. Вы укрепили свои нейронные связи! 🧠
        </p>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', margin: '10px 0' }}>
          <div style={{ border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius-md)', padding: '16px', textAlign: 'center', backgroundColor: 'var(--color-success-light)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-success-dark)' }}>ПОМНЮ</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{correctCount}</div>
          </div>
          <div style={{ border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius-md)', padding: '16px', textAlign: 'center', backgroundColor: 'var(--color-danger-light)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-danger-dark)' }}>ЗАБЫЛ</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-danger)' }}>{incorrectCount}</div>
          </div>
        </div>

        <Button variant="success" size="lg" style={{ width: '100%' }} onClick={() => navigate('/')}>
          Вернуться на главную
        </Button>
      </div>
    );
  }

  const currentCard = studyQueue[currentIndex];

  if (!currentCard) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h2 style={{ fontWeight: 800, color: 'var(--color-text-muted)' }}>Загрузка сессии...</h2>
      </div>
    );
  }

  const progressPercent = (currentIndex / studyQueue.length) * 100;

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-pop">
      
      {/* Session Header Navigation */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--color-text-main)', fontSize: '1rem' }}
        >
          <ArrowLeft size={20} /> Выйти
        </button>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ThemeToggle />
          <span style={{ fontWeight: 800, fontSize: '1.1rem', backgroundColor: 'var(--color-primary-light)', padding: '4px 12px', border: '2px solid var(--color-border)', borderRadius: '20px' }}>
            Карточка {currentIndex + 1} из {studyQueue.length} {cramMode && '⚡'}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '18px', backgroundColor: 'var(--color-card-bg)', border: 'var(--border-width) solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ 
          width: `${progressPercent}%`, 
          height: '100%', 
          backgroundColor: 'var(--color-primary)', 
          borderRight: progressPercent > 0 ? 'var(--border-width) solid var(--color-border)' : 'none',
          transition: 'width 0.3s ease' 
        }} />
      </div>

      {/* Mascot Side React Panel */}
      <div style={{ display: 'flex', justifyContent: 'center', height: '60px', margin: '-10px 0' }}>
        <Leon mood={leonMood} size={110} />
      </div>

      {/* Flashcard wrapper */}
      <main style={{ minHeight: '380px' }}>
        <Flashcard
          front={currentCard.front}
          back={currentCard.back}
          isFlipped={isFlipped}
          onFlip={() => {
            setIsFlipped(!isFlipped);
            if (leonMood === 'default') {
              setLeonMood('doubt');
              setTimeout(() => setLeonMood('default'), 800);
            }
          }}
        />
      </main>

      {/* Active buttons based on flip state */}
      <footer style={{ marginTop: '10px' }}>
        {!isFlipped ? (
          <Button 
            variant="primary" 
            size="lg" 
            style={{ width: '100%' }} 
            icon={<Eye size={22} />}
            onClick={() => {
              setIsFlipped(true);
              setLeonMood('doubt');
            }}
          >
            Показать ответ
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: '16px' }}>
            <Button 
              variant="danger" 
              size="lg" 
              style={{ flex: 1 }} 
              icon={<X size={22} />}
              onClick={() => handleAnswer(false)}
            >
              Забыл
            </Button>
            <Button 
              variant="success" 
              size="lg" 
              style={{ flex: 1 }} 
              icon={<Check size={22} />}
              onClick={() => handleAnswer(true)}
            >
              Помню
            </Button>
          </div>
        )}
      </footer>

    </div>
  );
};
