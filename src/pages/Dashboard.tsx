import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDecks, getDeckCards, createDeck, type Deck } from '../services/db';
import { onAuthStateChanged, signOut, signIn, signUp, signInAsGuest, type AppUser } from '../services/auth';
import { isFirebaseConfigured } from '../lib/firebase';
import { Leon } from '../components/mascot/Leon';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Plus, Play, Settings, Brain, LogOut, Cloud, Database, Lock, Mail } from 'lucide-react';
import { isCardDue } from '../lib/leitner';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AppUser | null>(null);
  
  // Dashboard states
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckStats, setDeckStats] = useState<Record<string, { total: number; due: number }>>({});
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [loading, setLoading] = useState(true);

  // Auth form states
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Listen to authentication changes
    const unsubscribe = onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        loadDecksAndStats();
      } else {
        // If not logged in and Firebase is disabled, auto sign-in as guest
        if (!isFirebaseConfigured) {
          signInAsGuest();
        } else {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setAuthError('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      console.error('Auth error', err);
      setAuthError(err.message || 'Ошибка авторизации. Проверьте данные.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setAuthLoading(true);
    try {
      await signInAsGuest();
    } catch (err) {
      console.error('Guest login failed', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setDecks([]);
      setDeckStats({});
    } catch (err) {
      console.error('Sign out error', err);
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

  // 1. Loading Screen
  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <h2 className={styles.loadingText}>Загрузка приложения...</h2>
      </div>
    );
  }

  // 2. Authentication Screen (when Firebase is configured and user is logged out)
  if (!user) {
    return (
      <div className={`${styles.authContainer} animate-pop`}>
        <div className={styles.authHeader}>
          <Brain size={48} color="var(--color-primary)" className={`${styles.authLogo} animate-float`} />
          <h1 className={styles.authTitle}>MindFlip</h1>
          <p className={styles.authSubtitle}>Обучение программированию по флеш-карточкам</p>
        </div>

        <form onSubmit={handleAuthSubmit} className={styles.authForm}>
          <h2 className={styles.authFormTitle}>
            {isSignUp ? '✨ Регистрация' : '🔐 Вход в аккаунт'}
          </h2>

          {authError && (
            <div className={styles.authError}>
              {authError}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              <Mail size={14} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your-email@domain.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              <Lock size={14} /> Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" variant="primary" style={{ marginTop: '10px' }} disabled={authLoading}>
            {authLoading ? 'Загрузка...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
          </Button>

          <div className={styles.authSwitch}>
            <span className={styles.authSwitchText}>
              {isSignUp ? 'Уже есть аккаунт? ' : 'Новый пользователь? '}
            </span>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className={styles.authSwitchBtn}
            >
              {isSignUp ? 'Войти в аккаунт' : 'Создать аккаунт'}
            </button>
          </div>

          <div className={styles.authDivider} />

          <Button type="button" variant="outline" onClick={handleGuestLogin} disabled={authLoading}>
            Войти как гость (Локально)
          </Button>
        </form>
      </div>
    );
  }

  // 3. Regular Authenticated Dashboard Screen
  return (
    <div className={`${styles.dashboardContainer} animate-pop`}>
      
      {/* Synchronization Mode Banner */}
      {isFirebaseConfigured ? (
        <div className={styles.cloudBanner}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cloud size={16} /> Облачная база активна ({user.isAnonymous ? 'Гостевой режим' : user.email})
          </span>
          <button 
            onClick={handleSignOut} 
            className={styles.cloudSignOutBtn}
          >
            <LogOut size={14} /> Выйти
          </button>
        </div>
      ) : (
        <div className={styles.localBanner}>
          <div className={styles.localBannerHeader}>
            <Database size={16} /> Локальный демо-режим (данные в localStorage)
          </div>
          Для включения облачной синхронизации Firestore создайте файл <code>.env.local</code> в корне проекта с переменными <code>VITE_FIREBASE_API_KEY</code> и <code>VITE_FIREBASE_PROJECT_ID</code>.
        </div>
      )}

      {/* App Branding Header */}
      <header className={styles.header}>
        <div className={styles.brandContainer}>
          <Brain size={36} color="var(--color-primary)" strokeWidth={2.5} />
          <h1 className={styles.brandTitle}>
            Mind<span className={styles.brandSpan}>Flip</span>
          </h1>
        </div>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <Button variant="outline" size="sm" icon={<Plus size={18} />} onClick={() => setShowNewDeckForm(true)}>
            Новая колода
          </Button>
        </div>
      </header>

      {/* Leon Mascot Welcomer */}
      <section className={styles.mascotPanel}>
        <div className="animate-float">
          <Leon mood={leonMood} size={130} />
        </div>
        <div className={styles.mascotContent}>
          {/* Speech Bubble Arrow */}
          <div className={`${styles.speechArrow} speech-arrow`} />
          
          <div className={styles.speechBubble}>
            {leonSpeech}
          </div>

          <div className={styles.mascotStats}>
            <div>
              <span className={styles.statItemLabel}>Всего карточек:</span>
              <div className={styles.statItemVal}>{totalCards}</div>
            </div>
            <div className={styles.statItemRight}>
              <span className={styles.statItemLabel}>К повторению:</span>
              <div className={styles.statItemVal} style={{ color: totalDue > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>{totalDue}</div>
            </div>
          </div>
        </div>
      </section>

      {/* New Deck Modal Overlay / Form */}
      {showNewDeckForm && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleCreateDeck} className={`${styles.modalForm} animate-pop`}>
            <h2 className={styles.modalTitle}>🆕 Создание новой колоды</h2>
            
            <div className={styles.inputGroup}>
              <label className={styles.modalLabel}>Название колоды</label>
              <input
                type="text"
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
                placeholder="Например: Основы React"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.modalLabel}>Описание</label>
              <textarea
                value={newDeckDesc}
                onChange={e => setNewDeckDesc(e.target.value)}
                placeholder="Краткое описание колоды..."
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            <div className={styles.modalActions}>
              <Button type="button" variant="outline" onClick={() => setShowNewDeckForm(false)}>Отмена</Button>
              <Button type="submit" variant="success">Создать</Button>
            </div>
          </form>
        </div>
      )}

      {/* Decks Grid */}
      <main className={styles.mainSection}>
        <h2 className={styles.sectionTitle}>📚 Ваши колоды</h2>
        {decks.length === 0 ? (
          <div className={styles.emptyState}>
            <p style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>У вас пока нет ни одной колоды.</p>
            <Button variant="primary" style={{ marginTop: '16px' }} onClick={() => setShowNewDeckForm(true)}>Создать первую колоду</Button>
          </div>
        ) : (
          <div className={styles.decksGrid}>
            {decks.map(deck => {
              const stats = deckStats[deck.id] || { total: 0, due: 0 };
              return (
                <article key={deck.id} className={styles.deckCard}>
                  <div className={styles.deckInfo}>
                    <h3 className={styles.deckTitle}>{deck.name}</h3>
                    <p className={styles.deckDesc}>
                      {deck.description || 'Нет описания.'}
                    </p>
                  </div>

                  <div className={styles.deckStatsRow}>
                    <div>
                      <span className={styles.deckStatsLabel}>Повторить</span>
                      <div className={styles.deckStatsVal} style={{ color: stats.due > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                        {stats.due} карточек
                      </div>
                    </div>
                    <div className={styles.deckStatsDivider} />
                    <div style={{ textAlign: 'right' }}>
                      <span className={styles.deckStatsLabel}>Всего</span>
                      <div className={styles.deckStatsVal}>{stats.total}</div>
                    </div>
                  </div>

                  <div className={styles.deckActions}>
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
