const { sendSuccess } = require("../../utils/response");
const { query } = require("../../config/db");
const { asyncHandler, ApiError } = require("../../middleware/errorHandler");
const { logger } = require("../../config/db");

/**
 * Notifications Controller
 * Handles all notification-related HTTP requests
 */

/**
 * Create a notification for students (Internal - called by other controllers)
 * POST /api/notifications/create-internal
 */
const createNotification = asyncHandler(async (req, res) => {
  const { studentIds, title, message, notification_type, related_id } =
    req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new ApiError(400, "Student IDs must be a non-empty array");
  }

  if (!title || !message || !notification_type) {
    throw new ApiError(
      400,
      "Title, message, and notification_type are required",
    );
  }

  const notifications = [];

  for (const studentId of studentIds) {
    const sql = `
      INSERT INTO notifications (student_id, title, message, notification_type, related_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      studentId,
      title,
      message,
      notification_type,
      related_id || null,
    ];
    const result = await query(sql, values);

    if (result.rows && result.rows.length > 0) {
      notifications.push(result.rows[0]);
    }
  }

  logger.info("Notifications created", {
    count: notifications.length,
    type: notification_type,
  });

  sendSuccess(res, 201, "Notifications created successfully", {
    notifications,
  });
});

/**
 * Get all notifications for the current user
 * GET /api/notifications
 * Protected route - student only
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { unread_only = false, page = 1, limit = 20 } = req.query;
  const userId = req.user.id;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    throw new ApiError(400, "Invalid page number");
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new ApiError(400, "Invalid limit. Must be between 1 and 100");
  }

  const offset = (pageNum - 1) * limitNum;

  let sql = "SELECT * FROM notifications WHERE student_id = $1";
  let countSql = "SELECT COUNT(*) FROM notifications WHERE student_id = $1";
  const values = [userId];

  if (unread_only === "true" || unread_only === true) {
    sql += " AND is_read = false";
    countSql += " AND is_read = false";
  }

  sql += " ORDER BY created_at DESC LIMIT $2 OFFSET $3";
  values.push(limitNum, offset);

  const [notificationsResult, countResult] = await Promise.all([
    query(sql, values),
    query(countSql, [userId]),
  ]);

  const total = parseInt(countResult.rows[0].count);
  const notifications = notificationsResult.rows;

  sendSuccess(res, 200, "Notifications retrieved successfully", {
    notifications,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get notification count (unread)
 * GET /api/notifications/count
 * Protected route - student only
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const sql =
    "SELECT COUNT(*) as unread_count FROM notifications WHERE student_id = $1 AND is_read = false";

  const result = await query(sql, [userId]);

  sendSuccess(res, 200, "Unread count retrieved successfully", {
    unread_count: parseInt(result.rows[0].unread_count),
  });
});

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 * Protected route - student only
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Verify ownership
  const verifySQL =
    "SELECT * FROM notifications WHERE id = $1 AND student_id = $2";
  const verifyResult = await query(verifySQL, [id, userId]);

  if (!verifyResult.rows || verifyResult.rows.length === 0) {
    throw new ApiError(404, "Notification not found or unauthorized");
  }

  const sql = `
    UPDATE notifications
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;

  const result = await query(sql, [id]);

  sendSuccess(res, 200, "Notification marked as read", {
    notification: result.rows[0],
  });
});

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 * Protected route - student only
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const sql = `
    UPDATE notifications
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE student_id = $1 AND is_read = false
    RETURNING *
  `;

  const result = await query(sql, [userId]);

  sendSuccess(res, 200, "All notifications marked as read", {
    updated_count: result.rows.length,
  });
});

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 * Protected route - student only
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const sql = `
    DELETE FROM notifications
    WHERE id = $1 AND student_id = $2
    RETURNING *
  `;

  const result = await query(sql, [id, userId]);

  if (!result.rows || result.rows.length === 0) {
    throw new ApiError(404, "Notification not found or unauthorized");
  }

  logger.info("Notification deleted", { notificationId: id });

  sendSuccess(res, 200, "Notification deleted successfully");
});

/**
 * Clear all notifications
 * DELETE /api/notifications/clear-all
 * Protected route - student only
 */
const clearAll = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const sql = "DELETE FROM notifications WHERE student_id = $1";

  const result = await query(sql, [userId]);

  logger.info("All notifications cleared", { userId });

  sendSuccess(res, 200, "All notifications cleared", {
    deleted_count: result.rowCount,
  });
});

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
};
