const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ticketInclude = {
  creator: { select: { id: true, name: true, email: true, color: true } },
  assignee: { select: { id: true, name: true, email: true, color: true } },
  labels: { orderBy: { name: "asc" } },
  notes: {
    include: { user: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: "asc" },
  },
  subtasks: { orderBy: { position: "asc" } },
};

const ticketDetailInclude = {
  ...ticketInclude,
  activities: {
    include: { user: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  },
  relationsFrom: {
    include: { to: { select: { id: true, title: true, status: true } } },
    orderBy: { createdAt: "asc" },
  },
  relationsTo: {
    include: { from: { select: { id: true, title: true, status: true } } },
    orderBy: { createdAt: "asc" },
  },
};

exports.getTickets = async (req, res) => {
  const { status, priority, assigneeId, labelId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = parseInt(assigneeId);
  if (labelId) where.labels = { some: { id: parseInt(labelId) } };

  const tickets = await prisma.ticket.findMany({
    where,
    include: ticketInclude,
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  res.json(tickets);
};

exports.createTicket = async (req, res) => {
  const {
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
    labelIds,
  } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  try {
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: description || null,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        creatorId: req.user.id,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        position: Date.now(),
        ...(labelIds?.length && {
          labels: { connect: labelIds.map((id) => ({ id: parseInt(id) })) },
        }),
      },
      include: ticketInclude,
    });

    await prisma.activity.create({
      data: { action: "created", ticketId: ticket.id, userId: req.user.id },
    });

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTicket = async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: parseInt(req.params.id) },
    include: ticketDetailInclude,
  });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  res.json(ticket);
};

exports.updateTicket = async (req, res) => {
  const {
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
    labelIds,
    position,
  } = req.body;
  const id = parseInt(req.params.id);

  try {
    const existing = await prisma.ticket.findUnique({
      where: { id },
      include: { assignee: { select: { name: true } } },
    });

    if (req.user.id !== existing.creatorId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Permission denied" });
    }

    const activityData = [];

    if (status !== undefined && status !== existing.status) {
      activityData.push({
        action: "status_changed",
        fromValue: existing.status,
        toValue: status,
        ticketId: id,
        userId: req.user.id,
      });
    }
    if (priority !== undefined && priority !== existing.priority) {
      activityData.push({
        action: "priority_changed",
        fromValue: existing.priority,
        toValue: priority,
        ticketId: id,
        userId: req.user.id,
      });
    }
    if (assigneeId !== undefined) {
      const newId = assigneeId ? parseInt(assigneeId) : null;
      if (newId !== existing.assigneeId) {
        let newName = null;
        if (newId) {
          const u = await prisma.user.findUnique({
            where: { id: newId },
            select: { name: true },
          });
          newName = u?.name || null;
        }
        activityData.push({
          action: "assignee_changed",
          fromValue: existing.assignee?.name || null,
          toValue: newName,
          ticketId: id,
          userId: req.user.id,
        });
      }
    }

    await prisma.ticket.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId !== undefined && {
          assigneeId: assigneeId ? parseInt(assigneeId) : null,
        }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(position !== undefined && { position }),
        ...(labelIds !== undefined && {
          labels: { set: labelIds.map((lid) => ({ id: parseInt(lid) })) },
        }),
      },
    });

    if (activityData.length > 0) {
      await prisma.activity.createMany({ data: activityData });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: ticketInclude,
    });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (req.user.id !== ticket.creatorId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Permission denied" });
    }
    await prisma.ticket.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addNote = async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Content is required" });

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
