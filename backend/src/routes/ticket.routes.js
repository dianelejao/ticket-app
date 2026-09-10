const router = require('express').Router();
const ctrl = require('../controllers/ticket.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/me', authenticate, ctrl.myTickets);
router.post('/scan', authenticate, requireAdmin, ctrl.scanTicket);

module.exports = router;
