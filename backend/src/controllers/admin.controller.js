const pool = require('../config/db');
const { generateTicketCode } = require('../utils/qrcode');

/** GET /api/admin/bookings/pending - paiements mobile money a valider */
exports.pendingBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.total_ariary, b.payment_method, b.payment_reference, b.payer_name, b.payer_phone, b.created_at,
              u.full_name AS client_name, u.email,
              COALESCE(json_agg(json_build_object(
                'event_title', e.title,
                'category_name', tc.name,
                'quantity', bi.quantity
              ) ORDER BY e.title) FILTER (WHERE bi.id IS NOT NULL), '[]'::json) AS items
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       LEFT JOIN booking_items bi ON bi.booking_id = b.id
       LEFT JOIN ticket_categories tc ON tc.id = bi.ticket_category_id
       LEFT JOIN events e ON e.id = tc.event_id
       WHERE b.status = 'awaiting_approval'
       GROUP BY b.id, u.full_name, u.email
       ORDER BY b.created_at ASC`
    );
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du chargement des paiements en attente.' });
  }
};

/** GET /api/admin/bookings/payments?status=all|pending|approved|rejected */
exports.paymentBookings = async (req, res) => {
  try {
    const statusMap = {
      pending: 'awaiting_approval',
      approved: 'paid',
      rejected: 'rejected',
    };
    const requestedStatus = req.query.status || 'pending';
    const status = statusMap[requestedStatus];
    if (requestedStatus !== 'all' && !status) {
      return res.status(400).json({ message: 'Statut de paiement invalide.' });
    }

    const result = await pool.query(
            `SELECT b.id, b.status, b.total_ariary, b.payment_method, b.payment_reference,
              b.payer_name, b.payer_phone, b.created_at, b.paid_at, b.approved_at,
              u.full_name AS client_name, u.email,
              COALESCE(json_agg(json_build_object(
                'event_title', e.title,
                'category_name', tc.name,
                'quantity', bi.quantity
              ) ORDER BY e.title) FILTER (WHERE bi.id IS NOT NULL), '[]'::json) AS items
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       LEFT JOIN booking_items bi ON bi.booking_id = b.id
       LEFT JOIN ticket_categories tc ON tc.id = bi.ticket_category_id
       LEFT JOIN events e ON e.id = tc.event_id
      WHERE ($1 = 'all' OR b.status = $2)
       GROUP BY b.id, u.full_name, u.email
       ORDER BY b.created_at DESC`,
          [requestedStatus, status]
    );
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du chargement des paiements.' });
  }
};

/** POST /api/admin/bookings/:id/approve - valide le paiement et genere les tickets */
exports.approveBooking = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bookingRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const booking = bookingRes.rows[0];
    if (!booking) throw new Error('Reservation introuvable.');
    if (booking.status !== 'awaiting_approval') throw new Error('Cette reservation n\'est pas en attente de validation.');

    const itemsRes = await client.query(
      `SELECT bi.*, tc.event_id, tc.name AS category_name, tc.quantity_total, tc.quantity_sold
       FROM booking_items bi
       JOIN ticket_categories tc ON tc.id = bi.ticket_category_id
       WHERE bi.booking_id = $1`,
      [booking.id]
    );

    const tickets = [];
    for (const item of itemsRes.rows) {
      if (item.quantity > item.quantity_total - item.quantity_sold) {
        throw new Error(`Stock insuffisant pour "${item.category_name}".`);
      }
      await client.query(
        `UPDATE ticket_categories SET quantity_sold = quantity_sold + $1 WHERE id = $2`,
        [item.quantity, item.ticket_category_id]
      );
      for (let index = 0; index < item.quantity; index += 1) {
        const ticketRes = await client.query(
          `INSERT INTO tickets (booking_item_id, event_id, user_id, qr_code_value)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [item.id, item.event_id, booking.user_id, generateTicketCode()]
        );
        tickets.push({ ...ticketRes.rows[0], category_name: item.category_name });
      }
    }

    await client.query(
      `UPDATE bookings SET status = 'paid', paid_at = now(), approved_by = $1, approved_at = now()
       WHERE id = $2`,
      [req.user.id, booking.id]
    );
    await client.query(
      `INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)`,
      [booking.user_id, 'Réservation approuvée', `Votre paiement a été validé. Vos ${tickets.length} billet(s) sont disponibles dans "Mes billets".`]
    );

    await client.query('COMMIT');
    res.json({ message: 'Réservation approuvée et billets envoyés.', tickets });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ message: err.message || 'Erreur lors de la validation.' });
  } finally {
    client.release();
  }
};

