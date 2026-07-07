import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDeck, createCard } from '../services/db';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ArrowLeft, Brain, BookOpen, Plus, Download, UploadCloud } from 'lucide-react';
import catalogDecks from '../assets/catalog.json';
import styles from './Explore.module.css';

interface CatalogDeck {
  id: string;
  name: string;
  description: string;
  cards: {
    front: string;
    back: string;
  }[];
}

export const Explore: React.FC = () => {
  const navigate = useNavigate();
  const [loadingDeckId, setLoadingDeckId] = useState<string | null>(null);

  const handleAddTemplate = async (template: CatalogDeck) => {
    setLoadingDeckId(template.id);
    try {
      // 1. Create a new personal deck
      const newDeck = await createDeck(template.name, template.description);
      
      // 2. Add all template cards to the created deck
      for (const card of template.cards) {
        await createCard(newDeck.id, card.front, card.back);
      }
      
      // 3. Redirect back to dashboard to study the new deck
      navigate('/');
    } catch (err) {
      console.error('Failed to copy template deck', err);
    } finally {
      setLoadingDeckId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder file handler (to be implemented in Task 3)
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected file to import:', file.name);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('import-file-input')?.click();
  };

  return (
    <div className={`${styles.pageContainer} animate-pop`}>
      
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => navigate('/')} 
            className={styles.backButton}
          >
            <ArrowLeft size={20} /> Назад
          </button>
          <div>
            <h1 className={styles.title}>🧭 Каталог и Импорт</h1>
            <p className={styles.subtitle}>Добавляйте готовые колоды знаний или загружайте собственные файлы</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Import Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <UploadCloud size={20} color="var(--color-primary)" /> Импорт своей колоды
        </h2>
        <div className={styles.importBox} onClick={triggerFileInput}>
          <Download size={36} color="var(--color-text-muted)" />
          <div>
            <div className={styles.importTitle}>Нажмите для выбора файла колоды</div>
            <div className={styles.importDesc}>Поддерживаются форматы .json и текстовый .md / .txt</div>
          </div>
          <input 
            type="file" 
            id="import-file-input" 
            className={styles.fileInput} 
            accept=".json,.md,.txt"
            onChange={handleFileChange}
          />
        </div>
      </section>

      {/* Catalog Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Brain size={20} color="var(--color-primary)" /> Готовые шаблоны знаний
        </h2>
        <div className={styles.catalogGrid}>
          {(catalogDecks as CatalogDeck[]).map((deck) => (
            <article key={deck.id} className={styles.templateCard}>
              <div className={styles.templateInfo}>
                <h3 className={styles.templateTitle}>{deck.name}</h3>
                <p className={styles.templateDesc}>{deck.description}</p>
                <div className={styles.templateStats}>
                  <BookOpen size={14} />
                  <span>{deck.cards.length} карточек</span>
                </div>
              </div>
              <Button
                variant="success"
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => handleAddTemplate(deck)}
                disabled={loadingDeckId !== null}
              >
                {loadingDeckId === deck.id ? 'Добавление...' : 'Добавить в профиль'}
              </Button>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
};
