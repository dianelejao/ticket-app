import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Topbar({ title, back }) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || isAdmin) {
      setUnreadCount(0);
      return undefined;
    }

    let active = true;
    const loadUnreadCount = () => {
      api.get('/notifications').then(({ data }) => {
        if (active) setUnreadCount((data.notifications || []).filter((notification) => !notification.is_read).length);
      }).catch(() => {});
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, isAdmin]);

  return (
    <div className="topbar">
      {back ? (
        <button className="btn btn-sm btn-outline" onClick={() => navigate(-1)}>←</button>
      ) : (
        <span className="brand">Billeterie MG</span>
      )}
      {title && <h3 style={{ margin: 0 }}>{title}</h3>}
      {user && isAdmin ? (
        <button className="topbar-icon-btn" onClick={() => navigate('/admin/settings')} title="Paramètres" aria-label="Paramètres">
          <Settings size={18} />
        </button>
      ) : user ? (
        <button className="notification-btn" onClick={() => navigate('/profile')}>
          Notifications{unreadCount > 0 && <span>{unreadCount}</span>}
        </button>
      ) : (
        <span style={{ width: 24 }} />
      )}
    </div>
  );
}
