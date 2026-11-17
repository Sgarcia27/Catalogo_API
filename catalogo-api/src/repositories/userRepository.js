const { getSql, runSql } = require('../config/database');
const { normalizeEmail } = require('../models/user');

async function createUser({ name, email, passwordHash, role = 'usuario' }) {
  const normalizedEmail = normalizeEmail(email);

  const result = await runSql(
    `
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `,
    [name, normalizedEmail, passwordHash, role],
  );

  return { id: result.lastInsertRowid, name, email: normalizedEmail, password_hash: passwordHash, role };
}

async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  return getSql(
    `
      SELECT *
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [normalizedEmail],
  );
}

async function findUserById(userId) {
  return getSql(
    `
      SELECT *
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [userId],
  );
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
};
