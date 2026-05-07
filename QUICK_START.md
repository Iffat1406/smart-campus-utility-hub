# Quick Start Guide - Notifications & Academic Progress

## 🚀 Getting Started (5 minutes)

### Step 1: Database Setup

Run the migration to create tables and initialize student data:

```bash
cd smart-campus-backend
node sql/migrate-academic-progress.js
```

This will:

- Create notification tables
- Create academic progress tracking tables
- Initialize progress records for existing students
- Initialize GPA history records

### Step 2: Start the Backend

```bash
npm run dev
```

You should see:

```
✅ Smart Campus Backend Server Started
📍 Server running on: http://localhost:5000
```

### Step 3: Start the Frontend

```bash
cd ../smart-campus-frontend
npm run dev
```

You should see:

```
VITE v... ready in ... ms

➜  Local:   http://localhost:5173/
```

### Step 4: Test the Features

#### A. Test Notifications

1. Login as **Admin**
2. Navigate to **Manage Events**
3. Create a new event with a target department
4. Login as a **Student** in that department
5. You should see:
   - Bell icon with badge count in dashboard
   - Toast notification in top-right
   - Notification in Notification Center

#### B. Test Academic Progress Tracker

1. Login as **Student**
2. Go to **Dashboard**
3. Scroll down to see **Academic Progress** section
4. You should see:
   - Current GPA card
   - Semester GPA
   - Credits progress
   - Courses completed
   - GPA trend chart (if historical data exists)

---

## 📝 API Endpoints Quick Reference

### Notifications

```bash
# Get all notifications
GET /api/notifications

# Get unread count
GET /api/notifications/count

# Mark as read
PATCH /api/notifications/:id/read

# Mark all as read
PATCH /api/notifications/read-all

# Delete notification
DELETE /api/notifications/:id

# Clear all
DELETE /api/notifications/clear-all
```

### Academic Progress

```bash
# Get student's progress
GET /api/academic-progress

# Get GPA trends
GET /api/academic-progress/gpa-history

# Get complete data
GET /api/academic-progress/complete

# Admin: Update student GPA
POST /api/academic-progress/update-gpa
Body: {
  "student_id": 2,
  "current_gpa": 8.5,
  "semester_gpa": 8.7,
  "current_semester": 3
}

# Admin: View all students' progress
GET /api/academic-progress/admin/all
```

---

## 🎨 Component Integration

### Adding NotificationCenter to a Page

```tsx
import { NotificationCenter } from "@/components/activity/NotificationCenter";
import { useState } from "react";

export function MyPage() {
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <>
      <button onClick={() => setNotificationOpen(true)}>
        Open Notifications
      </button>
      <NotificationCenter
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </>
  );
}
```

### Adding AcademicProgressTracker to a Page

```tsx
import { AcademicProgressTracker } from "@/components/activity/AcademicProgressTracker";
import { useEffect, useState } from "react";
import academicProgressService from "@/services/academicProgressService";

export function MyPage() {
  const [progress, setProgress] = useState(null);
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    academicProgressService.getCompleteProgress().then((res) => {
      setProgress(res.data.progress);
      setTrends(res.data.gpaTrends);
    });
  }, []);

  if (!progress) return <div>Loading...</div>;

  return (
    <AcademicProgressTracker studentProgress={progress} gpaTrends={trends} />
  );
}
```

---

## 🔔 How It Works

### Notification Flow

1. **Admin creates event** → Event saved to database
2. **Notification creation** → System queries relevant students
3. **Notifications inserted** → Each student gets a notification record
4. **Student logs in** → Frontend polls for notifications every 30s
5. **Toast appears** → Sonner displays beautiful toast message
6. **Notification Center updates** → User sees notification in panel

### Academic Progress Flow

1. **Admin updates student GPA** → Database updated
2. **GPA history recorded** → Historical entry created
3. **Student views dashboard** → Progress data fetched
4. **Components render** → Tracker displays metrics and trends
5. **Chart updates** → Recharts visualizes GPA history

---

## ⚙️ Configuration

### Notification Polling Interval

Edit `src/hooks/useNotifications.ts`:

```tsx
export function useNotifications(pollInterval = 30000) {
  // 30 seconds
  // ...
}

// Usage with custom interval:
const { notifications } = useNotifications(10000); // 10 seconds
```

### GPA History Limit

Edit `src/services/academicProgressService.ts`:

```tsx
getGpaTrends: withServiceError(async (limit = 10) => {
  // Change default limit here
});
```

---

## 🧪 Testing Checklist

- [ ] Notification appears when event created
- [ ] Toast message shows in top-right
- [ ] Bell icon shows correct unread count
- [ ] Can open Notification Center
- [ ] Can mark notification as read
- [ ] Can delete notifications
- [ ] GPA metrics display correctly
- [ ] Chart shows trend line
- [ ] Performance status badge shows
- [ ] Academic goals progress bar works
- [ ] Data persists after page reload
- [ ] Works on mobile devices

---

## 🐛 Common Issues & Solutions

| Issue                       | Solution                                             |
| --------------------------- | ---------------------------------------------------- |
| Notifications not appearing | Check browser console, verify database connection    |
| Toast doesn't show          | Ensure Sonner is imported in component               |
| GPA chart blank             | Check if gpaTrends array has data                    |
| Unread count wrong          | Clear browser cache, restart frontend                |
| API 404 errors              | Ensure backend is running on port 5000               |
| Migrations fail             | Check database permissions, verify connection string |

---

## 📚 Documentation

- [Full Setup Guide](./NOTIFICATIONS_AND_PROGRESS_SETUP.md)
- [API Documentation](./docs/)
- [Component Props Documentation](./docs/COMPONENTS.md)

---

## 🎉 You're All Set!

Your notification system and academic progress tracker are now ready to use.

**Key Features:**

- ✅ Real-time notifications with Sonner toasts
- ✅ Notification center with read/unread tracking
- ✅ Academic progress visualization
- ✅ GPA trend analysis
- ✅ Responsive design
- ✅ Performance optimized

**Next Steps:**

1. Test all features
2. Customize colors/styling as needed
3. Deploy to production
4. Monitor notification performance

---

## 📞 Support

For help:

1. Check troubleshooting section above
2. Review backend logs: `tail -f logs/*.log`
3. Check browser console: `F12` → Console tab
4. Review database errors: `psql` → `SELECT * FROM notifications;`

Happy notifying! 🚀
