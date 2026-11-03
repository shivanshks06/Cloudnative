const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "super_secret_test_key_for_testing_purposes_only_32_chars";
process.env.JWT_EXPIRES_IN = "1d";

test("Authentication Utilities Test", async (t) => {
  await t.test("Password hashing with bcrypt", async () => {
    const rawPassword = "Password@123";
    const hash = await bcrypt.hash(rawPassword, 10);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    const isWrong = await bcrypt.compare("WrongPassword", hash);

    assert.strictEqual(isMatch, true, "Valid password should verify against hash");
    assert.strictEqual(isWrong, false, "Invalid password should fail verification");
  });

  await t.test("JWT token signing and verification", () => {
    const mockUser = {
      id: "usr_test_123",
      role: "DEVELOPER"
    };

    const token = jwt.sign(
      { sub: mockUser.id, role: mockUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    assert.ok(token, "Token should be generated");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(decoded.sub, mockUser.id);
    assert.strictEqual(decoded.role, "DEVELOPER");
  });
});

