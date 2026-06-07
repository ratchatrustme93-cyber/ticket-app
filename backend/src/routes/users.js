const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  getUsers,
  updateRole,
  deleteUser,
} = require("../controllers/userController");

router.use(auth);
router.get("/", getUsers);
router.patch("/:id/role", updateRole);
router.delete("/:id", deleteUser);

module.exports = router;
