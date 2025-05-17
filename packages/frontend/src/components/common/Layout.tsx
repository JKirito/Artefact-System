import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  onToggleSidebar?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, sidebar, onToggleSidebar }) => {
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
