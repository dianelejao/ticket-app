import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-main">
      <div style={{ padding: '30px 0 10px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--gold)' }}>Billeterie MG</h1>
        <p>Concerts, cinéma et événements près de chez vous</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit}>
        <label>Email</label>
        <input type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.mg" />
        <label>Mot de passe</label>
        <div style={{ position: 'relative' }}>
          <input type={showPassword ? 'text' : 'password'} required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ paddingRight: 88 }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            style={{ position: 'absolute', right: 10, top: 8, padding: '6px 4px', border: 0, background: 'transparent', color: 'var(--gold)', cursor: 'pointer', display: 'inline-flex' }}>
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16 }}>
        Pas encore de compte ? <Link to="/register" style={{ color: 'var(--gold)' }}>Inscrivez-vous</Link>
      </p>
    </div>
  );
}
