# 🎓 Classroom Management System

A comprehensive web-based classroom management system built with React and FastAPI, featuring attendance tracking, timetable management, marks management, notifications, and AI-powered textbook assistance.

## ✨ Features

### 👨‍🎓 For Students
- View personal timetable and class schedules
- Track attendance records
- View marks and academic performance
- Receive real-time notifications
- Access AI-powered textbook chat and search
- Upload and manage study materials

### 👨‍🏫 For Professors
- Manage class timetables
- Mark student attendance
- Enter and manage student marks
- Send notifications to students
- Cancel classes with automatic notifications
- Upload textbooks and course materials
- View department-wide schedules

### 👨‍💼 For Administrators
- Complete user management (students, professors)
- Department and semester management
- System-wide timetable oversight
- Attendance and marks analytics
- Bulk operations and reporting
- Notification broadcasting

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd classroom-management-system
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your configuration
```

3. **Start the application**
```bash
# Windows
start-all.bat

# Or start individually:
start-backend.bat
start-frontend.bat
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Default Login Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**Professor:**
- Username: `prof_smith`
- Password: `prof123`

**Student:**
- Username: `student_john`
- Password: `student123`

## 🏗️ Tech Stack

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Axios
- Lucide React Icons

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- ChromaDB (Vector Store)
- Sentence Transformers
- PyPDF2

### Database
- SQLite (Development)
- PostgreSQL (Production Ready)

## 📁 Project Structure

```
classroom-management-system/
├── backend/
│   ├── modules/
│   │   ├── auth/           # Authentication & user management
│   │   ├── timetable/      # Timetable management
│   │   ├── attendance/     # Attendance tracking
│   │   ├── marks/          # Marks management
│   │   ├── notifications/  # Notification system
│   │   ├── textbooks/      # AI textbook features
│   │   └── analytics/      # Analytics & reporting
│   ├── models/             # Database models
│   ├── schemas/            # Pydantic schemas
│   └── main.py            # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── features/      # Feature modules
│   │   ├── components/    # Shared components
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
│   └── public/
└── start-all.bat          # Quick start script
```

## 🔧 Configuration

### Backend Configuration
Edit `backend/.env`:
```env
DATABASE_URL=sqlite:///./database.db
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key  # Optional for AI features
```

### Frontend Configuration
Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8000
```

## 📚 Key Features

### Timetable Management
- Create and manage class schedules
- Department and semester-wise views
- Conflict detection
- Bulk operations

### Attendance System
- Quick attendance marking
- Bulk attendance creation
- Attendance reports and analytics
- Student attendance history

### Marks Management
- Enter marks by subject and exam type
- Student performance tracking
- Grade calculations
- Export capabilities

### Notification System
- Real-time notifications
- Role-based notifications
- Class cancellation alerts
- System announcements

### AI Textbook Assistant
- Upload PDF textbooks
- AI-powered chat with textbooks
- Semantic search across materials
- Source citations and references

## 🛠️ Development

### Backend Development
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

## 📝 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with FastAPI and React
- AI features powered by Sentence Transformers
- UI components styled with Tailwind CSS

---

**Note:** Change default passwords before deploying to production!
