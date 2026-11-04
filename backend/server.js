require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const prisma = require("./src/config/prisma");
const redis = require("./src/config/redis");
const authRoutes = require("./src/routes/auth.routes");
const projectRoutes = require("./src/routes/project.routes");
const taskRoutes = require("./src/routes/task.routes");
const activityRoutes = require("./src/routes/activity.routes");
const notificationRoutes = require("./src/routes/notification.routes");
const requestRoutes = require("./src/routes/request.routes");
const notFound = require("./src/middleware/notFound.middleware");
const errorHandler = require("./src/middleware/error.middleware");

const app = express();
app.set("trust proxy", 1);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-side calls)
    if (!origin) return callback(null, true);
    // Allow configured CLIENT_URL or wildcard
    if (!process.env.CLIENT_URL || process.env.CLIENT_URL === "*" || origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    // Allow local development ports
    if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
      return callback(null, true);
    }
    // Allow dynamic host access (e.g. newly provisioned Elastic IP)
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome to CloudNative API", version: "1.0.0" });
});

app.get("/api/health", async (req, res) => {
  let database = "disconnected";
  let cache = "not_configured";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "connected";
  } catch (error) {
    database = "disconnected";
  }

  if (redis) {
    try {
      if (redis.status === "wait") await redis.connect();
      await redis.ping();
      cache = "connected";
    } catch (error) {
      cache = "disconnected";
    }
  }

  const healthy = database === "connected";
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    application: "CloudNative",
    status: healthy ? "healthy" : "degraded",
    dependencies: { database, redis: cache },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/requests", requestRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`CloudNative API listening on port ${PORT}`);
});

async function shutdown() {
  console.log("Shutting down CloudNative API...");
  server.close(async () => {
    await prisma.$disconnect();
    if (redis) await redis.quit().catch(() => {});
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
