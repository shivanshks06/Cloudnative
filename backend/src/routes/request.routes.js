const router = require("express").Router();
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const authenticate = require("../middleware/auth.middleware");
const recordActivity = require("../utils/activity");

// Submit a developer request (Extend Deadline, Reassign, Blocked)
router.post("/", authenticate, asyncHandler(async (req, res) => {
  const { taskId, type, reason, suggestedDate, suggestedHours } = req.body;

  if (!taskId || !type || !reason) {
    return res.status(400).json({ success: false, message: "taskId, type and reason are required" });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { include: { owner: true } },
      createdBy: true
    }
  });

  if (!task) return res.status(404).json({ success: false, message: "Task not found" });

  const request = await prisma.taskRequest.create({
    data: {
      taskId,
      userId: req.user.id,
      type,
      reason: String(reason).trim(),
      suggestedDate: suggestedDate ? new Date(suggestedDate) : null,
      suggestedHours: suggestedHours ? parseInt(suggestedHours, 10) : null
    },
    include: {
      user: { select: { id: true, name: true, username: true, role: true } },
      task: { select: { id: true, title: true } }
    }
  });

  // Notify the manager (project owner or task creator)
  const managerId = task.project.ownerId || task.createdById;
  const typeLabels = {
    EXTEND_DEADLINE: "Deadline Extension",
    REASSIGN_TASK: "Reassignment Request",
    BLOCKED: "Task Blocked Alert"
  };

  try {
    await prisma.notification.create({
      data: {
        userId: managerId,
        title: `Developer Request: ${typeLabels[type] || type}`,
        message: `@${req.user.username} submitted a request on "${task.title}": "${reason}"`,
        taskId: task.id
      }
    });
  } catch (err) {
    console.error("Manager notification failed:", err);
  }

  await recordActivity(
    req.user.id,
    "REQUESTED",
    "TASK",
    task.id,
    `@${req.user.username} requested ${typeLabels[type] || type} for "${task.title}"`
  );

  res.status(201).json({ success: true, data: { request } });
}));

// List requests (Managers see all project requests, Developers see their own)
router.get("/", authenticate, asyncHandler(async (req, res) => {
  const isManager = req.user.role === "MANAGER" || req.user.role === "ADMIN";

  const requests = await prisma.taskRequest.findMany({
    where: isManager ? {} : { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, username: true, role: true } },
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          estimatedHours: true,
          assignee: { select: { id: true, name: true, username: true } },
          project: { select: { id: true, name: true } }
        }
      }
    }
  });

  res.json({ success: true, data: { requests } });
}));

// Manager Approve / Reject developer request
router.patch("/:id", authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== "MANAGER" && req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Only managers can approve or reject requests" });
  }

  const { status, action } = req.body; // status: APPROVED | REJECTED
  const existing = await prisma.taskRequest.findUnique({
    where: { id: req.params.id },
    include: { task: true, user: true }
  });

  if (!existing) return res.status(404).json({ success: false, message: "Request not found" });

  const updatedRequest = await prisma.taskRequest.update({
    where: { id: existing.id },
    data: { status }
  });

  // If approved and it's deadline extension, update task dueDate
  if (status === "APPROVED") {
    if (existing.type === "EXTEND_DEADLINE" && existing.suggestedDate) {
      await prisma.task.update({
        where: { id: existing.taskId },
        data: {
          dueDate: existing.suggestedDate,
          ...(existing.suggestedHours ? { estimatedHours: existing.suggestedHours } : {})
        }
      });
    } else if (existing.type === "REASSIGN_TASK") {
      // Unassign task so manager can reassign
      await prisma.task.update({
        where: { id: existing.taskId },
        data: { assigneeId: null }
      });
    }
  }

  // Notify developer about outcome
  try {
    await prisma.notification.create({
      data: {
        userId: existing.userId,
        title: `Request ${status === "APPROVED" ? "Approved" : "Declined"}`,
        message: `Your request on "${existing.task.title}" was ${status.toLowerCase()} by manager @${req.user.username}.`,
        taskId: existing.taskId
      }
    });
  } catch (err) {
    console.error("Developer notification failed:", err);
  }

  res.json({ success: true, data: { request: updatedRequest } });
}));

module.exports = router;

