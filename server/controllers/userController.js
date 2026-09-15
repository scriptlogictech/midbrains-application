const User = require("../models/User");
const bcrypt = require("bcryptjs");

/*
|--------------------------------------------------------------------------
| Allowed Roles
|--------------------------------------------------------------------------
| Only these roles can be created/updated as normal users.
|
| super_admin = Admin
| employee    = Employee
| intern      = Intern
|--------------------------------------------------------------------------
*/

const allowedRoles = ["employee", "intern"];

/*
|--------------------------------------------------------------------------
| Company Access Helper
|--------------------------------------------------------------------------
| Super Admin:
|   Can access any company.
|
| Employee / Intern:
|   Can access only their own company.
|
| IMPORTANT:
| authMiddleware.js populates req.user.company.
| Therefore req.user.company can be either:
|
| 1. ObjectId
| 2. Populated Company object
|--------------------------------------------------------------------------
*/

const hasCompanyAccess = (req, companyId) => {
    // Super Admin can access all companies
    if (req.user.role === "super_admin") {
        return true;
    }

    // Employee / Intern must have a company
    if (!req.user.company || !companyId) {
        return false;
    }

    // If company is populated, use company._id
    const userCompanyId = req.user.company._id
        ? req.user.company._id.toString()
        : req.user.company.toString();

    return userCompanyId === companyId.toString();
};

/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
| Only Super Admin can create Employee / Intern.
|--------------------------------------------------------------------------
*/

