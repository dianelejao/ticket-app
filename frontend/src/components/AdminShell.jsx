import { BarChart3, CalendarPlus, LayoutDashboard, LogOut, QrCode, Settings, ShoppingBag, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Topbar from './Topbar';
import NotificationBadge from './NotificationBadge';

const NAV_ITEMS = [
  { path: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { path: '/admin/clients', label: 'Clients', icon: Users },
  { path: '/admin/events/new', label: 'Créer un événement', icon: CalendarPlus },
  { path: '/admin/scan', label: 'Scanner les billets', icon: QrCode },
  { path: '/admin/clients', label: 'Paiements', icon: ShoppingBag },
];

export default function AdminShell({ title, back, className = '', children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (item) => item.end
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);

  return (
    <>
      <Topbar title={title} back={back} />
      <div className={`admin-page-layout ${className}`}>
        <aside className="admin-sidebar" aria-label="Navigation administrateur">
          <div className="admin-sidebar__profile">
            <div className="admin-avatar">{user?.full_name?.charAt(0) || 'A'}</div>
            <div>
              <strong>{user?.full_name || 'Administrateur'}</strong>
              <span>Administrateur</span>
            </div>
          </div>
          <nav className="admin-sidebar__nav">
            {NAV_ITEMS.map(({ path, label, icon: Icon, end }) => (
              <button key={`${path}-${label}`} className={isActive({ path, end }) ? 'active' : ''} onClick={() => navigate(path)}>
                <span className="admin-nav-icon"><Icon size={16} />{label === 'Clients' && <NotificationBadge />}</span>
                {label}
              </button>
            ))}
            <button className={location.pathname === '/admin/reports' ? 'active' : ''} onClick={() => navigate('/admin/reports')}><BarChart3 size={16} />Rapports</button>
            <button className={location.pathname === '/admin/settings' ? 'active' : ''} onClick={() => navigate('/admin/settings')}><Settings size={16} />Paramètres</button>
          </nav>
          <button className="admin-sidebar__logout" onClick={handleLogout}><LogOut size={16} />Déconnexion</button>
        </aside>
        <main className="admin-page-content">
          {children}
        </main>
      </div>
    </>
  );
}
