/**
 * propertyRoutes.js
 * Express routes for property operations.
 */
const express = require("express");
const router = express.Router();
const {
  registerProperty,
  listPropertyForSale,
  purchaseProperty,
  getProperty,
} = require("../controllers/propertyController");

router.post("/register", registerProperty);
router.post("/list", listPropertyForSale);
router.post("/buy", purchaseProperty);
router.get("/:id", getProperty);

module.exports = router;
