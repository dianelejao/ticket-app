const router = require('express').Router();
const ctrl = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/me', ctrl.myBookings);
router.post('/', ctrl.createBooking);
router.post('/:id/pay', ctrl.payBooking);

module.exports = router;
