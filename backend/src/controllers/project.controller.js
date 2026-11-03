const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const recordActivity = require("../utils/activity");
const { getOrSetCache, invalidateCache } = require("../utils/cache");

const listProjects = asyncHandler(async (req, res) => {
  const cacheKey = `projects:user:${req.user.id}`;

  const data = await getOrSetCache(cacheKey, 60, async () => {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { tasks: true } },
        tasks: { select: { status: true } }
      }
    });

    return projects.map(({ tasks, ...project }) => ({
      ...project,
      taskCount: project._count.tasks,
      completedCount: tasks.filter((t) => t.status === "DONE").length
    }));
  });

  res.json({ success: true, data: { projects: data } });
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: "Project name is required" });
  }

  const project = await prisma.project.create({
    data: { name: String(name).trim(), description: description || null, ownerId: req.user.id }
  });

  await invalidateCache(`projects:user:${req.user.id}`);
  await recordActivity(req.user.id, "CREATED", "PROJECT", project.id, `Created project "${project.name}"`);
  res.status(201).json({ success: true, data: { project } });
});

const getProject = asyncHandler(async (req, res) => {
  const cacheKey = `project:${req.params.id}:user:${req.user.id}`;

  const data = await getOrSetCache(cacheKey, 60, async () => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
          include: { assignee: { select: { id: true, name: true, username: true, email: true } } }
        },
        _count: { select: { tasks: true } }
      }
    });

    if (!project) return null;

    return {
      ...project,
      taskCount: project._count.tasks,
      completedCount: project.tasks.filter((t) => t.status === "DONE").length
    };
  });

  if (!data) return res.status(404).json({ success: false, message: "Project not found" });

  res.json({ success: true, data: { project: data } });
});

const updateProject = asyncHandler(async (req, res) => {
  const existing = await prisma.project.findFirst({
    where: { id: req.params.id, ownerId: req.user.id }
  });
  if (!existing) return res.status(404).json({ success: false, message: "Project not found" });

  const { name, description } = req.body;
  const project = await prisma.project.update({
    where: { id: existing.id },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(description !== undefined ? { description } : {})
    }
  });

  await invalidateCache([
    `projects:user:${req.user.id}`,
    `project:${req.params.id}:user:${req.user.id}`
  ]);

  await recordActivity(req.user.id, "UPDATED", "PROJECT", project.id, `Updated project "${project.name}"`);
  res.json({ success: true, data: { project } });
});

const deleteProject = asyncHandler(async (req, res) => {
  const existing = await prisma.project.findFirst({
    where: { id: req.params.id, ownerId: req.user.id }
  });
  if (!existing) return res.status(404).json({ success: false, message: "Project not found" });

  await prisma.project.delete({ where: { id: existing.id } });

  await invalidateCache([
    `projects:user:${req.user.id}`,
    `project:${req.params.id}:user:${req.user.id}`
  ]);

  await recordActivity(req.user.id, "DELETED", "PROJECT", existing.id, `Deleted project "${existing.name}"`);
  res.json({ success: true, message: "Project deleted" });
});

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject
};
