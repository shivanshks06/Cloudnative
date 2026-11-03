const test = require("node:test");
const assert = require("node:assert");
const redis = require("../src/config/redis");
const { getOrSetCache } = require("../src/utils/cache");

test.after(() => {
  // Disconnect open redis socket handle so Node test runner exits immediately
  if (redis && redis.status !== "end") {
    redis.disconnect();
  }
});

test("Cache Utility Test (Fallback without live Redis)", async () => {
  let dbCallCount = 0;
  async function fetchFromDb() {
    dbCallCount++;
    return [{ id: 1, name: "Cloud Infrastructure" }];
  }

  const result = await getOrSetCache("test:projects", 60, fetchFromDb);

  assert.strictEqual(Array.isArray(result), true);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, "Cloud Infrastructure");
  assert.strictEqual(dbCallCount, 1);
});
