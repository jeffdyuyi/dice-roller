import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './pages/Layout';
import { Home } from './pages/Home';
import { CharacterLibrary } from './pages/CharacterLibrary';
import { CharacterCreator } from './pages/CharacterCreator';
import { MqttProvider } from './contexts/MqttContext';

function App() {
  return (
    <MqttProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="characters" element={<CharacterLibrary />} />
            <Route path="characters/new" element={<CharacterCreator />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MqttProvider>
  );
}

export default App;
