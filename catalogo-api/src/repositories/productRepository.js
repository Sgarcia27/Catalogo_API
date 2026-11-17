const { allSql, getSql, runSql } = require('../config/database');
const { normalizeProduct } = require('../models/product');

async function listProducts(category) {
  const rows = category
    ? await allSql(
      `
        SELECT *
        FROM products
        WHERE LOWER(category) = LOWER(?)
        ORDER BY id ASC
      `,
      [category],
    )
    : await allSql(`
      SELECT *
      FROM products
      ORDER BY id ASC
    `);

  return rows.map((product) => normalizeProduct(product));
}

async function getProductById(productId) {
  const row = await getSql(
    `
      SELECT *
      FROM products
      WHERE id = ?
      LIMIT 1
    `,
    [productId],
  );

  return row ? normalizeProduct(row) : null;
}

async function findProductByNameAndCategory(name, category) {
  const row = await getSql(
    `
      SELECT *
      FROM products
      WHERE LOWER(name) = LOWER(?) AND LOWER(category) = LOWER(?)
      LIMIT 1
    `,
    [String(name).trim(), String(category).trim()],
  );

  return row ? normalizeProduct(row) : null;
}

async function createProduct(productData) {
  const { name, description, category, price } = productData;

  const result = await runSql(
    `
      INSERT INTO products (name, description, category, price, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    [String(name).trim(), String(description).trim(), String(category).trim(), Number(price)],
  );

  return getProductById(result.lastInsertRowid);
}

async function updateProduct(productId, productData) {
  const existingProduct = await getProductById(productId);

  if (!existingProduct) {
    return null;
  }

  const nextName = productData.name?.trim() ?? existingProduct.name;
  const nextDescription = productData.description?.trim() ?? existingProduct.description;
  const nextCategory = productData.category?.trim() ?? existingProduct.category;
  const nextPrice = Number(productData.price ?? existingProduct.price);

  await runSql(
    `
      UPDATE products
      SET name = ?, description = ?, category = ?, price = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
    [nextName, nextDescription, nextCategory, nextPrice, productId],
  );

  return getProductById(productId);
}

async function deleteProduct(productId) {
  const existingProduct = await getProductById(productId);

  if (!existingProduct) {
    return false;
  }

  await runSql(
    `
      DELETE FROM products
      WHERE id = ?
    `,
    [productId],
  );

  return true;
}

module.exports = {
  listProducts,
  getProductById,
  findProductByNameAndCategory,
  createProduct,
  updateProduct,
  deleteProduct,
};
