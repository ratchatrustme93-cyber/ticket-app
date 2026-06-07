const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  getTickets,
  createTicket,
  getTicket,
  updateTicket,
  deleteTicket,
  addNote,
  deleteNote,
} = require("../controllers/ticketController");
const {
  createSubtask,
  updateSubtask,
  deleteSubtask,
} = require("../controllers/subtaskController");
const {
  createRelation,
  deleteRelation,
} = require("../controllers/relationController");

router.use(auth);
router.get("/", getTickets);
router.post("/", createTicket);
router.get("/:id", getTicket);
router.put("/:id", updateTicket);
router.delete("/:id", deleteTicket);
router.post("/:id/notes", addNote);
router.delete("/:id/notes/:noteId", deleteNote);
router.post("/:id/subtasks", createSubtask);
router.patch("/:id/subtasks/:subtaskId", updateSubtask);
router.delete("/:id/subtasks/:subtaskId", deleteSubtask);
router.post("/:id/relations", createRelation);
router.delete("/:id/relations/:relationId", deleteRelation);

module.exports = router;
