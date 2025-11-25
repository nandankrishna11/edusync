# ✅ Pre-Share Checklist

Before sharing your project with friends, make sure you've completed these steps:

## 🔒 Security & Privacy

- [x] Remove `.env` file (keep only `.env.example`)
- [x] Remove database files (`*.db`, `*.sqlite`)
- [x] Remove uploaded files (`backend/uploads/`)
- [x] Remove vector database (`backend/chroma_db/`)
- [x] Remove Python cache (`__pycache__/`)
- [x] Verify `.gitignore` is properly configured
- [ ] Check for any personal information in code comments
- [ ] Remove any API keys or secrets from code

## 📦 Dependencies & Configuration

- [x] `requirements.txt` exists and is up to date
- [x] `requirements_textbooks.txt` exists
- [x] `package.json` exists in frontend
- [x] `.env.example` exists with sample configuration
- [x] `.gitignore` includes all necessary exclusions

## 📝 Documentation

- [x] `README.md` is comprehensive and clear
- [x] `SETUP_GUIDE.md` exists with step-by-step instructions
- [x] Default credentials are documented
- [x] Prerequisites are clearly listed
- [x] Troubleshooting section is included

## 🚀 Setup Scripts

- [x] `setup.bat` exists (Windows)
- [x] `setup.sh` exists (Mac/Linux)
- [x] `start-all.bat` exists (Windows)
- [x] `start-all.sh` exists (Mac/Linux)
- [x] `start-backend.bat` exists
- [x] `start-frontend.bat` exists

## 🧪 Testing

- [ ] Test fresh installation on clean machine
- [ ] Verify setup.bat works correctly
- [ ] Verify start-all.bat works correctly
- [ ] Test all user roles (Admin, Professor, Student)
- [ ] Test key features:
  - [ ] Login/Logout
  - [ ] Timetable creation
  - [ ] Attendance marking
  - [ ] Marks entry
  - [ ] Notifications
  - [ ] PDF upload
  - [ ] AI chat

## 📁 Files to Remove Before Sharing

Run these commands to clean up:

### Windows:
```cmd
# Remove database files
del /f backend\classroom_rag.db
del /f backend\*.sqlite3

# Remove uploads
rmdir /s /q backend\uploads

# Remove vector database
rmdir /s /q backend\chroma_db

# Remove environment file (keep .env.example)
del /f backend\.env
del /f frontend\.env

# Remove Python cache
for /d /r . %d in (__pycache__) do @if exist "%d" rmdir /s /q "%d"

# Remove node_modules (optional - will be reinstalled)
rmdir /s /q frontend\node_modules

# Remove venv (optional - will be recreated)
rmdir /s /q backend\venv
```

### Mac/Linux:
```bash
# Remove database files
rm -f backend/classroom_rag.db
rm -f backend/*.sqlite3

# Remove uploads
rm -rf backend/uploads

# Remove vector database
rm -rf backend/chroma_db

# Remove environment files
rm -f backend/.env
rm -f frontend/.env

# Remove Python cache
find . -type d -name "__pycache__" -exec rm -rf {} +

# Remove node_modules (optional)
rm -rf frontend/node_modules

# Remove venv (optional)
rm -rf backend/venv
```

## 📤 How to Share

### Option 1: ZIP File
1. Complete all checklist items above
2. Clean up unnecessary files
3. Create ZIP of entire project folder
4. Share via Google Drive, Dropbox, etc.
5. Include link to SETUP_GUIDE.md in your message

### Option 2: GitHub Repository
1. Complete all checklist items above
2. Commit all changes
3. Push to GitHub
4. Make repository public or add collaborators
5. Share repository URL

### Option 3: USB Drive
1. Complete all checklist items above
2. Clean up unnecessary files
3. Copy entire project folder to USB
4. Include a text file with setup instructions

## 📧 Message Template for Friends

```
Hey! 👋

I've built a Classroom Management System with AI-powered features. 
Here's how to set it up:

📥 Download/Clone the project
📖 Read SETUP_GUIDE.md for detailed instructions
🚀 Quick start:
   1. Run setup.bat (Windows) or ./setup.sh (Mac/Linux)
   2. Run start-all.bat (Windows) or ./start-all.sh (Mac/Linux)
   3. Open http://localhost:3000

🔐 Default login:
   Admin: admin / admin123
   Professor: prof_smith / prof123
   Student: 4KV22CS090 / password123

⚠️ Requirements:
   - Python 3.8+
   - Node.js 14+
   - 8GB RAM
   - 5GB disk space

📚 Features:
   ✅ Timetable Management
   ✅ Attendance Tracking
   ✅ Marks Management
   ✅ Notifications
   ✅ AI Textbook Chat (RAG)

Need help? Check README.md or SETUP_GUIDE.md

Enjoy! 🎉
```

## 🎯 Final Verification

Before sharing, verify:
1. [ ] Project runs on a fresh machine
2. [ ] All setup scripts work
3. [ ] Documentation is clear
4. [ ] No sensitive data included
5. [ ] All features work correctly
6. [ ] File size is reasonable (<100MB without node_modules/venv)

## 💡 Tips for Friends

Include these tips in your message:
- First setup takes 5-10 minutes (downloading dependencies)
- AI features need internet on first use (downloading models)
- Keep both terminal windows open while using
- Use Chrome or Firefox for best experience
- Check SETUP_GUIDE.md if anything doesn't work

---

**Ready to share?** Make sure all checkboxes are marked! ✅
