import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Plus, Camera, Ticket, ShoppingCart, User, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationBadge from './NotificationBadge';

export default function BottomNav() {
  const { isAdmin } = useAuth();
  const { count } = useCart();

  if (isAdmin) {
    return (
      <nav className="bottom-nav admin-bottom-nav">
        <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon"><LayoutDashboard size={18} /></span>Tableau de bord
        </NavLink>
        <NavLink to="/admin/clients" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon"><Users size={18} /><NotificationBadge /></span>Clients
        </NavLink>
        <NavLink to="/admin/events/new" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon"><Plus size={18} /></span>Creer
        </NavLink>
        <NavLink to="/admin/scan" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon"><Camera size={18} /></span>Scanner
        </NavLink>
      </nav>
    );
  }

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon"><Ticket size={18} /></span>Evenements
      </NavLink>
      <NavLink to="/cart" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon"><ShoppingCart size={18} /></span>Panier{count > 0 ? ` (${count})` : ''}
      </NavLink>
      <NavLink to="/my-tickets" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon"><BadgeCheck size={18} /></span>Mes billets
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon"><User size={18} /></span>Profil
      </NavLink>
    </nav>
  );
}
