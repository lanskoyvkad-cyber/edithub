const express = require('express');

const router = express.Router();

const complaintController = require('../controllers/complaintController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, complaintController.createComplaint);

router.get('/my', authMiddleware, complaintController.getMyComplaints);

router.get('/', authMiddleware, complaintController.getAllComplaints);

router.patch('/:id/status', authMiddleware, complaintController.updateComplaintStatus);

router.patch(
    '/:id/block-user',
    authMiddleware,
    complaintController.blockUserFromComplaint
);

router.patch(
    '/:id/unblock-user',
    authMiddleware,
    complaintController.unblockUserFromComplaint
);

router.delete('/:id', authMiddleware, complaintController.deleteComplaint);

module.exports = router;