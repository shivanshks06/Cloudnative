const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");

function makeToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, role } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, username, email and password are required" });
  }

  const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (cleanUsername.length < 3) {
    return res.status(400).json({ success: false, message: "Username must be at least 3 characters (letters, numbers, _)" });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingEmail) {
    return res.status(409).json({ success: false, message: "An account with this email already exists" });
  }

  const existingUsername = await prisma.user.findUnique({ where: { username: cleanUsername } });
  if (existingUsername) {
    return res.status(409).json({ success: false, message: "This username is already taken. Choose another." });
  }

  const validRole = ["MANAGER", "DEVELOPER"].includes(role) ? role : "DEVELOPER";

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      username: cleanUsername,
      email: normalizedEmail,
      role: validRole,
      passwordHash
    },
    select: { id: true, name: true, username: true, email: true, role: true, createdAt: true }
  });

  res.status(201).json({ success: true, message: "Account created successfully", data: { user, token: makeToken(user) } });
});

const login = asyncHandler(async (req, res) => {
  const { identifier, email, password } = req.body;
  const loginHandle = String(identifier || email || "").trim().toLowerCase();

  if (!loginHandle || !password) {
    return res.status(400).json({ success: false, message: "Username/Email and password are required" });
  }

  const userRecord = await prisma.user.findFirst({
    where: {
      OR: [
        { email: loginHandle },
        { username: loginHandle }
      ]
    }
  });

  if (!userRecord || !(await bcrypt.compare(password, userRecord.passwordHash))) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const user = {
    id: userRecord.id,
    name: userRecord.name,
    username: userRecord.username,
    email: userRecord.email,
    role: userRecord.role
  };

  res.json({ success: true, data: { user, token: makeToken(user) } });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, email: true, role: true },
    orderBy: { name: "asc" }
  });
  res.json({ success: true, data: { users } });
});

module.exports = { register, login, me, listUsers };
