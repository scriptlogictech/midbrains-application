const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");

const {
    getMyProfile,
    updateMyProfile,
} = require("../controllers/accountController");

router.get(
    "/profile",
    protect,
    getMyProfile
);

router.put(
    "/profile",
    protect,
    updateMyProfile
);

module.exports = router;