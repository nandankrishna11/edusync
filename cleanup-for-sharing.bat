@echo off
echo ========================================
echo Cleanup Script - Prepare for Sharing
echo ========================================
echo.
echo This will remove:
echo - Database files
echo - Uploaded files
echo - Vector database
echo - Environment files (.env)
echo - Python cache
echo - Build artifacts
echo.
echo Press Ctrl+C to cancel, or
pause
echo.

echo [1/8] Removing database files...
if exist "backend\classroom_rag.db" (
    del /f "backend\classroom_rag.db"
    echo Removed classroom_rag.db
)
if exist "backend\*.sqlite3" (
    del /f "backend\*.sqlite3"
    echo Removed SQLite files
)
echo.

echo [2/8] Removing uploaded files...
if exist "backend\uploads" (
    rmdir /s /q "backend\uploads"
    echo Removed uploads folder
)
echo.

echo [3/8] Removing vector database...
if exist "backend\chroma_db" (
    rmdir /s /q "backend\chroma_db"
    echo Removed chroma_db folder
)
echo.

echo [4/8] Removing environment files...
if exist "backend\.env" (
    del /f "backend\.env"
    echo Removed backend .env
)
if exist "frontend\.env" (
    del /f "frontend\.env"
    echo Removed frontend .env
)
echo.

echo [5/8] Removing Python cache...
for /d /r . %%d in (__pycache__) do @if exist "%%d" (
    rmdir /s /q "%%d"
    echo Removed %%d
)
echo.

echo [6/8] Removing log files...
if exist "backend\*.log" (
    del /f "backend\*.log"
    echo Removed log files
)
echo.

echo [7/8] Removing build artifacts...
if exist "frontend\build" (
    rmdir /s /q "frontend\build"
    echo Removed frontend build folder
)
echo.

echo [8/8] Verifying cleanup...
echo.
if exist "backend\classroom_rag.db" (
    echo [WARN] Database file still exists
) else (
    echo [OK] Database removed
)

if exist "backend\.env" (
    echo [WARN] Backend .env still exists
) else (
    echo [OK] Backend .env removed
)

if exist "backend\uploads" (
    echo [WARN] Uploads folder still exists
) else (
    echo [OK] Uploads removed
)

if exist "backend\chroma_db" (
    echo [WARN] Vector database still exists
) else (
    echo [OK] Vector database removed
)

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Your project is now ready to share!
echo.
echo Next steps:
echo 1. Review PRE_SHARE_CHECKLIST.md
echo 2. Test on a clean machine if possible
echo 3. Create ZIP or push to GitHub
echo 4. Share with friends!
echo.
echo Note: Keep .env.example file - it's needed!
echo ========================================
echo.
pause
