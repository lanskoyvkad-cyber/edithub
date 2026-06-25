const express = require('express');

const router = express.Router();

const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, orderController.createOrder);

router.get('/my', authMiddleware, orderController.getMyOrders);

router.get('/', orderController.getOrders);

router.get('/:id', orderController.getOrderById);

router.put('/:id', authMiddleware, orderController.updateOrder);

router.delete('/admin/:id', authMiddleware, orderController.adminDeleteOrder);

router.delete('/:id', authMiddleware, orderController.deleteOrder);

router.patch('/:id/complete', authMiddleware, orderController.completeOrder);

module.exports = router;