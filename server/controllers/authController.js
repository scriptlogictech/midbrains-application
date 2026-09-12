const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// ============================================================
// REGISTER SUPER ADMIN
// ONLY ONE SUPER ADMIN IS ALLOWED
// ============================================================
exports.registerAdmin = async (req, res) => {
    try {
        let { fullName, email, password } = req.body;

        // Basic validation
        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        fullName = fullName.trim();
        email = email.trim().toLowerCase();

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        // Check if Super Admin already exists
        const existingAdmin = await User.findOne({
            role: "super_admin",
        });

        if (existingAdmin) {
            return res.status(403).json({
                message:
                    "Super Admin already exists. You cannot create another admin.",
            });
        }

        // Check email uniqueness
        const emailExists = await User.findOne({
            email,
        });

        if (emailExists) {
            return res.status(400).json({
                message: "Email already in use",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Super Admin
        const admin = await User.create({
            fullName,
            email,
            password: hashedPassword,
            role: "super_admin",
            isActive: true,
        });

        // Safe response
        const safeAdmin = {
            _id: admin._id,
            fullName: admin.fullName,
            email: admin.email,
            role: admin.role,
            company: admin.company || null,
            isActive: admin.isActive,
        };

        return res.status(201).json({
            success: true,
            message: "Super Admin created successfully",
            admin: safeAdmin,
        });
    } catch (error) {
        console.error("Register Admin Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating Super Admin",
            error: error.message,
        });
    }
};

// ============================================================
// LOGIN
// ============================================================
exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and Password are required",
            });
        }

        // Normalize email
        email = email.trim().toLowerCase();

        // Find user
        const user = await User.findOne({
            email,
        }).populate("company", "companyName companyCode");

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        // Check active status
        if (!user.isActive) {
            return res.status(403).json({
                message: "Account is deactivated",
            });
        }

        // Validate role
        const allowedRoles = [
            "super_admin",
            "employee",
            "intern",
        ];

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({
                message: "Invalid user role",
            });
        }

        // Generate token
        const token = generateToken(user);

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Safe user response
        const safeUser = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            company: user.company || null,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
        };

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: safeUser,
        });
    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login",
            error: error.message,
        });
    }
};