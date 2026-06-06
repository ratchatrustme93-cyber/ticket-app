const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.getLabels = async (req, res) => {
  const labels = await prisma.label.findMany({ orderBy: { name: "asc" } });
  res.json(labels);
};

exports.createLabel = async (req, res) => {
  const { name, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
  try {
    const label = await prisma.label.create({
      data: { name: name.trim(), color: color || "#6B7280" },
    });
    res.json(label);
  } catch (err) {
    if (err.code === "P2002")
      return res.status(400).json({ error: "Label name already exists" });
    res.status(500).json({ error: err.message });
  }
};

exports.updateLabel = async (req, res) => {
  const { name, color } = req.body;
  try {
    const label = await prisma.label.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
      },
    });
    res.json(label);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLabel = async (req, res) => {
  try {
    await prisma.label.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
