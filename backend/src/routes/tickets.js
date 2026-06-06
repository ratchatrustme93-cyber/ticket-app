const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getTickets,
  createTicket,
  getTicket,
  updateTicket,
  deleteTicket,
  addNote,
  deleteNote,
} = require('../controllers/ticketController');

router.use(auth);
router.get('/', getTickets);
router.post('/', createTicket);
router.get('/:id', getTicket);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);
router.post('/:id/notes', addNote);
router.delete('/:id/notes/:noteId', deleteNote);

module.exports = router;
