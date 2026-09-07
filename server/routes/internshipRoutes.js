const express = require("express");

const router = express.Router();

const {
    createInternship,
    getInternships,
    getCompanyInternships,
    updateInternshipStatus,
} = require("../controllers/internshipController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

router.post(
    "/",
    protect,
    authorizeRoles("super_admin", "trainer"),
    createInternship
);

router.get(
    "/",
    protect,
    authorizeRoles("super_admin", "trainer"),
    getInternships
);

router.get(
    "/company/:companyId",
    protect,
    authorizeRoles("super_admin", "trainer"),
    getCompanyInternships
);

router.put(
    "/:id/status",
    protect,
    authorizeRoles("super_admin", "trainer"),
    updateInternshipStatus
);

module.exports = router;