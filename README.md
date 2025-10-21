# Classroom + RAG Web App

A modern, full-stack classroom management system with RAG (Retrieval-Augmented Generation) capabilities, built with FastAPI and React.

## 🚀 Features

### Core Functionality
- **Role-Based Authentication** - Secure login/registration with JWT tokens and RBAC
- **User Management** - Complete user lifecycle management with role assignments
- **Dynamic Timetable** - Real-time class scheduling with role-based permissions
- **Attendance Management** - Comprehensive tracking with role-specific access
- **Notifications System** - Multi-type notifications with role-based filtering
- **Analytics Dashboard** - Interactive charts with permission-based data access
- **AI Insights** - RAG-powered intelligent analysis for authorized users

### Technical Highlights
- **Modular Architecture** - Clean separation of concerns with feature-based modules
- **Real-time Updates** - Live data synchronization across all views
- **Responsive Design** - Mobile-first UI with Tailwind CSS
- **Professional UI/UX** - Dribbble-inspired design system
- **Comprehensive Testing** - Unit and integration test coverage
- **Production Ready** - Scalable architecture with best practices

## 🏗️ Architecture

### Backend (FastAPI)
```
backend/
├── core/                 # Core configuration and settings
├── database.py          # Database connection and session management
├── modules/             # Feature modules
│   ├── auth/           # Authentication (JWT, user management)
│   ├── timetable/      # Class scheduling and cancellations
│   ├── attendance/     # Student attendance tracking
│   ├── notifications/  # Multi-type notification system
│   ├── analytics/      # Data analysis and insights
│   └── ai_insights/    # RAG-powered AI features
└── tests/              # Comprehensive test suite
```

### Frontend (React)
```
frontend/src/
├── features/           # Feature-based modules
│   ├── auth/          # Authentication components and hooks
│   ├── timetable/     # Timetable management UI
│   ├── attendance/    # Attendance tracking interface
│   ├── notifications/ # Notification system UI
│   ├── analytics/     # Analytics dashboard
│   └── ai_insights/   # AI-powered insights panel
├── components/        # Shared UI components
├── api/              # API client and configuration
├── hooks/            # Custom React hooks
└── styles/           # Global styles and theme
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **Pydantic** - Data validation using Python type annotations
- **JWT** - JSON Web Tokens for authentication
- **SQLite/PostgreSQL** - Database options
- **Sentence Transformers** - AI embeddings for RAG
- **FAISS** - Vector similarity search

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Recharts** - Responsive chart library
- **Context API** - State management

### Development Tools
- **Uvicorn** - ASGI server for FastAPI
- **Pytest** - Python testing framework
- **Jest** - JavaScript testing framework
- **ESLint** - Code linting and formatting

## 🚀 Quick Start

### One-Click Setup (Recommended)
```bash
python quick-setup.py
```

### Easy Startup (Windows)
- Double-click `start-all.bat` (starts both servers)
- Or use `start-backend.bat` and `start-frontend.bat` separately

### Manual Setup
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python init_auth.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm start
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Default Login Credentials
- **Admin**: `admin` / `admin123`
- **Professor**: `prof_smith` / `prof123`
- **Student**: `student_john` / `student123`

## 📊 Key Features

### 1. Role-Based Authentication System
- **Three User Roles**: Student, Professor, Admin with distinct permissions
- **JWT Token Authentication**: Secure token-based authentication with auto-refresh
- **User Management**: Complete CRUD operations for user accounts (admin only)
- **Password Security**: Bcrypt hashing with password change functionality
- **Protected Routes**: Frontend and backend route protection based on roles
- **Permission System**: Fine-grained permissions for different operations

#### User Role Permissions:
- **Students**: View classes, timetables, personal attendance, notifications, update profile
- **Professors**: All student features + create/manage classes, mark attendance, send notifications, view analytics
- **Admins**: All professor features + user management, system administration

### 2. Dynamic Timetable
- Real-time class scheduling
- Professor cancellation capabilities with reasons
- Student view with cancellation alerts
- Dashboard integration with next class notifications

### 3. Attendance Management
- Comprehensive attendance tracking
- Bulk attendance operations
- Statistical analysis and reporting
- Historical attendance records

### 4. Notifications System
- Multi-type notifications (cancellations, resources, notices)
- Read/unread status tracking
- Class-specific and broadcast notifications
- Real-time notification updates

### 5. Analytics Dashboard
- Interactive attendance charts
- Performance trend analysis
- Class-wise statistics
- Student engagement metrics

### 6. AI Insights (RAG)
- Intelligent performance analysis
- Data-driven recommendations
- Trend identification and predictions
- Natural language insights generation

## 🎨 Design System

### Color Palette
- **Background**: #F7F8FC (Light theme)
- **Primary**: #5C6AC4 (Soft indigo)
- **Secondary**: #7E8AFF (Lighter blue/lavender)
- **Card Background**: #FFFFFF (Pure white)
- **Text Primary**: #2F304A (Dark slate)
- **Text Secondary**: #6E6E85 (Muted gray)
- **Success**: #4CB963 (Green)
- **Error**: #FF6B6B (Soft red)

### Design Principles
- **20px border radius** for all cards and components
- **Soft shadows** with hover effects
- **Poppins font family** throughout
- **Generous spacing** (16px base grid)
- **Smooth transitions** (300ms) on all interactions

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
python integration_test.py
```

## 📈 Performance

- **API Response Time**: <500ms for all endpoints
- **Database Queries**: Optimized with proper indexing
- **Frontend Rendering**: 60fps smooth animations
- **Real-time Updates**: 30-second polling intervals
- **Bundle Size**: Optimized with code splitting

## 🔒 Security

- **JWT Authentication** with secure token handling
- **Input Validation** using Pydantic schemas
- **SQL Injection Prevention** via SQLAlchemy ORM
- **CORS Configuration** for controlled access
- **Environment Variables** for sensitive configuration

## 🚀 Deployment

### Backend (Production)
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (Production)
```bash
# Build production bundle
npm run build

# Serve with static file server
npx serve -s build -l 3000
```

## 📞 API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation with:
- Complete endpoint documentation
- Request/response schemas
- Interactive testing interface
- Authentication examples

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Phase 1: Core Features ✅
- Authentication system
- Basic timetable management
- Attendance tracking

### Phase 2: Advanced Features ✅
- Real-time notifications
- Analytics dashboard
- AI insights integration

### Phase 3: Enhancement (Planned)
- Mobile app (React Native)
- Advanced AI features
- Integration with external LMS
- Real-time chat system
- Video conferencing integration

## 📧 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/docs`
- Review the comprehensive test suite for examples

---

