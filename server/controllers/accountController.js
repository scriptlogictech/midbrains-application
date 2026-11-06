const User = require("../models/User");

// ==========================================
// GET MY PROFILE
// GET /api/account/profile
// ==========================================

exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password")
            .populate("company", "companyName companyCode");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {
        console.error("Get Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch profile",
        });
    }
};

// ==========================================
// UPDATE MY PROFILE
// PUT /api/account/profile
// ==========================================

exports.updateMyProfile = async (req, res) => {
    try {
        const { fullName, phone, address, dateOfBirth } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Validate full name
        if (
            fullName !== undefined &&
            (typeof fullName !== "string" || !fullName.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid full name",
            });
        }

        // Validate phone
        if (
            phone !== undefined &&
            (typeof phone !== "string" || phone.length > 15)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid phone number",
            });
        }

        // Validate address
        if (
            address !== undefined &&
            (typeof address !== "string" || address.length > 500)
        ) {
            return res.status(400).json({
                success: false,
                message: "Address must be a valid text of at most 500 characters",
            });
        }

        // Validate date of birth
        if (dateOfBirth !== undefined && dateOfBirth !== null && dateOfBirth !== "") {
            const parsedDate = new Date(dateOfBirth);

            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date of birth",
                });
            }

            if (parsedDate > new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "Date of birth cannot be in the future",
                });
            }

            user.dateOfBirth = parsedDate;
        } else if (dateOfBirth === null || dateOfBirth === "") {
            user.dateOfBirth = null;
        }

        // Update only permitted personal fields
        if (fullName !== undefined) {
            user.fullName = fullName.trim();
        }

        if (phone !== undefined) {
            user.phone = phone.trim();
        }

        if (address !== undefined) {
            user.address = address.trim();
        }

        await user.save();

        const updatedUser = await User.findById(user._id)
            .select("-password")
            .populate("company", "companyName companyCode");

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });

    } catch (error) {
        console.error("Update Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update profile",
        });
    }
};