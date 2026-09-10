import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../components/AdminShell';
import api from '../api/axios';

export default function AdminCreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'concert', venue: '', city: 'Antananarivo',
    event_date: '', image_url: '',
  });
  const [categories, setCategories] = useState([{ name: '', price_ariary: '', quantity_total: '' }]);
  const [error, setError] = useState('');

  const updateCat = (i, field, value) => {
    setCategories((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  };
  const addCat = () => setCategories((prev) => [...prev, { name: '', price_ariary: '', quantity_total: '' }]);
  const removeCat = (i) => setCategories((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/events', {
        ...form,
        ticket_categories: categories.map((c) => ({
          name: c.name, price_ariary: Number(c.price_ariary), quantity_total: Number(c.quantity_total),
        })),
      });
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
    }
  };

  return (
    <AdminShell back title="Nouvel événement" className="admin-create-layout">
      <div className="app-main admin-page-body">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <label>Titre</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label>Catégorie</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="concert">Concert</option>
            <option value="cinema">Cinéma</option>
            <option value="theatre">Théâtre</option>
            <option value="autre">Autre</option>
          </select>
          <label>Lieu</label>
          <input required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          <label>Ville</label>
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <label>Date et heure</label>
          <input type="datetime-local" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          <label>URL de l'image (optionnel)</label>
          <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />

          <h3 style={{ marginTop: 16 }}>Catégories de billets</h3>
          {categories.map((c, i) => (
            <div key={i} className="ticket-stub" style={{ padding: 12 }}>
              <label>Nom (ex: VIP, Fosse)</label>
              <input required value={c.name} onChange={(e) => updateCat(i, 'name', e.target.value)} />
              <label>Prix (Ariary)</label>
              <input required type="number" min="0" value={c.price_ariary} onChange={(e) => updateCat(i, 'price_ariary', e.target.value)} />
              <label>Quantité disponible</label>
              <input required type="number" min="1" value={c.quantity_total} onChange={(e) => updateCat(i, 'quantity_total', e.target.value)} />
              {categories.length > 1 && (
                <button type="button" className="btn btn-sm btn-outline" onClick={() => removeCat(i)}>Retirer cette catégorie</button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-outline" onClick={addCat} style={{ marginBottom: 16 }}>+ Ajouter une catégorie</button>

          <button className="btn btn-primary">Publier l'événement</button>
        </form>
      </div>
    </AdminShell>
  );
}
