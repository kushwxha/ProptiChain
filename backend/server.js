/**
 * server.js
 * ProptiChain Integration Middleware
 * Orchestrates communication between the React frontend, AI service, and blockchain.
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const propertyRoutes = require("./routes/propertyRoutes");
const aiRoutes = require("./routes/aiRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Routes ──
app.use("/property", propertyRoutes);
app.use("/ai", aiRoutes);
app.use("/user", userRoutes);

// ── Health check ──
app.get("/", (_req, res) => {
  res.json({ message: "ProptiChain Middleware API is running." });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`ProptiChain Middleware running on http://localhost:${PORT}`);
});
