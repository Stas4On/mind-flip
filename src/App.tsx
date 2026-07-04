import { useState } from 'react';
import { Button } from './components/ui/Button';
import { Flashcard } from './components/cards/Flashcard';
import { Check, X, RefreshCw, Star, Trash2 } from 'lucide-react';

function App() {
  const [count, setCount] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const demoCard = {
    front: `### Как создать компонент в Angular?\n\nКакая декоратор-функция используется для определения компонента в Angular и какие основные параметры она принимает?`,
    back: `### Декоратор \`@Component\`\n\nДля создания компонента используется декоратор \`@Component\` из пакета \`@angular/core\`:\n\n\`\`\`typescript\nimport { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-user-profile',\n  standalone: true,\n  templateUrl: './user-profile.component.html',\n  styleUrl: './user-profile.component.css'\n})\nexport class UserProfileComponent {\n  username = 'Leon';\n}\n\`\`\``
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '40px 20px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '40px' 
    }} className="animate-pop">
      
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          color: 'var(--color-text-main)', 
          textShadow: '2px 2px 0px var(--color-bg-page-end)',
          marginBottom: '10px'
        }} className="animate-float">
          🦖 MindFlip Design System
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', fontWeight: 500 }}>
          Тактильный игровой UI-кит с 3D эффектами
        </p>
      </header>

      {/* Interactive Flashcard Section */}
      <section style={{ 
        background: 'var(--color-card-bg)', 
        border: 'var(--border-width) solid var(--color-border)', 
        borderRadius: 'var(--border-radius-md)', 
        padding: '30px',
        boxShadow: '0 var(--shadow-depth) 0 var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center'
      }}>
        <h2>🎴 Интерактивная флеш-карточка</h2>
        <Flashcard
          front={demoCard.front}
          back={demoCard.back}
          isFlipped={isCardFlipped}
          onFlip={() => setIsCardFlipped(!isCardFlipped)}
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <Button 
            variant="outline" 
            onClick={() => setIsCardFlipped(!isCardFlipped)}
          >
            Перевернуть карточку
          </Button>
        </div>
      </section>

      {/* Button Variants Section */}
      <section style={{ 
        background: 'var(--color-card-bg)', 
        border: 'var(--border-width) solid var(--color-border)', 
        borderRadius: 'var(--border-radius-md)', 
        padding: '30px',
        boxShadow: '0 var(--shadow-depth) 0 var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2>🎨 Варианты кнопок (3D-эффект при нажатии)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <Button variant="primary">Primary Sky</Button>
          <Button variant="success" icon={<Check size={18} />}>Помню</Button>
          <Button variant="danger" icon={<X size={18} />}>Забыл</Button>
          <Button variant="warning" icon={<Star size={18} />}>Избранное</Button>
          <Button variant="outline" icon={<Trash2 size={18} />}>Удалить</Button>
        </div>
      </section>

      {/* Button Sizes Section */}
      <section style={{ 
        background: 'var(--color-card-bg)', 
        border: 'var(--border-width) solid var(--color-border)', 
        borderRadius: 'var(--border-radius-md)', 
        padding: '30px',
        boxShadow: '0 var(--shadow-depth) 0 var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2>📏 Размеры кнопок</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <Button size="sm" variant="outline">Small Size</Button>
          <Button size="md" variant="primary">Medium Size</Button>
          <Button size="lg" variant="success" icon={<Check size={24} />}>Large Button</Button>
        </div>
      </section>

      {/* Interactive State Section */}
      <section style={{ 
        background: 'var(--color-card-bg)', 
        border: 'var(--border-width) solid var(--color-border)', 
        borderRadius: 'var(--border-radius-md)', 
        padding: '30px',
        boxShadow: '0 var(--shadow-depth) 0 var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center'
      }}>
        <h2>⚡ Интерактивный кликер</h2>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Счётчик: {count}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => setCount(count + 1)}
          >
            Кликни меня!
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            icon={<RefreshCw size={20} />} 
            onClick={() => setCount(0)}
          >
            Сброс
          </Button>
        </div>
      </section>

    </div>
  );
}

export default App;
