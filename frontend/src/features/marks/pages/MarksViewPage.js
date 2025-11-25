/**
 * Marks View Page - View and manage all marks
 */
import { useState, useEffect } from 'react';
import { marksService } from '../services/marksService';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

const MarksViewPage = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subjectCode: '',
    assessmentType: '',
    searchStudent: ''
  });
  const [editingMark, setEditingMark] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const data = await marksService.getProfessorMarks();
      setMarks(data);
    } catch (err) {
      console.error('Error fetching marks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mark) => {
    setEditingMark(mark.id);
    setEditFormData({
      marks_obtained: mark.marks_obtained,
      max_marks: mark.max_marks,
      remarks: mark.remarks || ''
    });
  };

  const handleUpdate = async (markId) => {
    try {
      await marksService.updateMark(markId, editFormData);
      setEditingMark(null);
      fetchMarks();
    } catch (err) {
      console.error('Error updating mark:', err);
    }
  };

  const handleDelete = async (markId) => {
    if (window.confirm('Are you sure you want to delete this mark entry?')) {
      try {
        await marksService.deleteMark(markId);
        fetchMarks();
      } catch (err) {
        console.error('Error deleting mark:', err);
      }
    }
  };

  const filteredMarks = marks.filter(mark => {
    if (filters.subjectCode && !mark.subject_code.includes(filters.subjectCode.toUpperCase())) return false;
    if (filters.assessmentType && mark.assessment_type !== filters.assessmentType) return false;
    if (filters.searchStudent && !mark.student_id.includes(filters.searchStudent.toUpperCase())) return false;
    return true;
  });

  const getPercentage = (obtained, max) => ((obtained / max) * 100).toFixed(1);

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Marks Management</h1>
        <p className="text-gray-600">View and manage student marks</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject Code
            </label>
            <input
              type="text"
              value={filters.subjectCode}
              onChange={(e) => setFilters({...filters, subjectCode: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Filter by subject..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assessment Type
            </label>
            <select
              value={filters.assessmentType}
              onChange={(e) => setFilters({...filters, assessmentType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
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
              Student ID
            </label>
            <input
              type="text"
              value={filters.searchStudent}
              onChange={(e) => setFilters({...filters, searchStudent: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Search student..."
            />
          </div>
        </div>
      </Card>

      {/* Marks List */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            All Marks ({filteredMarks.length})
          </h2>
        </div>

        {filteredMarks.length > 0 ? (
          <div className="space-y-3">
            {filteredMarks.map((mark) => {
              const percentage = getPercentage(mark.marks_obtained, mark.max_marks);
              const isEditing = editingMark === mark.id;

              return (
                <div key={mark.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{mark.student_id}</h3>
                        <Badge variant="info">{mark.subject_code}</Badge>
                        <Badge variant="default">{mark.assessment_type}</Badge>
                      </div>
                      
                      {isEditing ? (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <input
                            type="number"
                            step="0.5"
                            value={editFormData.marks_obtained}
                            onChange={(e) => setEditFormData({...editFormData, marks_obtained: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Marks"
                          />
                          <input
                            type="number"
                            step="0.5"
                            value={editFormData.max_marks}
                            onChange={(e) => setEditFormData({...editFormData, max_marks: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Max Marks"
                          />
                          <input
                            type="text"
                            value={editFormData.remarks}
                            onChange={(e) => setEditFormData({...editFormData, remarks: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Remarks"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className={`text-2xl font-bold ${getGradeColor(percentage)}`}>
                            {mark.marks_obtained}/{mark.max_marks}
                          </span>
                          <span className="text-lg text-gray-600">({percentage}%)</span>
                          {mark.remarks && (
                            <span className="text-sm text-gray-500 italic">"{mark.remarks}"</span>
                          )}
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-500 mt-2">
                        Date: {new Date(mark.assessment_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleUpdate(mark.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMark(null)}
                            className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(mark)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(mark.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No marks found</p>
        )}
      </Card>
    </div>
  );
};

export default MarksViewPage;
