const express = require('express');

const router = express.Router();

const portfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, portfolioController.createPortfolioItem);

router.get('/', portfolioController.getPortfolio);

router.get('/user/:userId', portfolioController.getPortfolioByUser);

router.put('/:id', authMiddleware, portfolioController.updatePortfolioItem);

router.delete('/:id', authMiddleware, portfolioController.deletePortfolioItem);

module.exports = router;