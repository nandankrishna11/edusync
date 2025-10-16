import React, { useState, useEffect } from 'react';
import AttendanceCard from './AttendanceCard';
import { 
  getAttendanceRecords, 
  updateAttendanceRecord, 
  deleteAttendanceRecord,
  getClassAttendanceStats,
  getStudentAttendanceStats 
} from '../services/api';


const AttendanceList = ({ classId = null, studentId = null }) => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    limit: 50
  });

  useEffect(() => {
    fetchRecords();
    fetchStats();
  }, [classId, studentId, filters]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const filterParams = {
        ...filters,
        class_id: classId,
        student_id: studentId
      };
      
      // Remove empty filters
      Object.keys(filterParams).forEach(key => {
        if (filterParams[key] === '' || filterParams[key] === null || filterParams[key] === undefined) {
          delete filterParams[key];
        }
      });

      const data = await getAttendanceRecords(filterParams);
      setRecords(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch attendance records');
      console.error('Error fetching attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      let statsData = null;
      if (classId) {
        statsData = await getClassAttendanceStats(classId);
      } else if (studentId) {
        statsData = await getStudentAttendanceStats(studentId);
      }
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching attendance stats:', err);
    }
  };

  const handleUpdate = async (recordId, updateData) => {
    try {
      await updateAttendanceRecord(recordId, updateData);
      setRecords(prev => 
        prev.map(record => 
          record.id === recordId 
            ? { ...record, ...updateData }
            : record
        )
      );
      fetchStats(); // Refresh stats
    } catch (err) {
      console.error('Error updating attendance record:', err);
      alert('Failed to update attendance record');
    }
  };

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await deleteAttendanceRecord(recordId);
        setRecords(prev => prev.filter(record => record.id !== recordId));
        fetchStats(); // Refresh stats
      } catch (err) {
        console.error('Error deleting attendance record:', err);
        alert('Failed to delete attendance record');
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusCounts = () => {
    const counts = {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      cancelled: records.filter(r => r.status === 'cancelled').length
    };
    return counts;
  };

  if (loading) {
    return (
      <div className="attendance-loading">
        <div className="loading-spinner"></div>
        <p>Loading attendance records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-error">
        <p>❌ {error}</p>
        <button className="btn btn-primary" onClick={fetchRecords}>
          Try Again
        </button>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="attendance-list">
      <div className="attendance-header">
        <div className="header-title">
          <h2>📊 Attendance Records</h2>
          {classId && <span className="class-filter">Class: {classId}</span>}
          {studentId && <span className="student-filter">Student: {studentId}</span>}
        </div>
        
        <div className="attendance-summary">
          <div className="summary-item present">
            <span className="summary-number">{statusCounts.present}</span>
            <span className="summary-label">Present</span>
          </div>
          <div className="summary-item absent">
            <span className="summary-number">{statusCounts.absent}</span>
            <span className="summary-label">Absent</span>
          </div>
          <div className="summary-item cancelled">
            <span className="summary-number">{statusCounts.cancelled}</span>
            <span className="summary-label">Cancelled</span>
          </div>
        </div>
      </div>

      {stats && (
        <div className="stats-panel">
          <h3>📈 Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.attendance_rate}%</div>
              <div className="stat-label">Attendance Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.total_records}</div>
              <div className="stat-label">Total Records</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.active_records}</div>
              <div className="stat-label">Active Classes</div>
            </div>
            {stats.unique_students && (
              <div className="stat-card">
                <div className="stat-value">{stats.unique_students}</div>
                <div className="stat-label">Students</div>
              </div>
            )}
            {stats.classes && (
              <div className="stat-card">
                <div className="stat-value">{stats.classes.length}</div>
                <div className="stat-label">Classes</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="attendance-controls">
        <div className="filters">
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="present">Present Only</option>
            <option value="absent">Absent Only</option>
            <option value="cancelled">Cancelled Only</option>
          </select>

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className="filter-input"
            placeholder="From Date"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className="filter-input"
            placeholder="To Date"
          />

          <select 
            value={filters.limit} 
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="filter-select"
          >
            <option value={25}>25 items</option>
            <option value={50}>50 items</option>
            <option value={100}>100 items</option>
            <option value={200}>200 items</option>
          </select>
        </div>

        <div className="actions">
          <button 
            className="btn btn-primary"
            onClick={fetchRecords}
            title="Refresh records"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="attendance-content">
        {records.length === 0 ? (
          <div className="no-records">
            <div className="no-records-icon">📋</div>
            <h3>No attendance records found</h3>
            <p>There are no attendance records matching your current filters.</p>
          </div>
        ) : (
          <div className="records-grid">
            {records.map(record => (
              <AttendanceCard
                key={record.id}
                record={record}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <div className="records-info">
        <p>Showing {records.length} records</p>
        {records.length > 0 && (
          <p>
            Last updated: {new Date(Math.max(...records.map(r => new Date(r.created_at)))).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;