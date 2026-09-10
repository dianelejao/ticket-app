const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.myNotifications);
router.put('/:id/read', ctrl.markRead);

module.exports = router;
