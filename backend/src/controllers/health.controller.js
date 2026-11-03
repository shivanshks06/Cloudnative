const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    application: "CloudNative",
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
};

module.exports = {
  getHealth,
};

