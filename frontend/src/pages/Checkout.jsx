import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Topbar from '../components/Topbar';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import mvolaLogo from '../../img/mvola.png';
import orangeLogo from '../../img/orange.png';
import airtelLogo from '../../img/airtel.png';

const METHODS = [
  { value: 'mvola', label: 'MVola', logo: mvolaLogo },
  { value: 'orange_money', label: 'Orange Money', logo: orangeLogo },
  { value: 'airtel_money', label: 'Airtel Money', logo: airtelLogo },
];

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState('mvola');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [step, setStep] = useState('form'); // form | processing | done
  const [error, setError] = useState('');

  const pay = async () => {
    setError('');
    setStep('processing');
    try {
      const { data: bookingRes } = await api.post('/bookings', {
        items: items.map((i) => ({ ticket_category_id: i.category.id, quantity: i.quantity })),
      });
      // Simulation d'un délai réseau / validation mobile money
      await new Promise((r) => setTimeout(r, 1800));
      await api.post(`/bookings/${bookingRes.booking.id}/pay`, {
        payment_method: method,
        payer_name: payerName.trim(),
        payer_phone: payerPhone.trim(),
        payment_reference: paymentReference.trim(),
      });
      clearCart();
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Le paiement a échoué.');
      setStep('form');
    }
  };

  if (step === 'done') {
    return (
      <div className="app-main" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <CheckCircle2 size={60} color="var(--success)" strokeWidth={2.5} />
        </div>
        <h2>Paiement transmis</h2>
        <p>Votre réservation sera disponible dans vos billets après validation par un administrateur.</p>
        <button className="btn btn-primary" onClick={() => navigate('/my-tickets')}>Voir mes billets</button>
      </div>
    );
  }

  return (
    <>
      <Topbar back title="Paiement" />
      <div className="app-main">
        <p>Ceci est un paiement simulé à des fins de démonstration — aucune transaction réelle n'est effectuée.</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0', fontSize: 18 }}>
          <strong>Total a payer</strong>
          <strong style={{ color: 'var(--gold)' }}>{total.toLocaleString('fr-FR')} Ar</strong>
        </div>
        <h3>Moyen de paiement</h3>
        {METHODS.map((m) => (
          <label key={m.value} className={`ticket-stub payment-option ${method === m.value ? 'selected' : ''}`}>
            <input type="radio" name="method" checked={method === m.value} onChange={() => setMethod(m.value)} />
            {m.logo && <img src={m.logo} alt={m.label} className="payment-logo" />}
            <span>{m.label}</span>
          </label>
        ))}
        <label>
          Nom du payeur
          <input
            type="text"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder="Nom utilisé pour le paiement"
            required
          />
        </label>
        <label>
          Numéro du payeur
          <input
            type="tel"
            value={payerPhone}
            onChange={(e) => setPayerPhone(e.target.value)}
            placeholder="Numéro utilisé pour le paiement"
            required
          />
        </label>
        <label>
          Référence de paiement
          <input
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Référence fournie par le service mobile money"
            required
          />
        </label>
        {error && <div className="alert alert-error">{error}</div>}
        <button
          className="btn btn-primary"
          disabled={step === 'processing' || !payerName.trim() || !payerPhone.trim() || !paymentReference.trim()}
          onClick={pay}
        >
          {step === 'processing' ? 'Transmission...' : 'Envoyer pour validation'}
        </button>
      </div>
    </>
  );
}
