const { allSql, getSql, runSql } = require('../config/database');

async function listFavoritesByUser(userId) {
  return allSql(
    `
      SELECT p.*
      FROM favorites f
      INNER JOIN products p ON p.id = f.product_id
      WHERE f.user_id = ?
      ORDER BY f.id ASC
    `,
    [userId],
  );
}

async function getFavorite(userId, productId) {
  return getSql(
    `
      SELECT *
      FROM favorites
      WHERE user_id = ? AND product_id = ?
      LIMIT 1
    `,
    [userId, productId],
  );
}

async function addFavorite(userId, productId) {
  const existingFavorite = await getFavorite(userId, productId);

  if (existingFavorite) {
    return existingFavorite;
  }

  const result = await runSql(
    `
      INSERT INTO favorites (user_id, product_id)
      VALUES (?, ?)
    `,
    [userId, productId],
  );

  return {
    id: result.lastInsertRowid,
    user_id: userId,
    product_id: productId,
  };
}

async function removeFavorite(userId, productId) {
  const existingFavorite = await getFavorite(userId, productId);

  if (!existingFavorite) {
    return false;
  }

  await runSql(
    `
      DELETE FROM favorites
      WHERE user_id = ? AND product_id = ?
    `,
    [userId, productId],
  );

  return true;
}

module.exports = {
  listFavoritesByUser,
  getFavorite,
  addFavorite,
  removeFavorite,
};
