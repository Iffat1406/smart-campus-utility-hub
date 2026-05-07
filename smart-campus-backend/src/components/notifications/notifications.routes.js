const express = require("express");
const router = express.Router();
const notificationsController = require("./notifications.controller");
const { verifyToken } = require("../../middleware/auth.middleware");
const { validate, validationSchemas } = require("../../middleware/validation");

/**
 * Notifications Routes
 * Base path: /api/notifications
 */

// Protected routes (requires authentication)
router.get("/", verifyToken, notificationsController.getNotifications);
router.get("/count", verifyToken, notificationsController.getUnreadCount);
router.patch("/:id/read", verifyToken, notificationsController.markAsRead);
router.patch("/read-all", verifyToken, notificationsController.markAllAsRead);
router.delete("/:id", verifyToken, notificationsController.deleteNotification);
router.delete("/clear-all", verifyToken, notificationsController.clearAll);

// Internal routes (should be protected with internal API key in production)
// These are called by other controllers when creating events, updating timetables, etc.
router.post("/create-internal", notificationsController.createNotification);

module.exports = router;
