const User = require("../models/User");
const bcrypt = require("bcryptjs");

const allowedRoles = [
  "counselor",
  "hr",
  "trainer",
  "placement_coordinator",
  "project_manager",
  "employee",
  "intern"
];

// ========================================
// CREATE USER
// ========================================

exports.createUser = async (req, res) => {
  try {
    let {
      fullName,
      email,
      password,
      role,
      company,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !password ||
      !role ||
      !company
    ) {
      return res.status(400).json({
        message:
          "Full name, email, password, role and company are required",
      });
    }

    email = email.toLowerCase().trim();

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      company,
    });

    const safeUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      company: user.company,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET ALL USERS
// ========================================

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("company", "companyName companyCode")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET USERS BY COMPANY
// ========================================

exports.getCompanyUsers = async (req, res) => {
  try {
    const { companyId } = req.params;

    const users = await User.find({
      company: companyId,
      role: {
        $in: allowedRoles,
      },
    })
      .select("-password")
      .populate("company", "companyName companyCode")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET COUNSELORS BY COMPANY
// ========================================

exports.getCompanyCounselors = async (
  req,
  res
) => {
  try {
    const { companyId } = req.params;

    const counselors = await User.find({
      company: companyId,
      role: "counselor",
      isActive: true,
    })
      .select("_id fullName email company")
      .sort({ fullName: 1 });

    res.status(200).json({
      success: true,
      count: counselors.length,
      counselors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// UPDATE USER
// ========================================

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      fullName,
      email,
      password,
      role,
      company,
    } = req.body

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "super_admin") {
      return res.status(403).json({
        message:
          "Super Admin cannot be modified from User Management",
      });
    }

    if (email) {
      const normalizedEmail =
        email.toLowerCase().trim();

      const emailExists = await User.findOne({
        email: normalizedEmail,
        _id: {
          $ne: id,
        },
      });

      if (emailExists) {
        return res.status(400).json({
          message: "Email already in use",
        });
      }

      user.email = normalizedEmail;
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (role) {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
        });
      }

      user.role = role;
    }

    if (company) {
      user.company = company;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Password must be at least 6 characters",
        });
      }

      user.password = await bcrypt.hash(
        password,
        10
      );
    }

    await user.save();

    const safeUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      company: user.company,
      isActive: user.isActive,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// UPDATE USER STATUS
// ========================================

exports.updateUserStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "super_admin") {
      return res.status(403).json({
        message:
          "Super Admin status cannot be changed",
      });
    }

    user.isActive = Boolean(isActive);

    await user.save();

    res.status(200).json({
      success: true,
      message: user.isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        company: user.company,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};