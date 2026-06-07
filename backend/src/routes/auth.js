const router = require('express').Router();
const { register, login, getMe, updateMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.patch('/me', auth, updateMe);

module.exports = router;