/** POST /api/admin/bookings/:id/reject - refuse un paiement */
exports.rejectBooking = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bookingRes = await client.query(
      `SELECT id, user_id FROM bookings WHERE id = $1 AND status = 'awaiting_approval' FOR UPDATE`,
      [req.params.id]
    );
    const booking = bookingRes.rows[0];
    if (!booking) throw new Error('Paiement introuvable ou déjà traité.');

    await client.query(`UPDATE bookings SET status = 'rejected' WHERE id = $1`, [booking.id]);
    await client.query(
      `INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)`,
      [booking.user_id, 'Paiement refusé', "Votre paiement n'a pas été validé. Veuillez vérifier votre référence et contacter l'administrateur."]
    );
    await client.query('COMMIT');
    res.json({ message: 'Paiement refusé.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ message: err.message || 'Erreur lors du refus du paiement.' });
  } finally {
    client.release();
  }
};

/** GET /api/admin/dashboard - vue d'ensemble des ventes */
exports.dashboard = async (req, res) => {
  try {
    const totalsRes = await pool.query(
      `SELECT
         COALESCE(SUM(total_ariary) FILTER (WHERE status = 'paid'), 0) AS revenue_total,
         COUNT(*) FILTER (WHERE status = 'paid') AS bookings_paid,
         COUNT(*) FILTER (WHERE status IN ('pending', 'awaiting_approval')) AS bookings_pending
       FROM bookings`
    );

    const ticketsRes = await pool.query(
      `SELECT
         COUNT(*) AS tickets_total,
         COUNT(*) FILTER (WHERE status = 'used') AS tickets_used
       FROM tickets`
    );

    const clientsRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE role = 'client') AS clients_total,
         COUNT(*) FILTER (WHERE role = 'client' AND created_at >= NOW() - INTERVAL '30 days') AS new_clients_30d
       FROM users`
    );

    const recentClientsRes = await pool.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone,
         u.created_at,
         CASE
           WHEN EXISTS (
             SELECT 1
             FROM bookings b
             WHERE b.user_id = u.id
               AND b.status = 'paid'
               AND b.paid_at >= NOW() - INTERVAL '30 days'
           ) THEN 'Actif'
           WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN 'Nouveau'
           ELSE 'Inactif'
         END AS status
       FROM users u
       WHERE u.role = 'client'
       ORDER BY u.created_at DESC
       LIMIT 5`
    );

    const perEventRes = await pool.query(
      `SELECT e.id, e.title, e.event_date, e.status,
              COALESCE(SUM(tc.quantity_sold), 0) AS billets_vendus,
              COALESCE(SUM(tc.quantity_total), 0) AS billets_total,
              COALESCE(SUM(tc.quantity_sold * tc.price_ariary), 0) AS revenu
       FROM events e
       LEFT JOIN ticket_categories tc ON tc.event_id = e.id
       GROUP BY e.id
       ORDER BY e.event_date ASC`
    );

    res.json({
      revenue_total: Number(totalsRes.rows[0].revenue_total),
      bookings_paid: Number(totalsRes.rows[0].bookings_paid),
      bookings_pending: Number(totalsRes.rows[0].bookings_pending),
      tickets_total: Number(ticketsRes.rows[0].tickets_total),
      tickets_used: Number(ticketsRes.rows[0].tickets_used),
      clients_total: Number(clientsRes.rows[0].clients_total),
      new_clients_30d: Number(clientsRes.rows[0].new_clients_30d),
      recent_clients: recentClientsRes.rows,
      events: perEventRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du chargement du tableau de bord.' });
  }
};

