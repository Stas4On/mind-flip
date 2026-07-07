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
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleAddTemplate = async (template: CatalogDeck) => {
    setLoadingDeckId(template.id);
    setImportError(null);
    try {
      const newDeck = await createDeck(template.name, template.description);
      for (const card of template.cards) {
        await createCard(newDeck.id, card.front, card.back);
      }
      navigate('/');
    } catch (err) {
      console.error('Failed to copy template deck', err);
      setImportError('Не удалось скопировать шаблон колоды.');
    } finally {
      setLoadingDeckId(null);
    }
  };

  const processJsonImport = async (text: string) => {
    const data = JSON.parse(text);
    if (!data.name || !Array.isArray(data.cards)) {
      throw new Error('Файл JSON должен содержать название "name" и массив карточек "cards".');
    }

    const newDeck = await createDeck(data.name, data.description || '');
    for (const card of data.cards) {
      if (card.front && card.back) {
        await createCard(newDeck.id, card.front, card.back);
      }
    }
  };

  const processMarkdownImport = async (text: string) => {
    const cleanText = text.replace(/\r\n/g, '\n').trim();
    
    // Split into cards using === as a block separator
    const blocks = cleanText.split(/\n\s*===\s*\n/);
    if (blocks.length === 0 || !blocks[0].trim()) {
      throw new Error('Файл пуст или не содержит карточек, разделенных "===".');
    }

    let deckName = 'Импортированная колода';
    let deckDesc = 'Создано из импортированного файла Markdown';
    let startIndex = 0;

    const firstBlock = blocks[0].trim();
    if (firstBlock.startsWith('#')) {
      // First block is metadata (e.g., "# Title\nDescription")
      const lines = firstBlock.split('\n');
      deckName = lines[0].replace(/^#\s*/, '').trim();
      deckDesc = lines.slice(1).join('\n').trim() || deckDesc;
      startIndex = 1; // start importing cards from the second block
    }

    const cardsToCreate: { front: string; back: string }[] = [];

    for (let i = startIndex; i < blocks.length; i++) {
      const cardBlock = blocks[i].trim();
      if (!cardBlock) continue;

      // Split front and back by ---
      const parts = cardBlock.split(/\n\s*---\s*\n/);
      if (parts.length >= 2) {
        const front = parts[0].trim();
        const back = parts.slice(1).join('\n---').trim(); // support multiple --- in back content
        cardsToCreate.push({ front, back });
      } else if (parts.length === 1 && parts[0].trim()) {
        cardsToCreate.push({ front: parts[0].trim(), back: '*Ответ не указан*' });
      }
    }

    if (cardsToCreate.length === 0) {
      throw new Error('В файле не обнаружено ни одной карточки. Убедитесь, что стороны разделены "---".');
    }

    const newDeck = await createDeck(deckName, deckDesc);
    for (const card of cardsToCreate) {
      await createCard(newDeck.id, card.front, card.back);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        if (file.name.endsWith('.json')) {
          await processJsonImport(text);
        } else {
          await processMarkdownImport(text);
        }
        navigate('/');
      } catch (err: any) {
        console.error('Import error', err);
        setImportError(err.message || 'Произошла ошибка при разборе файла. Проверьте формат.');
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      setImportError('Не удалось прочитать файл с диска.');
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    if (isImporting || loadingDeckId !== null) return;
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
            disabled={isImporting || loadingDeckId !== null}
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

      {/* Error alert if any */}
      {importError && (
        <div style={{
          backgroundColor: 'var(--color-danger-light)',
          color: 'var(--color-danger-dark)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--border-radius-sm)',
          padding: '12px 16px',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          ⚠️ {importError}
        </div>
      )}

      {/* Import Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <UploadCloud size={20} color="var(--color-primary)" /> Импорт своей колоды
        </h2>
        <div 
          className={styles.importBox} 
          onClick={triggerFileInput}
          style={{ opacity: isImporting ? 0.6 : 1, pointerEvents: isImporting ? 'none' : 'auto' }}
        >
          <Download size={36} color="var(--color-text-muted)" />
          <div>
            <div className={styles.importTitle}>
              {isImporting ? 'Разбор и импорт файла...' : 'Нажмите для выбора файла колоды'}
            </div>
            <div className={styles.importDesc}>Поддерживаются форматы .json и текстовый .md / .txt</div>
          </div>
          <input 
            type="file" 
            id="import-file-input" 
            className={styles.fileInput} 
            accept=".json,.md,.txt"
            onChange={handleFileChange}
            disabled={isImporting}
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
                disabled={loadingDeckId !== null || isImporting}
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
