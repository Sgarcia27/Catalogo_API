const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../data/test-catalogo.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

process.env.DATABASE_PATH = dbPath;

const { app, databaseReady } = require('../src/server');
const { db } = require('../src/config/database');

const server = app.listen(0);
const baseUrl = () => `http://127.0.0.1:${server.address().port}`;

let userToken;
let adminToken;

async function seedAdmin() {
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
  ).run('Administrador', 'admin@catalogo.com', passwordHash, 'admin');
}

test.before(async () => {
  await databaseReady;
  await seedAdmin();

  const adminLoginResponse = await fetch(`${baseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@catalogo.com',
      password: 'Admin123!',
    }),
  });

  const adminLoginBody = await adminLoginResponse.json();
  adminToken = adminLoginBody.token;
});

test('GET /health responde con estado correcto', async () => {
  const response = await fetch(`${baseUrl()}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

test('POST /api/auth/register crea un usuario con rol usuario', async () => {
  const response = await fetch(`${baseUrl()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ana López',
      email: 'ana@example.com',
      password: 'Password123',
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.user.role, 'usuario');
  assert.equal(body.user.email, 'ana@example.com');
  assert.equal(body.user.password, undefined);
});

test('POST /api/auth/login devuelve un JWT válido', async () => {
  const response = await fetch(`${baseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ana@example.com',
      password: 'Password123',
    }),
  });

  const body = await response.json();

  userToken = body.token;

  assert.equal(response.status, 200);
  assert.ok(body.token);
  assert.equal(body.user.email, 'ana@example.com');
  assert.equal(body.user.password, undefined);
});

test('GET /api/products devuelve el catálogo público', async () => {
  const response = await fetch(`${baseUrl()}/api/products`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));
  assert.ok(body.length >= 5);
});

test('POST /api/products requiere autenticación de administrador', async () => {
  const response = await fetch(`${baseUrl()}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      name: 'Mochila',
      description: 'Mochila ligera para viajes',
      category: 'Accesorios',
      price: 49.9,
    }),
  });

  assert.equal(response.status, 403);
});

test('POST /api/products crea producto con administrador autenticado', async () => {
  const response = await fetch(`${baseUrl()}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Mochila',
      description: 'Mochila ligera para viajes',
      category: 'Accesorios',
      price: 49.9,
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.name, 'Mochila');
  assert.equal(body.price, 49.9);
});

test('GET /api/favorites lista favoritos del usuario autenticado', async () => {
  const response = await fetch(`${baseUrl()}/api/favorites`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));
});

test('POST /api/favorites/:productId agrega favorito del usuario autenticado', async () => {
  const response = await fetch(`${baseUrl()}/api/favorites/1`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.userId, 2);
  assert.equal(body.productId, 1);
});

test('DELETE /api/favorites/:productId quita el favorito', async () => {
  const response = await fetch(`${baseUrl()}/api/favorites/1`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userToken}` },
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.productId, 1);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});
