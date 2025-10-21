# Attendance Management System

## Overview

The attendance management system provides role-based access to attendance data with the following features:

### Student Features
- **View Personal Attendance**: Students can only view their own attendance records
- **Subject-wise Breakdown**: Attendance is organized by subject and class
- **Attendance Statistics**: Shows attendance percentage for each subject
- **Filtering Options**: Filter by semester, subject, and date range
- **Detailed Records**: View individual attendance entries with dates and times

### Professor Features
- **Class Management**: View all assigned classes from timetable
- **Attendance Marking**: Mark attendance for students in assigned classes only
- **Bulk Operations**: Mark attendance for entire class at once
- **Student Lists**: View students enrolled in each class
- **Attendance History**: View past attendance records for classes
- **Statistics**: See class-wise attendance averages

### Admin Features
- **Comprehensive Reports**: View attendance data across all classes and subjects
- **Semester Analysis**: Generate reports by semester
- **Export Functionality**: Export attendance data to CSV
- **Student Performance**: Track individual student attendance across subjects
- **Class Performance**: Monitor class-wise attendance trends

## API Endpoints

### Student Endpoints
- `GET /attendance/student/my-attendance` - Get current student's attendance with filters
- `GET /attendance/student/subjects/{usn}` - Get subjects for a specific student

### Professor Endpoints
- `GET /attendance/professor/my-classes` - Get professor's assigned classes
- `GET /attendance/professor/class-students/{class_id}` - Get students for attendance marking
- `POST /attendance/bulk` - Create bulk attendance records

### Admin Endpoints
- `GET /attendance/admin/semester-report` - Get comprehensive attendance reports
- `GET /attendance/` - Get all attendance records with filters

### General Endpoints
- `POST /attendance/` - Create single attendance record
- `PUT /attendance/{id}` - Update attendance record
- `DELETE /attendance/{id}` - Delete attendance record
- `GET /attendance/stats/class/{class_id}` - Get class statistics
- `GET /attendance/stats/student/{usn}` - Get student statistics

## Role-Based Access Control

### Students
- Can only view their own attendance data
- Cannot modify attendance records
- Access restricted to personal USN

### Professors
- Can view and modify attendance for assigned classes only
- Assignment validation through timetable entries
- Can mark attendance for any student in their classes
- Cannot access other professors' classes

### Admins
- Full access to all attendance data
- Can generate comprehensive reports
- Can modify any attendance record
- Access to system-wide statistics

## Data Model

### Attendance Record
```python
{
    "id": int,
    "class_id": str,        # e.g., "CS301"
    "usn": str,             # Student USN
    "date": date,           # Class date
    "status": str,          # "present", "absent", "cancelled"
    "marked_by": str,       # Professor USN
    "subject": str,         # Subject name
    "period_start": str,    # Start time
    "period_end": str,      # End time
    "created_at": datetime
}
```

## Frontend Components

### StudentAttendanceView
- Personal attendance dashboard
- Subject-wise statistics
- Detailed attendance history
- Filtering and search capabilities

### ProfessorAttendanceManager
- Class selection interface
- Student attendance marking
- Bulk attendance operations
- Real-time attendance tracking

### AdminAttendanceReport
- Comprehensive reporting dashboard
- Multi-level filtering
- Export functionality
- Statistical analysis

## Security Features

1. **Authentication Required**: All endpoints require valid user authentication
2. **Role Validation**: Each endpoint validates user role permissions
3. **Data Isolation**: Students can only access their own data
4. **Professor Restrictions**: Professors limited to assigned classes
5. **Audit Trail**: All attendance changes tracked with timestamps

## Usage Examples

### Student Viewing Attendance
```javascript
// Get my attendance for semester 3
GET /attendance/student/my-attendance?semester=3

// Get attendance for specific subject
GET /attendance/student/my-attendance?subject=Data%20Structures
```

### Professor Marking Attendance
```javascript
// Get students for marking attendance
GET /attendance/professor/class-students/CS301?subject=Data%20Structures&date_filter=2024-01-15

// Mark bulk attendance
POST /attendance/bulk
{
    "class_id": "CS301",
    "date": "2024-01-15",
    "subject": "Data Structures",
    "attendance_records": [
        {"usn": "1MS21CS001", "status": "present"},
        {"usn": "1MS21CS002", "status": "absent"}
    ]
}
```

### Admin Generating Reports
```javascript
// Get semester report
GET /attendance/admin/semester-report?semester=3&class_id=CS301

// Export data (frontend handles CSV generation)
```

## Integration with Timetable

The attendance system integrates with the timetable module to:
- Validate professor assignments to classes
- Determine which subjects a professor can mark attendance for
- Ensure attendance is only marked for scheduled classes
- Provide context for attendance records (subject, timing)

## Performance Considerations

1. **Indexing**: Database indexes on frequently queried fields (usn, class_id, date)
2. **Pagination**: Large result sets are paginated to improve performance
3. **Caching**: Frequently accessed data can be cached
4. **Bulk Operations**: Efficient bulk attendance marking reduces database calls

## Future Enhancements

1. **Biometric Integration**: Support for fingerprint/face recognition
2. **Mobile App**: Native mobile app for attendance marking
3. **Analytics Dashboard**: Advanced analytics and insights
4. **Automated Notifications**: Alerts for low attendance
5. **Parent Portal**: Parent access to student attendance
6. **Integration APIs**: APIs for external systems integration