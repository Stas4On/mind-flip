import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDecks, getDeckCards, createCard, deleteCard, type Deck, type Card } from '../services/db';
import { Flashcard } from '../components/cards/Flashcard';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Plus, Trash2, Eye } from 'lucide-react';

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

    try {
      await createCard(deckId, frontText, backText);
      // Reset form to defaults
      setFrontText('### Новый вопрос?\n\n');
      setBackText('### Ответ\n\n');
      setPreviewFlipped(false);
      // Reload cards
      await loadDeckAndCards();
    } catch (err) {
      console.error('Failed to add card', err);
    }
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h2 style={{ fontWeight: 800, color: 'var(--color-text-muted)' }}>Загрузка редактора...</h2>
      </div>
    );
  }

  if (!deck) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Колода не найдена</h2>
        <Button variant="outline" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>На главную</Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-pop">
      
      {/* Editor Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--color-text-main)', fontSize: '1rem' }}
        >
          <ArrowLeft size={20} /> Назад
        </button>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>🛠️ Редактор: {deck.name}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>{deck.description}</p>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Left Side: Add card form and Card list */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Add Card Form */}
          <section style={{
            background: 'var(--color-card-bg)',
            border: 'var(--border-width) solid var(--color-border)',
            borderRadius: 'var(--border-radius-md)',
            padding: '24px',
            boxShadow: '0 var(--shadow-depth) 0 var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} /> Добавить карточку
            </h2>
            
            <form onSubmit={handleAddCard} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Лицевая сторона (Markdown)</label>
                <textarea
                  value={frontText}
                  onChange={e => setFrontText(e.target.value)}
                  rows={4}
                  required
                  placeholder="### Вопрос или понятие..."
                  style={{
                    padding: '12px',
                    border: 'var(--border-width) solid var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: 600,
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Обратная сторона (Markdown / Код)</label>
                <textarea
                  value={backText}
                  onChange={e => setBackText(e.target.value)}
                  rows={6}
                  required
                  placeholder="### Ответ с кодом..."
                  style={{
                    padding: '12px',
                    border: 'var(--border-width) solid var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontFamily: 'Fira Code, Courier New, monospace',
                    fontWeight: 600,
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <Button type="submit" variant="success" icon={<Plus size={18} />} style={{ alignSelf: 'flex-start' }}>
                Добавить карточку
              </Button>
            </form>
          </section>

          {/* Cards List in Deck */}
          <section style={{
            background: 'var(--color-card-bg)',
            border: 'var(--border-width) solid var(--color-border)',
            borderRadius: 'var(--border-radius-md)',
            padding: '24px',
            boxShadow: '0 var(--shadow-depth) 0 var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{ fontSize: '1.3rem' }}>🗂️ Карточки в колоде ({cards.length})</h2>
            {cards.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontWeight: 500, fontStyle: 'italic' }}>В этой колоде ещё нет карточек.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '6px' }}>
                {cards.map((card, idx) => (
                  <div key={card.id} style={{
                    border: '2px solid var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--color-bg-page-start)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>Карточка #{idx + 1} (Уровень {card.level})</span>
                      <p style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 600, 
                        whiteSpace: 'nowrap', 
                        textOverflow: 'ellipsis', 
                        overflow: 'hidden',
                        maxWidth: '300px'
                      }}>
                        {card.front.replace(/[#*`]/g, '').trim()}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteCard(card.id)} 
                      icon={<Trash2 size={14} />} 
                      style={{ padding: '6px 10px', color: 'var(--color-danger)' }}
                      title="Удалить карточку"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Side: Live Interactive Card Preview */}
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '30px', alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.3rem' }}>Живой предпросмотр</h2>
          </div>
          
          <div style={{ width: '100%' }}>
            <Flashcard
              front={frontText || '*Лицевая сторона пуста*'}
              back={backText || '*Обратная сторона пуста*'}
              isFlipped={previewFlipped}
              onFlip={() => setPreviewFlipped(!previewFlipped)}
            />
          </div>

          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            Кликните по карточке выше, чтобы перевернуть и протестировать обе стороны.
          </div>
        </div>

      </div>

    </div>
  );
};
