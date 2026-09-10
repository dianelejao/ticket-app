import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_LABEL = { paid: 'Payée', pending: 'En attente', cancelled: 'Annulée' };

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState('historique');

  useEffect(() => {
    api.get('/bookings/me').then(({ data }) => setBookings(data.bookings));
    api.get('/notifications').then(({ data }) => setNotifications(data.notifications));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <Topbar title="Profil" />
      <div className="app-main">
        <div className="ticket-stub">
          <div className="ticket-stub__body">
            <h3>{user?.full_name}</h3>
            <p>{user?.email}</p>
            {user?.phone && <p>{user.phone}</p>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button className="btn btn-sm" style={{ background: tab === 'historique' ? 'var(--gold)' : 'var(--surface)', color: tab === 'historique' ? '#1C1600' : 'var(--text)' }}
            onClick={() => setTab('historique')}>Historique</button>
          <button className="btn btn-sm" style={{ background: tab === 'notifications' ? 'var(--gold)' : 'var(--surface)', color: tab === 'notifications' ? '#1C1600' : 'var(--text)' }}
            onClick={() => setTab('notifications')}>
            Notifications{notifications.filter((n) => !n.is_read).length > 0 ? ` (${notifications.filter((n) => !n.is_read).length})` : ''}
          </button>
        </div>

        {tab === 'historique' && (
          bookings.length === 0 ? <div className="center-empty">Aucune réservation pour le moment.</div> :
          bookings.map((b) => (
            <div key={b.id} className="ticket-stub">
              <div className="ticket-stub__body">
                {b.items.map((it) => (
                  <p key={it.id} style={{ color: 'var(--text)' }}>{it.quantity} x {it.category_name} — {it.event_title}</p>
                ))}
                <p>{new Date(b.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="ticket-stub__divider" />
              <div className="ticket-stub__stub">
                <span className={`badge ${b.status === 'paid' ? 'badge-success' : b.status === 'cancelled' ? 'badge-coral' : ''}`}>
                  {STATUS_LABEL[b.status]}
                </span>
                <strong>{Number(b.total_ariary).toLocaleString('fr-FR')} Ar</strong>
              </div>
            </div>
          ))
        )}

        {tab === 'notifications' && (
          notifications.length === 0 ? <div className="center-empty">Aucune notification.</div> :
          notifications.map((n) => (
            <div key={n.id} className="alert" style={{ background: n.is_read ? 'var(--surface)' : 'rgba(242,183,5,0.1)' }}
              onClick={() => api.put(`/notifications/${n.id}/read`).then(() =>
                setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x)))}>
              <strong style={{ color: 'var(--text)' }}>{n.title}</strong>
              <p style={{ margin: '4px 0 0' }}>{n.body}</p>
            </div>
          ))
        )}

        <button className="btn btn-outline" style={{ marginTop: 20 }} onClick={handleLogout}>Se déconnecter</button>
      </div>
    </>
  );
}
