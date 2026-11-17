const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbDirectory = path.join(__dirname, '../../data');
const dbPath = process.env.DATABASE_PATH || path.join(dbDirectory, 'catalogo.db');

if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

function runSql(sql, params = []) {
  return db.prepare(sql).run(...params);
}

function getSql(sql, params = []) {
  return db.prepare(sql).get(...params) || null;
}

function allSql(sql, params = []) {
  return db.prepare(sql).all(...params) || [];
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('usuario', 'admin')) DEFAULT 'usuario',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL CHECK(price > 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_product ON favorites(user_id, product_id);
  `);

  const totalProducts = Number(db.prepare('SELECT COUNT(*) AS total FROM products').get().total);

  if (totalProducts === 0) {
    const sampleProducts = [
      ['Camiseta básica', 'Camiseta de algodón para uso diario.', 'Ropa', 19.99],
      ['Auriculares Bluetooth', 'Auriculares inalámbricos con sonido nítido.', 'Tecnología', 89.99],
      ['Botella térmica', 'Botella de acero inoxidable ideal para viajes.', 'Accesorios', 24.5],
      ['Laptop 14 pulgadas', 'Portátil ligera para trabajo y estudio.', 'Tecnología', 799.99],
      ['Zapatillas deportivas', 'Calzado cómodo para ejercicio diario.', 'Calzado', 59.9],
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (name, description, category, price, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const transaction = db.transaction((products) => {
      for (const product of products) {
        insertProduct.run(product);
      }
    });

    transaction(sampleProducts);
  }

  return { db, dbPath };
}

module.exports = {
  db,
  dbPath,
  runSql,
  getSql,
  allSql,
  initDatabase,
};
