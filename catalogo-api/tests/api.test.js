const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'catalogo-api-test-'));
const dbPath = path.join(tempDirectory, 'test-catalogo.db');
process.env.DATABASE_PATH = dbPath;
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-tests';

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

test('POST /api/auth/register rechaza un correo duplicado', async () => {
  const response = await fetch(`${baseUrl()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ana duplicada',
      email: 'ana@example.com',
      password: 'Password123',
    }),
  });

  assert.equal(response.status, 409);
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

test('POST /api/auth/login rechaza credenciales incorrectas', async () => {
  const response = await fetch(`${baseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ana@example.com',
      password: 'incorrecta',
    }),
  });

  assert.equal(response.status, 401);
});

test('GET /api/products devuelve el catálogo público', async () => {
  const response = await fetch(`${baseUrl()}/api/products`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));
  assert.ok(body.length >= 5);
});

test('GET /api/productos filtra por categoría sin distinguir mayúsculas', async () => {
  const response = await fetch(`${baseUrl()}/api/productos?category=tecnología`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(body.length > 0);
  assert.ok(body.every((product) => product.category.toLowerCase() === 'tecnología'));
});

test('GET /api/products/:id rechaza un producto inexistente', async () => {
  const response = await fetch(`${baseUrl()}/api/products/99999`);

  assert.equal(response.status, 404);
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

test('POST /api/products rechaza precios inválidos y campos vacíos', async () => {
  const invalidPriceResponse = await fetch(`${baseUrl()}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Producto inválido',
      description: 'Prueba',
      category: 'Pruebas',
      price: 0,
    }),
  });
  const emptyNameResponse = await fetch(`${baseUrl()}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: ' ',
      description: 'Prueba',
      category: 'Pruebas',
      price: 1,
    }),
  });

  assert.equal(invalidPriceResponse.status, 400);
  assert.equal(emptyNameResponse.status, 400);
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

test('Las rutas protegidas rechazan token ausente o vencido con 401', async () => {
  const missingTokenResponse = await fetch(`${baseUrl()}/api/favorites`);
  const expiredToken = jwt.sign(
    { id: 2, role: 'usuario' },
    process.env.JWT_SECRET,
    { expiresIn: -1 },
  );
  const expiredTokenResponse = await fetch(`${baseUrl()}/api/favorites`, {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });

  assert.equal(missingTokenResponse.status, 401);
  assert.equal(expiredTokenResponse.status, 401);
});

test('GET /api/favorites lista favoritos del usuario autenticado', async () => {
  const response = await fetch(`${baseUrl()}/api/favorites`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));
});

test('POST /api/favoritos agrega favorito y rechaza duplicados con 409', async () => {
  const request = () => fetch(`${baseUrl()}/api/favoritos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId: 1 }),
  });

  const response = await request();
  const body = await response.json();
  const duplicateResponse = await request();

  assert.equal(response.status, 201);
  assert.equal(body.userId, 2);
  assert.equal(body.productId, 1);
  assert.equal(duplicateResponse.status, 409);
});

test('POST /api/favoritos rechaza un producto inexistente con 404', async () => {
  const response = await fetch(`${baseUrl()}/api/favoritos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId: 99999 }),
  });

  assert.equal(response.status, 404);
});

test('Los favoritos están aislados por usuario', async () => {
  const registerResponse = await fetch(`${baseUrl()}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Usuario B',
      email: 'usuario-b@example.com',
      password: 'Password123',
    }),
  });
  assert.equal(registerResponse.status, 201);

  const loginResponse = await fetch(`${baseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'usuario-b@example.com',
      password: 'Password123',
    }),
  });
  const { token: userBToken } = await loginResponse.json();

  const userBFavoritesResponse = await fetch(`${baseUrl()}/api/favoritos`, {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  const userBDeleteResponse = await fetch(`${baseUrl()}/api/favoritos/1`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  const userAFavoritesResponse = await fetch(`${baseUrl()}/api/favoritos`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });

  assert.deepEqual(await userBFavoritesResponse.json(), []);
  assert.equal(userBDeleteResponse.status, 404);
  assert.ok((await userAFavoritesResponse.json()).some((product) => product.id === 1));
});

test('DELETE /api/favoritos/:productId quita el favorito', async () => {
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
  db.close();
  fs.rmSync(tempDirectory, { recursive: true, force: true });
});
