const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Company = require("../models/Company");
const path = require("path");

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

console.log("MONGO_URI loaded:", !!process.env.MONGO_URI);

const seedCompanies = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Atlas Connected");

    await Company.deleteMany();

    await Company.insertMany([
      {
        companyName: "Midbrains Technologies",
        companyCode: "MBT",
        description: "Training & IT Services",
      },
      {
        companyName: "Midbrain Software Institute",
        companyCode: "MSI",
        description: "Software Training Institute",
      },
      {
        companyName: "Millionis Tech",
        companyCode: "MT",
        description: "Training & Placement Company",
      },
    ]);

    console.log("Companies Inserted Successfully");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeder Error:", error.message);
    process.exit(1);
  }
};

seedCompanies();