import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { StudySession } from './pages/StudySession';
import { DeckEditor } from './pages/DeckEditor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/study/:deckId" element={<StudySession />} />
        <Route path="/edit/:deckId" element={<DeckEditor />} />
      </Routes>
    </Router>
  );
}

export default App;
