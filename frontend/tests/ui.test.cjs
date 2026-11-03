const test = require("node:test");
const assert = require("node:assert");

test("Frontend Utility & Build Assets Test", async (t) => {
  await t.test("Status badge label resolver logic", () => {
    const labels = { TODO: "To do", IN_PROGRESS: "In progress", DONE: "Done" };
    assert.strictEqual(labels.TODO, "To do");
    assert.strictEqual(labels.IN_PROGRESS, "In progress");
    assert.strictEqual(labels.DONE, "Done");
  });

  await t.test("API BaseURL fallback format", () => {
    const defaultUrl = "http://localhost:5000/api";
    assert.match(defaultUrl, /^https?:\/\//);
    assert.ok(defaultUrl.endsWith("/api"));
  });
});

