const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const app = express();

// Routes
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const leadRoutes = require("./routes/leadRoutes");
const followupRoutes = require("./routes/followupRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const internshipRoutes = require("./routes/internshipRoutes");
const corporateTrainingRoutes = require("./routes/corporateTrainingRoutes");
const projectRoutes = require("./routes/projectRoutes");
const placementRoutes = require("./routes/placementRoutes");
const reportRoutes = require("./routes/reportRoutes");
// const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// API Routes
app.use("/api/auth", authRoutes);

app.use("/api/companies", companyRoutes);

app.use("/api/leads", leadRoutes);

app.use("/api/followups", followupRoutes);

app.use("/api/admissions", admissionRoutes);

app.use("/api/internships", internshipRoutes);

app.use("/api/corporate-trainings", corporateTrainingRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/placements", placementRoutes);

app.use("/api/reports", reportRoutes);

// app.use("/api/upload", uploadRoutes);

app.use("/api/users", userRoutes);

// Uploaded Files
// app.use("/uploads", express.static("uploads"));

// Root Route
app.get("/", (req, res) => {
  res.send("CRM Backend Running Successfully");
});

module.exports = app;