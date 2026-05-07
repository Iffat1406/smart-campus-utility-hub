# Toast Notifications & Academic Progress Tracker Setup Guide

## Overview

This guide covers the implementation of two major features:

1. **Toast Notifications System** - Real-time notifications using Sonner
2. **Academic Progress Tracker** - GPA trends and academic metrics visualization

---

## 1. Toast Notifications System

### Features

- **Real-time Notifications**: Students receive instant notifications when:
  - New events are created by admin
  - Timetables are updated
  - Electives are allocated
  - Announcements are made
- **Toast Messages**: Integrated with Sonner library for elegant toast notifications
- **Notification Center**: Dedicated panel showing all notifications with read/unread status
- **Auto-polling**: System automatically checks for new notifications every 30 seconds

### Database Schema

#### `notifications` Table

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'event', 'timetable', 'elective', 'announcement'
    related_id INTEGER,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);
```

### Backend Implementation

#### Notification Controller: `src/components/notifications/notifications.controller.js`

**Endpoints:**

- `POST /api/notifications/create-internal` - Create notifications (internal use)
- `GET /api/notifications` - Get all notifications with pagination
- `GET /api/notifications/count` - Get unread notification count
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete a notification
- `DELETE /api/notifications/clear-all` - Clear all notifications

#### Routes: `src/components/notifications/notifications.routes.js`

### Frontend Implementation

#### Service: `src/services/notificationService.ts`

Handles all API calls for notification operations.

#### Hook: `src/hooks/useNotifications.ts`

Custom React hook providing:

- `notifications` - Array of all notifications
- `unreadNotifications` - Filtered unread notifications
- `unreadCount` - Count of unread notifications
- `markAsRead(id)` - Mark single notification as read
- `markAllAsRead()` - Mark all as read
- `deleteNotification(id)` - Delete notification
- `clearAll()` - Clear all notifications
- Auto-polling with configurable interval

#### Component: `src/components/activity/NotificationCenter.tsx`

Features:

- Slide-out notification panel
- Badge showing unread count
- Toast message integration with Sonner
- Real-time notification display
- Mark as read/delete actions
- Empty state handling

### Integration

#### In Events Creation

When an admin creates an event, notifications are automatically sent to relevant students:

```javascript
// In events.controller.js
const studentResult = await query(studentQuery, studentParams);
const studentIds = studentResult.rows.map((row) => row.id);

if (studentIds.length > 0) {
  // Create notifications for each student
  for (const studentId of studentIds) {
    const notificationSql = `
      INSERT INTO notifications (student_id, title, message, notification_type, related_id)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await query(notificationSql, [studentId, title, message, "event", eventId]);
  }
}
```

#### In Dashboard

```tsx
import { NotificationCenter } from "@/components/activity/NotificationCenter";
import { useNotifications } from "@/hooks/useNotifications";

export default function StudentDashboard() {
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <button onClick={() => setNotificationCenterOpen(true)}>
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
      </button>
      <NotificationCenter
        isOpen={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
      />
    </>
  );
}
```

---

## 2. Academic Progress Tracker

### Features

- **GPA Tracking**: Current GPA, Semester GPA, and historical trends
- **Credit Progress**: Track earned vs total credits
- **Course Completion**: Monitor courses completed
- **Trend Visualization**: Line chart showing GPA progression across semesters
- **Performance Status**: Visual indicators for academic performance
- **Academic Goals**: Track progress toward target GPA

### Database Schema

#### `student_academic_progress` Table

```sql
CREATE TABLE student_academic_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_gpa DECIMAL(3,2) CHECK (current_gpa >= 0 AND current_gpa <= 10),
    semester_gpa DECIMAL(3,2) CHECK (semester_gpa >= 0 AND semester_gpa <= 10),
    current_semester INTEGER DEFAULT 1,
    total_credits INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    courses_completed INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `student_gpa_history` Table

```sql
CREATE TABLE student_gpa_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    gpa DECIMAL(3,2) NOT NULL CHECK (gpa >= 0 AND gpa <= 10),
    academic_year VARCHAR(10),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, semester, academic_year)
);
```

### Backend Implementation

#### Controller: `src/components/academic-progress/academicProgress.controller.js`

**Key Endpoints:**

- `GET /api/academic-progress` - Get current student's progress
- `GET /api/academic-progress/gpa-history` - Get GPA trends
- `GET /api/academic-progress/complete` - Get complete progress with trends
- `POST /api/academic-progress/update-gpa` - Update GPA (admin)
- `POST /api/academic-progress/update-progress` - Update progress metrics (admin)
- `POST /api/academic-progress/record-gpa` - Record GPA history entry
- `GET /api/academic-progress/admin/all` - Get all students' progress (admin)

#### Routes: `src/components/academic-progress/academicProgress.routes.js`

### Frontend Implementation

#### Service: `src/services/academicProgressService.ts`

Methods:

- `getProgress()` - Get current progress
- `getGpaTrends(limit)` - Get trend history
- `getCompleteProgress()` - Get combined data
- `updateGPA(studentId, currentGpa, semesterGpa, semester)` - Update GPA
- `updateProgress(totalCredits, creditsEarned, coursesCompleted)` - Update metrics
- `recordGpaHistory(semester, gpa, academicYear)` - Record history

#### Component: `src/components/activity/AcademicProgressTracker.tsx`

Features:

- **Key Metrics Cards**: Current GPA, Semester GPA, Credits, Courses
- **GPA Trend Chart**: Line chart using Recharts
- **Performance Status**: Color-coded status indicator
- **Academic Goals**: Progress toward target GPA
- **Responsive Design**: Works on all device sizes

### Integration

#### In Dashboard

```tsx
import { AcademicProgressTracker } from "@/components/activity/AcademicProgressTracker";
import academicProgressService from "@/services/academicProgressService";

