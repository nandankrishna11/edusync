# 🚀 Setup Guide for Friends

This guide will help you set up and run the Classroom Management System on your local machine.

## ⚠️ Before You Start

**System Requirements:**
- Windows 10/11, macOS, or Linux
- 8GB RAM (minimum 4GB)
- 5GB free disk space
- Internet connection (for downloading dependencies)

**Required Software:**
- Python 3.8 or higher ([Download](https://www.python.org/downloads/))
- Node.js 14 or higher ([Download](https://nodejs.org/))
- Git (optional, for cloning)

## 📥 Step 1: Get the Project

### Option A: Download ZIP
1. Download the project ZIP file
2. Extract it to a folder (e.g., `C:\Projects\classroom-system`)
3. Open Command Prompt or Terminal in that folder

### Option B: Clone with Git
```bash
git clone <repository-url>
cd classroom-management-system
```

## 🔧 Step 2: Initial Setup

### Windows Users

1. **Open Command Prompt as Administrator** (Right-click → Run as administrator)

2. **Navigate to project folder:**
```cmd
cd path\to\classroom-management-system
```

3. **Run the setup script:**
```cmd
setup.bat
```

This will:
- Create Python virtual environment
- Install all backend dependencies
- Install all frontend dependencies
- Create necessary folders
- Set up environment variables

### Mac/Linux Users

1. **Open Terminal**

2. **Navigate to project folder:**
```bash
cd path/to/classroom-management-system
```

3. **Make scripts executable:**
```bash
chmod +x setup.sh
chmod +x start-all.sh
```

4. **Run setup:**
```bash
./setup.sh
```

## ▶️ Step 3: Start the Application

### Windows
```cmd
start-all.bat
```

### Mac/Linux
```bash
./start-all.sh
```

This will open two terminal windows:
- **Backend** (Python/FastAPI) on port 8000
- **Frontend** (React) on port 3000

**Wait for both to start** (may take 1-2 minutes on first run)

## 🌐 Step 4: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

## 🔐 Step 5: Login

Use these default credentials:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Professor Account:**
- Username: `prof_smith`
- Password: `prof123`

**Student Account:**
- Username: `4KV22CS090`
- Password: `password123`

## ✅ Verify Everything Works

1. **Login as Admin** → Check if dashboard loads
2. **Go to Timetable** → Try creating a class schedule
3. **Go to Users** → View student/professor list
4. **Logout and login as Student** → Check student dashboard
5. **Try AI Chat** → Upload a PDF and ask a question

## 🛑 Stopping the Application

- Close both terminal windows
- Or press `Ctrl+C` in each terminal

## 🔄 Restarting

Just run `start-all.bat` (Windows) or `./start-all.sh` (Mac/Linux) again!

## ❗ Common Issues & Solutions

### Issue 1: "Python not found"
**Solution:** Install Python from https://www.python.org/downloads/
- During installation, check "Add Python to PATH"

### Issue 2: "Node not found" or "npm not found"
**Solution:** Install Node.js from https://nodejs.org/
- Use LTS (Long Term Support) version

### Issue 3: Port 8000 or 3000 already in use
**Solution:**
```cmd
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### Issue 4: Backend starts but shows errors
**Solution:**
1. Delete `backend/classroom_rag.db`
2. Restart backend - it will create a fresh database

### Issue 5: Frontend shows "Cannot connect to server"
**Solution:**
1. Make sure backend is running (check http://localhost:8000/docs)
2. Check if `frontend/.env` has correct API URL
3. Clear browser cache (Ctrl+Shift+Delete)

### Issue 6: AI features not working
**Solution:**
1. Make sure you installed textbook requirements:
```cmd
cd backend
venv\Scripts\activate
pip install -r requirements_textbooks.txt
```
2. First AI query takes 30-60 seconds (downloading models)
3. Check if you have at least 2GB free disk space

### Issue 7: "Permission denied" errors
**Solution:**
- Windows: Run Command Prompt as Administrator
- Mac/Linux: Use `sudo` or check folder permissions

## 📁 Project Structure

```
classroom-management-system/
├── backend/              # Python FastAPI backend
│   ├── venv/            # Python virtual environment (created by setup)
│   ├── classroom_rag.db # Database (created automatically)
│   └── chroma_db/       # AI vector database (created automatically)
├── frontend/            # React frontend
│   └── node_modules/    # Node dependencies (created by setup)
└── start-all.bat        # Quick start script
```

## 🎯 What to Try First

1. **Admin Panel:**
   - Create departments and semesters
   - Add users (students/professors)
   - View system analytics

2. **Professor Features:**
   - Create timetable entries
   - Mark attendance
   - Enter student marks
   - Upload textbooks (PDF files)

3. **Student Features:**
   - View your timetable
   - Check attendance records
   - View marks
   - Chat with AI about textbooks

## 🔒 Security Note

**Important:** The default passwords are for testing only!
- Change them before using in production
- Never share your `.env` file

## 💡 Tips

- **First time setup takes longer** (downloading dependencies)
- **AI features need internet** (first time only, to download models)
- **Keep both terminals open** while using the app
- **Use Chrome or Firefox** for best experience
- **Check backend logs** if something doesn't work

## 📞 Need Help?

If you encounter issues:
1. Check the error message in the terminal
2. Look at browser console (F12 → Console tab)
3. Check the main README.md for detailed documentation
4. Make sure all prerequisites are installed

## 🎉 You're All Set!

Enjoy exploring the Classroom Management System!

---

**Quick Commands Reference:**

```bash
# Start everything
start-all.bat  (Windows)
./start-all.sh (Mac/Linux)

# Start backend only
cd backend
venv\Scripts\activate  (Windows)
source venv/bin/activate  (Mac/Linux)
uvicorn main:app --reload

# Start frontend only
cd frontend
npm start

# Reinstall dependencies
cd backend
pip install -r requirements.txt
pip install -r requirements_textbooks.txt

cd frontend
npm install
```
