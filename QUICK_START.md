# 🚀 Quick Start Guide

## ✅ Project is Running!

Both servers are now active and ready to use.

### 🌐 Access URLs

**Frontend Application:**
- URL: http://localhost:3000
- Status: ✅ Running

**Backend API:**
- URL: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Status: ✅ Running

### 🔐 Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Access: Full system control

**Professor Account:**
- Username: `prof_smith`
- Password: `prof123`
- Access: Class management, attendance, marks

**Student Account:**
- Username: `student_john`
- Password: `student123`
- Access: View timetable, attendance, marks

### 📋 What You Can Do Now

1. **Open your browser** and go to http://localhost:3000
2. **Login** with any of the credentials above
3. **Explore features:**
   - Timetable management
   - Attendance tracking
   - Marks management
   - Notifications
   - AI Textbook chat (upload PDFs and ask questions)

### 🛑 Stopping the Servers

- Close the terminal windows running the servers
- Or press `Ctrl+C` in each terminal

### 🔄 Restarting the Servers

**Option 1: Use the batch file**
```bash
start-all.bat
```

**Option 2: Start individually**
```bash
# Backend
start-backend.bat

# Frontend
start-frontend.bat
```

### 📚 Features Available

✅ User Authentication & Authorization
✅ Role-Based Access Control (Admin/Professor/Student)
✅ Timetable Management
✅ Attendance Tracking
✅ Marks Management
✅ Real-time Notifications
✅ AI-Powered Textbook Chat
✅ PDF Upload & Processing
✅ Analytics Dashboard

### 🔧 Troubleshooting

**Backend not starting?**
- Check if port 8000 is available
- Ensure Python virtual environment is activated
- Check backend terminal for error messages

**Frontend not starting?**
- Check if port 3000 is available
- Ensure npm dependencies are installed
- Check frontend terminal for error messages

**Can't login?**
- Verify backend is running at http://localhost:8000
- Check browser console for errors
- Ensure database file exists in backend folder

---

**Need help?** Check the main README.md for detailed documentation.
