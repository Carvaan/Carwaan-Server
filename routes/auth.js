const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/auth_controller");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 1024 * 1024 * 5,
  },
  //fileFilter: filefilter
});

router.post("/register", AuthController.register);
router.post(
  "/registershowroom",
  upload.single("img"),
  AuthController.registerShowroom
);
router.post("/login", AuthController.login);
router.post("/loginshowroom", AuthController.loginShowroom);
router.get("/verify", AuthController.verify);
router.post("/verifyshowroom", AuthController.verifyShowroom);

module.exports = {
  router,
};
