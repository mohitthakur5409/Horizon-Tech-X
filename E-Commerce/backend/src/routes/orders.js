const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
    placeOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus
} = require('../controllers/orderController');

router.post('/', auth, placeOrder);
router.get('/', auth, getUserOrders);
router.get('/:id', auth, getOrderById);
router.put('/:id/status', auth, admin, updateOrderStatus);

module.exports = router;
