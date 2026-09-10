import { useEffect, useState } from 'react';
import AdminShell from '../components/AdminShell';
import api from '../api/axios';
import mvolaLogo from '../../img/mvola.png';
import orangeLogo from '../../img/orange.png';
import airtelLogo from '../../img/airtel.png';

const PAYMENT_LOGOS = { mvola: mvolaLogo, orange_money: orangeLogo, airtel_money: airtelLogo };

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [activeView, setActiveView] = useState('clients');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientDetail, setClientDetail] = useState(null);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadClients = () => {
    api.get('/admin/clients').then(({ data }) => setClients(data.clients || [])).finally(() => setLoading(false));
  };

  const loadPayments = (status = paymentStatus) => {
    api.get(`/admin/bookings/payments?status=${status}`).then(({ data }) => setPayments(data.bookings || []));
  };

  const loadNotifications = () => {
    api.get('/notifications').then(({ data }) => setNotifications(data.notifications || []));
  };

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { loadPayments(); }, [paymentStatus]);
  useEffect(() => { loadNotifications(); }, []);

  const openClient = async (clientId) => {
    setSelectedClientId(clientId);
    try {
      const { data } = await api.get(`/admin/clients/${clientId}`);
      setClientDetail(data);
    } catch (err) {
      setClientDetail(null);
    }
  };

  const approvePayment = async (bookingId) => {
    try {
      await api.post(`/admin/bookings/${bookingId}/approve`);
      loadPayments();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'approbation du paiement.");
    }
  };

  const rejectPayment = async (bookingId) => {
    try {
      await api.post(`/admin/bookings/${bookingId}/reject`);
      loadPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du refus du paiement.');
    }
  };

  const sendMessage = async () => {
    if (!selectedClientId || !messageTitle.trim() || !messageBody.trim()) return;
    setSending(true);
    try {
      await api.post(`/admin/clients/${selectedClientId}/message`, { title: messageTitle.trim(), body: messageBody.trim() });
      setMessageTitle('');
      setMessageBody('');
      alert('Message envoyé au client.');
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'envoi du message.");
    } finally {
      setSending(false);
    }
  };

  const markNotificationRead = async (notification) => {
    if (notification.is_read) return;
    await api.put(`/notifications/${notification.id}/read`);
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
  };

  const filteredClients = clients.filter((client) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [client.full_name, client.email, client.phone].filter(Boolean).some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (!statusFilter || client.status === statusFilter);
  });

  if (loading) return <div className="spinner" />;

  return (
    <AdminShell title="Clients" className="admin-clients-layout">
      <div className="app-main admin-page-body">
        <div className="section-heading">
          <h3>{activeView === 'clients' ? 'Liste des clients' : activeView === 'payments' ? 'Tous les paiements' : 'Notifications'}</h3>
          <span className="section-total">{activeView === 'clients' ? `${filteredClients.length}/${clients.length}` : activeView === 'payments' ? payments.length : notifications.length}</span>
        </div>
        <div className="period-switcher admin-view-switcher" role="tablist" aria-label="Vue admin">
          <button type="button" className={activeView === 'clients' ? 'period-btn active' : 'period-btn'} onClick={() => setActiveView('clients')}>Tous les clients</button>
          <button type="button" className={activeView === 'payments' ? 'period-btn active' : 'period-btn'} onClick={() => setActiveView('payments')}>Tous les paiements</button>
          <button type="button" className={activeView === 'notifications' ? 'period-btn active' : 'period-btn'} onClick={() => setActiveView('notifications')}>Notifications</button>
        </div>

        {activeView === 'clients' && (
          <>
            <div className="filter-row">
              <input type="search" placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Tous les statuts</option><option value="Actif">Actif</option><option value="Nouveau">Nouveau</option><option value="Inactif">Inactif</option>
              </select>
            </div>
            {filteredClients.length === 0 ? <div className="center-empty">Aucun client inscrit pour le moment.</div> : filteredClients.map((client) => (
              <div key={client.id} className="ticket-stub client-row"><div className="ticket-stub__body">
                <div className="client-row__header"><h3>{client.full_name}</h3><span className={`status-pill status-${String(client.status || 'Nouveau').toLowerCase().replace(/\s+/g, '-')}`}>{client.status || 'Nouveau'}</span></div>
                <p>{client.email}</p><p>{client.phone || 'Sans téléphone'}</p>
                <div className="client-row__meta"><span>Inscrit le {new Date(client.created_at).toLocaleDateString('fr-FR')}</span><strong>{Number(client.total_spent || 0).toLocaleString('fr-FR')} Ar</strong></div>
                <div className="client-row__actions"><button type="button" className="ghost-btn" onClick={() => openClient(client.id)}>Voir</button><button type="button" className="ghost-btn" onClick={() => { openClient(client.id); setMessageTitle(''); setMessageBody(''); }}>Envoyer message</button></div>
              </div></div>
            ))}
          </>
        )}

        {activeView === 'payments' && (
          <>
            <div className="period-switcher" role="tablist" aria-label="Statut des paiements">
              <button type="button" className={paymentStatus === 'all' ? 'period-btn active' : 'period-btn'} onClick={() => setPaymentStatus('all')}>Tous</button>
              <button type="button" className={paymentStatus === 'pending' ? 'period-btn active' : 'period-btn'} onClick={() => setPaymentStatus('pending')}>En attente</button>
              <button type="button" className={paymentStatus === 'approved' ? 'period-btn active' : 'period-btn'} onClick={() => setPaymentStatus('approved')}>Approuvés</button>
              <button type="button" className={paymentStatus === 'rejected' ? 'period-btn active' : 'period-btn'} onClick={() => setPaymentStatus('rejected')}>Refusés</button>
            </div>
            {payments.length === 0 ? <div className="center-empty">Aucun paiement dans cette categorie.</div> : payments.map((payment) => (
              <div key={payment.id} className="ticket-stub payment-history-row"><div className="ticket-stub__body">
                <div className="client-row__header"><div className="payment-client-name"><img src={PAYMENT_LOGOS[payment.payment_method]} alt={payment.payment_method} className="payment-logo" /><h3>{payment.client_name}</h3></div><span className="status-pill status-nouveau">{payment.status === 'awaiting_approval' ? 'En attente' : payment.status === 'paid' ? 'Approuve' : 'Refuse'}</span></div>
                <p>{payment.payment_method} · Référence : {payment.payment_reference}</p><p>Payeur : {payment.payer_name} · {payment.payer_phone}</p><p>{(payment.items || []).map((item) => `${item.event_title} · ${item.category_name} x${item.quantity}`).join(' | ')}</p><strong>{Number(payment.total_ariary).toLocaleString('fr-FR')} Ar</strong>
              </div>{payment.status === 'awaiting_approval' && <div className="ticket-stub__stub payment-history-row__actions"><button type="button" className="btn btn-primary payment-action-btn" onClick={() => approvePayment(payment.id)}>Approuver</button><button type="button" className="ghost-btn payment-action-btn" onClick={() => rejectPayment(payment.id)}>Refuser</button></div>}</div>
            ))}
          </>
        )}

        {activeView === 'notifications' && (
          notifications.length === 0 ? <div className="center-empty">Aucune notification.</div> :
          notifications.map((notification) => (
            <div key={notification.id} className="alert" style={{ background: notification.is_read ? 'var(--surface)' : 'rgba(242,183,5,0.1)' }} onClick={() => markNotificationRead(notification)}>
              <strong style={{ color: 'var(--text)' }}>{notification.title}</strong>
              <p style={{ margin: '4px 0 0' }}>{notification.body}</p>
              <small>{new Date(notification.created_at).toLocaleString('fr-FR')}</small>
            </div>
          ))
        )}

        {clientDetail && activeView === 'clients' && <div className="client-detail-card">
          <div className="client-detail-card__header"><h4>{clientDetail.client.full_name}</h4><span className="status-pill status-nouveau">{clientDetail.client.status || 'Nouveau'}</span></div>
          <p>{clientDetail.client.email}</p><p>{clientDetail.client.phone || 'Pas de numéro'}</p><small>Inscrit le {new Date(clientDetail.client.created_at).toLocaleDateString('fr-FR')}</small>
          <div style={{ marginTop: 12, fontWeight: 700, color: 'var(--text)' }}>Total dépensé : {Number(clientDetail.client.total_spent || 0).toLocaleString('fr-FR')} Ar</div>
          <div style={{ marginTop: 16 }}><h4>Historique d'achats</h4>{(clientDetail.bookings || []).length === 0 ? <p>Aucun achat pour le moment.</p> : <div className="history-list">{clientDetail.bookings.map((booking) => <div key={booking.id} className="history-item"><div className="history-item__head"><strong>{booking.status}</strong><span>{new Date(booking.created_at).toLocaleDateString('fr-FR')}</span></div><div className="history-item__body">{(booking.items || []).map((item, index) => <div key={`${booking.id}-${index}`} className="history-item__line"><span>{item.event_title} · {item.category_name}</span><span>{item.quantity} x {Number(item.unit_price_ariary).toLocaleString('fr-FR')} Ar</span></div>)}</div><div className="history-item__total">{Number(booking.total_ariary).toLocaleString('fr-FR')} Ar</div></div>)}</div>}</div>
          <div className="message-box"><h4>Envoyer un message</h4><input type="text" value={messageTitle} onChange={(e) => setMessageTitle(e.target.value)} placeholder="Titre du message" /><textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Écrivez le message pour le client..." rows={4} /><button className="btn btn-primary" disabled={sending} onClick={sendMessage}>{sending ? 'Envoi...' : 'Envoyer'}</button></div>
        </div>}
      </div>
    </AdminShell>
  );
}
