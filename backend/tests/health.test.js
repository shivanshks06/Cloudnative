const test = require("node:test");
const assert = require("node:assert");

// Test Environment configuration
process.env.PORT = "5002";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "super_secret_test_key_for_testing_purposes_only_32_chars";

test("Health Controller Response Test", async () => {
  const { getHealth } = require("../src/controllers/health.controller");

  const req = {};
  let responseData = null;
  let statusCode = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  getHealth(req, res);

  assert.strictEqual(statusCode, 200, "Health check should return status code 200");
  assert.strictEqual(responseData.success, true, "Response should have success: true");
  assert.strictEqual(responseData.application, "CloudNative");
  assert.strictEqual(responseData.status, "healthy");
  assert.ok(responseData.timestamp, "Response should include an ISO timestamp");
});

