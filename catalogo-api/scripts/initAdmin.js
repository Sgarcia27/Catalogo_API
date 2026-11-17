const bcrypt = require('bcryptjs');
require('dotenv').config();
const { initDatabase, db } = require('../src/config/database');

function ensureAdmin() {
  initDatabase();

  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = process.env.ADMIN_NAME || 'Administrador';

  if (!email || !password) {
    throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD en el archivo .env');
  }

  const existingUser = db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').get(email);

  if (existingUser) {
    if (existingUser.role !== 'admin') {
      throw new Error('El correo configurado ya existe y no tiene rol de administrador');
    }

    console.log(`El administrador ya existe: ${email}`);
    return existingUser;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
  ).run(name, email, passwordHash, 'admin');

  console.log(`Administrador creado: ${email}`);

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
