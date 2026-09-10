const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis.' });
    }
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Cet email est deja utilise.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'client')
       RETURNING id, full_name, email, phone, role, created_at`,
      [full_name, email, phone || null, password_hash]
    );
    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
  }
};

exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const token = signToken(user);
    delete user.password_hash;
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
};

exports.me = async (req, res) => {
  const result = await pool.query(
    'SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json({ user: result.rows[0] });
};

exports.updateMe = async (req, res) => {
  try {
    const { full_name, email, phone, current_password, new_password } = req.body;
    const normalizedName = String(full_name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').trim() || null;

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({ message: 'Le nom et l\'email sont requis.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'L\'adresse e-mail est invalide.' });
    }

    const wantsPasswordChange = Boolean(current_password || new_password);
    if (wantsPasswordChange && (!current_password || !new_password)) {
      return res.status(400).json({ message: 'L\'ancien et le nouveau mot de passe sont requis.' });
    }
    if (wantsPasswordChange && String(new_password).length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }

    let passwordHash;
    if (wantsPasswordChange) {
      const currentUser = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      const validPassword = currentUser.rows.length && await bcrypt.compare(current_password, currentUser.rows[0].password_hash);
      if (!validPassword) {
        return res.status(400).json({ message: 'L\'ancien mot de passe est incorrect.' });
      }
      passwordHash = await bcrypt.hash(new_password, 10);
    }

    const result = await pool.query(
      `UPDATE users SET full_name = $1, email = $2, phone = $3${passwordHash ? ', password_hash = $5' : ''}
       WHERE id = $4
       RETURNING id, full_name, email, phone, role, created_at`,
      passwordHash
        ? [normalizedName, normalizedEmail, normalizedPhone, req.user.id, passwordHash]
        : [normalizedName, normalizedEmail, normalizedPhone, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const user = result.rows[0];
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Cette adresse e-mail est déjà utilisée.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil.' });
  }
};
