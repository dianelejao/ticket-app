/**
 * Initialise la base de donnees : cree les tables (schema.sql) puis
 * insere un compte admin et quelques evenements de demo si la base est vide.
 * Usage : npm run db:init
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function run() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('-> Creation des tables...');
  await pool.query(schema);

  console.log('-> Insertion du compte admin de demo...');
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const adminRes = await pool.query(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin') RETURNING id`,
    ['Administrateur', 'admin@ticketapp.mg', '0340000000', adminPasswordHash]
  );
  const adminId = adminRes.rows[0].id;

  console.log('-> Insertion du compte client de demo...');
  const clientPasswordHash = await bcrypt.hash('Client123!', 10);
  await pool.query(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, 'client')`,
    ['Rina Client', 'client@ticketapp.mg', '0331111111', clientPasswordHash]
  );

  console.log('-> Insertion des evenements de demo...');
  const events = [
    {
      title: 'Kadao Live - Tournee Antananarivo',
      description: "Concert live du groupe Kadao, ambiance salegy et rock malgache.",
      category: 'concert',
      venue: 'Palais des Sports Mahamasina',
      city: 'Antananarivo',
      event_date: '2026-11-15T19:00:00+03:00',
      image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
      categories: [
        { name: 'Fosse', price_ariary: 25000, quantity_total: 300 },
        { name: 'VIP', price_ariary: 60000, quantity_total: 80 },
      ],
    },
    {
      title: 'Avatar 3 - Avant-premiere',
      description: 'Projection speciale avant-premiere en 3D.',
      category: 'cinema',
      venue: 'Cine Ritz Analakely',
      city: 'Antananarivo',
      event_date: '2026-10-02T20:30:00+03:00',
      image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
      categories: [
        { name: 'Standard', price_ariary: 15000, quantity_total: 150 },
        { name: 'Salle Premium', price_ariary: 22000, quantity_total: 40 },
      ],
    },
  ];

  for (const ev of events) {
    const evRes = await pool.query(
      `INSERT INTO events (title, description, category, venue, city, event_date, image_url, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [ev.title, ev.description, ev.category, ev.venue, ev.city, ev.event_date, ev.image_url, adminId]
    );
    const eventId = evRes.rows[0].id;
    for (const cat of ev.categories) {
      await pool.query(
        `INSERT INTO ticket_categories (event_id, name, price_ariary, quantity_total)
         VALUES ($1,$2,$3,$4)`,
        [eventId, cat.name, cat.price_ariary, cat.quantity_total]
      );
    }
  }

  console.log('OK - Base initialisee.');
  console.log('   Admin  : admin@ticketapp.mg / Admin123!');
  console.log('   Client : client@ticketapp.mg / Client123!');
  await pool.end();
}

run().catch((err) => {
  console.error('Erreur init DB:', err.message);
  process.exit(1);
});
