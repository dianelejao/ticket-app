import { useEffect, useState } from 'react';
import api from '../api/axios';
import EventCard from '../components/EventCard';
import Topbar from '../components/Topbar';

const CATEGORIES = [
  { value: '', label: 'Tous' },
  { value: 'concert', label: 'Concerts' },
  { value: 'cinema', label: 'Cinéma' },
  { value: 'theatre', label: 'Théâtre' },
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/events', { params: { category: category || undefined, search: search || undefined } })
      .then(({ data }) => setEvents(data.events))
      .finally(() => setLoading(false));
  }, [category, search]);

  return (
    <>
      <Topbar />
      <div className="app-main">
        <input placeholder="Rechercher un événement, une salle..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto' }}>
          {CATEGORIES.map((c) => (
            <button key={c.value} className="btn btn-sm"
              style={{ background: category === c.value ? 'var(--gold)' : 'var(--surface)', color: category === c.value ? '#1C1600' : 'var(--text)', whiteSpace: 'nowrap' }}
              onClick={() => setCategory(c.value)}>
              {c.label}
            </button>
          ))}
        </div>
        {loading && <div className="spinner" />}
        {!loading && events.length === 0 && <div className="center-empty">Aucun événement pour le moment.</div>}
        {events.map((ev) => <EventCard key={ev.id} event={ev} />)}
      </div>
    </>
  );
}
