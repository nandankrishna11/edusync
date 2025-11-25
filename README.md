# 🎓 EDUSYNC - KVG College of Engineering Classroom Management System

A comprehensive web-based classroom management system built with React and FastAPI, featuring attendance tracking, timetable management, marks management, notifications, and AI-powered textbook assistance with RAG (Retrieval-Augmented Generation).

**Personalized for KVG College of Engineering Students**

## ✨ Features

### 👨‍🎓 For Students
- **Timetable:** View personal class schedules and department-wide timetables
- **Attendance:** Track attendance records and view statistics
- **Marks:** View marks, grades, and academic performance analytics
- **Notifications:** Receive real-time notifications about classes, exams, and announcements
- **AI Textbook Chat:** Ask questions and get AI-powered answers from uploaded textbooks
- **Textbook Library:** Browse, search, and access course materials
- **Subject Management:** Select subjects to personalize textbook access

### 👨‍🏫 For Professors
- **Timetable Management:** Create and manage class schedules
- **Attendance Marking:** Quick attendance marking with bulk operations
- **Marks Entry:** Enter and manage student marks by subject and exam type
- **Notifications:** Send targeted notifications to students
- **Class Cancellation:** Cancel classes with automatic student notifications
- **Textbook Upload:** Upload PDF textbooks for AI-powered student assistance
- **Analytics:** View attendance and performance statistics

### 👨‍💼 For Administrators
- **User Management:** Create and manage students, professors, and admin accounts
- **Department Management:** Organize departments and semesters
- **System Oversight:** Monitor timetables, attendance, and marks across all departments
- **Bulk Operations:** Import/export data and perform bulk updates
- **Analytics Dashboard:** System-wide reports and insights
- **Notification Broadcasting:** Send announcements to all users

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (with pip)
- Node.js 14+ (with npm)
- 4GB RAM minimum (8GB recommended for AI features)

### Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd classroom-management-system
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration (optional for basic setup)
```

3. **Start the application**

**Windows:**
```bash
start-all.bat
```

**Linux/Mac:**
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements_textbooks.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (in new terminal)
cd frontend
npm install
npm start
```

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

### Default Login Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**Professor:**
- Username: `prof_smith`
- Password: `prof123`

**Student:**
- Username: `4KV22CS090` (or other student USN)
- Password: `password123`

> ⚠️ **Important:** Change default passwords before deploying to production!

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation
- **Passlib & Bcrypt** - Password hashing
- **JWT** - Authentication

### AI & RAG System
- **ChromaDB** - Vector database
- **Sentence Transformers** - Text embeddings (all-MiniLM-L6-v2)
- **Transformers** - NLP models
- **PyPDF2** - PDF processing
- **Torch** - Deep learning backend

### Database
- **SQLite** - Development (included)
- **PostgreSQL** - Production ready

## 📁 Project Structure

```
classroom-management-system/
├── backend/
│   ├── modules/
│   │   ├── auth/              # Authentication & authorization
│   │   ├── timetable/         # Timetable management
│   │   ├── attendance/        # Attendance tracking
│   │   ├── marks/             # Marks management
│   │   ├── notifications/     # Notification system
│   │   ├── textbooks/         # AI textbook features (RAG)
│   │   ├── analytics/         # Analytics & reporting
│   │   └── semester/          # Semester management
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   ├── utils/                 # Utility functions
│   ├── chroma_db/             # Vector database storage
│   ├── main.py                # FastAPI application
│   ├── database.py            # Database configuration
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── features/          # Feature-based modules
│   │   │   ├── auth/          # Authentication
│   │   │   ├── timetable/     # Timetable features
│   │   │   ├── marks/         # Marks features
│   │   │   └── textbooks/     # Textbook & AI chat
│   │   ├── components/        # Shared components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── hooks/             # Custom React hooks
│   └── public/
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 🔧 Configuration

### Backend Configuration

Create `backend/.env`:
```env
# Database
DATABASE_URL=sqlite:///./classroom_rag.db

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Features (Optional - uses local models by default)
OPENAI_API_KEY=your-openai-key  # Only if using OpenAI
```

### Frontend Configuration

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8000
```

## 📚 Key Features Explained

### 1. AI-Powered Textbook Assistant (RAG System)

The system uses Retrieval-Augmented Generation to provide intelligent answers from uploaded textbooks:

