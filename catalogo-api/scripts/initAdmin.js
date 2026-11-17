const bcrypt = require('bcryptjs');
const { initDatabase, db } = require('../src/config/database');

function ensureAdmin() {
  initDatabase();

  const email = (process.env.ADMIN_EMAIL || 'admin@catalogo.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const name = process.env.ADMIN_NAME || 'Administrador';

  const existingUser = db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').get(email);

  if (existingUser) {
    console.log(`Administrador ya existe: ${email}`);
    return existingUser;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
  ).run(name, email, passwordHash, 'admin');

  console.log(`Administrador creado: ${email}`);
  console.log(`Contraseña temporal: ${password}`);

  return { id: result.lastInsertRowid, name, email, role: 'admin' };
}

try {
  ensureAdmin();
  process.exit(0);
} catch (error) {
  console.error('No se pudo crear el administrador:', error.message);
  process.exit(1);
}

module.exports = {
  ensureAdmin,
};
