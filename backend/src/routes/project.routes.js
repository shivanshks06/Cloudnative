const router = require("express").Router();
const authenticate = require("../middleware/auth.middleware");
const controller = require("../controllers/project.controller");

router.use(authenticate);
router.get("/", controller.listProjects);
router.post("/", controller.createProject);
router.get("/:id", controller.getProject);
router.patch("/:id", controller.updateProject);
router.delete("/:id", controller.deleteProject);

module.exports = router;
