# Complete Database Setup Guide - Notifications & Academic Progress

## ⚠️ Problem: Tables Don't Exist

If you're getting the error:

```
"relation \"notifications\" does not exist"
```

This means the database tables haven't been created yet. Follow these steps to fix it.

---

## 🔧 Step 1: Initialize the Database Schema

### Option A: Using PostgreSQL CLI (Recommended)

```bash
# Navigate to the backend directory
cd smart-campus-backend

# Connect to PostgreSQL
psql -U your_db_user -d your_db_name -f sql/schema.sql
```

### Option B: Using Node.js Script

Create a file `smart-campus-backend/sql/init-db.js`:

```javascript
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log("📊 Initializing database schema...");
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, "schema.sql"),
      "utf8",
    );
    await client.query(schemaSQL);
    console.log("✅ Database schema created successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

Then run:

```bash
node sql/init-db.js
```

---

## 🔄 Step 2: Initialize Student Data

Once the schema is created, initialize academic progress records for students:

```bash
cd smart-campus-backend
node sql/migrate-academic-progress.js
```

Expected output:

```
Starting academic progress migration...
✅ Created X initial academic progress records
✅ Created X initial GPA history records
✨ Academic progress migration completed successfully!
```

---

## ✅ Verify Database Setup

Check that tables were created successfully:

```bash
# Connect to PostgreSQL
psql -U your_db_user -d your_db_name

# List tables
\dt

# You should see these tables:
# - notifications
# - student_academic_progress
# - student_gpa_history
# - users
# - events
# - And others...
```

Query to verify:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## 🚀 Step 3: Start the Application

### Terminal 1: Backend

```bash
cd smart-campus-backend
npm install          # If not already done
npm run dev
```

You should see:

```
✅ Smart Campus Backend Server Started
📍 Server running on: http://localhost:5000
🗄️  Database: Connected
```

### Terminal 2: Frontend

```bash
cd smart-campus-frontend
npm install          # If not already done
npm run dev
```

You should see:

```
➜  Local:   http://localhost:5173/
```

---

## 🧪 Step 4: Test the Features

### Test 1: Notifications

1. **Login as Admin**
   - Email: `admin@smartcampus.edu`
   - Password: `admin123`

2. **Create an Event**
   - Navigate to Admin → Manage Events
   - Click "Create Event"
   - Fill in event details:
     - Title: "Welcome Event"
     - Description: "Welcome to campus"
     - Location: "Auditorium"
     - Club: Select any club
     - Target Department: "Computer Science" (or any department with students)
     - Start Time: Tomorrow at 10:00 AM
     - End Time: Tomorrow at 11:00 AM
   - Click "Create Event"

3. **Login as Student**
   - Logout from admin
   - Login as student in the same department:
     - Email: `student@example.com` (or any student account in that department)
     - Password: (their password)

4. **Verify Notifications**
   - You should see:
     - ✅ Bell icon with badge showing "1" unread notification in top-right
     - ✅ Toast notification saying "New Event: Welcome Event"
     - ✅ Notification in Notification Center when you click the bell icon

### Test 2: Academic Progress Tracker

1. **Login as Student**
2. **Go to Dashboard**
   - You should see "Academic Progress" section with:
     - 📊 Current GPA card
     - 📊 Semester GPA card
     - 📊 Credits Earned progress
     - 📊 Courses Completed card
     - 📈 GPA Trend Chart (if historical data exists)

---

## 🐛 Troubleshooting

### Error: "relation \"notifications\" does not exist"

**Solution**: Run the schema initialization:

```bash
cd smart-campus-backend
psql -U your_db_user -d your_db_name -f sql/schema.sql
```

### Error: "connect ECONNREFUSED 127.0.0.1:5432"

**Solution**: PostgreSQL server is not running

```bash
# On Windows
net start PostgreSQL14  # or your version

# On Mac
brew services start postgresql

# On Linux
sudo systemctl start postgresql
```

### Error: "password authentication failed"

**Solution**: Check your `.env` file in `smart-campus-backend/`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_NAME=smart_campus
```

### Notifications not showing

**Solution**:

1. Clear browser cache: Ctrl+Shift+Delete
2. Check browser console for errors
3. Verify backend is running: `http://localhost:5000/health`
4. Check that the event has a target department matching student's department

### Academic Progress showing 0/0

**Solution**: Run the migration script:

```bash
cd smart-campus-backend
node sql/migrate-academic-progress.js
```

---

## 📋 Database Initialization Checklist

- [ ] PostgreSQL server is running
- [ ] `.env` file configured with correct database credentials
- [ ] Schema initialized: `psql -f sql/schema.sql`
- [ ] Migration script run: `node sql/migrate-academic-progress.js`
- [ ] Backend started and showing "Database: Connected"
- [ ] Frontend started and accessible at `http://localhost:5173`
- [ ] Can login as admin and student
- [ ] Created a test event
- [ ] Verified notification appears for student

---

## 📚 API Endpoints Reference

### Notifications API

```bash
# Get notifications (unread only)
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/notifications?unread_only=true"

# Get unread count
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/notifications/count"

# Mark as read
curl -X PATCH -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/notifications/1/read"

# Mark all as read
curl -X PATCH -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/notifications/read-all"

# Delete notification
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/notifications/1"

# Clear all
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/notifications/clear-all"
```

### Academic Progress API

```bash
# Get current progress
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/academic-progress"

# Get GPA trends
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/academic-progress/gpa-history"

# Get complete progress with trends
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/academic-progress/complete"
```

---

## ✨ Features Implemented

### Backend

- ✅ Notification creation and management
- ✅ Academic progress tracking
- ✅ GPA history recording
- ✅ Auto-notification on event creation
- ✅ Student data initialization

### Frontend

- ✅ Notification Center component with slide-out panel
- ✅ Toast notifications using Sonner
- ✅ Academic Progress Tracker with charts
- ✅ Real-time notification polling
- ✅ GPA trend visualization

### Database

- ✅ Notifications table with indexes
- ✅ Student academic progress table
- ✅ GPA history table for trends
- ✅ Migration script for initialization

---

## 🎯 Next Steps

1. ✅ Database setup complete
2. ✅ Run the application
3. ✅ Test all features
4. Test other events (timetable updates, elective allocations)
5. Customize notification messages for your campus
6. Add more academic metrics as needed

For issues or questions, check the logs in both backend and frontend terminals.
