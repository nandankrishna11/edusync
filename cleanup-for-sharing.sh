#!/bin/bash

echo "========================================"
echo "Cleanup Script - Prepare for Sharing"
echo "========================================"
echo ""
echo "This will remove:"
echo "- Database files"
echo "- Uploaded files"
echo "- Vector database"
echo "- Environment files (.env)"
echo "- Python cache"
echo "- Build artifacts"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

echo "[1/8] Removing database files..."
if [ -f "backend/classroom_rag.db" ]; then
    rm -f backend/classroom_rag.db
    echo "Removed classroom_rag.db"
fi
rm -f backend/*.sqlite3 2>/dev/null
echo ""

echo "[2/8] Removing uploaded files..."
if [ -d "backend/uploads" ]; then
    rm -rf backend/uploads
    echo "Removed uploads folder"
fi
echo ""

echo "[3/8] Removing vector database..."
if [ -d "backend/chroma_db" ]; then
    rm -rf backend/chroma_db
    echo "Removed chroma_db folder"
fi
echo ""

echo "[4/8] Removing environment files..."
if [ -f "backend/.env" ]; then
    rm -f backend/.env
    echo "Removed backend .env"
fi
if [ -f "frontend/.env" ]; then
    rm -f frontend/.env
    echo "Removed frontend .env"
fi
echo ""

echo "[5/8] Removing Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
echo "Removed Python cache"
echo ""

echo "[6/8] Removing log files..."
rm -f backend/*.log 2>/dev/null
echo "Removed log files"
echo ""

echo "[7/8] Removing build artifacts..."
if [ -d "frontend/build" ]; then
    rm -rf frontend/build
    echo "Removed frontend build folder"
fi
echo ""

echo "[8/8] Verifying cleanup..."
echo ""

if [ -f "backend/classroom_rag.db" ]; then
    echo "[WARN] Database file still exists"
else
    echo "[OK] Database removed"
fi

if [ -f "backend/.env" ]; then
    echo "[WARN] Backend .env still exists"
else
    echo "[OK] Backend .env removed"
fi

if [ -d "backend/uploads" ]; then
    echo "[WARN] Uploads folder still exists"
else
    echo "[OK] Uploads removed"
fi

if [ -d "backend/chroma_db" ]; then
    echo "[WARN] Vector database still exists"
else
    echo "[OK] Vector database removed"
fi

echo ""
echo "========================================"
echo "Cleanup Complete!"
echo "========================================"
echo ""
echo "Your project is now ready to share!"
echo ""
echo "Next steps:"
echo "1. Review PRE_SHARE_CHECKLIST.md"
echo "2. Test on a clean machine if possible"
echo "3. Create ZIP or push to GitHub"
echo "4. Share with friends!"
echo ""
echo "Note: Keep .env.example file - it's needed!"
echo "========================================"
echo ""
