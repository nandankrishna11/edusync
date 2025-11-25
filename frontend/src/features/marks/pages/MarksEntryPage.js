/**
 * Marks Entry Page - Professor enters marks for students
 */
import { useState, useEffect } from 'react';
import { marksService } from '../services/marksService';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

const MarksEntryPage = () => {
  const [formData, setFormData] = useState({
    student_id: '',
    subject_code: '',
    assessment_type: 'Test1',
    assessment_name: '',
    marks_obtained: '',
    max_marks: '100',
    assessment_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [recentMarks, setRecentMarks] = useState([]);

  useEffect(() => {
    fetchRecentMarks();
  }, []);

  const fetchRecentMarks = async () => {
    try {
      const marks = await marksService.getProfessorMarks();
      setRecentMarks(marks.slice(0, 10));
    } catch (err) {
      console.error('Error fetching marks:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await marksService.createMark({
        ...formData,
        marks_obtained: parseFloat(formData.marks_obtained),
        max_marks: parseFloat(formData.max_marks)
      });
      
      setSuccess('Marks entered successfully!');
      setFormData({
        ...formData,
        student_id: '',
        marks_obtained: '',
        remarks: ''
      });
      fetchRecentMarks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to enter marks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Marks Entry</h1>
        <p className="text-gray-600">Enter student marks and grades</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entry Form */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Enter Marks</h2>
          
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID (USN) *
              </label>
              <input
                type="text"
                value={formData.student_id}
                onChange={(e) => setFormData({...formData, student_id: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="4KV22CS001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                value={formData.subject_code}
                onChange={(e) => setFormData({...formData, subject_code: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="BCS301"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment Type *
                </label>
                <select
                  value={formData.assessment_type}
                  onChange={(e) => setFormData({...formData, assessment_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="Test1">Test 1</option>
                  <option value="Test2">Test 2</option>
                  <option value="Test3">Test 3</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Project">Project</option>
                  <option value="Practical">Practical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment Date
                </label>
                <input
                  type="date"
                  value={formData.assessment_date}
                  onChange={(e) => setFormData({...formData, assessment_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marks Obtained *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.marks_obtained}
                  onChange={(e) => setFormData({...formData, marks_obtained: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="85"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Marks *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.max_marks}
                  onChange={(e) => setFormData({...formData, max_marks: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks (Optional)
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows="2"
                placeholder="Additional comments..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Saving...' : 'Save Marks'}
            </button>
          </form>
        </Card>

        {/* Recent Entries */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Entries</h2>
          <div className="space-y-3">
            {recentMarks.length > 0 ? (
              recentMarks.map((mark) => (
                <div key={mark.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{mark.student_id}</p>
                      <p className="text-sm text-gray-600">{mark.subject_code}</p>
                    </div>
                    <Badge variant="info">{mark.assessment_type}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-indigo-600">
                      {mark.marks_obtained}/{mark.max_marks}
                    </span>
                    <span className="text-sm text-gray-500">
                      {((mark.marks_obtained / mark.max_marks) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No marks entered yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MarksEntryPage;
