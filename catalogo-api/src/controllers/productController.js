const productRepository = require('../repositories/productRepository');

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

async function listProducts(req, res) {
  const products = await productRepository.listProducts();
  return res.json(products);
}

async function getProductById(req, res) {
  const productId = Number(req.params.id);

  if (!isPositiveInteger(productId)) {
    return res.status(400).json({ message: 'El identificador del producto no es válido' });
  }

  const product = await productRepository.getProductById(productId);

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  return res.json(product);
}

async function createProduct(req, res) {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  const category = String(req.body.category || '').trim();
  const price = Number(req.body.price);

  if (!name) {
    return res.status(400).json({ message: 'El nombre del producto es obligatorio' });
  }

  if (!description) {
    return res.status(400).json({ message: 'La descripción del producto es obligatoria' });
  }

  if (!category) {
    return res.status(400).json({ message: 'La categoría del producto es obligatoria' });
  }

  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: 'El precio debe ser mayor a cero' });
  }

  const existingProduct = await productRepository.findProductByNameAndCategory(name, category);

  if (existingProduct) {
    return res.status(409).json({ message: 'Ya existe un producto con ese nombre y categoría' });
  }

  const product = await productRepository.createProduct({ name, description, category, price });
  return res.status(201).json(product);
}

async function updateProduct(req, res) {
  const productId = Number(req.params.id);

  if (!isPositiveInteger(productId)) {
    return res.status(400).json({ message: 'El identificador del producto no es válido' });
  }

  const currentProduct = await productRepository.getProductById(productId);

  if (!currentProduct) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  const nextName = typeof req.body.name === 'string' ? req.body.name.trim() : currentProduct.name;
  const nextDescription = typeof req.body.description === 'string' ? req.body.description.trim() : currentProduct.description;
  const nextCategory = typeof req.body.category === 'string' ? req.body.category.trim() : currentProduct.category;
  const nextPrice = req.body.price === undefined ? currentProduct.price : Number(req.body.price);

  if (!nextName) {
    return res.status(400).json({ message: 'El nombre del producto es obligatorio' });
  }

  if (!nextDescription) {
    return res.status(400).json({ message: 'La descripción del producto es obligatoria' });
  }

  if (!nextCategory) {
    return res.status(400).json({ message: 'La categoría del producto es obligatoria' });
  }

  if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
    return res.status(400).json({ message: 'El precio debe ser mayor a cero' });
  }

  const duplicateProduct = await productRepository.findProductByNameAndCategory(nextName, nextCategory);

  if (duplicateProduct && duplicateProduct.id !== productId) {
    return res.status(409).json({ message: 'Ya existe otro producto con ese nombre y categoría' });
  }

  const updatedProduct = await productRepository.updateProduct(productId, {
    name: nextName,
    description: nextDescription,
    category: nextCategory,
    price: nextPrice,
  });

  return res.json(updatedProduct);
}

async function deleteProduct(req, res) {
  const productId = Number(req.params.id);

  if (!isPositiveInteger(productId)) {
    return res.status(400).json({ message: 'El identificador del producto no es válido' });
  }

  const deleted = await productRepository.deleteProduct(productId);

  if (!deleted) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  return res.status(204).send();
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
