/**
 * server.js
 * Express API server for ProptiChain blockchain interaction.
 */
const express = require("express");
const cors = require("cors");
const propertyRoutes = require("./routes/propertyRoutes");
const aiRoutes = require("./routes/aiRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/property", propertyRoutes);
app.use("/ai", aiRoutes);
app.use("/user", userRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "ProptiChain Blockchain API is running." });
});

app.listen(PORT, () => {
  console.log(`ProptiChain API listening on http://localhost:${PORT}`);
});
