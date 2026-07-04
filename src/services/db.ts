import { updateLeitnerCard } from '../lib/leitner';

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

const DECKS_KEY = 'mind_flip_decks';
const CARDS_KEY_PREFIX = 'mind_flip_cards_';

// Initial Mock Data
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

const INITIAL_CARDS: Record<string, Card[]> = {
  'js-basics': [
    {
      id: 'js-1',
      front: 'Что такое **замыкание (Closure)** в JavaScript?',
      back: '### Замыкание (Closure)\n\nЗамыкание — это комбинация функции и лексического окружения, в котором эта функция была определена. Простыми словами, функция "помнит" переменные из своей внешней области видимости, даже когда вызывается вне её.\n\n```javascript\nfunction createCounter() {\n  let count = 0;\n  return function() {\n    return ++count;\n  };\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n```',
      level: 1,
      nextReviewDate: new Date().toISOString(), // due now
    },
    {
      id: 'js-2',
      front: 'В чем разница между `==` и `===`?',
      back: '### Сравнение с приведением типов и без\n\n- `==` сравнивает значения на равенство, предварительно приводя их к одному типу (нестрогое равенство).\n- `===` сравнивает и значения, и типы без приведения типов (строгое равенство).\n\n```javascript\n5 == "5"   // true (строка "5" приводится к числу)\n5 === "5"  // false (разные типы: number и string)\nnull == undefined  // true\nnull === undefined // false\n```',
      level: 1,
      nextReviewDate: new Date().toISOString(), // due now
    }
  ],
  'angular-core': [
    {
      id: 'ng-1',
      front: 'Что такое **Сигналы (Signals)** в Angular?',
      back: '### Angular Signals\n\nСигнал — это обертка над значением, которая умеет уведомлять заинтересованных потребителей об изменении этого значения. Это позволяет Angular точечно обновлять шаблоны без прохода по всему дереву компонентов.\n\n```typescript\nimport { signal, computed } from \'@angular/core\';\n\nconst count = signal(0);\nconst doubleCount = computed(() => count() * 2);\n\nconsole.log(count()); // 0\ncount.set(5);\nconsole.log(doubleCount()); // 10\n```',
      level: 1,
      nextReviewDate: new Date().toISOString(), // due now
    },
    {
      id: 'ng-2',
      front: 'Как работает Директива `*ngFor` и её современный аналог `@for`?',
      back: '### Рендеринг списков\n\nНачиная с Angular 17, вместо структурной директивы `*ngFor` используется новый встроенный синтаксис управляющих конструкций `@for`, который работает быстрее и не требует импорта:\n\n```html\n<!-- Старый синтаксис -->\n<li *ngFor="let item of items; trackBy: trackById">\n  {{ item.name }}\n</li>\n\n<!-- Новый синтаксис (Angular 17+) -->\n@for (item of items; track item.id) {\n  <li>{{ item.name }}</li>\n} @empty {\n  <li>Список пуст!</li>\n}\n```',
      level: 1,
      nextReviewDate: new Date().toISOString(), // due now
    }
  ]
};

// Initialize localStorage with mockup if empty
function initDbIfNeeded() {
  if (!localStorage.getItem(DECKS_KEY)) {
    localStorage.setItem(DECKS_KEY, JSON.stringify(INITIAL_DECKS));
    Object.entries(INITIAL_CARDS).forEach(([deckId, cards]) => {
      localStorage.setItem(`${CARDS_KEY_PREFIX}${deckId}`, JSON.stringify(cards));
    });
  }
}

export async function getDecks(): Promise<Deck[]> {
  initDbIfNeeded();
  const data = localStorage.getItem(DECKS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function createDeck(name: string, description: string): Promise<Deck> {
  initDbIfNeeded();
  const decks = await getDecks();
  const newDeck: Deck = {
    id: `deck-${Date.now()}`,
    name,
    description,
    createdAt: new Date().toISOString(),
  };
  decks.push(newDeck);
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  localStorage.setItem(`${CARDS_KEY_PREFIX}${newDeck.id}`, JSON.stringify([]));
  return newDeck;
}

export async function getDeckCards(deckId: string): Promise<Card[]> {
  initDbIfNeeded();
  const data = localStorage.getItem(`${CARDS_KEY_PREFIX}${deckId}`);
  return data ? JSON.parse(data) : [];
}

export async function createCard(deckId: string, front: string, back: string): Promise<Card> {
  initDbIfNeeded();
  const cards = await getDeckCards(deckId);
  const newCard: Card = {
    id: `card-${Date.now()}`,
    front,
    back,
    level: 1,
    nextReviewDate: new Date().toISOString(), // due immediately
  };
  cards.push(newCard);
  localStorage.setItem(`${CARDS_KEY_PREFIX}${deckId}`, JSON.stringify(cards));
  return newCard;
}

export async function updateCardProgress(
  deckId: string,
  cardId: string,
  isCorrect: boolean
): Promise<Card> {
  initDbIfNeeded();
  const cards = await getDeckCards(deckId);
  const cardIndex = cards.findIndex(c => c.id === cardId);
  
  if (cardIndex === -1) {
    throw new Error('Card not found');
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
