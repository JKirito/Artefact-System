import React from 'react';
import { Layout } from '../components/common/Layout';
import { useSettings } from '../context/SettingsContext';

const ThemePage: React.FC = () => {
  const { theme, toggleTheme } = useSettings();
  return (
    <Layout>
      <div style={{ padding: '1rem' }}>
        <h2>Theme Settings</h2>
        <p>Current theme: {theme}</p>
        <button onClick={toggleTheme}>Toggle Theme</button>
      </div>
    </Layout>
  );
};

export default ThemePage;
