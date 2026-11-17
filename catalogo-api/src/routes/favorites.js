const express = require('express');
const favoritesController = require('../controllers/favoritesController');
const { authenticateToken } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

router.use(authenticateToken);
router.get('/', asyncHandler(favoritesController.listFavorites));
router.post('/', asyncHandler(favoritesController.addFavorite));
router.post('/:productId', asyncHandler(favoritesController.addFavorite));
router.delete('/:productId', asyncHandler(favoritesController.removeFavorite));

module.exports = router;