**How it works:**
1. Professors upload PDF textbooks
2. System extracts and chunks text content
3. Generates vector embeddings using Sentence Transformers
4. Stores embeddings in ChromaDB vector database
5. Students ask questions in natural language
6. System retrieves relevant chunks using semantic search
7. Generates contextual answers with source citations

**Features:**
- Semantic search across all course materials
- Source citations with page numbers
- Subject-specific filtering
- Chat history tracking
- Multi-document querying

### 2. Timetable Management

- Create class schedules with time slots
- Department and semester-wise organization
- Conflict detection and validation
- Bulk timetable generation
- Export and print capabilities

### 3. Attendance System

- Quick attendance marking interface
- Bulk attendance creation
- Attendance percentage calculation
- Student attendance history
- Department-wide reports
- Export to CSV/Excel

### 4. Marks Management

- Enter marks by subject and exam type
- Automatic grade calculation
- Student performance analytics
- Semester-wise tracking
- Export capabilities
- Performance trends

### 5. Notification System

- Real-time notifications
- Role-based targeting
- Class cancellation alerts
- System announcements
- Read/unread status
- Notification history

## 🛠️ Development

### Backend Development

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements_textbooks.txt

# Run development server
uvicorn main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Database Management

**Initialize database:**
```bash
cd backend
python -c "from database import engine; from models.models import Base; Base.metadata.create_all(bind=engine)"
```

**Reset database:**
```bash
# Delete classroom_rag.db file
# Run initialization again
```

## 📖 API Documentation

Once the backend is running, access interactive API documentation:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key API Endpoints

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

**Timetable:**
- `GET /api/timetable` - Get timetables
- `POST /api/timetable` - Create timetable entry
- `PUT /api/timetable/{id}` - Update timetable
- `DELETE /api/timetable/{id}` - Delete timetable

**Attendance:**
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/student/{usn}` - Student attendance

**Marks:**
- `GET /api/marks` - Get marks
- `POST /api/marks` - Enter marks
- `GET /api/marks/student/{usn}` - Student marks

**Textbooks (RAG):**
- `POST /api/textbooks/upload` - Upload textbook
- `POST /api/rag/ask` - Ask question
- `GET /api/textbooks` - List textbooks
- `POST /api/textbooks/opt-in` - Select subjects

## 🧪 Testing

### Test RAG System

```bash
cd backend
python test_rag_system.py
```

### Manual Testing Checklist

- [ ] User login (all roles)
- [ ] Timetable creation and viewing
- [ ] Attendance marking
- [ ] Marks entry
- [ ] Notification sending
- [ ] PDF upload
- [ ] AI chat functionality
- [ ] Subject selection

## 🐛 Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

**Database errors:**
- Delete `classroom_rag.db` and restart backend
- Check file permissions

**AI features not working:**
- Ensure `requirements_textbooks.txt` is installed
- Check available disk space (models need ~500MB)
- Verify ChromaDB folder has write permissions

### Frontend Issues

**Port 3000 already in use:**
```bash
# Change port in package.json or:
PORT=3001 npm start
```

**API connection errors:**
- Verify backend is running at http://localhost:8000
- Check CORS settings in backend
- Verify `.env` file has correct API URL

### RAG System Issues

**No results from AI chat:**
1. Check if textbooks are uploaded and processed
2. Verify student has selected subjects in "My Subjects"
3. Check browser console for errors
4. Ensure ChromaDB has write permissions

**Slow AI responses:**
- First query loads models (30-60 seconds)
- Subsequent queries are faster
- Consider using GPU for better performance

## 🚀 Deployment

### Production Checklist

- [ ] Change all default passwords
- [ ] Set strong SECRET_KEY in .env
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure file upload limits
- [ ] Set up backup strategy
- [ ] Enable logging and monitoring
- [ ] Use environment variables for secrets
- [ ] Set up reverse proxy (nginx)

### Environment Variables for Production

```env
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=<generate-strong-random-key>
ALLOWED_ORIGINS=https://yourdomain.com
DEBUG=False
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **FastAPI** - Modern Python web framework
- **React** - UI library
- **ChromaDB** - Vector database
- **Sentence Transformers** - Embedding models
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide** - Beautiful icon set

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review API documentation at `/docs`
- Check browser console for frontend errors
- Review backend logs for API errors

---

**Built with ❤️ for KVG College of Engineering**

*EDUSYNC - Empowering Education Through Technology*

*Last updated: November 2025*
