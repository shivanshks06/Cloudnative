const router = require("express").Router();
const authenticate = require("../middleware/auth.middleware");
const { listActivity } = require("../controllers/activity.controller");

router.use(authenticate);
router.get("/", listActivity);

module.exports = router;
