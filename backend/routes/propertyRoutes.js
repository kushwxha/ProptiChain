/**
 * routes/propertyRoutes.js
 */
const express = require("express");
const router = express.Router();
const {
  registerProperty,
  listPropertyForSale,
  purchaseProperty,
  getProperty,
  getAllProperties,
} = require("../controllers/propertyController");

router.post("/register", registerProperty);
router.post("/list", listPropertyForSale);
router.post("/buy", purchaseProperty);
router.get("/all", getAllProperties);
router.get("/:id", getProperty);

module.exports = router;
