import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import AdminShell from '../components/AdminShell';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PERIODS = [
  { value: 'all', label: 'Tous' },
  { value: 30, label: '30j' },
  { value: 90, label: '90j' },
  { value: 365, label: '1 an' },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setData(data));
  }, []);

  if (!data) return <div className="spinner" />;

  const chartColors = ['#f2b705', '#4ade80', '#ff6b6b', '#8b5cf6', '#38bdf8'];

  const now = new Date();
  const filteredEvents = (data.events || []).filter((event) => {
    if (period === 'all') return true;
    const eventDate = new Date(event.event_date);
    const diffDays = (now - eventDate) / (1000 * 60 * 60 * 24);
    return diffDays <= Number(period);
  });

  const eventStats = filteredEvents.map((event, index) => {
    const total = Number(event.billets_total) || 0;
    const sold = Number(event.billets_vendus) || 0;
    const percent = total > 0 ? (sold / total) * 100 : 0;
    return {
      ...event,
      color: chartColors[index % chartColors.length],
      sold,
      total,
      percent,
      revenue: Number(event.revenu) || 0,
    };
  });

  const totalSold = eventStats.reduce((sum, event) => sum + event.sold, 0);
  const totalCapacity = eventStats.reduce((sum, event) => sum + event.total, 0);
  const totalRevenue = eventStats.reduce((sum, event) => sum + event.revenue, 0);
  const avgFill = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;

  const donutSegments = eventStats.map((event, index) => {
    const previous = eventStats.slice(0, index).reduce((sum, item) => sum + item.total, 0);
    const start = (previous / Math.max(totalCapacity, 1)) * 100;
    const end = ((previous + event.total) / Math.max(totalCapacity, 1)) * 100;
    return `${event.color} ${start}% ${end}%`;
  });

  const donutStyle = {
    background: donutSegments.length
      ? `conic-gradient(${donutSegments.join(', ')})`
      : 'conic-gradient(#2a244c 0% 100%)',
  };

  const maxSold = Math.max(...eventStats.map((event) => event.sold), 1);
  const eventColors = Object.fromEntries(eventStats.map((event) => [event.id, event.color]));

  const getAvailability = (event) => {
    const total = Number(event.billets_total) || 0;
    const sold = Number(event.billets_vendus) || 0;
    const remaining = total - sold;

    if (remaining <= 0) {
      return { label: 'Complet', className: 'availability-badge status-full' };
    }

    if (remaining <= total * 0.2) {
      return { label: 'Presque plein', className: 'availability-badge status-low' };
    }

    return { label: 'Disponible', className: 'availability-badge status-open' };
  };

  return (
    <AdminShell title="Tableau de bord" className="admin-dashboard-layout">
        <section className="admin-dashboard admin-dashboard__content">
          <div className="admin-dashboard__welcome">
            <div>
              <span className="admin-eyebrow">Vue générale</span>
              <h1>Bonjour, {user?.full_name?.split(' ')[0] || 'admin'} !</h1>
              <p>Voici l'activité de votre billetterie.</p>
            </div>
            <button className="admin-alert-button" onClick={() => navigate('/admin/clients')} aria-label="Voir les notifications" title="Voir les notifications"><Bell size={18} /></button>
          </div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="value">{data.revenue_total.toLocaleString('fr-FR')} Ar</div>
            <div className="label">Chiffre d'affaires</div>
          </div>
          <div className="stat-card">
            <div className="value">{data.bookings_paid}</div>
            <div className="label">Réservations payées</div>
          </div>
          <div className="stat-card">
            <div className="value">{data.tickets_total}</div>
            <div className="label">Billets vendus</div>
          </div>
          <div className="stat-card">
            <div className="value">{data.tickets_used}</div>
            <div className="label">Entrées scannées</div>
          </div>
          <div className="stat-card">
            <div className="value">{data.clients_total}</div>
            <div className="label">Clients inscrits</div>
          </div>
          <div className="stat-card">
            <div className="value">{data.new_clients_30d}</div>
            <div className="label">Nouveaux 30j</div>
          </div>
        </div>

        <div className="dashboard-section-header">
          <h3>Performance</h3>
          <div className="period-switcher">
            {PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={period === item.value ? 'period-btn active' : 'period-btn'}
                onClick={() => setPeriod(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <span>Total</span>
            <strong>{totalCapacity.toLocaleString('fr-FR')}</strong>
            <small>places disponibles</small>
          </div>
          <div className="summary-card">
            <span>Vendu</span>
            <strong>{totalSold.toLocaleString('fr-FR')}</strong>
            <small>billets vendus</small>
          </div>
          <div className="summary-card">
            <span>Revenu</span>
            <strong>{totalRevenue.toLocaleString('fr-FR')} Ar</strong>
            <small>CA cumulé</small>
          </div>
          <div className="summary-card">
            <span>Taux</span>
            <strong>{Math.round(avgFill)}%</strong>
            <small>remplissage</small>
          </div>
        </div>

        <div className="event-chart-panel">
          <div className="donut-wrap">
            <div className="donut-chart" style={donutStyle}>
              <div className="donut-chart__inner">
                <strong>{Math.round(avgFill)}%</strong>
                <span>rempli</span>
              </div>
            </div>
          </div>

          <div className="event-chart-legend">
            {eventStats.map((event) => (
              <div key={`${event.id}-legend`} className="event-chart-legend__item">
                <span className="legend-dot" style={{ background: event.color }} />
                <span>{event.title}</span>
              </div>
            ))}
          </div>
        </div>

        <h3>Ventes par événement</h3>
        {filteredEvents.map((ev) => {
          const availability = getAvailability(ev);
          const totalTickets = Number(ev.billets_total) || 0;
          const soldTickets = Number(ev.billets_vendus) || 0;
          const soldPercent = totalTickets > 0
            ? Math.min((soldTickets / totalTickets) * 100, 100)
            : 0;

          return (
            <div
              key={ev.id}
              className="ticket-stub"
              onClick={() => navigate(`/admin/events/${ev.id}`)}
              style={{ '--event-color': eventColors[ev.id] || 'var(--gold)', cursor: 'pointer' }}
            >
              <div className="ticket-stub__body">
                <div className="ticket-stub__heading">
                  <h3>{ev.title}</h3>
                  <span className={availability.className}>{availability.label}</span>
                </div>
                <p>{new Date(ev.event_date).toLocaleDateString('fr-FR')} · {ev.status}</p>
                <p style={{ color: 'var(--text)' }}>{ev.billets_vendus} / {ev.billets_total} billets vendus</p>
                <div className="ticket-availability" aria-label={`${soldTickets} billets vendus sur ${totalTickets}`}>
                  <div className="ticket-availability__header">
                    <span>{soldTickets} billet{soldTickets > 1 ? 's' : ''} vendu{soldTickets > 1 ? 's' : ''}</span>
                    <strong>{Math.round(soldPercent)}% vendu</strong>
                  </div>
                  <div className="ticket-availability__track">
                    <div
                      className={`ticket-availability__fill ${availability.className}`}
                      style={{ width: `${soldPercent}%`, background: eventColors[ev.id] || 'var(--gold)' }}
                    />
                  </div>
                </div>
              </div>
              <div className="ticket-stub__divider" />
              <div className="ticket-stub__stub">
                <span>Revenu</span>
                <strong>{Number(ev.revenu).toLocaleString('fr-FR')} Ar</strong>
              </div>
            </div>
          );
        })}
        </section>
    </AdminShell>
  );
}
