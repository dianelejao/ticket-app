const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/** Genere une valeur unique pour un billet (encodee dans le QR). */
function generateTicketCode() {
  return `TKT-${uuidv4()}`;
}

/** Convertit une valeur texte en QR code au format Data URL (base64 PNG). */
async function toQrDataUrl(value) {
  return QRCode.toDataURL(value, { errorCorrectionLevel: 'M', margin: 1, width: 300 });
}

module.exports = { generateTicketCode, toQrDataUrl };
