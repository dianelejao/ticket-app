const pool = require('../config/db');

/** GET /api/events - liste publique des evenements publies, avec categories de billets */
exports.listEvents = async (req, res) => {
  try {
    const { category, city, search } = req.query;
    const conditions = [`status = 'published'`];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (city) {
      params.push(city);
      conditions.push(`city = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(title ILIKE $${params.length} OR venue ILIKE $${params.length})`);
    }

    const eventsRes = await pool.query(
      `SELECT * FROM events WHERE ${conditions.join(' AND ')} ORDER BY event_date ASC`,
      params
    );
    const events = eventsRes.rows;

    if (events.length === 0) return res.json({ events: [] });

    const ids = events.map((e) => e.id);
    const catsRes = await pool.query(
      `SELECT * FROM ticket_categories WHERE event_id = ANY($1::uuid[])`,
      [ids]
    );
    const catsByEvent = {};
    for (const c of catsRes.rows) {
      if (!catsByEvent[c.event_id]) catsByEvent[c.event_id] = [];
      catsByEvent[c.event_id].push(c);
    }
    const enriched = events.map((e) => ({
      ...e,
      ticket_categories: catsByEvent[e.id] || [],
    }));
    res.json({ events: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du chargement des événements.' });
  }
};

/** GET /api/events/:id */
exports.getEvent = async (req, res) => {
  try {
    const evRes = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (evRes.rows.length === 0) return res.status(404).json({ message: 'Événement introuvable.' });
    const catsRes = await pool.query(
      'SELECT * FROM ticket_categories WHERE event_id = $1',
      [req.params.id]
    );
    res.json({ event: { ...evRes.rows[0], ticket_categories: catsRes.rows } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors du chargement de l'événement." });
  }
};

/** POST /api/events - reserve a l'admin */
exports.createEvent = async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, description, category, venue, city, event_date, image_url, ticket_categories } = req.body;
    if (!title || !venue || !event_date || !Array.isArray(ticket_categories) || ticket_categories.length === 0) {
      return res.status(400).json({ message: 'Titre, lieu, date et au moins une catégorie de billet sont requis.' });
    }
    await client.query('BEGIN');
    const evRes = await client.query(
      `INSERT INTO events (title, description, category, venue, city, event_date, image_url, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description || null, category || 'concert', venue, city || 'Antananarivo', event_date, image_url || null, req.user.id]
    );
    const event = evRes.rows[0];
    const insertedCats = [];
    for (const cat of ticket_categories) {
      const catRes = await client.query(
        `INSERT INTO ticket_categories (event_id, name, price_ariary, quantity_total)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [event.id, cat.name, cat.price_ariary, cat.quantity_total]
      );
      insertedCats.push(catRes.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json({ event: { ...event, ticket_categories: insertedCats } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la création de l'événement." });
  } finally {
    client.release();
  }
};

/** PUT /api/events/:id - reserve a l'admin */
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, category, venue, city, event_date, image_url, status } = req.body;
    const result = await pool.query(
      `UPDATE events SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         category = COALESCE($3, category),
         venue = COALESCE($4, venue),
         city = COALESCE($5, city),
         event_date = COALESCE($6, event_date),
         image_url = COALESCE($7, image_url),
         status = COALESCE($8, status)
       WHERE id = $9 RETURNING *`,
      [title, description, category, venue, city, event_date, image_url, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Événement introuvable.' });
    res.json({ event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'événement." });
  }
};

/** DELETE /api/events/:id - reserve a l'admin */
exports.deleteEvent = async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ message: 'Événement supprimé.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
};
