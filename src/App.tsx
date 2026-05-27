import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './pages/Layout';
import { Home } from './pages/Home';
import { CharacterLibrary } from './pages/CharacterLibrary';
import { CharacterCreator } from './pages/CharacterCreator';
import { WhiteboardLibrary } from './pages/WhiteboardLibrary';
import { RoomConfigurator } from './pages/RoomConfigurator';
import { MqttProvider } from './contexts/MqttContext';
import { TwemojiProvider } from './components/TwemojiProvider';

function App() {
  return (
    <TwemojiProvider>
      <MqttProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="characters" element={<CharacterLibrary />} />
              <Route path="characters/new" element={<CharacterCreator />} />
              <Route path="whiteboards" element={<WhiteboardLibrary />} />
              <Route path="rooms" element={<RoomConfigurator />} />
            </Route>
          </Routes>
        </HashRouter>
      </MqttProvider>
    </TwemojiProvider>
  );
}

export default App;
