# Tuition Management System

A comprehensive web application for managing tuition centers, students, batches, fees, and attendance.

## Features

### 📚 Student Management
- Add, edit, and delete students
- Store comprehensive student information (name, class, phone, email, parent details, address)
- Track subjects and batch assignments
- Admission date tracking
- Student status management (active/inactive)
- Search and filter students

### 📅 Batch Management
- Create and manage batches based on timing
- Define batch subjects and capacity
- View students in each batch
- Track batch occupancy

### 💰 Fee Management
- Create fee records for students
- Record payments (full or partial)
- Track payment methods (cash, UPI, bank transfer, card, cheque)
- Due date tracking
- Overdue fee alerts
- Payment history

### ✅ Attendance Tracking
- Mark daily attendance by batch
- Support for Present, Absent, and Late status
- Bulk attendance marking
- Attendance history

### 📊 Reports & Analytics
- Dashboard with key metrics
- Students by class distribution
- Fee collection summary
- Fee defaulters list
- Export data to CSV

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Icons**: Font Awesome 6

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm
- PostgreSQL installed and running locally

### Database Setup

1. Make sure PostgreSQL is running on your system
2. Create a database named `tutiondata`:
   ```sql
   CREATE DATABASE tutiondata;
   ```
3. The default connection settings are:
   - Host: localhost
   - Port: 5432
   - Database: tutiondata
   - User: postgres
   - Password: 12345

   (You can modify these in `backend/config/database.js`)

### Steps

1. **Clone/Navigate to the project directory**
   ```bash
   cd tution_project
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   The server will automatically create all necessary tables on first run.

4. **Open in browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
tution_project/
├── backend/
│   ├── config/
│   │   └── database.js      # SQLite database setup
│   ├── controllers/
│   │   ├── studentController.js
│   │   ├── batchController.js
│   │   ├── feeController.js
│   │   └── attendanceController.js
│   ├── routes/
│   │   ├── studentRoutes.js
│   │   ├── batchRoutes.js
│   │   ├── feeRoutes.js
│   │   └── attendanceRoutes.js
│   ├── server.js            # Express server entry point
│   ├── package.json
│   └── database.sqlite      # SQLite database file (auto-created)
├── frontend/
│   ├── css/
│   │   └── styles.css       # Main stylesheet
│   ├── js/
│   │   ├── api.js           # API service layer
│   │   └── utils.js         # Utility functions
│   ├── index.html           # Dashboard
│   ├── students.html        # Student management
│   ├── batches.html         # Batch management
│   ├── fees.html            # Fee management
│   ├── attendance.html      # Attendance tracking
│   └── reports.html         # Reports & analytics
└── README.md
```

## API Endpoints

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/stats` - Get student statistics

### Batches
- `GET /api/batches` - Get all batches
- `GET /api/batches/:id` - Get batch by ID (includes students)
- `POST /api/batches` - Create batch
- `PUT /api/batches/:id` - Update batch
- `DELETE /api/batches/:id` - Delete batch

### Fees
- `GET /api/fees` - Get all fee records
- `GET /api/fees/:id` - Get fee by ID
- `GET /api/fees/student/:studentId` - Get fees for a student
- `POST /api/fees` - Create fee record
- `PUT /api/fees/:id` - Update fee record
- `POST /api/fees/:id/payment` - Record payment
- `DELETE /api/fees/:id` - Delete fee record
- `GET /api/fees/stats` - Get fee statistics
- `GET /api/fees/overdue` - Get overdue fees

### Attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/batch/:batchId/date/:date` - Get batch attendance for date
- `POST /api/attendance` - Mark attendance (bulk)
- `PUT /api/attendance/:id` - Update attendance record
- `GET /api/attendance/student/:studentId/stats` - Get student attendance stats

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Export
- `GET /api/export/students` - Export students data
- `GET /api/export/fees` - Export fees data

## Usage Guide

### Adding a Student
1. Go to Students page
2. Click "Add Student" button
3. Fill in the required fields (Name, Class, Phone, Subjects, Admission Date)
4. Optionally select a batch and add parent details
5. Click "Save Student"

### Creating a Batch
1. Go to Batches page
2. Click "Add Batch" button
3. Enter batch name, timing, subjects, and max capacity
4. Click "Save Batch"

### Managing Fees
1. Go to Fees page
2. Click "Add Fee Record"
3. Select student, enter amount, due date, and month/year
4. To record a payment, click the ₹ button on any pending fee
5. Enter payment amount and method

### Marking Attendance
1. Go to Attendance page
2. Select date and batch
3. Click "Load" to see students
4. Mark each student as Present, Absent, or Late
5. Click "Save Attendance"

## License

MIT License - Feel free to use this project for your tuition center!
