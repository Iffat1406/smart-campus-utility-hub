const express = require("express");
const router = express.Router();
const academicProgressController = require("./academicProgress.controller");
const {
  verifyToken,
  verifyAdmin,
} = require("../../middleware/auth.middleware");

/**
 * Academic Progress Routes
 * Base path: /api/academic-progress
 */

// Protected routes (student - can view their own)
router.get("/", verifyToken, academicProgressController.getProgress);
router.get(
  "/gpa-history",
  verifyToken,
  academicProgressController.getGpaTrends,
);
router.get(
  "/complete",
  verifyToken,
  academicProgressController.getCompleteProgress,
);

// Student can record their own GPA (if granted permission)
router.post(
  "/record-gpa",
  verifyToken,
  academicProgressController.recordGpaHistory,
);

// Admin only routes
router.post(
  "/update-gpa",
  verifyToken,
  verifyAdmin,
  academicProgressController.updateGPA,
);
router.post(
  "/update-progress",
  verifyToken,
  verifyAdmin,
  academicProgressController.updateProgress,
);
router.get(
  "/admin/all",
  verifyToken,
  verifyAdmin,
  academicProgressController.getAllStudentProgress,
);

module.exports = router;
