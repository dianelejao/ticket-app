const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [payload.id]);
    if (!userResult.rows.length) {
      return res.status(401).json({ message: 'Session obsolete. Veuillez vous reconnecter.' });
    }
    req.user = payload; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expire.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acces reserve aux administrateurs.' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
