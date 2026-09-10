import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import AdminShell from '../components/AdminShell';
import api from '../api/axios';

export default function AdminReports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data: dashboard }) => setData(dashboard));
  }, []);

  const exportReport = () => {
    if (!data) return;
    const headers = ['Événement', 'Date', 'Billets vendus', 'Billets disponibles', 'Revenu'];
    const rows = (data.events || []).map((event) => [
      event.title,
      new Date(event.event_date).toLocaleDateString('fr-FR'),
      event.billets_vendus,
      event.billets_total,
      `${Number(event.revenu || 0).toLocaleString('fr-FR')} Ar`,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'rapport-billetterie.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!data) return <AdminShell title="Rapports"><div className="app-main admin-page-body"><div className="spinner" /></div></AdminShell>;

  const totalRevenue = Number(data.revenue_total || 0);
  const totalTickets = Number(data.tickets_total || 0);
  const totalUsed = Number(data.tickets_used || 0);

  return (
    <AdminShell title="Rapports" className="admin-reports-layout">
      <div className="app-main admin-page-body">
        <div className="section-heading">
          <div>
            <span className="admin-eyebrow">Analyse de l'activité</span>
            <h1>Rapports</h1>
          </div>
          <button className="btn btn-primary" onClick={exportReport}><Download size={16} />Exporter CSV</button>
        </div>
        <div className="summary-grid">
          <div className="summary-card"><span>Chiffre d'affaires</span><strong>{totalRevenue.toLocaleString('fr-FR')} Ar</strong><small>revenu total</small></div>
          <div className="summary-card"><span>Billets vendus</span><strong>{totalTickets}</strong><small>toutes périodes</small></div>
          <div className="summary-card"><span>Entrées validées</span><strong>{totalUsed}</strong><small>billets scannés</small></div>
          <div className="summary-card"><span>Événements</span><strong>{(data.events || []).length}</strong><small>au catalogue</small></div>
        </div>
        <h3>Ventes par événement</h3>
        <div className="admin-report-table-wrap">
          <table className="admin-report-table">
            <thead><tr><th>Événement</th><th>Date</th><th>Vendus</th><th>Capacité</th><th>Revenu</th></tr></thead>
            <tbody>
              {(data.events || []).map((event) => (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{new Date(event.event_date).toLocaleDateString('fr-FR')}</td>
                  <td>{event.billets_vendus}</td>
                  <td>{event.billets_total}</td>
                  <td>{Number(event.revenu || 0).toLocaleString('fr-FR')} Ar</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
