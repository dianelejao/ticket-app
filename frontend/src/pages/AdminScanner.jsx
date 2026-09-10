import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, CircleX } from 'lucide-react';
import AdminShell from '../components/AdminShell';
import api from '../api/axios';

export default function AdminScanner() {
  const [result, setResult] = useState(null); // { valid, message, ticket }
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const qr = new Html5Qrcode('qr-reader');
    scannerRef.current = qr;

    Html5Qrcode.getCameras()
      .then((cams) => {
        if (!cams.length) { setCameraError('Aucune camera detectee.'); return; }
        const cameraId = cams.find((c) => /back|rear|environment/i.test(c.label))?.id || cams[0].id;
        return qr.start(
          cameraId,
          { fps: 10, qrbox: 220 },
          (decodedText) => handleScan(decodedText)
        );
      })
      .then(() => setScanning(true))
      .catch((err) => setCameraError('Impossible d\'acceder a la camera : ' + err));

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async (qr_code_value) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const { data } = await api.post('/tickets/scan', { qr_code_value });
      setResult({ valid: data.valid, message: data.message, ticket: data.ticket });
    } catch (err) {
      const data = err.response?.data;
      setResult({ valid: false, message: data?.message || 'Erreur de validation.', ticket: data?.ticket });
    }
    setTimeout(() => { busyRef.current = false; }, 2000);
  };

  return (
    <AdminShell title="Scanner les entrées" className="admin-scanner-layout">
      <div className="app-main admin-page-body">
        <p>Placez le QR code du billet du client dans le cadre.</p>
        <div id="qr-reader" style={{ borderRadius: 10, overflow: 'hidden' }} />
        {cameraError && <div className="alert alert-error">{cameraError}</div>}
        {!scanning && !cameraError && <div className="spinner" />}

        {result && (
          <div className={`alert ${result.valid ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 16 }}>
            <strong className="alert-status">
              <span className="alert-status-icon">
                {result.valid ? <CheckCircle2 size={18} /> : <CircleX size={18} />}
              </span>
              {result.valid ? 'Entrée validée' : result.message}
            </strong>
            {result.ticket && (
              <p style={{ marginTop: 6 }}>
                {result.ticket.full_name} — {result.ticket.category_name || result.ticket.event_title}
              </p>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
