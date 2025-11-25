/**
 * Student Marks Page - View marks assigned by professors
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { marksService } from '../services/marksService';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

const StudentMarksPage = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user?.user_id) {
      fetchMarks();
    }
  }, [user]);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const data = await marksService.getStudentMarks(user.user_id);
      setMarks(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error fetching marks:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (marksData) => {
    if (marksData.length === 0) {
      setStats(null);
      return;
    }

    const totalPercentage = marksData.reduce((sum, mark) => {
      return sum + (mark.marks_obtained / mark.max_marks) * 100;
    }, 0);

    const avgPercentage = totalPercentage / marksData.length;

    // Group by subject
    const subjectWise = {};
    marksData.forEach(mark => {
      if (!subjectWise[mark.subject_code]) {
        subjectWise[mark.subject_code] = {
          marks: [],
          total: 0,
          count: 0
        };
      }
      const percentage = (mark.marks_obtained / mark.max_marks) * 100;
      subjectWise[mark.subject_code].marks.push(mark);
      subjectWise[mark.subject_code].total += percentage;
      subjectWise[mark.subject_code].count += 1;
    });

    setStats({
      totalAssessments: marksData.length,
      avgPercentage: avgPercentage.toFixed(2),
      subjects: Object.keys(subjectWise).length,
      subjectWise
    });
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

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800 border-green-300';
    if (percentage >= 75) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (percentage >= 40) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const filteredMarks = filter === 'all' 
    ? marks 
    : marks.filter(m => m.subject_code === filter);

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
        <h1 className="text-3xl font-bold text-gray-900">My Marks</h1>
        <p className="text-gray-600">View your academic performance and grades</p>
      </div>

      {marks.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No marks yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your professors haven't entered any marks yet. Check back later!
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Statistics Cards */}
          {stats && (
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
          )}

          {/* Filter */}
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Subject:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Subjects</option>
                {stats && Object.keys(stats.subjectWise).map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Subject-wise Performance */}
          {stats && filter === 'all' && (
            <Card className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Subject-wise Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(stats.subjectWise).map(([subject, data]) => {
                  const subjectAvg = data.total / data.count;
                  return (
                    <div key={subject} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-900">{subject}</h3>
                        <Badge className={`${getGradeColor(subjectAvg)} border`}>
                          {subjectAvg.toFixed(1)}% - {getGrade(subjectAvg)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{data.count} assessments</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Marks List */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {filter === 'all' ? 'All Marks' : `${filter} Marks`} ({filteredMarks.length})
            </h2>
            <div className="space-y-3">
              {filteredMarks.map((mark) => {
                const percentage = (mark.marks_obtained / mark.max_marks) * 100;
                return (
                  <div key={mark.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{mark.subject_code}</h3>
                          <Badge variant="info">{mark.assessment_type}</Badge>
                          {mark.assessment_name && (
                            <span className="text-sm text-gray-600">- {mark.assessment_name}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Date: {new Date(mark.assessment_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        {mark.remarks && (
                          <p className="text-sm text-gray-600 italic mt-1">"{mark.remarks}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-3xl font-bold text-indigo-600">
                            {mark.marks_obtained}
                          </span>
                          <span className="text-lg text-gray-500">/ {mark.max_marks}</span>
                        </div>
                        <Badge className={`${getGradeColor(percentage)} border text-sm`}>
                          {percentage.toFixed(1)}% - {getGrade(percentage)}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          percentage >= 90 ? 'bg-green-500' :
                          percentage >= 75 ? 'bg-blue-500' :
                          percentage >= 60 ? 'bg-yellow-500' :
                          percentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default StudentMarksPage;
