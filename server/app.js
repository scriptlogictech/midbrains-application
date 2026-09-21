
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const app = express();

// ==================== Routes ====================

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
const instagramReelDataRoutes = require("./routes/instagramReelDataRoutes");
const userRoutes = require("./routes/userRoutes");
const workTaskRoutes = require("./routes/workTaskRoutes");
const workLogRoutes = require("./routes/workLogRoutes");

// ==================== CORS Configuration ====================

const allowedOrigins = [
  "https://midbrains-application.vercel.app",
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin, such as Postman
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      return callback(null, false);
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ==================== Middleware ====================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// ==================== API Routes ====================

app.use("/api/auth", authRoutes);

app.use("/api/companies", companyRoutes);

app.use("/api/leads", leadRoutes);

app.use("/api/followups", followupRoutes);

app.use("/api/admissions", admissionRoutes);

app.use("/api/internships", internshipRoutes);

app.use(
  "/api/corporate-trainings",
  corporateTrainingRoutes
);

app.use("/api/projects", projectRoutes);

app.use("/api/placements", placementRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/users", userRoutes);

app.use("/api/work-tasks", workTaskRoutes);

app.use("/api/work-logs", workLogRoutes);

app.use(
  "/api/instagram-reel-data",
  instagramReelDataRoutes
);

// ==================== Root Route ====================

app.get("/", (req, res) => {
  res.status(200).send(
    "CRM Backend Running Successfully"
  );
});

// ==================== Error Handler ====================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;