const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.getUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, color: true },
    orderBy: { name: "asc" },
  });
  res.json(users);
};

exports.updateRole = async (req, res) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ error: "Forbidden" });
  const { role } = req.body;
  if (!["USER", "ADMIN"].includes(role))
    return res.status(400).json({ error: "Invalid role" });

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ error: "Forbidden" });
  const targetId = parseInt(req.params.id);
  if (req.user.id === targetId) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }
  try {
    await prisma.user.delete({ where: { id: targetId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
