import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';

import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyTickets from './pages/MyTickets';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminClients from './pages/AdminClients';
import AdminCreateEvent from './pages/AdminCreateEvent';
import AdminEventAttendees from './pages/AdminEventAttendees';
import AdminScanner from './pages/AdminScanner';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';

function RequireAuth({ children, adminOnly }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, isAdmin } = useAuth();
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ticket-app-view-mode') || 'auto');

  useEffect(() => {
    localStorage.setItem('ticket-app-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const handleViewModeChange = (event) => setViewMode(event.detail);
    window.addEventListener('ticket-app-view-mode-change', handleViewModeChange);
    return () => window.removeEventListener('ticket-app-view-mode-change', handleViewModeChange);
  }, []);

  const rootClassName = viewMode === 'auto' ? '' : `view-mode-${viewMode}`;

  return (
    <div id="app-shell" className={rootClassName}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Espace client */}
        <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="/my-tickets" element={<RequireAuth><MyTickets /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

        {/* Espace admin */}
        <Route path="/admin" element={<RequireAuth adminOnly><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/clients" element={<RequireAuth adminOnly><AdminClients /></RequireAuth>} />
        <Route path="/admin/events/new" element={<RequireAuth adminOnly><AdminCreateEvent /></RequireAuth>} />
        <Route path="/admin/events/:id" element={<RequireAuth adminOnly><AdminEventAttendees /></RequireAuth>} />
        <Route path="/admin/scan" element={<RequireAuth adminOnly><AdminScanner /></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth adminOnly><AdminReports /></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth adminOnly><AdminSettings /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <BottomNav />}
    </div>
  );
}
