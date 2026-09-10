import { useNavigate } from 'react-router-dom';

const CATEGORY_LABELS = { concert: 'Concert', cinema: 'Cinéma', theatre: 'Théâtre', autre: 'Événement' };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function EventCard({ event }) {
  const navigate = useNavigate();
  const minPrice = event.ticket_categories?.length
    ? Math.min(...event.ticket_categories.map((c) => Number(c.price_ariary)))
    : null;

  return (
    <div className="ticket-stub" onClick={() => navigate(`/events/${event.id}`)} style={{ cursor: 'pointer' }}>
      <div
        className="event-hero"
        style={{ backgroundImage: `url(${event.image_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3'})`, marginBottom: 0, borderRadius: '10px 10px 0 0' }}
      >
        <span className="badge badge-gold cat-badge">{CATEGORY_LABELS[event.category] || event.category}</span>
      </div>
      <div className="ticket-stub__body">
        <h3>{event.title}</h3>
        <p>{event.venue} · {event.city}</p>
        <p>{formatDate(event.event_date)}</p>
      </div>
      <div className="ticket-stub__divider" />
      <div className="ticket-stub__stub">
        <span className="ticket-stub__category">Dès que</span>
        <span className="ticket-stub__price">{minPrice ? `${minPrice.toLocaleString('fr-FR')} Ar` : '—'}</span>
      </div>
    </div>
  );
}
