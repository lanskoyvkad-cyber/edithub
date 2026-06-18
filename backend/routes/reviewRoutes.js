const express = require('express');

const router = express.Router();

const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, reviewController.createReview);

router.get('/admin/all', authMiddleware, reviewController.getAllReviews);

router.delete('/admin/:id', authMiddleware, reviewController.deleteReview);

router.get('/editor/:editorId', reviewController.getReviewsByEditor);

router.get('/order/:orderId', reviewController.getReviewsByOrder);

module.exports = router;