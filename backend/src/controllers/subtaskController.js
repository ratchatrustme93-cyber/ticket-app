const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.createSubtask = async (req, res) => {
  const { title } = req.body;
  if (!title?.trim())
    return res.status(400).json({ error: "Title is required" });
  try {
    const subtask = await prisma.subtask.create({
      data: {
        title: title.trim(),
        ticketId: parseInt(req.params.id),
        position: Date.now(),
      },
    });
    res.json(subtask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubtask = async (req, res) => {
  const { title, completed } = req.body;
  try {
    const subtask = await prisma.subtask.update({
      where: { id: parseInt(req.params.subtaskId) },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(completed !== undefined && { completed }),
      },
    });
    res.json(subtask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSubtask = async (req, res) => {
  try {
    await prisma.subtask.delete({
      where: { id: parseInt(req.params.subtaskId) },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
