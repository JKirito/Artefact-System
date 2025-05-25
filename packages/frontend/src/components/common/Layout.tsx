import React, { ReactNode, useState } from "react";
import { Link } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  sidebar,
  onToggleSidebar,
  isSidebarOpen = true,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex flex-col items-center justify-start gap-4 p-0 w-full m-0 h-screen">
      <header className="w-full p-4 bg-white/5 border-b border-white/10 text-center relative">
        {onToggleSidebar && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-none border-none text-white text-xl cursor-pointer hover:text-blue-400 transition-colors duration-200"
            onClick={onToggleSidebar}
            title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            &#9776;
          </button>
        )}
        <h1 className="m-0 text-2xl text-blue-500">AI Chat Assistant</h1>
        <nav className="mt-2">
          <Link
            to="/"
            className="mx-2 text-inherit no-underline hover:underline"
          >
            Home
          </Link>
          <Link
            to="/playground"
            className="mx-2 text-inherit no-underline hover:underline"
          >
            Playground
          </Link>
        </nav>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-none border-none text-white text-xl cursor-pointer hover:text-blue-400 transition-colors duration-200"
          onClick={() => setShowMenu((p) => !p)}
        >
          ⚙
        </button>
        {showMenu && (
          <ul
            className="absolute right-4 top-full mt-2 bg-gray-800 border border-white/10 rounded list-none py-2 m-0 z-50"
            onMouseLeave={() => setShowMenu(false)}
          >
            <li className="px-4 py-2 hover:bg-white/10">
              <Link
                to="/settings"
                onClick={() => setShowMenu(false)}
                className="text-inherit no-underline"
              >
                Settings
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-white/10">
              <Link
                to="/theme"
                onClick={() => setShowMenu(false)}
                className="text-inherit no-underline"
              >
                Theme
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-white/10">
              <Link
                to="/preferences"
                onClick={() => setShowMenu(false)}
                className="text-inherit no-underline"
              >
                Preferences
              </Link>
            </li>
          </ul>
        )}
      </header>
      <div className="flex flex-1 w-full overflow-hidden relative">
        {sidebar}
        <main
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "md:ml-0" : "ml-0"
          }`}
        >
          {children}
        </main>
      </div>
      <footer className="w-full p-2 bg-white/5 border-t border-white/10 text-center text-sm text-white/60">
        <p>&copy; {new Date().getFullYear()} AI Chat Assistant</p>
      </footer>
    </div>
  );
};
