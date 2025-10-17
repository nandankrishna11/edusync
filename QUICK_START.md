# 🚀 Quick Start Guide

## One-Click Setup (Recommended)

### Option 1: Automatic Setup
```bash
python quick-setup.py
```
This script will:
- ✅ Check all prerequisites 
- ✅ Set up Python virtual environment
- ✅ Install all backend dependencies
- ✅ Install all frontend dependencies  
- ✅ Initialize database with default users
- ✅ Create easy startup scripts

### Option 2: Use Existing Scripts

**Windows Users:**
- Double-click `start-all.bat` (starts both servers)
- Or run `start-backend.bat` and `start-frontend.bat` separately

**Mac/Linux Users:**
- Run `./start-all.sh` (starts both servers)
- Or run `./start-backend.sh` and `./start-frontend.sh` separately

## Manual Setup (If needed)

### Prerequisites
- Python 3.8+ 
- Node.js 16+
- npm

### Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux  
source venv/bin/activate

pip install -r requirements.txt
python init_auth.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000  
- **API Documentation**: http://localhost:8000/docs

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Professor | prof_smith | prof123 |
| Student | student_john | student123 |

## Features Available

### 🔐 Authentication System
- Role-based access control (Admin, Professor, Student)
- JWT token authentication
- User management (Admin only)

### 📅 Timetable Management  
- View class schedules
- Cancel classes (Professor only)
- Real-time updates

### 📊 Attendance Tracking
- Mark attendance (Professor only)
- View attendance records
- Statistical analysis

### 🔔 Notifications
- Class cancellations
- Important announcements
- Read/unread status

### 📈 Analytics Dashboard
- Attendance trends
- Performance metrics
- Interactive charts

## Troubleshooting

### Common Issues

**Backend won't start:**
- Make sure Python virtual environment is activated
- Check if port 8000 is available
- Run `pip install -r requirements.txt` again

**Frontend won't start:**
- Delete `node_modules` folder and run `npm install` again
- Check if port 3000 is available
- Make sure Node.js 16+ is installed

**Database issues:**
- Delete `classroom.db` file and run `python init_auth.py` again

### Getting Help

1. Check the full README.md for detailed documentation
2. Visit http://localhost:8000/docs for API documentation
3. Check browser console for frontend errors
4. Check terminal output for backend errors

## Development Tips

- Both servers auto-reload when you make code changes
- Use the API docs at `/docs` to test backend endpoints
- Check browser developer tools for frontend debugging
- Default database is SQLite (classroom.db file)

---

**🎉 You're all set! Happy coding!**