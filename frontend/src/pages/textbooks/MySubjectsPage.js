import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle } from '../../features/textbooks/components/Icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { chatService } from '../../features/textbooks/services/chatService';

const MySubjectsPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await chatService.getSubjects();
      setSubjects(data.available_subjects);
      setSelectedSubjects(data.opted_subjects.map(s => s.subject_code));
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectCode) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectCode)
        ? prev.filter(s => s !== subjectCode)
        : [...prev, subjectCode]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await chatService.optInSubjects(selectedSubjects);
      navigate('/student/textbooks/chat');
    } catch (err) {
      alert('Failed to save subjects: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Subjects</h1>
              <p className="text-gray-600 mt-1">
                Select subjects to enable AI-powered textbook search
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">How it works</h3>
              <p className="text-sm text-gray-700">
                Select the subjects you want to include in your AI textbook search. 
                You can only search textbooks from subjects you've opted into. 
                You can change your selection anytime.
              </p>
            </div>
          </div>
        </Card>

        {/* Subject Selection */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Available Subjects ({subjects.length})
          </h2>
          
          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No subjects available</h3>
              <p className="text-gray-600 mb-4">
                Subjects will appear here once your professors upload textbooks.
              </p>
              <p className="text-sm text-gray-500">
                Contact your administrator if you believe this is an error.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map(subject => (
                <button
                  key={subject.subject_code}
                  onClick={() => toggleSubject(subject.subject_code)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedSubjects.includes(subject.subject_code)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedSubjects.includes(subject.subject_code)
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedSubjects.includes(subject.subject_code) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {subject.subject_code}
                          </h3>
                          <p className="text-sm text-gray-600">{subject.subject_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">
                        {subject.department_code}
                      </div>
                      <div className="text-xs text-gray-500">
                        Sem {subject.semester}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/student/dashboard')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || selectedSubjects.length === 0}
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySubjectsPage;
