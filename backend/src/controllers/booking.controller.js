const pool = require('../config/db');

/**
 * POST /api/bookings
 * Cree une reservation "pending" a partir du panier envoye par le client :
 * items: [{ ticket_category_id, quantity }]
 */
exports.createBooking = async (req, res) => {
  const client = await pool.connect();
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Le panier est vide.' });
    }

    await client.query('BEGIN');

    let total = 0;
    const resolvedItems = [];
    for (const item of items) {
      const catRes = await client.query(
        `SELECT * FROM ticket_categories WHERE id = $1 FOR UPDATE`,
        [item.ticket_category_id]
      );
      const cat = catRes.rows[0];
      if (!cat) throw new Error('Catégorie de billet introuvable.');
      const available = cat.quantity_total - cat.quantity_sold;
      if (item.quantity > available) {
        throw new Error(`Stock insuffisant pour "${cat.name}" (${available} restant(s)).`);
      }
      total += Number(cat.price_ariary) * item.quantity;
      resolvedItems.push({ cat, quantity: item.quantity });
    }

    const bookingRes = await client.query(
      `INSERT INTO bookings (user_id, status, total_ariary) VALUES ($1, 'pending', $2) RETURNING *`,
      [req.user.id, total]
    );
    const booking = bookingRes.rows[0];

    for (const { cat, quantity } of resolvedItems) {
      await client.query(
        `INSERT INTO booking_items (booking_id, ticket_category_id, unit_price_ariary, quantity)
         VALUES ($1,$2,$3,$4)`,
        [booking.id, cat.id, cat.price_ariary, quantity]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ booking });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ message: err.message || 'Erreur lors de la création de la réservation.' });
  } finally {
    client.release();
  }
};

/**
 * POST /api/bookings/:id/pay
 * Enregistre un paiement mobile money en attente de validation admin.
 */
exports.payBooking = async (req, res) => {
  let client;
  try {
    const { payment_method, payer_name, payer_phone, payment_reference } = req.body;
    const allowedMethods = ['mvola', 'orange_money', 'airtel_money'];
    if (!allowedMethods.includes(payment_method)) {
      return res.status(400).json({ message: 'Moyen de paiement mobile invalide.' });
    }
    if (!payer_name || payer_name.trim().length < 2) {
      return res.status(400).json({ message: 'Le nom du payeur est requis.' });
    }
    if (!payer_phone || payer_phone.trim().length < 8) {
      return res.status(400).json({ message: 'Le numéro du payeur est requis.' });
    }
    if (!payment_reference || payment_reference.trim().length < 3) {
      return res.status(400).json({ message: 'La référence de paiement est requise.' });
    }

    client = await pool.connect();
    await client.query('BEGIN');

    const bookingRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [req.params.id, req.user.id]
    );
    const booking = bookingRes.rows[0];
    if (!booking) throw new Error('Réservation introuvable.');
    if (booking.status !== 'pending') throw new Error('Cette réservation a déjà été traitée.');

    await client.query(
      `UPDATE bookings SET status = 'awaiting_approval', payment_method = $1, payment_reference = $2, payer_name = $3, payer_phone = $4
       WHERE id = $5`,
      [payment_method, payment_reference.trim(), payer_name.trim(), payer_phone.trim(), booking.id]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, body)
       VALUES ($1, $2, $3)`,
      [req.user.id, 'Paiement en vérification', 'Votre paiement a été transmis. Les billets seront envoyés après validation par un administrateur.']
    );

    const adminsRes = await client.query(`SELECT id FROM users WHERE role = 'admin'`);
    for (const admin of adminsRes.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)`,
        [admin.id, 'Nouveau paiement à vérifier', `Le paiement de ${payer_name.trim()} (${payer_phone.trim()}) attend votre validation.`]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Paiement transmis pour validation.', booking_id: booking.id });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ message: err.message || 'Erreur lors du paiement.' });
  } finally {
    if (client) client.release();
  }
};

/** GET /api/bookings/me - historique des reservations du client connecte */
exports.myBookings = async (req, res) => {
  try {
    const bookingsRes = await pool.query(
      `SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    const bookings = bookingsRes.rows;
    if (bookings.length === 0) return res.json({ bookings: [] });

    const ids = bookings.map((b) => b.id);
    const itemsRes = await pool.query(
      `SELECT bi.*, tc.name AS category_name, e.title AS event_title, e.event_date, e.venue, e.id AS event_id
       FROM booking_items bi
       JOIN ticket_categories tc ON tc.id = bi.ticket_category_id
       JOIN events e ON e.id = tc.event_id
       WHERE bi.booking_id = ANY($1::uuid[])`,
      [ids]
    );
    const itemsByBooking = {};
    for (const it of itemsRes.rows) {
      if (!itemsByBooking[it.booking_id]) itemsByBooking[it.booking_id] = [];
      itemsByBooking[it.booking_id].push(it);
    }
    res.json({ bookings: bookings.map((b) => ({ ...b, items: itemsByBooking[b.id] || [] })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du chargement de l\'historique.' });
  }
};
