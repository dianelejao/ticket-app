function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_BADGE = {
  valid: <span className="badge badge-success">Valide</span>,
  used: <span className="badge">Utilise</span>,
  cancelled: <span className="badge badge-coral">Annule</span>,
};

export default function TicketCard({ ticket }) {
  return (
    <div className="ticket-stub">
      <div className="ticket-stub__body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3>{ticket.event_title}</h3>
          {STATUS_BADGE[ticket.status]}
        </div>
        <p>{ticket.venue} · {ticket.city}</p>
        <p>{formatDate(ticket.event_date)}</p>
        <div className="qr-frame">
          <img src={ticket.qr_data_url} alt="QR code du billet" />
        </div>
        <p style={{ textAlign: 'center', fontSize: 12 }}>{ticket.qr_code_value}</p>
      </div>
      <div className="ticket-stub__divider" />
      <div className="ticket-stub__stub">
        <span className="ticket-stub__category">{ticket.category_name}</span>
      </div>
    </div>
  );
}
