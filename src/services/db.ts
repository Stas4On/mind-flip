import { updateLeitnerCard } from '../lib/leitner';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { getCurrentUser } from './auth';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';

export interface Card {
  id: string;
  front: string;
  back: string;
  level: number; // 1 to 5
  nextReviewDate: string; // ISO String
  lastReviewedDate?: string; // ISO String
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export const LIMITS = {
  guest: {
    maxDecks: 3,
    maxCardsPerDeck: 30,
  },
  user: {
    maxDecks: 10,
    maxCardsPerDeck: 100,
  }
};

const DECKS_KEY = 'mind_flip_decks';
const CARDS_KEY_PREFIX = 'mind_flip_cards_';

// Initial Seed Data
const INITIAL_DECKS: Deck[] = [
  {
    id: 'js-basics',
    name: 'JavaScript Core',
    description: 'Основные концепции JS: Замыкания, Прототипы, Асинхронность и ES6+.',
    createdAt: new Date('2026-07-01T12:00:00Z').toISOString(),
  },
  {
    id: 'angular-core',
    name: 'Angular Framework',
    description: 'Разработка на Angular: компоненты, директивы, RxJS, сигналы и DI.',
    createdAt: new Date('2026-07-02T12:00:00Z').toISOString(),
  }
];

const INITIAL_CARDS: Record<string, Omit<Card, 'id'>[]> = {
  'js-basics': [
    {
      front: 'Что такое **замыкание (Closure)** в JavaScript?',
      back: '### Замыкание (Closure)\n\nЗамыкание — это комбинация функции и лексического окружения, в котором эта функция была определена. Простыми словами, функция "помнит" переменные из своей внешней области видимости, даже когда вызывается вне её.\n\n```javascript\nfunction createCounter() {\n  let count = 0;\n  return function() {\n    return ++count;\n  };\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n```',
      level: 1,
      nextReviewDate: new Date().toISOString(),
    },
    {
      front: 'В чем разница между `==` и `===`?',
      back: '### Сравнение с приведением типов и без\n\n- `==` сравнивает значения на равенство, предварительно приводя их к одному типу (нестрогое равенство).\n- `===` сравнивает и значения, и типы без приведения типов (строгое равенство).\n\n```javascript\n5 == "5"   // true (строка "5" приводится к числу)\n5 === "5"  // false (разные типы: number и string)\nnull == undefined  // true\nnull === undefined // false\n```',
      level: 1,
      nextReviewDate: new Date().toISOString(),
    }
  ],
  'angular-core': [
    {
      front: 'Что такое **Сигналы (Signals)** в Angular?',
      back: '### Angular Signals\n\nСигнал — это обертка над значением, которая умеет уведомлять заинтересованных потребителей об изменении этого значения. Это позволяет Angular точечно обновлять шаблоны без прохода по всему дереву компонентов.\n\n```typescript\nimport { signal, computed } from \'@angular/core\';\n\nconst count = signal(0);\nconst doubleCount = computed(() => count() * 2);\n\nconsole.log(count()); // 0\ncount.set(5);\nconsole.log(doubleCount()); // 10\n```',
      level: 1,
      nextReviewDate: new Date().toISOString(),
    },
    {
      front: 'Как работает Директива `*ngFor` и её современный аналог `@for`?',
      back: '### Рендеринг списков\n\nНачиная с Angular 17, вместо структурной директивы `*ngFor` используется новый встроенный синтаксис управляющих конструкций `@for`, который работает быстрее и не требует импорта:\n\n```html\n<!-- Старый синтаксис -->\n<li *ngFor="let item of items; trackBy: trackById">\n  {{ item.name }}\n</li>\n\n<!-- Новый синтаксис (Angular 17+) -->\n@for (item of items; track item.id) {\n  <li>{{ item.name }}</li>\n} @empty {\n  <li>Список пуст!</li>\n}\n```',
      level: 1,
      nextReviewDate: new Date().toISOString(),
    }
  ]
};

// Local storage init helper
function initLocalStorageIfNeeded() {
  if (!localStorage.getItem(DECKS_KEY)) {
    localStorage.setItem(DECKS_KEY, JSON.stringify(INITIAL_DECKS));
    Object.entries(INITIAL_CARDS).forEach(([deckId, cards]) => {
      const cardsWithIds = cards.map((c, i) => ({ id: `${deckId}-${i + 1}`, ...c }));
      localStorage.setItem(`${CARDS_KEY_PREFIX}${deckId}`, JSON.stringify(cardsWithIds));
    });
  }
}

export async function getDecks(): Promise<Deck[]> {
  const user = getCurrentUser();
  
  if (isFirebaseConfigured && db && user) {
    // Firestore Path: users/{userId}/decks
    const decksRef = collection(db, 'users', user.uid, 'decks');
    const snap = await getDocs(decksRef);
    const decksList: Deck[] = [];
    
    snap.forEach((doc) => {
      decksList.push({ id: doc.id, ...doc.data() } as Deck);
    });

    // Seeding Firestore with default decks if empty
    if (decksList.length === 0) {
      for (const d of INITIAL_DECKS) {
        await setDoc(doc(db, 'users', user.uid, 'decks', d.id), {
          name: d.name,
          description: d.description,
          createdAt: d.createdAt,
        });
        
        const cards = INITIAL_CARDS[d.id] || [];
        for (let i = 0; i < cards.length; i++) {
          const cardId = `${d.id}-${i + 1}`;
          await setDoc(doc(db, 'users', user.uid, 'decks', d.id, 'cards', cardId), cards[i]);
        }
      }
      return INITIAL_DECKS;
    }
    
    return decksList;
  } else {
    // Local storage fallback
    initLocalStorageIfNeeded();
    const data = localStorage.getItem(DECKS_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function createDeck(name: string, description: string): Promise<Deck> {
  const user = getCurrentUser();
  if (!user) throw new Error('Пользователь не авторизован.');

  const decks = await getDecks();
  const limits = user.isAnonymous ? LIMITS.guest : LIMITS.user;
  if (decks.length >= limits.maxDecks) {
    throw new Error(`Превышен лимит колод. Максимум для вашего аккаунта: ${limits.maxDecks}.`);
  }

  const newDeckId = `deck-${Date.now()}`;
  const newDeck = {
    name,
    description,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db && user) {
    await setDoc(doc(db, 'users', user.uid, 'decks', newDeckId), newDeck);
    return { id: newDeckId, ...newDeck };
  } else {
    initLocalStorageIfNeeded();
    const created = { id: newDeckId, ...newDeck };
    decks.push(created);
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
    localStorage.setItem(`${CARDS_KEY_PREFIX}${newDeckId}`, JSON.stringify([]));
    return created;
  }
}

export async function getDeckCards(deckId: string): Promise<Card[]> {
  const user = getCurrentUser();

  if (isFirebaseConfigured && db && user) {
    const cardsRef = collection(db, 'users', user.uid, 'decks', deckId, 'cards');
    const snap = await getDocs(cardsRef);
    const cardsList: Card[] = [];
    
    snap.forEach((doc) => {
      cardsList.push({ id: doc.id, ...doc.data() } as Card);
    });
    
    return cardsList;
  } else {
    initLocalStorageIfNeeded();
    const data = localStorage.getItem(`${CARDS_KEY_PREFIX}${deckId}`);
    return data ? JSON.parse(data) : [];
  }
}

export async function createCard(deckId: string, front: string, back: string): Promise<Card> {
  const user = getCurrentUser();
  if (!user) throw new Error('Пользователь не авторизован.');

  const cards = await getDeckCards(deckId);
  const limits = user.isAnonymous ? LIMITS.guest : LIMITS.user;
  if (cards.length >= limits.maxCardsPerDeck) {
    throw new Error(`Превышен лимит карточек в колоде. Максимум для вашего аккаунта: ${limits.maxCardsPerDeck}.`);
  }

  const newCardId = `card-${Date.now()}`;
  const newCard = {
    front,
    back,
    level: 1,
    nextReviewDate: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db && user) {
    await setDoc(doc(db, 'users', user.uid, 'decks', deckId, 'cards', newCardId), newCard);
    return { id: newCardId, ...newCard };
  } else {
    initLocalStorageIfNeeded();
    const created: Card = { id: newCardId, ...newCard };
    cards.push(created);
    localStorage.setItem(`${CARDS_KEY_PREFIX}${deckId}`, JSON.stringify(cards));
    return created;
  }
}

export async function updateCardProgress(
  deckId: string,
  cardId: string,
  isCorrect: boolean
): Promise<Card> {
  const user = getCurrentUser();

  if (isFirebaseConfigured && db && user) {
    const cardRef = doc(db, 'users', user.uid, 'decks', deckId, 'cards', cardId);
    const cardSnap = await getDoc(cardRef);
    
    if (!cardSnap.exists()) {
      throw new Error('Card not found in Firestore');
    }
    
    const currentCard = cardSnap.data() as Omit<Card, 'id'>;
    const updatedProgress = updateLeitnerCard(currentCard, isCorrect);
    const updatedCard: Card = {
      id: cardId,
      ...currentCard,
      ...updatedProgress
    };
    
    await updateDoc(cardRef, updatedProgress as any);
    return updatedCard;
  } else {
    initLocalStorageIfNeeded();
    const cards = await getDeckCards(deckId);
    const cardIndex = cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      throw new Error('Card not found in Local Storage');
    }
    
    const currentCard = cards[cardIndex];
    const updatedProgress = updateLeitnerCard(currentCard, isCorrect);
    const updatedCard: Card = {
      ...currentCard,
      ...updatedProgress
    };
    
    cards[cardIndex] = updatedCard;
    localStorage.setItem(`${CARDS_KEY_PREFIX}${deckId}`, JSON.stringify(cards));
    return updatedCard;
  }
}

export async function deleteCard(deckId: string, cardId: string): Promise<void> {
  const user = getCurrentUser();

  if (isFirebaseConfigured && db && user) {
    await deleteDoc(doc(db, 'users', user.uid, 'decks', deckId, 'cards', cardId));
  } else {
    initLocalStorageIfNeeded();
    const cards = await getDeckCards(deckId);
    const filtered = cards.filter(c => c.id !== cardId);
    localStorage.setItem(`${CARDS_KEY_PREFIX}${deckId}`, JSON.stringify(filtered));
  }
}

export async function createDeckWithCards(
  name: string,
  description: string,
  cards: { front: string; back: string }[]
): Promise<Deck> {
  const user = getCurrentUser();
  if (!user) throw new Error('Пользователь не авторизован.');

  const decks = await getDecks();
  const limits = user.isAnonymous ? LIMITS.guest : LIMITS.user;

  if (decks.length >= limits.maxDecks) {
    throw new Error(`Превышен лимит колод. Максимум для вашего аккаунта: ${limits.maxDecks}.`);
  }
  if (cards.length > limits.maxCardsPerDeck) {
    throw new Error(`Превышен лимит карточек. Данная колода содержит ${cards.length} карт, максимум для вашего аккаунта: ${limits.maxCardsPerDeck}.`);
  }

  const newDeckId = `deck-${Date.now()}`;
  const newDeck = {
    name,
    description,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db && user) {
    const batch = writeBatch(db!);
    
    // 1. Add deck creation to batch
    const deckRef = doc(db!, 'users', user.uid, 'decks', newDeckId);
    batch.set(deckRef, newDeck);

    // 2. Add each card creation to batch
    cards.forEach((card, index) => {
      const cardId = `card-${Date.now()}-${index}`;
      const cardRef = doc(db!, 'users', user.uid, 'decks', newDeckId, 'cards', cardId);
      batch.set(cardRef, {
        front: card.front,
        back: card.back,
        level: 1,
        nextReviewDate: new Date().toISOString(),
      });
    });

    // 3. Commit batch atomically
    await batch.commit();
    return { id: newDeckId, ...newDeck };
  } else {
    // Local storage fallback
    initLocalStorageIfNeeded();
    const createdDeck = { id: newDeckId, ...newDeck };
    decks.push(createdDeck);
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));

    const cardsToSave: Card[] = cards.map((card, index) => ({
      id: `card-${Date.now()}-${index}`,
      front: card.front,
      back: card.back,
      level: 1,
      nextReviewDate: new Date().toISOString(),
    }));
    localStorage.setItem(`${CARDS_KEY_PREFIX}${newDeckId}`, JSON.stringify(cardsToSave));
    
    return createdDeck;
  }
}

export async function deleteDeck(deckId: string): Promise<void> {
  const user = getCurrentUser();

  if (isFirebaseConfigured && db && user) {
    const deckRef = doc(db!, 'users', user.uid, 'decks', deckId);
    const cardsRef = collection(db!, 'users', user.uid, 'decks', deckId, 'cards');
    const cardsSnap = await getDocs(cardsRef);
    
    const batch = writeBatch(db!);
    
    // 1. Add all cards deletion to the batch
    cardsSnap.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // 2. Add the parent deck deletion to the batch
    batch.delete(deckRef);
    
    // 3. Commit atomically
    await batch.commit();
  } else {
    // Local storage fallback
    initLocalStorageIfNeeded();
    const decks = await getDecks();
    const filteredDecks = decks.filter(d => d.id !== deckId);
    localStorage.setItem(DECKS_KEY, JSON.stringify(filteredDecks));
    localStorage.removeItem(`${CARDS_KEY_PREFIX}${deckId}`);
  }
}
