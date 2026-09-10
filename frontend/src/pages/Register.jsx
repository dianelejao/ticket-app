import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Inscription impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-main">
      <h1 style={{ paddingTop: 20 }}>Créer un compte</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit}>
        <label>Nom complet</label>
        <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <label>Email</label>
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label>Téléphone</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="034 00 000 00" />
        <label>Mot de passe</label>
        <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Création...' : 'Créer mon compte'}</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16 }}>
        Déjà inscrit ? <Link to="/login" style={{ color: 'var(--gold)' }}>Connectez-vous</Link>
      </p>
    </div>
  );
}
