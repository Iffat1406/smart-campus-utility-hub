import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  TrendingUp,
  BookOpen,
  Award,
  Target,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";

interface StudentProgress {
  current_gpa: number;
  semester_gpa: number;
  current_semester: number;
  total_credits: number;
  credits_earned: number;
  courses_completed: number;
}

interface GpaTrendData {
  semester: number;
  gpa: number;
  academic_year: string;
}

interface AcademicProgressTrackerProps {
  studentProgress: StudentProgress;
  gpaTrends: GpaTrendData[];
  isLoading?: boolean;
}

/**
 * AcademicProgressTracker Component
 * Displays academic progress including GPA trends, credit progress, and course completion
 */
export function AcademicProgressTracker({
  studentProgress,
  gpaTrends,
  isLoading = false,
}: AcademicProgressTrackerProps) {
  const [chartData, setChartData] = useState<GpaTrendData[]>([]);

  useEffect(() => {
    if (gpaTrends && gpaTrends.length > 0) {
      const sortedTrends = [...gpaTrends].sort(
        (a, b) => a.semester - b.semester,
      );
      setChartData(sortedTrends);
    }
  }, [gpaTrends]);

  const getGpaColor = (gpa: number): string => {
    if (gpa >= 8.5) return "text-green-600";
    if (gpa >= 7) return "text-blue-600";
    if (gpa >= 5) return "text-amber-600";
    return "text-red-600";
  };

  const getGpaBg = (gpa: number): string => {
    if (gpa >= 8.5) return "bg-green-50";
    if (gpa >= 7) return "bg-blue-50";
    if (gpa >= 5) return "bg-amber-50";
    return "bg-red-50";
  };

  const creditProgress =
    studentProgress.total_credits > 0
      ? (studentProgress.credits_earned / studentProgress.total_credits) * 100
      : 0;

  const courseProgress =
    studentProgress.courses_completed > 0
      ? Math.min((studentProgress.courses_completed / 20) * 100, 100) // Assuming 20 courses per semester
      : 0;

  const gpaPercentage = (studentProgress.current_gpa / 10) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Academic Progress
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Semester {studentProgress.current_semester} • Track your academic
              journey
            </p>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            Semester {studentProgress.current_semester}
          </Badge>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Current GPA */}
        <Card
          className={`glass glow-primary ${getGpaBg(studentProgress.current_gpa)}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              <span className={getGpaColor(studentProgress.current_gpa)}>
                {studentProgress.current_gpa.toFixed(2)}
              </span>
              <span className="text-lg text-muted-foreground">/10</span>
            </div>
            <Progress value={gpaPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {studentProgress.current_gpa >= 8.5 && "🌟 Excellent performance"}
              {studentProgress.current_gpa >= 7 &&
                studentProgress.current_gpa < 8.5 &&
                "👏 Good progress"}
              {studentProgress.current_gpa >= 5 &&
                studentProgress.current_gpa < 7 &&
                "⚠️ Keep improving"}
              {studentProgress.current_gpa < 5 && "🎯 Focus on improvement"}
            </p>
          </CardContent>
        </Card>

        {/* Semester GPA */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Semester GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {studentProgress.semester_gpa.toFixed(2)}
              <span className="text-lg text-muted-foreground">/10</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Current semester score
            </p>
            <div className="mt-2 flex items-center gap-1">
              {studentProgress.semester_gpa > studentProgress.current_gpa ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Improving
                </span>
              ) : (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Stable
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Credits Progress */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Credits Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {studentProgress.credits_earned}
              <span className="text-lg text-muted-foreground">
                /{studentProgress.total_credits}
              </span>
            </div>
            <Progress value={creditProgress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(creditProgress)}% completed
            </p>
          </CardContent>
        </Card>

        {/* Courses Completed */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Courses Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2 flex items-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 mr-2" />
              {studentProgress.courses_completed}
            </div>
            <Progress value={courseProgress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              Courses this semester
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* GPA Trend Chart */}
      {chartData && chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>GPA Trend Over Semesters</CardTitle>
                  <CardDescription>
                    Track your GPA progression across semesters
                  </CardDescription>
                </div>
                <Zap className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">Loading chart...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="semester"
                      label={{
                        value: "Semester",
                        position: "insideBottomRight",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      label={{
                        value: "GPA",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [
                        typeof value === "number" ? value.toFixed(2) : value,
                        "GPA",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="gpa"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", r: 6 }}
                      activeDot={{ r: 8 }}
                      name="GPA"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid md:grid-cols-2 gap-4"
      >
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Performance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {studentProgress.current_gpa >= 8.5 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-900">
                  🌟 Outstanding Performance
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Keep maintaining this excellent score!
                </p>
              </div>
            )}
            {studentProgress.current_gpa >= 7 &&
              studentProgress.current_gpa < 8.5 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900">
                    👏 Good Performance
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    You're doing well! Aim for higher.
                  </p>
                </div>
              )}
            {studentProgress.current_gpa >= 5 &&
              studentProgress.current_gpa < 7 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-900">
                    ⚠️ Fair Performance
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Focus on improving your scores.
                  </p>
                </div>
              )}
            {studentProgress.current_gpa < 5 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-900">
                  🎯 Needs Improvement
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Seek help and improve your performance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Academic Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Target GPA: 8.5</span>
                <span className="text-xs text-muted-foreground">
                  {Math.max(0, 8.5 - studentProgress.current_gpa).toFixed(2)}{" "}
                  point gap
                </span>
              </div>
              <Progress
                value={Math.min((studentProgress.current_gpa / 8.5) * 100, 100)}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Credits: 50% Done</span>
                <span className="text-xs text-muted-foreground">
                  {creditProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={Math.min(creditProgress, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default AcademicProgressTracker;
