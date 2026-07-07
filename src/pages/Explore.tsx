import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDeckWithCards } from '../services/db';
import { getCurrentUser } from '../services/auth';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ArrowLeft, Brain, BookOpen, Plus, Download, UploadCloud, HelpCircle, X } from 'lucide-react';
import jsCatalog from '../assets/js-catalog.json';
import reactCatalog from '../assets/react-catalog.json';
import angularCatalog from '../assets/angular-catalog.json';
import englishCatalog from '../assets/english-catalog.json';
import styles from './Explore.module.css';

const catalogDecks = [...jsCatalog, ...reactCatalog, ...angularCatalog, ...englishCatalog];

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
  
  const user = getCurrentUser();
  const isGuest = !user || user.isAnonymous;
  
  // Format help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpTab, setHelpTab] = useState<'markdown' | 'json'>('markdown');

  const handleAddTemplate = async (template: CatalogDeck) => {
    setLoadingDeckId(template.id);
    setImportError(null);
    try {
      await createDeckWithCards(template.name, template.description, template.cards);
      navigate('/');
    } catch (err: any) {
      console.error('Failed to copy template deck', err);
      setImportError(err.message || 'Не удалось скопировать шаблон колоды.');
    } finally {
      setLoadingDeckId(null);
    }
  };

  const processJsonImport = async (text: string) => {
    const data = JSON.parse(text);
    if (!data.name || !Array.isArray(data.cards)) {
      throw new Error('Файл JSON должен содержать название "name" и массив карточек "cards".');
    }

    const validCards = data.cards.filter((card: any) => card.front && card.back);
    await createDeckWithCards(data.name, data.description || '', validCards);
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

    await createDeckWithCards(deckName, deckDesc, cardsToCreate);
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

      {/* Active Limits Info Banner */}
      <div className={styles.limitsBanner}>
        {isGuest ? (
          <span>
            💡 <strong>Режим Гостя:</strong> Доступно максимум 3 колоды и до 30 карточек в каждой. 
            Зарегистрируйтесь через email, чтобы увеличить лимиты до 10 колод / 100 карточек и импортировать готовые шаблоны из каталога.
          </span>
        ) : (
          <span>
            ✅ <strong>Лимиты аккаунта:</strong> Доступно до 10 колод и до 100 карточек в каждой.
          </span>
        )}
      </div>

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
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <UploadCloud size={20} color="var(--color-primary)" /> Импорт своей колоды
          </h2>
          <button 
            type="button" 
            className={styles.helpButton} 
            onClick={() => setShowHelpModal(true)}
            disabled={isImporting || loadingDeckId !== null}
          >
            <HelpCircle size={16} /> Справка по форматам
          </button>
        </div>
        
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

      {/* Format Help Modal */}
      {showHelpModal && (
        <div className={styles.modalOverlay} onClick={() => setShowHelpModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>📖 Инструкция по импорту файлов</h3>
              <button 
                onClick={() => setShowHelpModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.modalTabs}>
                <button 
                  className={`${styles.modalTab} ${helpTab === 'markdown' ? styles.modalTabActive : ''}`}
                  onClick={() => setHelpTab('markdown')}
                >
                  Markdown (.md / .txt)
                </button>
                <button 
                  className={`${styles.modalTab} ${helpTab === 'json' ? styles.modalTabActive : ''}`}
                  onClick={() => setHelpTab('json')}
                >
                  JSON (.json)
                </button>
              </div>

              {helpTab === 'markdown' ? (
                <>
                  <p className={styles.importDesc} style={{ textAlign: 'left' }}>
                    Создайте текстовый файл. Первая строчка с <code>#</code> задает имя колоды, строки ниже — описание. 
                    Разделитель карточек — <code>===</code> на отдельной строке. Разделитель вопроса и ответа — <code>---</code> на отдельной строке.
                  </p>
                  <pre className={styles.codeBlock}>
{`# Основы TypeScript
Колода для изучения базовых типов TS.
===
Что такое Union тип?
---
### Union Types
Объединение типов позволяет переменной принимать один из нескольких типов:
\`\`\`typescript
let id: string | number;
\`\`\`
===
Что делает readonly?
---
Делает свойства объекта доступными только для чтения.`}
                  </pre>
                </>
              ) : (
                <>
                  <p className={styles.importDesc} style={{ textAlign: 'left' }}>
                    Загрузите файл <code>.json</code> со структурой колоды. Обязательны поля <code>name</code> и массив объектов <code>cards</code> с полями <code>front</code> и <code>back</code>.
                  </p>
                  <pre className={styles.codeBlock}>
{`{
  "name": "Название колоды",
  "description": "Описание этой колоды (опционально)",
  "cards": [
    {
      "front": "Текст лицевой стороны (Markdown)",
      "back": "Текст обратной стороны (Markdown)"
    },
    {
      "front": "Второй вопрос",
      "back": "Второй ответ"
    }
  ]
}`}
                  </pre>
                </>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <Button onClick={() => setShowHelpModal(false)}>Закрыть</Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
