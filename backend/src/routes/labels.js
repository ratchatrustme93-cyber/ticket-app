const express = require("express");
const auth = require("../middleware/auth");
const {
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
} = require("../controllers/labelController");

const router = express.Router();

router.use(auth);
router.get("/", getLabels);
router.post("/", createLabel);
router.put("/:id", updateLabel);
router.delete("/:id", deleteLabel);

module.exports = router;
