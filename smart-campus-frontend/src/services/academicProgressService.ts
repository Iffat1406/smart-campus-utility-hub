import { api } from "@/lib/axios";
import { asApiData, withServiceError } from "./serviceUtils";

export interface StudentProgress {
  id: number;
  student_id: number;
  current_gpa: number;
  semester_gpa: number;
  current_semester: number;
  total_credits: number;
  credits_earned: number;
  courses_completed: number;
  updated_at: string;
}

export interface GpaTrendData {
  id: number;
  student_id: number;
  semester: number;
  gpa: number;
  academic_year: string;
  recorded_at: string;
}

export interface AcademicProgressResponse {
  progress: StudentProgress;
  gpaTrends: GpaTrendData[];
}

/**
 * Academic Progress Service
 * Handles all academic progress-related API calls
 */

const academicProgressService = {
  /**
   * Get student's academic progress
   * GET /api/academic-progress
   */
  getProgress: withServiceError(async () => {
    const response = await api.get<StudentProgress>("/academic-progress");
    return asApiData(response);
  }),

  /**
   * Get GPA trend history
   * GET /api/academic-progress/gpa-history
   */
  getGpaTrends: withServiceError(async (limit = 10) => {
    const response = await api.get<{ trends: GpaTrendData[] }>(
      "/academic-progress/gpa-history",
      {
        params: { limit },
      },
    );
    return asApiData(response);
  }),

  /**
   * Get complete academic progress with trends
   * GET /api/academic-progress/complete
   */
  getCompleteProgress: withServiceError(async () => {
    const response = await api.get<AcademicProgressResponse>(
      "/academic-progress/complete",
    );
    return asApiData(response);
  }),

  /**
   * Update GPA (Admin/System only)
   * POST /api/academic-progress/update-gpa
   */
  updateGPA: withServiceError(
    async (
      studentId: number,
      currentGpa: number,
      semesterGpa: number,
      semester: number,
    ) => {
      const response = await api.post("/academic-progress/update-gpa", {
        student_id: studentId,
        current_gpa: currentGpa,
        semester_gpa: semesterGpa,
        current_semester: semester,
      });
      return asApiData(response);
    },
  ),

  /**
   * Update progress metrics
   * POST /api/academic-progress/update-progress
   */
  updateProgress: withServiceError(
    async (
      totalCredits: number,
      creditsEarned: number,
      coursesCompleted: number,
    ) => {
      const response = await api.post("/academic-progress/update-progress", {
        total_credits: totalCredits,
        credits_earned: creditsEarned,
        courses_completed: coursesCompleted,
      });
      return asApiData(response);
    },
  ),

  /**
   * Record GPA history entry
   * POST /api/academic-progress/record-gpa
   */
  recordGpaHistory: withServiceError(
    async (semester: number, gpa: number, academicYear: string) => {
      const response = await api.post("/academic-progress/record-gpa", {
        semester,
        gpa,
        academic_year: academicYear,
      });
      return asApiData(response);
    },
  ),
};

export default academicProgressService;
