/**
 * Student Performance Page - View individual student performance
 */
import { useState } from 'react';
import { marksService } from '../services/marksService';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

const StudentPerformancePage = () => {
  const [studentId, setStudentId] = useState('');
  const [studentMarks, setStudentMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    try {
      setLoading(true);
      const data = await marksService.getStudentMarks(studentId.toUpperCase());
      setStudentMarks(data);
      setSearched(true);
    } catch (err) {
      console.error('Error fetching student marks:', err);
      setStudentMarks([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (studentMarks.length === 0) return null;

    const totalPercentage = studentMarks.reduce((sum, mark) => {
      return sum + (mark.marks_obtained / mark.max_marks) * 100;
    }, 0);

    const avgPercentage = totalPercentage / studentMarks.length;

    const subjectWise = {};
    studentMarks.forEach(mark => {
      if (!subjectWise[mark.subject_code]) {
        subjectWise[mark.subject_code] = [];
      }
      subjectWise[mark.subject_code].push(mark);
    });

    return {
      totalAssessments: studentMarks.length,
      avgPercentage: avgPercentage.toFixed(2),
      subjects: Object.keys(subjectWise).length,
      subjectWise
    };
  };

  const stats = calculateStats();

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 75) return 'bg-blue-100 text-blue-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Student Performance</h1>
        <p className="text-gray-600">View detailed student performance and marks</p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter Student ID (USN) - e.g., 4KV22CS001"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </Card>

      {/* Results */}
      {searched && (
        <>
          {studentMarks.length > 0 ? (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Assessments</p>
                    <p className="text-3xl font-bold text-indigo-600">{stats.totalAssessments}</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Average Score</p>
                    <p className="text-3xl font-bold text-green-600">{stats.avgPercentage}%</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Overall Grade</p>
                    <p className="text-3xl font-bold text-blue-600">{getGrade(stats.avgPercentage)}</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Subjects</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.subjects}</p>
                  </div>
                </Card>
              </div>

              {/* Subject-wise Performance */}
              <Card className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Subject-wise Performance</h2>
                <div className="space-y-4">
                  {Object.entries(stats.subjectWise).map(([subject, marks]) => {
                    const subjectAvg = marks.reduce((sum, m) => sum + (m.marks_obtained / m.max_marks) * 100, 0) / marks.length;
                    return (
                      <div key={subject} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-gray-900">{subject}</h3>
                          <Badge className={getGradeColor(subjectAvg)}>
                            {subjectAvg.toFixed(1)}% - {getGrade(subjectAvg)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {marks.map((mark, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="text-gray-600">{mark.assessment_type}: </span>
                              <span className="font-medium">{mark.marks_obtained}/{mark.max_marks}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Detailed Marks */}
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4">All Assessments</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Assessment</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Marks</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Percentage</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Grade</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {studentMarks.map((mark, idx) => {
                        const percentage = (mark.marks_obtained / mark.max_marks) * 100;
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(mark.assessment_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{mark.subject_code}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{mark.assessment_type}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {mark.marks_obtained}/{mark.max_marks}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{percentage.toFixed(1)}%</td>
                            <td className="px-4 py-3">
                              <Badge className={getGradeColor(percentage)}>{getGrade(percentage)}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 italic">
                              {mark.remarks || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No marks found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No assessment records found for student ID: {studentId}
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default StudentPerformancePage;
