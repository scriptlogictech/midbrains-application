const Company = require("../models/Company");
const Lead = require("../models/Lead");

// 🔹 GET ALL COMPANIES
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find();

    res.json(companies);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📊 GET COMPANY DASHBOARD STATS
exports.getCompanyStats = async (req, res) => {
  try {
    const { companyId } = req.params;

    // 🔍 Check company exists
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    // 📊 Total Leads
    const totalLeads = await Lead.countDocuments({
      company: companyId
    });

    // 📊 Pending Follow-ups
    const pendingFollowUps = await Lead.countDocuments({
      company: companyId,
      status: "follow_up"
    });

    // 📊 Converted Leads
    const convertedLeads = await Lead.countDocuments({
      company: companyId,
      status: "converted"
    });

    // 💰 Revenue (temporary logic)
    const revenue = convertedLeads * 10000;

    res.json({
      companyId: company._id,
      companyName: company.companyName,
      totalLeads,
      pendingFollowUps,
      convertedLeads,
      revenue
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};