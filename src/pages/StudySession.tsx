import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDeckCards, updateCardProgress, type Card } from '../services/db';
import { Flashcard } from '../components/cards/Flashcard';
import { Leon, type LeonMood } from '../components/mascot/Leon';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { isCardDue } from '../lib/leitner';
import { ArrowLeft, Check, X, RefreshCw, Award, Eye } from 'lucide-react';
import styles from './StudySession.module.css';

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
    return <Spinner fullScreen message="Загрузка сессии..." />;
  }

  if (studyQueue.length === 0 && cards.length > 0 && !cramMode) {
    return (
      <div className={`${styles.statusCard} animate-pop`}>
        <Leon mood="happy" size={150} className="animate-float" />
        <h2 className={styles.statusTitle}>🎉 Всё изучено!</h2>
        <p className={styles.statusText}>
          На сегодня в этой колоде не осталось карточек для повторения. Вы большой молодец!
        </p>
        <div className={styles.actionsRow}>
          <Button variant="outline" onClick={() => navigate('/')}>На главную</Button>
          <Button variant="primary" icon={<RefreshCw size={18} />} onClick={() => setCramMode(true)}>Повторить все ({cards.length})</Button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className={`${styles.statusCard} animate-pop`}>
        <Leon mood="doubt" size={150} />
        <h2 className={styles.statusTitle}>📭 Колода пуста</h2>
        <p className={styles.statusText}>
          В этой колоде пока нет карточек. Добавьте карточки в редакторе колоды, чтобы начать обучение!
        </p>
        <div className={styles.actionsRow} style={{ justifyContent: 'center' }}>
          <Button variant="outline" onClick={() => navigate('/')}>На главную</Button>
          <Button variant="success" onClick={() => navigate(`/edit/${deckId}`)}>Редактор колоды</Button>
        </div>
      </div>
    );
  }

  if (sessionFinished) {
    return (
      <div className={`${styles.statusCardFinished} animate-pop`}>
        <div className="animate-float">
          <Leon mood="happy" size={180} />
        </div>
        <h2 className={styles.statusTitleAward}>
          <Award size={36} color="var(--color-warning)" /> Отличный результат!
        </h2>
        <p className={styles.statusTextCenter}>
          Сессия успешно завершена. Вы укрепили свои нейронные связи! 🧠
        </p>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCardSuccess}>
            <span className={styles.statLabelSuccess}>ПОМНЮ</span>
            <div className={styles.statValueSuccess}>{correctCount}</div>
          </div>
          <div className={styles.statCardDanger}>
            <span className={styles.statLabelDanger}>ЗАБЫЛ</span>
            <div className={styles.statValueDanger}>{incorrectCount}</div>
          </div>
        </div>

        <Button variant="success" size="lg" className={styles.fullWidthButton} onClick={() => navigate('/')}>
          Вернуться на главную
        </Button>
      </div>
    );
  }

  const currentCard = studyQueue[currentIndex];

  if (!currentCard) {
    return <Spinner fullScreen message="Загрузка сессии..." />;
  }

  const progressPercent = (currentIndex / studyQueue.length) * 100;

  return (
    <div className={`${styles.studyContainer} animate-pop`}>
      
      {/* Session Header Navigation */}
      <header className={styles.header}>
        <button 
          onClick={() => navigate('/')} 
          className={styles.exitButton}
        >
          <ArrowLeft size={20} /> Выйти
        </button>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <span className={styles.badge}>
            Карточка {currentIndex + 1} из {studyQueue.length} {cramMode && '⚡'}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className={styles.progressBarWrapper}>
        <div 
          className={styles.progressBarFill}
          style={{ 
            width: `${progressPercent}%`, 
            borderRight: progressPercent > 0 ? 'var(--border-width) solid var(--color-border)' : 'none'
          }} 
        />
      </div>

      {/* Mascot Side React Panel */}
      <div className={styles.mascotPanel}>
        <Leon mood={leonMood} size={110} />
      </div>

      {/* Flashcard wrapper */}
      <main className={styles.flashcardWrapper}>
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
      <footer className={styles.footer}>
        {!isFlipped ? (
          <Button 
            variant="primary" 
            size="lg" 
            className={styles.fullWidthButton}
            icon={<Eye size={22} />}
            onClick={() => {
              setIsFlipped(true);
              setLeonMood('doubt');
            }}
          >
            Показать ответ
          </Button>
        ) : (
          <div className={styles.footerActions}>
            <Button 
              variant="danger" 
              size="lg" 
              className={styles.flexButton}
              icon={<X size={22} />}
              onClick={() => handleAnswer(false)}
            >
              Забыл
            </Button>
            <Button 
              variant="success" 
              size="lg" 
              className={styles.flexButton}
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
