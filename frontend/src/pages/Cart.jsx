import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();

  return (
    <>
      <Topbar title="Mon panier" />
      <div className="app-main">
        {items.length === 0 && <div className="center-empty">Votre panier est vide.</div>}
        {items.map((item) => (
          <div key={item.category.id} className="ticket-stub">
            <div className="ticket-stub__body">
              <h3>{item.event.title}</h3>
              <p>{item.category.name} · {Number(item.category.price_ariary).toLocaleString('fr-FR')} Ar</p>
            </div>
            <div className="ticket-stub__divider" />
            <div className="ticket-stub__stub">
              <div className="qty-control">
                <button onClick={() => updateQuantity(item.category.id, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.category.id, item.quantity + 1)}>+</button>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => removeItem(item.category.id)}>Retirer</button>
            </div>
          </div>
        ))}
        {items.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0', fontSize: 18 }}>
              <strong>Total</strong>
              <strong style={{ color: 'var(--gold)' }}>{total.toLocaleString('fr-FR')} Ar</strong>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/checkout')}>Passer au paiement</button>
          </>
        )}
      </div>
    </>
  );
}
