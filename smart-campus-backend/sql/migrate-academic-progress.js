/**
 * Migration script to initialize academic progress tracking
 * Sets up default academic progress records for all existing students
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function migrateAcademicProgress() {
  const client = await pool.connect();

  try {
    console.log("Starting academic progress migration...");

    // Create initial academic progress records for all students
    const insertProgressSql = `
      INSERT INTO student_academic_progress (
        student_id, 
        current_gpa, 
        semester_gpa, 
        current_semester, 
        total_credits, 
        credits_earned, 
        courses_completed
      )
      SELECT 
        id, 
        COALESCE(cgpa, 7.5), 
        7.5, 
        COALESCE(semester, 1), 
        0, 
        0, 
        0
      FROM users
      WHERE role = 'student'
        AND id NOT IN (SELECT student_id FROM student_academic_progress)
      ON CONFLICT (student_id) DO NOTHING
    `;

    const progressResult = await client.query(insertProgressSql);
    console.log(
      `✅ Created ${progressResult.rowCount} initial academic progress records`,
    );

    // Create initial GPA history records for all students
    const insertHistorySql = `
      INSERT INTO student_gpa_history (
        student_id, 
        semester, 
        gpa, 
        academic_year
      )
      SELECT 
        id, 
        COALESCE(semester, 1), 
        COALESCE(cgpa, 7.5), 
        '2025'
      FROM users
      WHERE role = 'student'
        AND id NOT IN (SELECT DISTINCT student_id FROM student_gpa_history)
      ON CONFLICT (student_id, semester, academic_year) DO NOTHING
    `;

    const historyResult = await client.query(insertHistorySql);
    console.log(
      `✅ Created ${historyResult.rowCount} initial GPA history records`,
    );

    console.log("✨ Academic progress migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during migration:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateAcademicProgress().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
