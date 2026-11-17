const express = require('express');
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', productController.listProducts);
router.get('/:id', productController.getProductById);
router.post('/', authenticateToken, authorizeRoles('admin'), productController.createProduct);
router.put('/:id', authenticateToken, authorizeRoles('admin'), productController.updateProduct);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;
