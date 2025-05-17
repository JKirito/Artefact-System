import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import Playground from './pages/Playground';
import SettingsPage from './pages/SettingsPage';
import ThemePage from './pages/ThemePage';
import PreferencesPage from './pages/PreferencesPage';
import { SettingsProvider } from './context/SettingsContext';

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/theme" element={<ThemePage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
};

export default App;
