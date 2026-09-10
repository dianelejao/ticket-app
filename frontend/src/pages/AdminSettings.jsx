import { useState } from 'react';
import { LogOut, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../components/AdminShell';
import { useAuth } from '../context/AuthContext';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ticket-app-view-mode') || 'auto');
  const [notifications, setNotifications] = useState(() => localStorage.getItem('ticket-app-notifications') !== 'off');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const saveSettings = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateUser({ ...profile, ...passwords });
      setPasswords({ current_password: '', new_password: '' });
      localStorage.setItem('ticket-app-view-mode', viewMode);
      localStorage.setItem('ticket-app-notifications', notifications ? 'on' : 'off');
      window.dispatchEvent(new CustomEvent('ticket-app-view-mode-change', { detail: viewMode }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible d\'enregistrer les paramètres.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AdminShell title="Paramètres" className="admin-settings-layout">
      <div className="app-main admin-page-body">
        <span className="admin-eyebrow">Configuration</span>
        <h1>Paramètres</h1>
        <p>Gérez vos préférences d'administration sur cet appareil.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form className="admin-settings-form" onSubmit={saveSettings}>
          <div className="admin-settings-section">
            <h3>Compte administrateur</h3>
            <label>Nom<input required value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} /></label>
            <label>Email<input required type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label>
            <label>Téléphone<input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="034 00 000 00" /></label>
          </div>
          <div className="admin-settings-section">
            <h3>Mot de passe</h3>
            <label>Ancien mot de passe<input type="password" value={passwords.current_password} onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })} autoComplete="current-password" /></label>
            <label>Nouveau mot de passe<input type="password" minLength={6} value={passwords.new_password} onChange={(event) => setPasswords({ ...passwords, new_password: event.target.value })} autoComplete="new-password" placeholder="6 caractères minimum" /></label>
          </div>
          <div className="admin-settings-section">
            <h3>Préférences d'affichage</h3>
            <label>Vue par défaut
              <select value={viewMode} onChange={(event) => setViewMode(event.target.value)}>
                <option value="auto">Automatique</option>
                <option value="desktop">PC</option>
                <option value="mobile">Smartphone</option>
              </select>
            </label>
            <label className="admin-settings-toggle"><input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} />Recevoir les notifications dans l'application</label>
          </div>
          <div className="admin-settings-actions">
            {saved && <span className="alert-success-text">Paramètres enregistrés.</span>}
            <button className="btn btn-primary" type="submit" disabled={saving}><Save size={16} />{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
        <div className="admin-settings-section admin-settings-session">
          <h3>Session</h3>
          <p>Fermez la session administrateur sur cet appareil.</p>
          <button className="btn btn-danger" type="button" onClick={handleLogout}><LogOut size={16} />Déconnexion</button>
        </div>
      </div>
    </AdminShell>
  );
}
