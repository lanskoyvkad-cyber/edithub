const express = require('express');

const router = express.Router();

const applicationController =
    require('../controllers/applicationController');

const authMiddleware =
    require('../middleware/authMiddleware');

router.post(
    '/',
    authMiddleware,
    applicationController.createApplication
);

router.get(
    '/my',
    authMiddleware,
    applicationController.getMyApplications
);

router.get(
    '/order/:orderId',
    authMiddleware,
    applicationController.getApplicationsByOrder
);

router.patch(
    '/:id/status',
    authMiddleware,
    applicationController.updateApplicationStatus
);

module.exports = router;