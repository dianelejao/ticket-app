import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Topbar from '../components/Topbar';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [event, setEvent] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`).then(({ data }) => setEvent(data.event));
  }, [id]);

  if (!event) return <div className="spinner" />;

  const setQty = (catId, qty) => setQuantities((q) => ({ ...q, [catId]: Math.max(0, qty) }));

  const handleAdd = () => {
    if (!user) return navigate('/login');
    let any = false;
    event.ticket_categories.forEach((cat) => {
      const qty = quantities[cat.id] || 0;
      if (qty > 0) { addItem(event, cat, qty); any = true; }
    });
    if (any) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
      setQuantities({});
    }
  };

  return (
    <>
      <Topbar back title={event.title} />
      <div className="app-main">
        <div className="event-hero" style={{ height: 200, backgroundImage: `url(${event.image_url || ''})` }} />
        <h2>{event.title}</h2>
        <p>{event.venue} · {event.city}</p>
        <p>{formatDate(event.event_date)}</p>
        {event.description && <p style={{ color: 'var(--text)', marginTop: 12 }}>{event.description}</p>}

        <h3 style={{ marginTop: 20 }}>Catégories de billets</h3>
        {event.ticket_categories.map((cat) => {
          const available = cat.quantity_total - cat.quantity_sold;
          return (
            <div key={cat.id} className="ticket-stub">
              <div className="ticket-stub__body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="ticket-stub__category">{cat.name}</div>
                  <p style={{ margin: 0 }}>{available > 0 ? `${available} place(s) restante(s)` : 'Complet'}</p>
                </div>
                <strong>{Number(cat.price_ariary).toLocaleString('fr-FR')} Ar</strong>
              </div>
              {available > 0 && (
                <>
                  <div className="ticket-stub__divider" />
                  <div className="ticket-stub__stub">
                    <span>Quantité</span>
                    <div className="qty-control">
                      <button onClick={() => setQty(cat.id, (quantities[cat.id] || 0) - 1)}>-</button>
                      <span>{quantities[cat.id] || 0}</span>
                      <button onClick={() => setQty(cat.id, Math.min(available, (quantities[cat.id] || 0) + 1))}>+</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {added && <div className="alert alert-success">Ajouté au panier !</div>}
        <button className="btn btn-primary" onClick={handleAdd}>Ajouter au panier</button>
      </div>
    </>
  );
}
