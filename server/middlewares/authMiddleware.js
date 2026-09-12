const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
    try {
        let token;

        // Get token from Authorization header
        if (req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                message: "Not Authorized",
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Get current user
        const user = await User.findById(decoded.id)
            .select("-password")
            .populate("company", "companyName companyCode");

        // User does not exist
        if (!user) {
            return res.status(401).json({
                message: "User no longer exists",
            });
        }

        // User account is inactive
        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account has been deactivated",
            });
        }

        // Attach user to request
        req.user = user;

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);

        return res.status(401).json({
            message: "Token Failed",
        });
    }
};