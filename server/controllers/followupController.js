const Lead = require("../models/Lead");

// 📅 TODAY FOLLOW-UPS
exports.getTodayFollowUps = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const leads = await Lead.find({
      nextFollowUpDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate("company", "companyName");

    res.json(leads);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getMissedFollowUps = async (req, res) => {
  try {
    const today = new Date();

    const leads = await Lead.find({
      nextFollowUpDate: { $lt: today },
      status: { $ne: "converted" }
    }).populate("company", "companyName");

    res.json(leads);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getUpcomingFollowUps = async (req, res) => {
  try {
    const today = new Date();

    const leads = await Lead.find({
      nextFollowUpDate: { $gt: today }
    }).populate("company", "companyName");

    res.json(leads);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};