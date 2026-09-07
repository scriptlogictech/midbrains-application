const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Company = require("../models/Company");

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const seedCompanies = async () => {
  try {
    await Company.deleteMany();

    await Company.insertMany([
      {
        companyName: "Midbrains Technologies",
        companyCode: "MBT",
        description: "Training & IT Services"
      },
      {
        companyName: "Midbrain Software Institute",
        companyCode: "MSI",
        description: "Software Training Institute"
      },
      {
        companyName: "Millionis Tech",
        companyCode: "MT",
        description: "Training & Placement Company"
      }
    ]);

    console.log("Companies Inserted Successfully");
    process.exit();

  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

seedCompanies();