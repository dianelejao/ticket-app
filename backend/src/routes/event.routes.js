const router = require('express').Router();
const ctrl = require('../controllers/event.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', ctrl.listEvents);
router.get('/:id', ctrl.getEvent);
router.post('/', authenticate, requireAdmin, ctrl.createEvent);
router.put('/:id', authenticate, requireAdmin, ctrl.updateEvent);
router.delete('/:id', authenticate, requireAdmin, ctrl.deleteEvent);

module.exports = router;
