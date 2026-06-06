const router = require('express').Router();
const auth = require('../middleware/auth');
const { getMemos, createMemo, updateMemo, deleteMemo } = require('../controllers/memoController');

router.use(auth);
router.get('/', getMemos);
router.post('/', createMemo);
router.put('/:id', updateMemo);
router.delete('/:id', deleteMemo);

module.exports = router;
