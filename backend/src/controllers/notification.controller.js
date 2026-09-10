const pool = require('../config/db');

/** GET /api/notifications - notifications du client connecte (polling cote frontend) */
exports.myNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du chargement des notifications.' });
  }
};

/** PUT /api/notifications/:id/read */
exports.markRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marquée comme lue.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise a jour.' });
  }
};

/**
 * POST /api/notifications/broadcast - reserve a l'admin
 * Envoie une notification (ex: rappel evenement, changement de salle) a tous les
 * acheteurs d'un evenement donne.
 */
exports.broadcastToEvent = async (req, res) => {
  try {
    const { event_id, title, body } = req.body;
    if (!event_id || !title || !body) {
      return res.status(400).json({ message: 'event_id, title et body sont requis.' });
    }
    const usersRes = await pool.query(
      `SELECT DISTINCT user_id FROM tickets WHERE event_id = $1`,
      [event_id]
    );
    for (const row of usersRes.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)`,
        [row.user_id, title, body]
      );
    }
    res.json({ message: `Notification envoyée à ${usersRes.rows.length} participant(s).` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de la notification.' });
  }
};
