const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const VALID_TYPES = ["blocks", "relates_to", "duplicate_of"];

exports.createRelation = async (req, res) => {
  const { toId, type } = req.body;
  const fromId = parseInt(req.params.id);

  if (!toId || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: "Invalid relation data" });
  }
  if (fromId === parseInt(toId)) {
    return res.status(400).json({ error: "Cannot relate a ticket to itself" });
  }

  try {
    const relation = await prisma.ticketRelation.create({
      data: { fromId, toId: parseInt(toId), type },
      include: {
        to: { select: { id: true, title: true, status: true } },
        from: { select: { id: true, title: true, status: true } },
      },
    });
    res.json(relation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRelation = async (req, res) => {
  try {
    await prisma.ticketRelation.delete({
      where: { id: parseInt(req.params.relationId) },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
