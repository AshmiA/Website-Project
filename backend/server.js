import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from "./routes/userRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import quotationRoutes from "./routes/quotationRoutes.js";
import path from "path";

dotenv.config();
const app = express();

// CORS - allow all origins for debugging
app.use(cors({
  origin: "*", // Allow all for debugging
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// Connect to MongoDB with better logging
console.log("🔗 Attempting MongoDB connection...");
console.log("📝 MONGO_URI exists:", !!process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully!");
    console.log("📊 Database name:", mongoose.connection.db.databaseName);
    
    // Test the database connection
    mongoose.connection.db.admin().ping((err, result) => {
      if (err) {
        console.error("❌ Database ping failed:", err);
      } else {
        console.log("✅ Database ping successful:", result);
      }
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("❌ Full error:", err);
    process.exit(1);
  });

// Routes - ADD THIS LINE
app.use("/api/applications", applicationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes); // ✅ ADD
// app.use("/api/blogs", blogRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/blogs", blogRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/quotations", quotationRoutes);

// Enhanced health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    time: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    dbState: mongoose.connection.readyState,
    dbName: mongoose.connection.db?.databaseName || "Unknown"
  });
});

// Test database query
app.get("/api/test-jobs", async (req, res) => {
  try {
    const Job = mongoose.model("Job");
    const jobs = await Job.find({});
    const activeJobs = await Job.find({ status: "Active" });
    
    res.json({
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      allJobs: jobs,
      activeJobsList: activeJobs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test applications endpoint
app.get("/api/test-applications", async (req, res) => {
  try {
    const Application = mongoose.model("Application");
    const applications = await Application.find({});
    
    res.json({
      totalApplications: applications.length,
      applications: applications
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Jobs & Applications API Server",
    endpoints: {
      health: "/api/health",
      testJobs: "/api/test-jobs",
      testApplications: "/api/test-applications",
      publicJobs: "/api/jobs/public",
      allJobs: "/api/jobs",
      applications: "/api/applications"
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("=".repeat(50));
  console.log("📋 Available endpoints:");
  console.log(`   🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`   🔗 Test jobs: http://localhost:${PORT}/api/test-jobs`);
  console.log(`   🔗 Test applications: http://localhost:${PORT}/api/test-applications`);
  console.log(`   🔗 Public jobs: http://localhost:${PORT}/api/jobs/public`);
  console.log(`   🔗 All jobs: http://localhost:${PORT}/api/jobs`);
  console.log(`   🔗 Applications: http://localhost:${PORT}/api/applications`);
  console.log("=".repeat(50));
});