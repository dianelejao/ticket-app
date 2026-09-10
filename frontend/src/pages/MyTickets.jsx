import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import TicketCard from '../components/TicketCard';
import api from '../api/axios';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tickets/me').then(({ data }) => setTickets(data.tickets)).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar title="Mes billets" />
      <div className="app-main">
        {loading && <div className="spinner" />}
        {!loading && tickets.length === 0 && (
          <div className="center-empty">Vous n'avez pas encore de billet. Réservez un événement pour le voir apparaître ici.</div>
        )}
        {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
      </div>
    </>
  );
}
