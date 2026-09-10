import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function NotificationBadge() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return undefined;

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
  }, [user]);

  if (!unreadCount) return null;
  return <span className="notification-badge" aria-label={`${unreadCount} notification${unreadCount > 1 ? 's' : ''}`}>{unreadCount}</span>;
}