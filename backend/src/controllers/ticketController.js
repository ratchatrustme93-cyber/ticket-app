const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ticketInclude = {
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  notes: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  },
};

exports.getTickets = async (req, res) => {
  const { status, priority, assigneeId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = parseInt(assigneeId);

  const tickets = await prisma.ticket.findMany({
    where,
    include: ticketInclude,
    orderBy: { updatedAt: 'desc' },
  });
  res.json(tickets);
};

exports.createTicket = async (req, res) => {
  const { title, description, status, priority, assigneeId, dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: description || null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        creatorId: req.user.id,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: ticketInclude,
    });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTicket = async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: parseInt(req.params.id) },
    include: ticketInclude,
  });
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
};

exports.updateTicket = async (req, res) => {
  const { title, description, status, priority, assigneeId, dueDate } = req.body;
  try {
    const ticket = await prisma.ticket.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId ? parseInt(assigneeId) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: ticketInclude,
    });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    await prisma.ticket.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addNote = async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const note = await prisma.note.create({
      data: {
        content,
        ticketId: parseInt(req.params.id),
        userId: req.user.id,
      },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    await prisma.note.delete({ where: { id: parseInt(req.params.noteId) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
