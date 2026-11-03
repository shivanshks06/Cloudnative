const router = require("express").Router();
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const authenticate = require("../middleware/auth.middleware");

// Get unread & recent notifications for logged in user
router.get("/", authenticate, asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: req.user.id, read: false }
  });

  res.json({ success: true, data: { notifications, unreadCount } });
}));

// Mark notification as read
router.patch("/:id/read", authenticate, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { read: true }
  });
  res.json({ success: true, message: "Marked as read" });
}));

// Mark all as read
router.post("/read-all", authenticate, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true }
  });
  res.json({ success: true, message: "All notifications marked as read" });
}));

module.exports = router;

