/**
 * routes/aiRoutes.js
 */
const express = require("express");
const router = express.Router();
const { evaluate } = require("../controllers/aiController");

router.post("/evaluate", evaluate);

module.exports = router;
