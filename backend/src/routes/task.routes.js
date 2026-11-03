const router = require("express").Router();
const authenticate = require("../middleware/auth.middleware");
const controller = require("../controllers/task.controller");

router.use(authenticate);
router.get("/", controller.listTasks);
router.post("/", controller.createTask);
router.patch("/:id", controller.updateTask);
router.delete("/:id", controller.deleteTask);

module.exports = router;
