import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDecks, getDeckCards, createCard, deleteCard, deleteDeck, updateCardContent, type Deck, type Card } from '../services/db';
import { Flashcard } from '../components/cards/Flashcard';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ArrowLeft, Plus, Trash2, Eye, Pencil, X } from 'lucide-react';
import styles from './DeckEditor.module.css';

export const DeckEditor: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [frontText, setFrontText] = useState('### Новый вопрос?\n\nНапишите текст вопроса здесь. Поддерживается **жирный**, *курсив* и код:\n\n`const a = 1;`');
  const [backText, setBackText] = useState('### Ответ\n\nНапишите ответ здесь.\n\n```javascript\nfunction greet() {\n  console.log("Привет!");\n}\n```');
  
  // Preview states
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  useEffect(() => {
    loadDeckAndCards();
  }, [deckId]);

  const loadDeckAndCards = async () => {
    if (!deckId) return;
    setLoading(true);
    try {
      const allDecks = await getDecks();
      const currentDeck = allDecks.find(d => d.id === deckId) || null;
      setDeck(currentDeck);

      const deckCards = await getDeckCards(deckId);
      setCards(deckCards);
    } catch (err) {
      console.error('Failed to load deck data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckId || !frontText.trim() || !backText.trim()) return;
    setError(null);

    try {
      if (editingCardId !== null) {
        await updateCardContent(deckId, editingCardId, frontText, backText);
        setEditingCardId(null);
      } else {
        await createCard(deckId, frontText, backText);
      }
      // Reset form to defaults
      setFrontText('### Новый вопрос?\n\n');
      setBackText('### Ответ\n\n');
      setPreviewFlipped(false);
      // Reload cards
      await loadDeckAndCards();
    } catch (err: any) {
      console.error('Failed to save card', err);
      setError(err.message || 'Не удалось сохранить изменения');
    }
  };

  const handleStartEditCard = (card: Card) => {
    setEditingCardId(card.id);
    setFrontText(card.front);
    setBackText(card.back);
    setPreviewFlipped(false);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setFrontText('### Новый вопрос?\n\n');
    setBackText('### Ответ\n\n');
    setPreviewFlipped(false);
    setError(null);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!deckId) return;
    try {
      await deleteCard(deckId, cardId);
      await loadDeckAndCards();
    } catch (err) {
      console.error('Failed to delete card', err);
    }
  };

  const handleDeleteDeck = async () => {
    if (!deckId || !deck) return;
    const confirmed = window.confirm(
      `Вы уверены, что хотите полностью удалить колоду "${deck.name}" и все её карточки? Это действие невозможно отменить.`
    );
    if (!confirmed) return;
    
    try {
      await deleteDeck(deckId);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete deck', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <h2 className={styles.loadingText}>Загрузка редактора...</h2>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className={styles.notFoundScreen}>
        <h2>Колода не найдена</h2>
        <Button variant="outline" onClick={() => navigate('/')} className={styles.notFoundButton}>На главную</Button>
      </div>
    );
  }

  return (
    <div className={`${styles.pageContainer} animate-pop`}>
      
      {/* Editor Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => navigate('/')} 
            className={styles.backButton}
          >
            <ArrowLeft size={20} /> Назад
          </button>
          <div>
            <h1 className={styles.title}>🛠️ Редактор: {deck.name}</h1>
            <p className={styles.description}>{deck.description}</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Button 
            variant="danger" 
            size="sm" 
            icon={<Trash2 size={16} />} 
            onClick={handleDeleteDeck}
          >
            Удалить колоду
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className={styles.workspace}>
        
        {/* Left Side: Add card form and Card list */}
        <div className={styles.leftColumn}>
          
          {/* Add Card Form */}
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              {editingCardId !== null ? <Pencil size={20} /> : <Plus size={20} />}
              {editingCardId !== null ? 'Редактировать карточку' : 'Добавить карточку'}
            </h2>
            
            <form onSubmit={handleAddCard} className={styles.formElement}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Лицевая сторона (Markdown)</label>
                <textarea
                  value={frontText}
                  onChange={e => setFrontText(e.target.value)}
                  rows={4}
                  required
                  placeholder="### Вопрос или понятие..."
                  className={styles.textareaField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Обратная сторона (Markdown / Код)</label>
                <textarea
                  value={backText}
                  onChange={e => setBackText(e.target.value)}
                  rows={6}
                  required
                  placeholder="### Ответ с кодом..."
                  className={styles.textareaField}
                  style={{ fontFamily: 'Fira Code, Courier New, monospace' }}
                />
              </div>

              {error && (
                <div style={{
                  color: 'var(--color-danger-dark)',
                  backgroundColor: 'var(--color-danger-light)',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '12px'
                }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button type="submit" variant="success" icon={editingCardId !== null ? <Pencil size={18} /> : <Plus size={18} />} className={styles.buttonSubmit}>
                  {editingCardId !== null ? 'Сохранить' : 'Добавить карточку'}
                </Button>
                {editingCardId !== null && (
                  <Button type="button" variant="outline" icon={<X size={18} />} onClick={handleCancelEdit}>
                    Отмена
                  </Button>
                )}
              </div>
            </form>
          </section>

          {/* Cards List in Deck */}
          <section className={styles.cardsSection}>
            <h2 className={styles.sectionTitle}>🗂️ Карточки в колоде ({cards.length})</h2>
            {cards.length === 0 ? (
              <p className={styles.emptyCardsText}>В этой колоде ещё нет карточек.</p>
            ) : (
              <div className={styles.cardsList}>
                {cards.map((card, idx) => (
                  <div key={card.id} className={styles.cardItem}>
                    <div className={styles.cardItemMeta}>
                      <span className={styles.cardLevelBadge}>Карточка #{idx + 1} (Уровень {card.level})</span>
                      <p className={styles.cardText}>
                        {card.front.replace(/[#*`]/g, '').trim()}
                      </p>
                    </div>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleStartEditCard(card)} 
                        icon={<Pencil size={14} />} 
                        className={styles.editButton}
                        title="Редактировать карточку"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteCard(card.id)} 
                        icon={<Trash2 size={14} />} 
                        className={styles.deleteButton}
                        title="Удалить карточку"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Side: Live Interactive Card Preview */}
        <div className={styles.rightColumn}>
          <div className={styles.previewHeader}>
            <Eye size={18} color="var(--color-primary)" />
            <h2 className={styles.sectionTitle}>Живой предпросмотр</h2>
          </div>
          
          <div className={styles.previewWrapper}>
            <Flashcard
              front={frontText || '*Лицевая сторона пуста*'}
              back={backText || '*Обратная сторона пуста*'}
              isFlipped={previewFlipped}
              onFlip={() => setPreviewFlipped(!previewFlipped)}
            />
          </div>

          <div className={styles.helperText}>
            Кликните по карточке выше, чтобы перевернуть и протестировать обе стороны.
          </div>
        </div>

      </div>

    </div>
  );
};
