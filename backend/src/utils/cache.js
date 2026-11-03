const redis = require("../config/redis");

/**
 * Get cached value by key or fallback to fetcher function
 * @param {string} key
 * @param {number} ttlSeconds
 * @param {Function} fetcher
 */
async function getOrSetCache(key, ttlSeconds, fetcher) {
  if (!redis) {
    return await fetcher();
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    // Graceful fallback on cache failure
    console.warn(`Redis get cache error for ${key}:`, err.message);
  }

  const freshData = await fetcher();

  if (redis && freshData !== undefined && freshData !== null) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(freshData));
    } catch (err) {
      console.warn(`Redis set cache error for ${key}:`, err.message);
    }
  }

  return freshData;
}

/**
 * Invalidate a specific cache key or keys matching pattern
 * @param {string|string[]} keys
 */
async function invalidateCache(keys) {
  if (!redis) return;
  try {
    const keyList = Array.isArray(keys) ? keys : [keys];
    if (keyList.length > 0) {
      await redis.del(...keyList);
    }
  } catch (err) {
    console.warn("Redis invalidate cache error:", err.message);
  }
}

module.exports = {
  getOrSetCache,
  invalidateCache
};

