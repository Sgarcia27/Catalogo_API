const productRepository = require('../repositories/productRepository');
const favoriteRepository = require('../repositories/favoriteRepository');

async function listFavorites(req, res) {
  const favorites = await favoriteRepository.listFavoritesByUser(req.user.id);
  return res.json(favorites);
}

async function addFavorite(req, res) {
  const productId = Number(req.params.productId ?? (req.body && req.body.productId));

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'El identificador del producto no es válido' });
  }

  const product = await productRepository.getProductById(productId);

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  const existingFavorite = await favoriteRepository.getFavorite(req.user.id, productId);

  if (existingFavorite) {
    return res.status(409).json({ message: 'El producto ya está en tus favoritos' });
  }

  const favorite = await favoriteRepository.addFavorite(req.user.id, productId);

  return res.status(201).json({
    id: favorite.id,
    userId: req.user.id,
    productId,
    message: 'Producto agregado a favoritos',
  });
}

async function removeFavorite(req, res) {
  const productId = Number(req.params.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'El identificador del producto no es válido' });
  }

  const product = await productRepository.getProductById(productId);

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  const removed = await favoriteRepository.removeFavorite(req.user.id, productId);

  if (!removed) {
    return res.status(404).json({ message: 'El producto no está en tus favoritos' });
  }

  return res.status(200).json({
    userId: req.user.id,
    productId,
    message: 'Producto eliminado de favoritos',
  });
}

module.exports = {
  listFavorites,
  addFavorite,
  removeFavorite,
};
