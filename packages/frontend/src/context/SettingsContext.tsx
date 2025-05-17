import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface SettingsContextType {
  theme: Theme;
  toggleTheme: () => void;
  defaultSidebarOpen: boolean;
  setDefaultSidebarOpen: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  defaultSidebarOpen: false,
  setDefaultSidebarOpen: () => {},
});

export const useSettings = () => useContext(SettingsContext);

interface ProviderProps { children: ReactNode }

export const SettingsProvider: React.FC<ProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [defaultSidebarOpen, setDefaultSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = theme === 'light' ? '#ffffff' : '#121212';
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, defaultSidebarOpen, setDefaultSidebarOpen }}>
      {children}
    </SettingsContext.Provider>
  );
};
