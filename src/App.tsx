import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { initializeAuth } from './features/auth/authSlice';
import { fetchLikes } from './features/library/librarySlice';

// Components
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { PlayerBar } from './components/PlayerBar';
import { AuthModal } from './components/AuthModal';

const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Browse = lazy(() => import('./pages/Browse').then(module => ({ default: module.Browse })));
const SongPage = lazy(() => import('./pages/Song').then(module => ({ default: module.SongPage })));
const Eras = lazy(() => import('./pages/Eras').then(module => ({ default: module.Eras })));
const Liked = lazy(() => import('./pages/Liked').then(module => ({ default: module.Liked })));
const Songs = lazy(() => import('./pages/Songs').then(module => ({ default: module.Songs })));
const RadioPage = lazy(() => import('./pages/Radio').then(module => ({ default: module.RadioPage })));

// Layout Wrapper
const AppLayout: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const location = useLocation();
  const isRadioRoute = location.pathname === '/radio';

  // Scroll to top on route change
  useEffect(() => {
    const mainEl = document.querySelector('.main-area');
    if (mainEl) mainEl.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className={`app-container${isRadioRoute ? ' radio-player-expanded' : ''}`}>
      <Sidebar />
      <TopBar onOpenAuth={onOpenAuth} />
      <main className="main-area custom-scroll">
        <Suspense fallback={<div className="route-loading">Loading</div>}>
          <Routes>
            <Route path="/" element={<Home onOpenAuth={onOpenAuth} />} />
            <Route path="/radio" element={<RadioPage onOpenAuth={onOpenAuth} />} />
            <Route path="/browse" element={<Browse onOpenAuth={onOpenAuth} />} />
            <Route path="/leaks" element={<Navigate to="/eras" replace />} />
            <Route path="/songs" element={<Songs onOpenAuth={onOpenAuth} />} />
            <Route path="/eras" element={<Eras />} />
            <Route path="/liked" element={<Liked onOpenAuth={onOpenAuth} />} />
            <Route path="/song/:id" element={<SongPage onOpenAuth={onOpenAuth} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <PlayerBar radioMode={isRadioRoute} onOpenAuth={onOpenAuth} />
    </div>
  );
};

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, initialized } = useAppSelector((state) => state.auth);
  
  const [authOpen, setAuthOpen] = useState(false);

  // Initialize auth
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Sync likes once user is initialized / logged in
  useEffect(() => {
    if (initialized) {
      dispatch(fetchLikes(user?.id));
    }
  }, [dispatch, user, initialized]);

  return (
    <BrowserRouter>
      <AppLayout onOpenAuth={() => setAuthOpen(true)} />
      
      {/* Modals */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      
      {/* Vercel Web Analytics */}
      <Analytics />
    </BrowserRouter>
  );
};

export default App;
