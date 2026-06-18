const express = require('express');

const router = express.Router();

const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, serviceController.createService);

router.get('/', serviceController.getServices);

router.get('/:id', serviceController.getServiceById);

router.put('/:id', authMiddleware, serviceController.updateService);

router.delete('/:id', authMiddleware, serviceController.deleteService);

module.exports = router;