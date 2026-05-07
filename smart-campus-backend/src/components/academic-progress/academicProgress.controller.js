const { sendSuccess } = require("../../utils/response");
const { query } = require("../../config/db");
const { asyncHandler, ApiError } = require("../../middleware/errorHandler");
const { logger } = require("../../config/db");

/**
 * Academic Progress Controller
 * Handles all academic progress tracking related HTTP requests
 */

/**
 * Get student's academic progress
 * GET /api/academic-progress
 * Protected route - student can only view their own, admin can view all
 */
const getProgress = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT * FROM student_academic_progress
    WHERE student_id = $1
  `;

  const result = await query(sql, [userId]);

  if (result.rows.length === 0) {
    throw new ApiError(404, "Academic progress not found");
  }

  sendSuccess(res, 200, "Academic progress retrieved successfully", {
    progress: result.rows[0],
  });
});

/**
 * Get student's GPA history/trends
 * GET /api/academic-progress/gpa-history
 * Protected route
 */
const getGpaTrends = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 10 } = req.query;

  const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);

  const sql = `
    SELECT * FROM student_gpa_history
    WHERE student_id = $1
    ORDER BY semester ASC
    LIMIT $2
  `;

  const result = await query(sql, [userId, limitNum]);

  sendSuccess(res, 200, "GPA trends retrieved successfully", {
    trends: result.rows,
  });
});

/**
 * Get complete academic progress with trends
 * GET /api/academic-progress/complete
 * Protected route
 */
const getCompleteProgress = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const progressSql = `
    SELECT * FROM student_academic_progress
    WHERE student_id = $1
  `;

  const trendsSql = `
    SELECT * FROM student_gpa_history
    WHERE student_id = $1
    ORDER BY semester ASC
  `;

  const [progressResult, trendsResult] = await Promise.all([
    query(progressSql, [userId]),
    query(trendsSql, [userId]),
  ]);

  if (progressResult.rows.length === 0) {
    throw new ApiError(404, "Academic progress not found");
  }

  sendSuccess(res, 200, "Complete academic progress retrieved successfully", {
    progress: progressResult.rows[0],
    gpaTrends: trendsResult.rows,
  });
});

/**
 * Update student's GPA
 * POST /api/academic-progress/update-gpa
 * Admin only or internal
 */
const updateGPA = asyncHandler(async (req, res) => {
  const { student_id, current_gpa, semester_gpa, current_semester } = req.body;

  // Validate input
  if (!student_id || current_gpa === undefined || semester_gpa === undefined) {
    throw new ApiError(
      400,
      "student_id, current_gpa, and semester_gpa are required",
    );
  }

  // Check if GPA values are valid
  if (current_gpa < 0 || current_gpa > 10) {
    throw new ApiError(400, "current_gpa must be between 0 and 10");
  }
  if (semester_gpa < 0 || semester_gpa > 10) {
    throw new ApiError(400, "semester_gpa must be between 0 and 10");
  }

  // Check if student exists
  const studentCheckSql = "SELECT id FROM users WHERE id = $1";
  const studentCheckResult = await query(studentCheckSql, [student_id]);

  if (studentCheckResult.rows.length === 0) {
    throw new ApiError(404, "Student not found");
  }

  // Check if progress record exists
  const progressCheckSql =
    "SELECT id FROM student_academic_progress WHERE student_id = $1";
  const progressCheckResult = await query(progressCheckSql, [student_id]);

  let progressResult;

  if (progressCheckResult.rows.length === 0) {
    // Create new progress record
    const insertSql = `
      INSERT INTO student_academic_progress (
        student_id, current_gpa, semester_gpa, current_semester
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    progressResult = await query(insertSql, [
      student_id,
      current_gpa,
      semester_gpa,
      current_semester || 1,
    ]);
  } else {
    // Update existing progress record
    const updateSql = `
      UPDATE student_academic_progress
      SET current_gpa = $2, semester_gpa = $3, current_semester = $4, updated_at = CURRENT_TIMESTAMP
      WHERE student_id = $1
      RETURNING *
    `;

    progressResult = await query(updateSql, [
      student_id,
      current_gpa,
      semester_gpa,
      current_semester || 1,
    ]);
  }

  logger.info("Student GPA updated", {
    studentId: student_id,
    newGPA: current_gpa,
  });

  sendSuccess(res, 200, "Academic progress updated successfully", {
    progress: progressResult.rows[0],
  });
});

/**
 * Update student's progress metrics (credits, courses)
 * POST /api/academic-progress/update-progress
 * Admin only or internal
 */
