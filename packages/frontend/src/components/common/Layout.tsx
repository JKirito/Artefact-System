import React, { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  onToggleSidebar?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, sidebar, onToggleSidebar }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        {onToggleSidebar && (
          <button className="menu-button" onClick={onToggleSidebar}>
            &#9776;
          </button>
        )}
        <h1>AI Chat Assistant</h1>
        <nav className="app-nav">
          <Link to="/">Home</Link>
          <Link to="/playground">Playground</Link>
        </nav>
        <button className="settings-button" onClick={() => setShowMenu((p) => !p)}>
          ⚙
        </button>
        {showMenu && (
          <ul className="settings-menu" onMouseLeave={() => setShowMenu(false)}>
            <li>
              <Link to="/settings" onClick={() => setShowMenu(false)}>Settings</Link>
            </li>
            <li>
              <Link to="/theme" onClick={() => setShowMenu(false)}>Theme</Link>
            </li>
            <li>
              <Link to="/preferences" onClick={() => setShowMenu(false)}>Preferences</Link>
            </li>
          </ul>
        )}
      </header>
      <div className="app-body">
        {sidebar}
        <main className="app-main">
          {children}
        </main>
      </div>
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} AI Chat Assistant</p>
      </footer>
    </div>
  );
};