/** GET /api/admin/clients - liste des clients avec statut */
exports.clients = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone,
         u.created_at,
         CASE
           WHEN EXISTS (
             SELECT 1
             FROM bookings b
             WHERE b.user_id = u.id
               AND b.status = 'paid'
               AND b.paid_at >= NOW() - INTERVAL '30 days'
           ) THEN 'Actif'
           WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN 'Nouveau'
           ELSE 'Inactif'
         END AS status,
         COALESCE(
           (SELECT SUM(b.total_ariary)
            FROM bookings b
            WHERE b.user_id = u.id
              AND b.status = 'paid'), 0
         ) AS total_spent
       FROM users u
       WHERE u.role = 'client'
       ORDER BY u.created_at DESC`
    );

    res.json({
      clients: result.rows.map((client) => ({
        ...client,
        total_spent: Number(client.total_spent),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du chargement des clients.' });
  }
};

/** GET /api/admin/clients/:id - detail d'un client avec historique d'achats */
exports.clientDetail = async (req, res) => {
  try {
    const clientRes = await pool.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone,
         u.created_at,
         CASE
           WHEN EXISTS (
             SELECT 1
             FROM bookings b
             WHERE b.user_id = u.id
               AND b.status = 'paid'
               AND b.paid_at >= NOW() - INTERVAL '30 days'
           ) THEN 'Actif'
           WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN 'Nouveau'
           ELSE 'Inactif'
         END AS status,
         COALESCE((SELECT SUM(b.total_ariary) FROM bookings b WHERE b.user_id = u.id AND b.status = 'paid'), 0) AS total_spent
       FROM users u
       WHERE u.id = $1 AND u.role = 'client'`,
      [req.params.id]
    );

    if (!clientRes.rows.length) {
      return res.status(404).json({ message: 'Client introuvable.' });
    }

    const bookingsRes = await pool.query(
      `SELECT
         b.id,
         b.status,
         b.total_ariary,
         b.created_at,
         COALESCE(json_agg(json_build_object(
           'event_title', e.title,
           'category_name', tc.name,
           'quantity', bi.quantity,
           'unit_price_ariary', bi.unit_price_ariary
         ) ORDER BY e.title), '[]'::json) AS items
       FROM bookings b
       LEFT JOIN booking_items bi ON bi.booking_id = b.id
       LEFT JOIN ticket_categories tc ON tc.id = bi.ticket_category_id
       LEFT JOIN events e ON e.id = tc.event_id
       WHERE b.user_id = $1
       GROUP BY b.id, b.status, b.total_ariary, b.created_at
       ORDER BY b.created_at DESC`,
      [req.params.id]
    );

    res.json({
      client: {
        ...clientRes.rows[0],
        total_spent: Number(clientRes.rows[0].total_spent),
      },
      bookings: bookingsRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du chargement du client.' });
  }
};

/** POST /api/admin/clients/:id/message - envoyer un message a un client */
exports.sendClientMessage = async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: 'title et body sont requis.' });
    }

    const userRes = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'client'`,
      [req.params.id]
    );

    if (!userRes.rows.length) {
      return res.status(404).json({ message: 'Client introuvable.' });
    }

    await pool.query(
      `INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)`,
      [req.params.id, title, body]
    );

    res.json({ message: 'Message envoyé au client.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message.' });
  }
};

/** GET /api/admin/events/:id/attendees - liste des acheteurs pour un evenement */
exports.eventAttendees = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id AS ticket_id, t.status, t.qr_code_value, t.used_at,
              u.full_name, u.email, u.phone, tc.name AS category_name
       FROM tickets t
       JOIN users u ON u.id = t.user_id
       JOIN booking_items bi ON bi.id = t.booking_item_id
       JOIN ticket_categories tc ON tc.id = bi.ticket_category_id
       WHERE t.event_id = $1
       ORDER BY u.full_name ASC`,
      [req.params.id]
    );
    res.json({ attendees: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du chargement des participants.' });
  }
};