const createUser = async (req, res) => {
    try {
        const {
            fullName,
            email,
            password,
            role,
            company,
        } = req.body;

        // Validate required fields
        if (
            !fullName ||
            !email ||
            !password ||
            !role ||
            !company
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name, email, password, role and company are required",
            });
        }

        // Validate role
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role",
            });
        }

        // Normalize email
        const normalizedEmail = email
            .toLowerCase()
            .trim();

        // Check existing user
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Create user
        const user = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role,
            company,
            isActive: true,
        });

        // Remove password from response
        const userResponse = user.toObject();

        delete userResponse.password;

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: userResponse,
        });
    } catch (error) {
        console.error("Create User Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating user",
            error: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get All Users
|--------------------------------------------------------------------------
| Super Admin only through route middleware.
|--------------------------------------------------------------------------
*/

const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .populate(
                "company",
                "companyName companyCode"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        console.error("Get Users Error:", error);

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching users",
            error: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get Users By Company
|--------------------------------------------------------------------------
| Used by Leads page to load Employee and Intern
| assignment options.
|
| Super Admin:
|   Can access any company.
|
| Employee / Intern:
|   Can access only their own company.
|
| Super Admin is excluded from the result.
|--------------------------------------------------------------------------
*/

const getCompanyUsers = async (req, res) => {
    try {
        const { companyId } = req.params;

        // Validate company ID
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "Company ID is required",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Company Isolation
        |--------------------------------------------------------------------------
        | This is the important part.
        |
        | authMiddleware.js populates req.user.company,
        | so hasCompanyAccess() handles the populated object correctly.
        |--------------------------------------------------------------------------
        */

        if (!hasCompanyAccess(req, companyId)) {
            return res.status(403).json({
                success: false,
                message:
                    "Access denied for this company",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Get Employee + Intern
        |--------------------------------------------------------------------------
        */

        const users = await User.find({
            company: companyId,
            role: {
                $in: ["employee", "intern"],
            },
        })
            .select("-password")
            .populate(
                "company",
                "companyName companyCode"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        console.error(
            "Get Company Users Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching company users",
            error: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get Company Employees
|--------------------------------------------------------------------------
| Compatibility endpoint.
|
| The existing frontend/service architecture uses the
| name getCompanyCounselors.
|
| IMPORTANT:
| "counselor" is NOT a role.
|
| This endpoint returns only active employees.
|--------------------------------------------------------------------------
*/

const getCompanyCounselors = async (req, res) => {
    try {
        const { companyId } = req.params;

        // Validate company ID
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "Company ID is required",
            });
        }

        // Enforce company isolation
        if (!hasCompanyAccess(req, companyId)) {
            return res.status(403).json({
                success: false,
                message:
                    "Access denied for this company",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Only Active Employees
        |--------------------------------------------------------------------------
        */

        const users = await User.find({
            company: companyId,
            role: "employee",
            isActive: true,
        })
            .select("-password")
            .populate(
                "company",
                "companyName companyCode"
            )
            .sort({ fullName: 1 });

        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        console.error(
            "Get Company Employees Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching company employees",
            error: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| Update User
|--------------------------------------------------------------------------
| Super Admin only through route middleware.
|
| Can update:
| - Employee
| - Intern
|
| Super Admin itself cannot be modified.
|--------------------------------------------------------------------------
*/

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            fullName,
            email,
            password,
            role,
            company,
            isActive,
        } = req.body;

        // Find user
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Super Admin cannot be modified
        if (user.role === "super_admin") {
            return res.status(403).json({
                success: false,
                message:
                    "Super Admin cannot be modified",
            });
        }

        // Validate role if provided
        if (
            role &&
            !allowedRoles.includes(role)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid role",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Email
        |--------------------------------------------------------------------------
        */

        if (email) {
            const normalizedEmail = email
                .toLowerCase()
                .trim();

            const existingUser =
                await User.findOne({
                    email: normalizedEmail,
                    _id: { $ne: id },
                });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Another user with this email already exists",
                });
            }

            user.email = normalizedEmail;
        }

        /*
        |--------------------------------------------------------------------------
        | Basic Fields
        |--------------------------------------------------------------------------
        */

        if (fullName) {
            user.fullName = fullName.trim();
        }

        /*
        |--------------------------------------------------------------------------
        | Role
        |--------------------------------------------------------------------------
        */

        if (role) {
            user.role = role;
        }

        /*
        |--------------------------------------------------------------------------
        | Company
        |--------------------------------------------------------------------------
        */

        if (company) {
            user.company = company;
        }

        /*
        |--------------------------------------------------------------------------
        | Active Status
        |--------------------------------------------------------------------------
        */

        if (typeof isActive === "boolean") {
            user.isActive = isActive;
        }

        /*
        |--------------------------------------------------------------------------
        | Password
        |--------------------------------------------------------------------------
        */

        if (password) {
            user.password =
                await bcrypt.hash(password, 10);
        }

        // Save changes
        const updatedUser = await user.save();

        // Remove password from response
        const userResponse =
            updatedUser.toObject();

        delete userResponse.password;

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: userResponse,
        });
    } catch (error) {
        console.error("Update User Error:", error);

        return res.status(500).json({
            success: false,
            message:
                "Server error while updating user",
            error: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| Update User Status
|--------------------------------------------------------------------------
| Super Admin only through route middleware.
|
| Used to activate/deactivate Employee / Intern.
|--------------------------------------------------------------------------
*/

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        // Find user
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Protect Super Admin
        if (user.role === "super_admin") {
            return res.status(403).json({
                success: false,
                message:
                    "Super Admin status cannot be changed",
            });
        }

        // Validate status
        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message:
                    "isActive must be true or false",
            });
        }

        // Update status
        user.isActive = isActive;

        await user.save();

        // Remove password
        const userResponse = user.toObject();

        delete userResponse.password;

        return res.status(200).json({
            success: true,
            message: `User ${
                isActive
                    ? "activated"
                    : "deactivated"
            } successfully`,
            user: userResponse,
        });
    } catch (error) {
        console.error(
            "Update User Status Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while updating user status",
            error: error.message,
        });
    }
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
    createUser,
    getUsers,
    getCompanyUsers,
    getCompanyCounselors,
    updateUser,
    updateUserStatus,
};