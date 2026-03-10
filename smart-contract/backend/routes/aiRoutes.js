/**
 * aiRoutes.js
 * Express routes for AI valuation and risk hash submission.
 */
const express = require("express");
const router = express.Router();
const { submitValuation, submitRisk } = require("../controllers/aiController");

router.post("/valuation", submitValuation);
router.post("/risk", submitRisk);

module.exports = router;
