/**
 * userRoutes.js
 * Express routes for user/role management.
 */
const express = require("express");
const router = express.Router();
const { registerUser, getRole } = require("../controllers/userController");

router.post("/register", registerUser);
router.get("/role/:address", getRole);

module.exports = router;
