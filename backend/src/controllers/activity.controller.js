const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");

const listActivity = asyncHandler(async (req, res) => {
  const activities = await prisma.activityLog.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  res.json({ success: true, data: { activities } });
});

module.exports = { listActivity };