export default function StudentDashboard() {
  const [studentProgress, setStudentProgress] = useState(null);
  const [gpaTrends, setGpaTrends] = useState([]);

  useEffect(() => {
    loadAcademicProgress();
  }, []);

  const loadAcademicProgress = async () => {
    try {
      const response = await academicProgressService.getCompleteProgress();
      if (response?.data) {
        setStudentProgress(response.data.progress);
        setGpaTrends(response.data.gpaTrends || []);
      }
    } catch (error) {
      console.error("Error loading academic progress:", error);
    }
  };

  return (
    <AcademicProgressTracker
      studentProgress={studentProgress}
      gpaTrends={gpaTrends}
      isLoading={progressLoading}
    />
  );
}
```

---

## 3. Setup Instructions

### Backend Setup

1. **Apply Database Migrations**

   ```bash
   cd smart-campus-backend
   psql -U your_user -d your_database -f sql/schema.sql
   node sql/migrate-academic-progress.js
   ```

2. **Install Dependencies** (if needed)

   ```bash
   npm install
   ```

3. **Update Environment Variables**
   Ensure your `.env` has database credentials set up.

4. **Start Backend**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**

   ```bash
   cd smart-campus-frontend
   npm install
   ```

2. **Sonner is Already Installed**
   Check `package.json` - Sonner should be in dependencies:

   ```json
   "sonner": "^1.7.4"
   ```

3. **Start Frontend Development Server**
   ```bash
   npm run dev
   ```

---

## 4. Usage Examples

### For Admin: Creating an Event with Notifications

```typescript
// The event creation automatically creates notifications
const eventData = {
  title: "Campus Hackathon 2025",
  description: "Join us for an exciting hackathon event",
  location: "Building A, Auditorium",
  start_time: "2025-03-15T09:00:00Z",
  end_time: "2025-03-15T18:00:00Z",
  club_id: 1,
  target_department: "Computer Science", // Only CS students get notified
  is_featured: true,
  tags: ["hackathon", "coding"],
};

// Students in CS department receive notification automatically
```

### For Student: Viewing Progress

```typescript
// In Dashboard component
const { studentProgress, gpaTrends } = await academicProgressService.getCompleteProgress();

// Display tracker
<AcademicProgressTracker
  studentProgress={studentProgress}
  gpaTrends={gpaTrends}
/>
```

### For Student: Checking Notifications

```typescript
// Automatically shown in dashboard
// Unread notifications appear as badge
// Toast popups appear in top-right corner
// Click bell icon to open notification panel
```

---

## 5. Performance Considerations

### Notifications

- Polling interval: 30 seconds (configurable)
- Automatic cleanup of old notifications recommended
- Consider implementing Websockets for real-time updates in future

### Academic Progress

- Use React Query for caching
- Limit GPA history query to last 10 semesters by default
- Consider archiving old records for large datasets

---

## 6. Future Enhancements

### Notifications

- [ ] WebSocket integration for real-time updates
- [ ] Email notifications
- [ ] Push notifications (PWA)
- [ ] Notification preferences/settings
- [ ] Notification categories and filtering

### Academic Progress

- [ ] Predictive GPA calculation
- [ ] Course recommendations based on GPA
- [ ] Comparison with class average
- [ ] Grade breakdown by course
- [ ] Export academic transcript

---

## 7. Troubleshooting

### Notifications Not Appearing

- Check if notifications table exists: `SELECT * FROM notifications;`
- Verify studentIds are being retrieved correctly
- Check browser console for errors
- Ensure polling is enabled

### Academic Progress Not Loading

- Verify `student_academic_progress` table exists
- Run migration script: `node sql/migrate-academic-progress.js`
- Check if user has role = 'student'
- Verify API endpoints are accessible

### Toast Messages Not Showing

- Ensure Sonner is imported in component
- Check if toast container is rendered
- Verify CSS is loaded properly
- Check z-index conflicts

---

## 8. API Reference

### Notification Endpoints

See [Notification API Documentation](./NOTIFICATION_API.md)

### Academic Progress Endpoints

See [Academic Progress API Documentation](./ACADEMIC_PROGRESS_API.md)

---

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review backend logs
3. Check browser developer console
4. Open an issue on GitHub
