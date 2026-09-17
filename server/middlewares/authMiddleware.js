const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                message: "Not Authorized",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id)
            .select("-password")
            .populate("company", "companyName companyCode");

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account has been deactivated",
            });
        }

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