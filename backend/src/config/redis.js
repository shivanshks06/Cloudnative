const Redis = require("ioredis");

let redis = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null
  });

  redis.on("error", (error) => {
    console.warn("Redis connection warning:", error.message);
  });
}

module.exports = redis;
