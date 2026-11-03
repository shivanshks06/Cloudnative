const test = require("node:test");
const assert = require("node:assert");
const { getOrSetCache } = require("../src/utils/cache");

test("Cache Utility Test (Fallback without live Redis)", async () => {
  let dbCallCount = 0;
  async function fetchFromDb() {
    dbCallCount++;
    return [{ id: 1, name: "Cloud Infrastructure" }];
  }

  // When Redis is null/offline in CI or test mode, getOrSetCache gracefully executes fetcher
  const result = await getOrSetCache("test:projects", 60, fetchFromDb);

  assert.strictEqual(Array.isArray(result), true);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, "Cloud Infrastructure");
  assert.strictEqual(dbCallCount, 1);
});

