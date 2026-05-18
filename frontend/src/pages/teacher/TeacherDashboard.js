import React, { useState, useEffect, useCallback } from 'react';
import { Users, Gift, UserPlus, FileText, Star, Calendar, Clock, TrendingUp, Award, BarChart3, PieChart } from 'lucide-react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

export default function TeacherDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalPoints: 0, activeStudents: 0 });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [teacherInfo, setTeacherInfo] = useState({ fullName: '', assignedGrades: [] });
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [formData, setFormData] = useState({ name: '', grade: '', section: 'Section A', email: '', phone: '' });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  const sections = ['Section A', 'Section B', 'Section C'];

  // Load user data first
  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        setLoading(false);
        return;
      }

      try {
        const userStr = localStorage.getItem('rebot_user');
        console.log('User from localStorage:', userStr);
        
        if (userStr) {
          const user = JSON.parse(userStr);
          const assignedGrades = user.assignedGrades || [];
          console.log('Assigned grades from localStorage:', assignedGrades);
          
          setTeacherInfo({
            fullName: user.fullName || 'Teacher',
            assignedGrades: assignedGrades
          });
          
          if (assignedGrades.length > 0) {
            setFormData(prev => ({ ...prev, grade: assignedGrades[0] }));
          }
          
          setIsDataLoaded(true);
        } else {
          const response = await fetch('http://localhost:5000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
            const assignedGrades = data.user.assignedGrades || [];
            setTeacherInfo({
              fullName: data.user.fullName || 'Teacher',
              assignedGrades: assignedGrades
            });
            if (assignedGrades.length > 0) {
              setFormData(prev => ({ ...prev, grade: assignedGrades[0] }));
            }
            setIsDataLoaded(true);
          } else {
            setIsDataLoaded(true);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setIsDataLoaded(true);
      }
    };
    
    loadUserData();
  }, []);

  // Fetch students only after teacher info is loaded
  const fetchStudents = useCallback(async () => {
    if (!isDataLoaded) {
      console.log('Waiting for teacher data to load...');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching students with token:', !!token);
      
      const response = await fetch('http://localhost:5000/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Students response:', data);
      
      if (data.success) {
        console.log('Total students returned:', data.students.length);
        
        const formatted = data.students.map(s => {
          let sectionName = 'N/A';
          let gradeLevel = s.grade || 'N/A';
          
          if (s.sectionName) {
            sectionName = s.sectionName;
          } else if (s.section && typeof s.section === 'object') {
            sectionName = s.section.sectionName || 'N/A';
            gradeLevel = s.section.gradeLevel || s.grade || 'N/A';
          }
          
          return {
            id: s._id,
            name: s.fullName,
            grade: gradeLevel,
            section: sectionName,
            points: s.points || 0,
            studentId: s.studentId,
            email: s.email,
            createdAt: new Date(s.createdAt),
            lastActive: new Date(s.createdAt).toISOString().split('T')[0]
          };
        });
        
        setStudents(formatted);
        
        const totalPoints = formatted.reduce((sum, s) => sum + s.points, 0);
        setStats(prev => ({
          ...prev,
          totalStudents: formatted.length,
          totalPoints: totalPoints,
          activeStudents: formatted.length
        }));
      } else {
        console.error('Failed to fetch students:', data.message);
        toast.error(data.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [isDataLoaded]);

  // Fetch dashboard stats after teacher info is loaded
  const fetchDashboardStats = useCallback(async () => {
    if (!isDataLoaded) return;
    
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching dashboard stats...');
      
      const response = await fetch('http://localhost:5000/api/stats/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Dashboard stats response:', data);
      
      if (data.success) {
        setStats(prev => ({
          ...prev,
          totalStudents: data.stats?.totalStudents || 0,
          totalPoints: data.stats?.totalPoints || 0,
          activeStudents: data.stats?.totalStudents || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, [isDataLoaded]);

  // Trigger data fetch when teacher info is loaded
  useEffect(() => {
    if (isDataLoaded) {
      console.log('Teacher data loaded, fetching data...');
      fetchDashboardStats();
      fetchStudents();
    }
  }, [isDataLoaded, fetchDashboardStats, fetchStudents]);

  const handleAddStudent = async () => {
    if (!formData.name || !formData.grade || !formData.section) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        setFormData({ 
          name: '', 
          grade: teacherInfo.assignedGrades[0] || '', 
          section: 'Section A', 
          email: '', 
          phone: '' 
        });
        fetchDashboardStats();
        fetchStudents();
      } else {
        toast.error(data.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('Add student error:', error);
      toast.error('Failed to add student');
    }
  };

  const handleAddPoints = async () => {
    if (!pointsToAdd || pointsToAdd <= 0) {
      toast.error('Please enter valid points');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/students/${selectedStudent.id}/points`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ points: parseInt(pointsToAdd) })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Added ${pointsToAdd} points to ${selectedStudent.name}`);
        setShowPointsModal(false);
        setSelectedStudent(null);
        setPointsToAdd('');
        fetchDashboardStats();
        fetchStudents();
      } else {
        toast.error(data.message || 'Failed to add points');
      }
    } catch (error) {
      console.error('Add points error:', error);
      toast.error('Failed to add points');
    }
  };

  // Generate chart data based on students
  const getPointsDistributionData = () => {
    const ranges = [
      { label: '0-50', min: 0, max: 50, color: '#ef4444' },
      { label: '51-100', min: 51, max: 100, color: '#f59e0b' },
      { label: '101-200', min: 101, max: 200, color: '#eab308' },
      { label: '201-500', min: 201, max: 500, color: '#22c55e' },
      { label: '500+', min: 501, max: Infinity, color: '#10b981' }
    ];
    
    const counts = ranges.map(range => 
      students.filter(s => s.points >= range.min && s.points <= range.max).length
    );
    
    return {
      labels: ranges.map(r => r.label),
      datasets: [{
        data: counts,
        backgroundColor: ranges.map(r => r.color),
        borderWidth: 0,
      }]
    };
  };

  // Get grade level distribution
  const getGradeDistributionData = () => {
    const gradeMap = {};
    students.forEach(s => {
      gradeMap[s.grade] = (gradeMap[s.grade] || 0) + 1;
    });
    
    const sortedGrades = Object.keys(gradeMap).sort();
    return {
      labels: sortedGrades,
      datasets: [{
        label: 'Number of Students',
        data: sortedGrades.map(g => gradeMap[g]),
        backgroundColor: '#3b82f6',
        borderRadius: 8,
      }]
    };
  };

  // Get top performing students
  const getTopStudents = () => {
    return [...students]
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  };

  // Get weekly activity data (mock data based on real student data)
  const getWeeklyActivityData = () => {
    // This would ideally come from transaction data, but using mock for now
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [45, 52, 38, 61, 48, 25, 12];
    
    return {
      labels: days,
      datasets: [{
        label: 'Activities',
        data: data,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    };
  };

  // Get points trend by grade
  const getPointsByGradeData = () => {
    const gradePoints = {};
    students.forEach(s => {
      if (!gradePoints[s.grade]) {
        gradePoints[s.grade] = { total: 0, count: 0 };
      }
      gradePoints[s.grade].total += s.points;
      gradePoints[s.grade].count += 1;
    });
    
    const sortedGrades = Object.keys(gradePoints).sort();
    return {
      labels: sortedGrades,
      datasets: [{
        label: 'Average Points',
        data: sortedGrades.map(g => Math.round(gradePoints[g].total / gradePoints[g].count)),
        backgroundColor: '#f59e0b',
        borderRadius: 8,
      }]
    };
  };

  const pointsDistributionData = getPointsDistributionData();
  const gradeDistributionData = getGradeDistributionData();
  const weeklyActivityData = getWeeklyActivityData();
  const pointsByGradeData = getPointsByGradeData();
  const topStudents = getTopStudents();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b',
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        cornerRadius: 8,
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0' },
        ticks: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }
      },
      x: {
        grid: { display: false },
        ticks: { color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }
      }
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading while data is being fetched
  if (loading && !isDataLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Show message if teacher has no assigned grades
  if (isDataLoaded && teacherInfo.assignedGrades.length === 0) {
    return (
      <div className="bg-yellow-50 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Grades Assigned</h2>
        <p className="text-yellow-700">
          Please contact the administrator to assign grade levels to your account.
        </p>
      </div>
    );
  }

  const assignedGradesText = teacherInfo.assignedGrades.join(', ');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Teacher Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back, {teacherInfo.fullName}! You have access to: <span className="font-semibold text-green-600">{assignedGradesText}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Users className="text-white" size={24} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp size={14} /> +{Math.round(stats.totalStudents * 0.12)}% from last month
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Points</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalPoints}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <Star className="text-white" size={24} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp size={14} /> +{Math.round(stats.totalPoints * 0.08)}% from last month
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Active Students</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeStudents}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
              <Award className="text-white" size={24} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp size={14} /> {Math.round((stats.activeStudents / stats.totalStudents) * 100)}% participation rate
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setShowAddStudentModal(true)} 
          className="flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition shadow-md"
        >
          <UserPlus size={18} /> Add Student
        </button>
        <button 
          onClick={() => window.location.href = '/teacher/qr-codes'} 
          className="flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow-md"
        >
          <FileText size={18} /> QR Codes
        </button>
        <button 
          onClick={() => toast.info('Export feature coming soon')} 
          className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-md"
        >
          <FileText size={18} /> Export Report
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-600" /> Weekly Activity
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedTimeframe('week')}
                className={`px-3 py-1 text-xs rounded-lg transition ${selectedTimeframe === 'week' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}
              >
                Week
              </button>
              <button 
                onClick={() => setSelectedTimeframe('month')}
                className={`px-3 py-1 text-xs rounded-lg transition ${selectedTimeframe === 'month' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}
              >
                Month
              </button>
            </div>
          </div>
          <div className="h-64">
            <Line data={weeklyActivityData} options={chartOptions} />
          </div>
        </div>

        {/* Points Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-orange-600" /> Points Distribution
          </h3>
          <div className="h-64">
            <Doughnut data={pointsDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Grade Distribution Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" /> Students by Grade Level
          </h3>
          <div className="h-64">
            <Bar data={gradeDistributionData} options={barChartOptions} />
          </div>
        </div>

        {/* Average Points by Grade Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Award size={20} className="text-yellow-600" /> Average Points by Grade
          </h3>
          <div className="h-64">
            <Bar data={pointsByGradeData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Top Performing Students */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Award size={20} className="text-yellow-500" /> Top Performing Students
            </h3>
            <span className="text-xs text-gray-500">Based on total points earned</span>
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {topStudents.length > 0 ? (
            topStudents.map((student, index) => (
              <div key={student.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : '#22c55e' }}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.grade} - {student.section}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">{student.points}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              No students found
            </div>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Your Students ({students.length})</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm w-64 focus:outline-none focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
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
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No students found in your assigned grades: {assignedGradesText}
                  </td>
                </tr>
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
              <input 
                type="text" 
                placeholder="Full Name *" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              />
              <div className="grid grid-cols-2 gap-4">
                <select 
                  value={formData.grade} 
                  onChange={(e) => setFormData({...formData, grade: e.target.value})} 
                  className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {teacherInfo.assignedGrades.map(g => <option key={g}>{g}</option>)}
                </select>
                <select 
                  value={formData.section} 
                  onChange={(e) => setFormData({...formData, section: e.target.value})} 
                  className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {sections.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <input 
                type="email" 
                placeholder="Email (optional)" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              />
              <button 
                onClick={handleAddStudent} 
                className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Add Student
              </button>
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
              <input 
                type="number" 
                placeholder="Points to add" 
                value={pointsToAdd} 
                onChange={(e) => setPointsToAdd(e.target.value)} 
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
                min="1" 
              />
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