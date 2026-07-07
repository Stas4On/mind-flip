import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Spinner } from './components/ui/Spinner';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const StudySession = lazy(() => import('./pages/StudySession').then(m => ({ default: m.StudySession })));
const DeckEditor = lazy(() => import('./pages/DeckEditor').then(m => ({ default: m.DeckEditor })));
const Explore = lazy(() => import('./pages/Explore').then(m => ({ default: m.Explore })));

function App() {
  return (
    <Router>
      <Suspense fallback={<Spinner fullScreen message="Запуск приложения..." />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/study/:deckId" element={<StudySession />} />
          <Route path="/edit/:deckId" element={<DeckEditor />} />
          <Route path="/explore" element={<Explore />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
