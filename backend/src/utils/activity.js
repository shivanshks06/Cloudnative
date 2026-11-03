const prisma = require("../config/prisma");

async function recordActivity(userId, action, entityType, entityId, message) {
  return prisma.activityLog.create({
    data: { userId, action, entityType, entityId, message }
  });
}

module.exports = recordActivity;
