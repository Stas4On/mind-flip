import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDecks, getDeckCards, createDeck, type Deck } from '../services/db';
import { Leon } from '../components/mascot/Leon';
import { Button } from '../components/ui/Button';
import { Plus, Play, Settings, Brain } from 'lucide-react';
import { isCardDue } from '../lib/leitner';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckStats, setDeckStats] = useState<Record<string, { total: number; due: number }>>({});
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecksAndStats();
  }, []);

  const loadDecksAndStats = async () => {
    setLoading(true);
    try {
      const allDecks = await getDecks();
      setDecks(allDecks);
      
      const stats: Record<string, { total: number; due: number }> = {};
      for (const deck of allDecks) {
        const cards = await getDeckCards(deck.id);
        const dueCount = cards.filter(c => isCardDue(c.nextReviewDate)).length;
        stats[deck.id] = {
          total: cards.length,
          due: dueCount
        };
      }
      setDeckStats(stats);
    } catch (err) {
      console.error('Failed to load decks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    try {
      await createDeck(newDeckName, newDeckDesc);
      setNewDeckName('');
      setNewDeckDesc('');
      setShowNewDeckForm(false);
      await loadDecksAndStats();
    } catch (err) {
      console.error('Failed to create deck', err);
    }
  };

  const totalCards = Object.values(deckStats).reduce((acc, curr) => acc + curr.total, 0);
  const totalDue = Object.values(deckStats).reduce((acc, curr) => acc + curr.due, 0);

  // Leon Mascot speech balloon text based on review queue
  let leonSpeech = 'Привет! Я Леон. Выберем колоду для разминки ума? 🦎';
  let leonMood: 'default' | 'happy' | 'doubt' = 'default';

  if (totalDue > 0) {
    leonSpeech = `У нас есть ${totalDue} карточек к повторению сегодня! Давай разомнемся! 🔥`;
    leonMood = 'doubt';
  } else if (totalCards > 0 && totalDue === 0) {
    leonSpeech = 'Отличная работа! Все карточки повторены. Отдохни или создай новую колоду! 🎉';
    leonMood = 'happy';
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h2 style={{ fontWeight: 800, color: 'var(--color-text-muted)' }}>Загрузка колод...</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-pop">
      
      {/* App Branding Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Brain size={36} color="var(--color-primary)" strokeWidth={2.5} />
          <h1 style={{ fontSize: '2rem', textShadow: '1px 1px 0 var(--color-bg-page-end)' }}>
            Mind<span style={{ color: 'var(--color-primary)' }}>Flip</span>
          </h1>
        </div>
        <Button variant="outline" size="sm" icon={<Plus size={18} />} onClick={() => setShowNewDeckForm(true)}>
          Новая колода
        </Button>
      </header>

      {/* Leon Mascot Welcomer */}
      <section style={{
        background: 'var(--color-card-bg)',
        border: 'var(--border-width) solid var(--color-border)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '24px 30px',
        boxShadow: '0 var(--shadow-depth) 0 var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        position: 'relative'
      }}>
        <div className="animate-float">
          <Leon mood={leonMood} size={130} />
        </div>
        <div style={{ flex: 1, minWidth: '250px' }}>
          {/* Speech Bubble Arrow */}
          <div style={{
            position: 'absolute',
            left: '144px',
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
            width: '16px',
            height: '16px',
            backgroundColor: 'var(--color-card-bg)',
            borderLeft: 'var(--border-width) solid var(--color-border)',
            borderBottom: 'var(--border-width) solid var(--color-border)',
            display: 'none' // Hide on mobile wrapping
          }} className="speech-arrow" />
          
          <div style={{
            border: 'var(--border-width) solid var(--color-border)',
            borderRadius: 'var(--border-radius-md)',
            padding: '16px 20px',
            backgroundColor: 'var(--color-primary-light)',
            fontWeight: 700,
            fontSize: '1.1rem',
            position: 'relative'
          }}>
            {leonSpeech}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Всего карточек:</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{totalCards}</div>
            </div>
            <div style={{ borderLeft: '2px solid var(--color-border)', paddingLeft: '20px' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>К повторению:</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: totalDue > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>{totalDue}</div>
            </div>
          </div>
        </div>
      </section>

      {/* New Deck Modal Overlay / Form */}
      {showNewDeckForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <form onSubmit={handleCreateDeck} style={{
            background: 'var(--color-card-bg)',
            border: 'var(--border-width) solid var(--color-border)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '30px',
            boxShadow: '0 var(--shadow-depth) 0 var(--color-border)',
            maxWidth: '500px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }} className="animate-pop">
            <h2 style={{ fontSize: '1.5rem' }}>🆕 Создание новой колоды</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Название колоды</label>
              <input
                type="text"
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
                placeholder="Например: Основы React"
                required
                style={{
                  padding: '12px',
                  border: 'var(--border-width) solid var(--color-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontFamily: 'var(--font-primary)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Описание</label>
              <textarea
                value={newDeckDesc}
                onChange={e => setNewDeckDesc(e.target.value)}
                placeholder="Краткое описание колоды..."
                rows={3}
                style={{
                  padding: '12px',
                  border: 'var(--border-width) solid var(--color-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontFamily: 'var(--font-primary)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setShowNewDeckForm(false)}>Отмена</Button>
              <Button type="submit" variant="success">Создать</Button>
            </div>
          </form>
        </div>
      )}

      {/* Decks Grid */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '1.4rem' }}>📚 Ваши колоды</h2>
        {decks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--border-radius-md)', border: '2px dashed var(--color-border)' }}>
            <p style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>У вас пока нет ни одной колоды.</p>
            <Button variant="primary" style={{ marginTop: '16px' }} onClick={() => setShowNewDeckForm(true)}>Создать первую колоду</Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {decks.map(deck => {
              const stats = deckStats[deck.id] || { total: 0, due: 0 };
              return (
                <article key={deck.id} style={{
                  background: 'var(--color-card-bg)',
                  border: 'var(--border-width) solid var(--color-border)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '24px',
                  boxShadow: '0 var(--shadow-depth) 0 var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '20px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>{deck.name}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500, minHeight: '40px' }}>
                      {deck.description || 'Нет описания.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-primary-light)', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', border: '2px solid var(--color-border)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Повторить</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: stats.due > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                        {stats.due} карточек
                      </div>
                    </div>
                    <div style={{ borderLeft: '2px solid var(--color-border)', height: '25px' }} />
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Всего</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{stats.total}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button 
                      variant={stats.due > 0 ? 'success' : 'outline'}
                      size="sm"
                      style={{ flex: 1 }}
                      icon={<Play size={16} />}
                      onClick={() => navigate(`/study/${deck.id}`)}
                    >
                      Изучать
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      icon={<Settings size={16} />}
                      onClick={() => navigate(`/edit/${deck.id}`)}
                      title="Настроить колоду"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
};
