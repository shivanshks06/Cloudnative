const client = require("prom-client");

// Create a Registry
const register = new client.Registry();

// Add default recommended metrics (CPU, memory, event loop lag, etc.)
client.collectDefaultMetrics({
  register,
  prefix: "cloudnative_backend_"
});

// HTTP request counter
const httpRequestCounter = new client.Counter({
  name: "cloudnative_http_requests_total",
  help: "Total number of HTTP requests processed by CloudNative backend",
  labelNames: ["method", "route", "status_code"],
  registers: [register]
});

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: "cloudnative_http_request_duration_seconds",
  help: "Histogram of HTTP request durations in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

// Metrics middleware to track request count and latency
const metricsMiddleware = (req, res, next) => {
  if (req.path === "/metrics") {
    return next();
  }

  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    const route = req.route ? `${req.baseUrl || ""}${req.route.path}` : (req.baseUrl || req.path);
    const statusCode = res.statusCode.toString();

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: statusCode
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: statusCode
      },
      durationInSeconds
    );
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
  httpRequestCounter,
  httpRequestDuration
};

