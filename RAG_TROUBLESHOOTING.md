# RAG System Troubleshooting Guide

## Issue: Student not getting results when querying "what is cloud computing"

### Diagnosis Results

✅ **Backend RAG System: WORKING**
- Textbooks uploaded: 2
- Vector embeddings: Generated
- Search functionality: Working
- Answer generation: Working
- Test query "what is cloud computing" returns proper answer

### What's Working:
1. PDF upload and processing ✓
2. Vector embedding generation ✓
3. ChromaDB vector search ✓
4. RAG answer generation ✓
5. Student subject opt-in ✓

### Possible Issues:

#### 1. Frontend Not Displaying Response
**Symptoms:** Backend returns answer but frontend shows nothing

**Check:**
- Open browser DevTools (F12)
- Go to Console tab
- Look for JavaScript errors
- Check Network tab for API call to `/api/rag/ask`
- Verify response status is 200
- Check response body contains `answer` field

**Fix:** If you see errors in console, share them

#### 2. Authentication Issue
**Symptoms:** 401 Unauthorized or 403 Forbidden

**Check:**
- Student is logged in
- Token is valid
- Student has opted into subjects

**Fix:**
```
1. Logout and login again
2. Go to "My Subjects" page
3. Select BCS501 subject
4. Click "Update Subjects"
5. Go back to Chat page
6. Try query again
```

#### 3. No Subjects Selected
**Symptoms:** Message says "Please select subjects first"

**Fix:**
1. Navigate to `/student/textbooks/my-subjects`
2. Check the BCS501 checkbox
3. Click "Update My Subjects" button
4. Go back to chat and try again

#### 4. Low Similarity Scores
**Current Status:** Similarity scores are ~22% (low but functional)

**Why:** The uploaded PDFs might be very short demo files

**Fix:** Upload longer, more comprehensive textbooks with more content

### Testing Steps:

#### Test 1: Check if textbooks are processed
```bash
cd backend
.\venv\Scripts\python.exe test_rag_system.py
```
Expected: Should show 2 textbooks with status "completed"

#### Test 2: Test RAG directly
```bash
cd backend
.\venv\Scripts\python.exe test_direct_rag.py
```
Expected: Should generate an answer about cloud computing

#### Test 3: Check backend logs
1. Look at the backend terminal window
2. When student submits a query, you should see:
   ```
   INFO: RAG Query from 4KV22CS090: what is cloud computing
   INFO: Subject codes: ['BCS501']
   INFO: Returning response with 2 sources
   ```

### Quick Fixes:

#### Fix 1: Restart Backend
```bash
# Close backend terminal
# Run:
start-backend.bat
```

#### Fix 2: Clear Browser Cache
```
1. Press Ctrl+Shift+Delete
2. Clear cached images and files
3. Reload page (Ctrl+F5)
```

#### Fix 3: Check Student Opt-In
```sql
-- Run in backend:
python -c "from database import SessionLocal; from models.models import StudentSubjectOptIn; db = SessionLocal(); opts = db.query(StudentSubjectOptIn).filter_by(student_usn='4KV22CS090', is_active=True).all(); print([o.subject_code for o in opts])"
```
Expected output: `['BCS501']`

### Common Error Messages:

| Error | Meaning | Solution |
|-------|---------|----------|
| "Please select subjects first" | No subjects opted in | Go to My Subjects and select BCS501 |
| "No textbooks are available" | No processed textbooks | Professor needs to upload textbooks |
| "I couldn't find relevant information" | Search returned no results | Upload better quality textbooks |
| 401 Unauthorized | Not logged in | Login again |
| 403 Forbidden | Wrong role | Must be logged in as student |

### Next Steps:

1. **Check browser console** for JavaScript errors
2. **Check Network tab** to see if API call is made
3. **Verify student has selected subjects** in My Subjects page
4. **Try with a different query** like "explain cloud computing benefits"
5. **Upload a longer PDF** with more content for better results

### Contact Points:

If issue persists, provide:
1. Screenshot of browser console errors
2. Screenshot of Network tab showing API response
3. Student user ID being used
4. Exact query being entered

---

**Status:** Backend is confirmed working. Issue is likely in:
- Frontend display logic
- Student not having subjects selected
- Browser caching old code
