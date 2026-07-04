import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from './Button';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('mind_flip_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mind_flip_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      icon={theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      title={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
      aria-label="Переключить тему оформления"
      style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
    />
  );
};
