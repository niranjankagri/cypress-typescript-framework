// Two screens and a tiny router: /login and the board at /. Without a token the board sends you to /login.
import { useEffect, useState } from 'react';
import { getToken } from './api.ts';
import { BoardPage } from './pages/BoardPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';

function navigate(path: string): void {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const loggedIn = getToken() !== null;

  useEffect(() => {
    if (path !== '/login' && !loggedIn) navigate('/login');
    if (path === '/login' && loggedIn) navigate('/');
  }, [path, loggedIn]);

  if (path === '/login') return <LoginPage onLoggedIn={() => navigate('/')} />;
  if (!loggedIn) return null;
  return <BoardPage onLoggedOut={() => navigate('/login')} />;
}
