const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.getMemos = async (req, res) => {
  const memos = await prisma.memo.findMany({
    where: { userId: req.user.id },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
  });
  res.json(memos);
};

exports.createMemo = async (req, res) => {
  const { title, content, pinned } = req.body;
  try {
    const memo = await prisma.memo.create({
      data: {
        title: title || '',
        content: content || '',
        pinned: pinned || false,
        userId: req.user.id,
      },
    });
    res.json(memo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMemo = async (req, res) => {
  const { title, content, pinned } = req.body;
  try {
    const memo = await prisma.memo.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(pinned !== undefined && { pinned }),
      },
    });
    res.json(memo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMemo = async (req, res) => {
  try {
    await prisma.memo.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
