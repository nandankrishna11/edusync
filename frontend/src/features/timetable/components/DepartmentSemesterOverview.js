/**
 * Department-Semester Overview Component
 * Shows all departments and semesters with their timetable status
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { timetableService } from '../services/timetableService';

const DepartmentSemesterOverview = ({ onSelectDeptSem }) => {
  const { user, isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const departmentInfo = {
    CS: { name: 'Computer Science', color: 'bg-blue-500', icon: '💻' },
    ME: { name: 'Mechanical Engineering', color: 'bg-green-500', icon: '⚙️' },
    EC: { name: 'Electronics & Communication', color: 'bg-purple-500', icon: '📡' },
    CV: { name: 'Civil Engineering', color: 'bg-orange-500', icon: '🏗️' },
    EE: { name: 'Electrical Engineering', color: 'bg-yellow-500', icon: '⚡' },
    IT: { name: 'Information Technology', color: 'bg-indigo-500', icon: '🌐' },
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await timetableService.getDepartmentCombinations();
      
      // Transform data into array format
      const deptArray = Object.keys(data).map(deptCode => ({
        code: deptCode,
        name: departmentInfo[deptCode]?.name || deptCode,
        color: departmentInfo[deptCode]?.color || 'bg-gray-500',
        icon: departmentInfo[deptCode]?.icon || '📚',
        semesters: Object.keys(data[deptCode]).map(sem => ({
          number: parseInt(sem),
          sections: data[deptCode][sem] || ['A']
        })).sort((a, b) => a.number - b.number)
      }));
      
      setDepartments(deptArray);
    } catch (error) {
      setError('Failed to fetch department information');
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptSemClick = (deptCode, semester, section) => {
    onSelectDeptSem({ department: deptCode, semester, section });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Department & Semester Overview
        </h2>
        <p className="text-sm text-gray-600">Click on any semester to view its timetable</p>
      </div>

      {departments.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetables Found</h3>
          <p className="text-gray-500">Create some timetable entries to see departments and semesters here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map(dept => (
            <div key={dept.code} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              {/* Department Header */}
              <div className={`${dept.color} p-4 text-white`}>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{dept.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg">{dept.code}</h3>
                    <p className="text-sm opacity-90">{dept.name}</p>
                  </div>
                </div>
              </div>

              {/* Semesters Grid */}
              <div className="p-4">
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4,5,6,7,8].map(semNum => {
                    const semester = dept.semesters.find(s => s.number === semNum);
                    const hasData = !!semester;
                    
                    return (
                      <div key={semNum} className="relative">
                        {hasData ? (
                          <div className="space-y-1">
                            {semester.sections.map(section => (
                              <button
                                key={`${semNum}-${section}`}
                                onClick={() => handleDeptSemClick(dept.code, semNum, section)}
                                className="w-full p-2 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 transition-colors"
                                title={`${dept.code} - Semester ${semNum} (${section})`}
                              >
                                S{semNum}{section}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div 
                            className="w-full p-2 text-xs text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                            title="No timetable data"
                          >
                            S{semNum}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Department Stats */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{dept.semesters.length} Semesters</span>
                    <span>{dept.semesters.reduce((acc, sem) => acc + sem.sections.length, 0)} Sections</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-indigo-100 rounded mr-2"></div>
            <span>Has Timetable Data</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
            <span>No Data Available</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs">S{'{'}Number{'}'}{'{'}Section{'}'} = Semester & Section</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentSemesterOverview;