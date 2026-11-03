const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const recordActivity = require("../utils/activity");

const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const listTasks = asyncHandler(async (req, res) => {
  const { projectId, status, assigneeId } = req.query;

  const whereClause = {
    ...(projectId ? { projectId } : {}),
    ...(status ? { status } : {}),
    ...(assigneeId ? { assigneeId } : {})
  };

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: [
      { order: "asc" },
      { createdAt: "desc" }
    ],
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, username: true, email: true, role: true } },
      createdBy: { select: { id: true, name: true, username: true, role: true } }
    }
  });

  res.json({ success: true, data: { tasks } });
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, projectId, assigneeId, dueDate, priority, estimatedHours } = req.body;
  if (!title || !String(title).trim() || !projectId) {
    return res.status(400).json({ success: false, message: "Task title and project are required" });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });
  if (!project) return res.status(404).json({ success: false, message: "Project not found" });

  let assignedUser = null;
  if (assigneeId) {
    assignedUser = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, name: true, username: true }
    });
    if (!assignedUser) return res.status(400).json({ success: false, message: "Assignee not found" });
  }

  const task = await prisma.task.create({
    data: {
      title: String(title).trim(),
      description: description || null,
      projectId,
      assigneeId: assigneeId || null,
      createdById: req.user.id,
      priority: validPriorities.includes(priority) ? priority : "MEDIUM",
      estimatedHours: estimatedHours ? parseInt(estimatedHours, 10) : 4,
      dueDate: dueDate ? new Date(dueDate) : null
    },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, username: true, role: true } },
      createdBy: { select: { id: true, name: true, username: true, role: true } }
    }
  });

  // Notify the assigned developer
  if (assignedUser && assignedUser.id !== req.user.id) {
    try {
      await prisma.notification.create({
        data: {
          userId: assignedUser.id,
          title: "New Task Assigned",
          message: `${req.user.name} (@${req.user.username}) assigned you to "${task.title}".`,
          taskId: task.id
        }
      });
    } catch (e) {
      console.error("Notification creation failed:", e);
    }
  }

  const assignText = assignedUser ? ` and assigned to @${assignedUser.username}` : "";
  await recordActivity(req.user.id, "CREATED", "TASK", task.id, `Created task "${task.title}"${assignText}`);
  res.status(201).json({ success: true, data: { task } });
});

const updateTask = asyncHandler(async (req, res) => {
  const existing = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { assignee: true }
  });
  if (!existing) return res.status(404).json({ success: false, message: "Task not found" });

  const { title, description, status, assigneeId, dueDate, priority, estimatedHours, order } = req.body;

  if (status !== undefined && !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid task status" });
  }

  let assignedUser = null;
  if (assigneeId !== undefined && assigneeId !== null && assigneeId !== "") {
    assignedUser = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, name: true, username: true }
    });
    if (!assignedUser) return res.status(400).json({ success: false, message: "Assignee not found" });
  }

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      ...(title !== undefined ? { title: String(title).trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined && validPriorities.includes(priority) ? { priority } : {}),
      ...(estimatedHours !== undefined ? { estimatedHours: parseInt(estimatedHours, 10) } : {}),
      ...(order !== undefined ? { order: parseInt(order, 10) } : {}),
      ...(assigneeId !== undefined ? { assigneeId: assigneeId || null } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {})
    },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, username: true, role: true } },
      createdBy: { select: { id: true, name: true, username: true, role: true } }
    }
  });

  // Reassignment notification: manager reassigns task to a new developer
  if (assigneeId !== undefined && assigneeId !== existing.assigneeId) {
    if (assignedUser && assignedUser.id !== req.user.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: assignedUser.id,
            title: "Task Reassigned to You",
            message: `${req.user.name} (@${req.user.username}) reassigned task "${task.title}" to you.`,
            taskId: task.id
          }
        });
      } catch (e) {
        console.error("Reassign notification failed:", e);
      }
    }
    const targetName = assignedUser ? `@${assignedUser.username}` : "Unassigned";
    await recordActivity(req.user.id, "REASSIGNED", "TASK", task.id, `Reassigned "${task.title}" to ${targetName}`);
  }

  if (status && status !== existing.status) {
    await recordActivity(req.user.id, "UPDATED", "TASK", task.id, `Moved "${task.title}" to ${status.replace("_", " ")}`);
  }

  res.json({ success: true, data: { task } });
});

const deleteTask = asyncHandler(async (req, res) => {
  const existing = await prisma.task.findUnique({
    where: { id: req.params.id }
  });
  if (!existing) return res.status(404).json({ success: false, message: "Task not found" });

  await prisma.task.delete({ where: { id: existing.id } });
  await recordActivity(req.user.id, "DELETED", "TASK", existing.id, `Deleted task "${existing.title}"`);
  res.json({ success: true, message: "Task deleted" });
});

module.exports = { listTasks, createTask, updateTask, deleteTask };
