const pool = require('../config/db');
const { toQrDataUrl } = require('../utils/qrcode');

/** GET /api/tickets/me - tous les tickets du client, avec QR code en image */
exports.myTickets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, e.title AS event_title, e.event_date, e.venue, e.city, tc.name AS category_name
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       JOIN booking_items bi ON bi.id = t.booking_item_id
       JOIN ticket_categories tc ON tc.id = bi.ticket_category_id
       WHERE t.user_id = $1
       ORDER BY e.event_date ASC`,
      [req.user.id]
    );
    const tickets = await Promise.all(
      result.rows.map(async (t) => ({ ...t, qr_data_url: await toQrDataUrl(t.qr_code_value) }))
    );
    res.json({ tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du chargement des tickets.' });
  }
};

/**
 * POST /api/tickets/scan - reserve a l'admin
 * body: { qr_code_value }
 * Valide l'entree : marque le ticket comme "used" s'il est valide.
 */
exports.scanTicket = async (req, res) => {
  const client = await pool.connect();
  try {
    const { qr_code_value } = req.body;
    if (!qr_code_value) return res.status(400).json({ message: 'Code QR manquant.' });

    await client.query('BEGIN');
    const result = await client.query(
      `SELECT t.*, e.title AS event_title, u.full_name, tc.name AS category_name
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       JOIN users u ON u.id = t.user_id
       JOIN booking_items bi ON bi.id = t.booking_item_id
       JOIN ticket_categories tc ON tc.id = bi.ticket_category_id
       WHERE t.qr_code_value = $1 FOR UPDATE`,
      [qr_code_value]
    );
    const ticket = result.rows[0];
    if (!ticket) {
      await client.query('ROLLBACK');
      return res.status(404).json({ valid: false, message: 'Billet inconnu.' });
    }
    if (ticket.status === 'used') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        valid: false,
        message: `Billet deja scanne le ${new Date(ticket.used_at).toLocaleString('fr-FR')}.`,
        ticket,
      });
    }
    if (ticket.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(409).json({ valid: false, message: 'Billet annule.', ticket });
    }

    await client.query(
      `UPDATE tickets SET status = 'used', used_at = now(), scanned_by = $1 WHERE id = $2`,
      [req.user.id, ticket.id]
    );
    await client.query('COMMIT');

    res.json({ valid: true, message: 'Entree validee.', ticket: { ...ticket, status: 'used' } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la validation du billet.' });
  } finally {
    client.release();
  }
};
