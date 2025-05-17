import React from 'react';
import { Layout } from '../components/common/Layout';
import { useSettings } from '../context/SettingsContext';

const PreferencesPage: React.FC = () => {
  const { defaultSidebarOpen, setDefaultSidebarOpen } = useSettings();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultSidebarOpen(e.target.checked);
  };

  return (
    <Layout>
      <div style={{ padding: '1rem' }}>
        <h2>Preferences</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Language:
            <select style={{ marginLeft: '0.5rem' }}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" checked={defaultSidebarOpen} onChange={handleChange} />
            {' '}Open sidebar by default
          </label>
        </div>
      </div>
    </Layout>
  );
};

export default PreferencesPage;
