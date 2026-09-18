const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check authorization header
        if (req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        // Check token
        if (!token) {
            return res.status(401).json({
                message: "Not Authorized",
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find logged-in user and populate company
        const user = await User.findById(decoded.id)
            .select("-password")
            .populate("company", "companyName companyCode");

        // Check user exists
        if (!user) {
            return res.status(401).json({
                message: "User no longer exists",
            });
        }

        // Check user active status
        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account has been deactivated",
            });
        }

        // Debug logged-in user company details
        console.log("========== AUTH USER DETAILS ==========");
        console.log("User ID:", user._id);
        console.log("User Email:", user.email);
        console.log("User Role:", user.role);
        console.log("User Company:", user.company);

        if (user.company) {
            console.log("Company ID:", user.company._id);
            console.log("Company Name:", user.company.companyName);
            console.log("Company Code:", user.company.companyCode);
        } else {
            console.log("Company is missing for this user");
        }

        console.log("=======================================");

        // Attach user to request
        req.user = user;

        next();
    } catch (error) {
        console.error(
            "Auth Middleware Error:",
            error.message
        );

        return res.status(401).json({
            message: "Token Failed",
        });
    }
};

// Authorize user roles
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Not Authorized",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission",
            });
        }

        next();
    };
};