import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { initializeAuth } from './features/auth/authSlice';
import { fetchLikes } from './features/library/librarySlice';

// Components
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { PlayerBar } from './components/PlayerBar';
import { AuthModal } from './components/AuthModal';
import { UploadModal } from './components/UploadModal';

// Pages
import { Home } from './pages/Home';
import { Browse } from './pages/Browse';
import { SongPage } from './pages/Song';
import { Eras } from './pages/Eras';
import { Liked } from './pages/Liked';

// Layout Wrapper
const AppLayout: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    const mainEl = document.querySelector('.main-area');
    if (mainEl) mainEl.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className="app-container">
      <Sidebar />
      <TopBar onOpenAuth={onOpenAuth} />
      <main className="main-area custom-scroll">
        <Routes>
          <Route path="/" element={<Home onOpenAuth={onOpenAuth} />} />
          <Route path="/browse" element={<Browse onOpenAuth={onOpenAuth} />} />
          <Route path="/leaks" element={<Navigate to="/eras" replace />} />
          <Route path="/eras" element={<Eras />} />
          <Route path="/liked" element={<Liked onOpenAuth={onOpenAuth} />} />
          <Route path="/song/:id" element={<SongPage onOpenAuth={onOpenAuth} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <PlayerBar />
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
      <UploadModal />
    </BrowserRouter>
  );
};

export default App;
