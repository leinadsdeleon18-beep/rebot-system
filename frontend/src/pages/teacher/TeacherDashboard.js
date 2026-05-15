import React, { useState, useEffect } from 'react';
import { Users, Gift, UserPlus, FileText, Star, Calendar, Clock } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function TeacherDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalPoints: 0, activeStudents: 0, totalRedemptions: 0 });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [formData, setFormData] = useState({ name: '', grade: 'Grade 5', section: 'Section A', email: '', phone: '' });

  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
  const sections = ['Section A', 'Section B', 'Section C'];

  useEffect(() => {
    fetchDashboardData();
    fetchStudents();
  }, []);

  // DIRECT FETCH FROM WORKING API - SAME AS ADMIN
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/get-stats');
      const data = await response.json();
      console.log('Teacher Dashboard Data:', data);
      
      if (data.success) {
        setStats({
          totalStudents: data.totalStudents || 0,
          totalPoints: data.totalPoints || 0,
          activeStudents: data.totalStudents || 0,
          totalRedemptions: data.totalRedemptions || 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    }
  };

  // DIRECT FETCH FOR STUDENTS - SAME AS ADMIN
  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/get-students');
      const data = await response.json();
      console.log('Students data:', data);
      
      if (data.success) {
        const formatted = data.students.map(s => ({
          id: s._id,
          name: s.fullName,
          grade: s.grade || 'N/A',
          section: s.section || 'N/A',
          points: s.points || 0,
          studentId: s.studentId,
          email: s.email,
          lastActive: new Date(s.createdAt).toISOString().split('T')[0]
        }));
        setStudents(formatted);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!formData.name || !formData.grade || !formData.section) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email,
          grade: formData.grade,
          section: formData.section,
          phone: formData.phone
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Student ${formData.name} added successfully!`);
        setShowAddStudentModal(false);
        setFormData({ name: '', grade: 'Grade 5', section: 'Section A', email: '', phone: '' });
        fetchStudents();
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Failed to add student');
    }
  };

  const handleAddPoints = async () => {
    if (!pointsToAdd || pointsToAdd <= 0) {
      toast.error('Please enter valid points');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/students/${selectedStudent.id}/points`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ points: parseInt(pointsToAdd) })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Added ${pointsToAdd} points to ${selectedStudent.name}`);
        setShowPointsModal(false);
        setSelectedStudent(null);
        setPointsToAdd('');
        fetchStudents();
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Failed to add points');
    }
  };

  const activityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ 
      label: 'Activities', 
      data: [45, 52, 38, 61, 48, 25, 12], 
      borderColor: '#2e7d32', 
      backgroundColor: 'rgba(46, 125, 50, 0.1)', 
      tension: 0.4, 
      fill: true 
    }]
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Teacher Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back! Here's your class overview for today.
        </p>
      </div>

      {/* Stats Cards - Shows SAME data as Admin */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div><p className="text-gray-500 dark:text-gray-400 text-sm">Total Students</p><p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats.totalStudents}</p></div>
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mt-4"><Users className="text-white" size={24} /></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div><p className="text-gray-500 dark:text-gray-400 text-sm">Total Points</p><p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalPoints}</p></div>
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mt-4"><Star className="text-white" size={24} /></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div><p className="text-gray-500 dark:text-gray-400 text-sm">Active Students</p><p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeStudents}</p></div>
          <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center mt-4"><Users className="text-white" size={24} /></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div><p className="text-gray-500 dark:text-gray-400 text-sm">Rewards Redeemed</p><p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalRedemptions}</p></div>
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center mt-4"><Gift className="text-white" size={24} /></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setShowAddStudentModal(true)} className="flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition shadow-md"><UserPlus size={18} /> Add Student</button>
        <button onClick={() => window.location.href = '/teacher/qr-codes'} className="flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow-md"><FileText size={18} /> QR Codes</button>
        <button onClick={() => window.location.href = '/teacher/rewards'} className="flex items-center justify-center gap-2 p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition shadow-md"><Gift size={18} /> Redeem Rewards</button>
        <button onClick={() => {}} className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-md"><FileText size={18} /> Export Report</button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Weekly Activity</h3>
          <div className="h-80"><Line data={activityData} options={chartOptions} /></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Student Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Students in System</span>
              <span className="text-2xl font-bold text-blue-600">{stats.totalStudents}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Points Earned</span>
              <span className="text-2xl font-bold text-orange-600">{stats.totalPoints}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Average Points per Student</span>
              <span className="text-2xl font-bold text-green-600">
                {stats.totalStudents > 0 ? Math.round(stats.totalPoints / stats.totalStudents) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table - Shows SAME students as Admin */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Students ({students.length})</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm w-64 focus:outline-none focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Grade & Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.grade} - {student.section}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">{student.points} pts</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar size={14} /> {student.lastActive}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => { 
                          setSelectedStudent(student); 
                          setShowPointsModal(true); 
                        }} 
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium hover:bg-green-200 transition"
                      >
                        Add Points
                      </button>
                    </td>
                   </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add New Student</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Full Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="px-4 py-2 border rounded-xl">
                  {grades.map(g => <option key={g}>{g}</option>)}
                </select>
                <select value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} className="px-4 py-2 border rounded-xl">
                  {sections.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
              <button onClick={handleAddStudent} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700">Add Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Points Modal */}
      {showPointsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Points</h3>
              <button onClick={() => setShowPointsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <p>Student: <span className="font-semibold">{selectedStudent.name}</span></p>
              <p>Current Points: <span className="font-semibold text-green-600">{selectedStudent.points}</span></p>
              <input type="number" placeholder="Points to add" value={pointsToAdd} onChange={(e) => setPointsToAdd(e.target.value)} className="w-full px-4 py-2 border rounded-xl" min="1" />
              <div className="flex gap-3">
                <button onClick={() => setShowPointsModal(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancel</button>
                <button onClick={handleAddPoints} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold">Add Points</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}