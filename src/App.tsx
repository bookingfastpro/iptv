import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import Navbar from './components/Layout/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import LiveTV from './pages/LiveTV';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import Series from './pages/Series';
import SeriesDetail from './pages/SeriesDetail';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Player from './pages/Player';
import LoadingSpinner from './components/UI/LoadingSpinner';
import Toast from './components/UI/Toast';

function ProtectedLayout() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<LiveTV />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/series" element={<Series />} />
          <Route path="/series/:id" element={<SeriesDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/player" element={<Player />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Navbar />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, initAuth, toast, setToast } = useAppStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isLoading && !isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0a0a0f' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="text-3xl font-bold tracking-wider" style={{ color: '#00d4ff' }}>
            AURA TV
          </div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/*"
          element={isAuthenticated ? <ProtectedLayout /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
