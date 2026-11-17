const express = require('express');
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(productController.listProducts));
router.get('/:id', asyncHandler(productController.getProductById));
router.post('/', authenticateToken, authorizeRoles('admin'), asyncHandler(productController.createProduct));
router.put('/:id', authenticateToken, authorizeRoles('admin'), asyncHandler(productController.updateProduct));
router.delete('/:id', authenticateToken, authorizeRoles('admin'), asyncHandler(productController.deleteProduct));

module.exports = router;
