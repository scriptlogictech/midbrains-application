
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check Authorization header
        if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not Authorized",
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find user and populate company
        const user = await User.findById(decoded.id)
            .select("-password")
            .populate("company", "companyName companyCode");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User no longer exists",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated",
            });
        }

        // Attach authenticated user
        req.user = user;

        // Debug information
        console.log("========== AUTH USER DETAILS ==========");
        console.log("User ID:", user._id);
        console.log("User Email:", user.email);
        console.log("User Role:", user.role);
        console.log("User Company:", user.company);

        if (user.company) {
            console.log("Company ID:", user.company._id);
            console.log("Company Name:", user.company.companyName);
            console.log("Company Code:", user.company.companyCode);
        } else if (user.role === "super_admin") {
            console.log("Super Admin: no personal company required");
        } else {
            console.log("Company is missing for this user");
        }

        console.log("=======================================");

        // Super Admin does not require a personal company
        if (user.role === "super_admin") {
            return next();
        }

        // Other users must belong to a company
        if (!user.company) {
            return res.status(403).json({
                success: false,
                message: "Your account is not assigned to a company",
            });
        }

        return next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Token Failed",
        });
    }
};

// Authorize user roles
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not Authorized",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission",
            });
        }

        return next();
    };
};