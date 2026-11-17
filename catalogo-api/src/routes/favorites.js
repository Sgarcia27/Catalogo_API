const express = require('express');
const favoritesController = require('../controllers/favoritesController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);
router.get('/', favoritesController.listFavorites);
router.post('/:productId', favoritesController.addFavorite);
router.delete('/:productId', favoritesController.removeFavorite);

module.exports = router;