const updateProgress = asyncHandler(async (req, res) => {
  const { student_id, total_credits, credits_earned, courses_completed } =
    req.body;
  const userId = req.user.id;

  // If no student_id provided, update the current user
  const targetStudentId = student_id || userId;

  if (!total_credits || !credits_earned || courses_completed === undefined) {
    throw new ApiError(
      400,
      "total_credits, credits_earned, and courses_completed are required",
    );
  }

  // Check if student exists
  const studentCheckSql = "SELECT id FROM users WHERE id = $1";
  const studentCheckResult = await query(studentCheckSql, [targetStudentId]);

  if (studentCheckResult.rows.length === 0) {
    throw new ApiError(404, "Student not found");
  }

  // Update progress record
  const updateSql = `
    UPDATE student_academic_progress
    SET total_credits = $2, credits_earned = $3, courses_completed = $4, updated_at = CURRENT_TIMESTAMP
    WHERE student_id = $1
    RETURNING *
  `;

  const result = await query(updateSql, [
    targetStudentId,
    total_credits,
    credits_earned,
    courses_completed,
  ]);

  if (result.rows.length === 0) {
    throw new ApiError(
      404,
      "Progress record not found. Please create one first.",
    );
  }

  logger.info("Student progress metrics updated", {
    studentId: targetStudentId,
    creditsEarned: credits_earned,
  });

  sendSuccess(res, 200, "Progress metrics updated successfully", {
    progress: result.rows[0],
  });
});

/**
 * Record GPA history entry
 * POST /api/academic-progress/record-gpa
 * Admin only or internal
 */
const recordGpaHistory = asyncHandler(async (req, res) => {
  const { student_id, semester, gpa, academic_year } = req.body;
  const userId = req.user.id;

  // If no student_id provided, record for the current user
  const targetStudentId = student_id || userId;

  if (!semester || gpa === undefined) {
    throw new ApiError(400, "semester and gpa are required");
  }

  // Validate GPA
  if (gpa < 0 || gpa > 10) {
    throw new ApiError(400, "gpa must be between 0 and 10");
  }

  // Check if student exists
  const studentCheckSql = "SELECT id FROM users WHERE id = $1";
  const studentCheckResult = await query(studentCheckSql, [targetStudentId]);

  if (studentCheckResult.rows.length === 0) {
    throw new ApiError(404, "Student not found");
  }

  const sql = `
    INSERT INTO student_gpa_history (student_id, semester, gpa, academic_year)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (student_id, semester, academic_year) DO UPDATE
    SET gpa = EXCLUDED.gpa, recorded_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const values = [
    targetStudentId,
    semester,
    gpa,
    academic_year || new Date().getFullYear().toString(),
  ];
  const result = await query(sql, values);

  logger.info("GPA history recorded", {
    studentId: targetStudentId,
    semester: semester,
    gpa: gpa,
  });

  sendSuccess(res, 201, "GPA history recorded successfully", {
    entry: result.rows[0],
  });
});

/**
 * Get academic progress for all students (Admin only)
 * GET /api/academic-progress/admin/all
 */
const getAllStudentProgress = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, department, semester } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    throw new ApiError(400, "Invalid page number");
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new ApiError(400, "Invalid limit. Must be between 1 and 100");
  }

  const offset = (pageNum - 1) * limitNum;

  let sql = `
    SELECT sap.*, u.full_name, u.email, u.department
    FROM student_academic_progress sap
    JOIN users u ON sap.student_id = u.id
    WHERE u.role = 'student'
  `;

  const values = [];
  let paramCounter = 1;

  if (department) {
    sql += ` AND u.department = $${paramCounter}`;
    values.push(department);
    paramCounter++;
  }

  if (semester) {
    sql += ` AND sap.current_semester = $${paramCounter}`;
    values.push(parseInt(semester));
    paramCounter++;
  }

  sql += ` ORDER BY sap.current_gpa DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
  values.push(limitNum, offset);

  const [resultData, countResult] = await Promise.all([
    query(sql, values),
    query(
      `SELECT COUNT(*) FROM student_academic_progress sap JOIN users u ON sap.student_id = u.id WHERE u.role = 'student'`,
    ),
  ]);

  const total = parseInt(countResult.rows[0].count);

  sendSuccess(res, 200, "Student progress retrieved successfully", {
    data: resultData.rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
});

module.exports = {
  getProgress,
  getGpaTrends,
  getCompleteProgress,
  updateGPA,
  updateProgress,
  recordGpaHistory,
  getAllStudentProgress,
};
