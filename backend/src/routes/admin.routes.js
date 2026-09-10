const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const notifCtrl = require('../controllers/notification.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);
router.get('/dashboard', ctrl.dashboard);
router.get('/bookings/pending', ctrl.pendingBookings);
router.get('/bookings/payments', ctrl.paymentBookings);
router.post('/bookings/:id/approve', ctrl.approveBooking);
router.post('/bookings/:id/reject', ctrl.rejectBooking);
router.get('/clients', ctrl.clients);
router.get('/clients/:id', ctrl.clientDetail);
router.post('/clients/:id/message', ctrl.sendClientMessage);
router.get('/events/:id/attendees', ctrl.eventAttendees);
router.post('/notifications/broadcast', notifCtrl.broadcastToEvent);

module.exports = router;
