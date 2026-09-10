import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminShell from '../components/AdminShell';
import api from '../api/axios';

export default function AdminEventAttendees() {
  const { id } = useParams();
  const [attendees, setAttendees] = useState([]);
  const [notif, setNotif] = useState({ title: '', body: '' });
  const [sent, setSent] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get(`/admin/events/${id}/attendees`).then(({ data }) => setAttendees(data.attendees));
  }, [id]);

  const broadcast = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/admin/notifications/broadcast', { event_id: id, ...notif });
    setSent(data.message);
    setNotif({ title: '', body: '' });
  };

  const filteredAttendees = attendees.filter((attendee) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [attendee.full_name, attendee.email, attendee.category_name]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
    const matchesStatus = !statusFilter || attendee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCsv = () => {
    const headers = ['Nom', 'Email', 'Catégorie', 'Statut'];
    const rows = filteredAttendees.map((attendee) => [
      attendee.full_name,
      attendee.email,
      attendee.category_name,
      attendee.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value || '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `participants-${id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell back title="Participants" className="admin-attendees-layout">
      <div className="app-main admin-page-body">
        <h3>Notifier les participants</h3>
        {sent && <div className="alert alert-success">{sent}</div>}
        <form onSubmit={broadcast}>
          <input placeholder="Titre (ex: Changement de salle)" required
            value={notif.title} onChange={(e) => setNotif({ ...notif, title: e.target.value })} />
          <textarea placeholder="Message" rows={3} required
            value={notif.body} onChange={(e) => setNotif({ ...notif, body: e.target.value })} />
          <button className="btn btn-primary">Envoyer la notification</button>
        </form>

        <div className="section-heading attendees-heading">
          <h3>Liste des billets ({filteredAttendees.length}/{attendees.length})</h3>
          <button type="button" className="ghost-btn" onClick={exportCsv} disabled={!filteredAttendees.length}>Exporter CSV</button>
        </div>
        <div className="filter-row">
          <input
            type="search"
            placeholder="Rechercher un participant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="valid">Valides</option>
            <option value="used">Utilisés</option>
            <option value="cancelled">Annulés</option>
          </select>
        </div>
        {filteredAttendees.map((a) => (
          <div key={a.ticket_id} className="ticket-stub">
            <div className="ticket-stub__body" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: 'var(--text)' }}>{a.full_name}</strong>
                <p>{a.category_name} · {a.email}</p>
              </div>
              <span className={`badge ticket-status-badge ${a.status === 'used' ? 'badge-success' : 'badge-gold'}`}>{a.status}</span>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
