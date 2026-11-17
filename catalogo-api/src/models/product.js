function normalizeProduct(product) {
  if (!product) {
    return null;
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: Number(product.price),
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

module.exports = {
  normalizeProduct,
};
