const express = require("express");
const dotenv = require("dotenv");
const { generalLimiter, authLimiter } = require("./middleware/rateLimiter");

dotenv.config({ quiet: true });

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Request logger
app.use((req, res, next) => {
  // console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
  // Authentication routes
  const authRoutes = require("./modules/auth/auth.routes");
  app.use("/api/auth", authLimiter, authRoutes);
  // User management routes (admin only)
  const usersRoutes = require("./modules/users/users.routes");
  app.use("/api/users", usersRoutes);

  // Financial records routes
  const recordsRoutes = require("./modules/records/records.routes");
  app.use("/api/records", recordsRoutes);

  // Dashboard routes
  const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
  app.use("/api/dashboard", dashboardRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Finance Dashboard API is running",
    version: "1.0.0",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
