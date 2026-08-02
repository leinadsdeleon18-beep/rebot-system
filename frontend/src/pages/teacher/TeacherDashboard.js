import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, UserPlus, FileText, Star, Calendar, 
  TrendingUp, Award, BarChart3, PieChart, Trophy, Target, 
  Activity, Crown, Medal, AlertCircle, CheckCircle,
  RefreshCw, Printer, Download, Eye, BadgeCheck, Sparkles, X, Settings, Save,
  School, BookOpen
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';
import LoadingScreen from '../../components/LoadingScreen';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Custom Certificate Icon
const CertificateIcon = ({ size = 18, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z"/>
    <path d="M8 7h8"/>
    <path d="M8 11h6"/>
    <path d="M8 15h4"/>
    <path d="M12 2v20"/>
  </svg>
);

export default function TeacherDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalPoints: 0, activeStudents: 0 });
  const [allStudents, setAllStudents] = useState([]); // Raw data from API
  const [filteredStudentsList, setFilteredStudentsList] = useState([]); // Filtered by teacher access
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingPoints, setIsAddingPoints] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [teacherInfo, setTeacherInfo] = useState({ fullName: '', assignedGrades: [], assignedSections: [] });
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [formData, setFormData] = useState({ name: '', grade: '', section: '', email: '', phone: '' });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [classGoal, setClassGoal] = useState(1000);
  const [goalInput, setGoalInput] = useState(1000);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [selectedBadgeStudent, setSelectedBadgeStudent] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [teacherSections, setTeacherSections] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [certificateData, setCertificateData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [teacherAssignedSections, setTeacherAssignedSections] = useState([]);
  const [teacherAssignedGrades, setTeacherAssignedGrades] = useState([]);

  // Badge definitions
  const badges = [
    { id: 'first_points', name: 'First Steps', icon: '🌟', points: 10, description: 'Earned first 10 points', color: 'bg-blue-500' },
    { id: 'eco_warrior', name: 'Eco Warrior', icon: '🌿', points: 50, description: 'Reached 50 points', color: 'bg-green-500' },
    { id: 'recycling_champ', name: 'Recycling Champ', icon: '♻️', points: 100, description: 'Reached 100 points', color: 'bg-yellow-500' },
    { id: 'point_master', name: 'Point Master', icon: '⭐', points: 200, description: 'Reached 200 points', color: 'bg-purple-500' },
    { id: 'super_recycler', name: 'Super Recycler', icon: '🏆', points: 500, description: 'Reached 500 points', color: 'bg-red-500' },
    { id: 'legend', name: 'Recycling Legend', icon: '👑', points: 1000, description: 'Reached 1000 points', color: 'bg-indigo-500' }
  ];

  // Get student's earned badges
  const getStudentBadges = (studentPoints) => {
    return badges.filter(badge => studentPoints >= badge.points);
  };

  // Get next badge for student
  const getNextBadge = (studentPoints) => {
    return badges.find(badge => badge.points > studentPoints) || badges[badges.length - 1];
  };

  // Load class goal from localStorage
  const loadClassGoal = () => {
    const savedGoal = localStorage.getItem(`class_goal_${teacherId}`);
    if (savedGoal && !isNaN(parseInt(savedGoal))) {
      setClassGoal(parseInt(savedGoal));
      setGoalInput(parseInt(savedGoal));
    } else {
      const defaultGoal = Math.max(1000, Math.ceil(stats.totalPoints * 1.2));
      setClassGoal(defaultGoal);
      setGoalInput(defaultGoal);
    }
  };

  // Save class goal to localStorage
  const saveClassGoal = (goal) => {
    if (teacherId) {
      localStorage.setItem(`class_goal_${teacherId}`, goal.toString());
    }
  };

  // Get goal progress
  const getGoalProgress = () => {
    const currentTotal = stats.totalPoints;
    const percentage = Math.min((currentTotal / classGoal) * 100, 100);
    const remaining = Math.max(classGoal - currentTotal, 0);
    const isCompleted = currentTotal >= classGoal;
    return { currentTotal, percentage, remaining, isCompleted };
  };

  // Generate Certificate Data
  const generateCertificate = (student) => {
    const earnedBadges = getStudentBadges(student.points);
    if (earnedBadges.length === 0) {
      toast.error(`${student.name} hasn't earned any badges yet. Encourage them to earn at least 10 points!`);
      return;
    }
    
    const latestBadge = earnedBadges[earnedBadges.length - 1];
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const certId = `CERT-${student.studentId || student.id}-${Date.now()}`;
    
    setCertificateData({
      student,
      badge: latestBadge,
      today,
      certId
    });
    setShowCertificateModal(true);
    toast.success(`Certificate prepared for ${student.name}`);
  };

  // Generate Progress Report Data
  const generateProgressReport = () => {
    if (filteredStudentsList.length === 0) {
      toast.error('No students to generate report');
      return;
    }
    
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalPoints = filteredStudentsList.reduce((sum, s) => sum + s.points, 0);
    const avgPoints = filteredStudentsList.length > 0 ? Math.round(totalPoints / filteredStudentsList.length) : 0;
    const goalProgress = getGoalProgress();
    
    const gradeDistribution = {};
    filteredStudentsList.forEach(s => { gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1; });
    
    let totalBadges = 0;
    filteredStudentsList.forEach(s => { totalBadges += getStudentBadges(s.points).length; });
    
    setReportData({
      students: filteredStudentsList,
      totalPoints,
      avgPoints,
      goalProgress,
      gradeDistribution,
      totalBadges,
      today,
      teacherName: teacherInfo.fullName
    });
    setShowReportModal(true);
    toast.success('Report generated successfully!');
  };

  // Fetch teacher's assigned sections
  const fetchTeacherSections = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/students/teacher/sections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setTeacherSections(data.sections);
        setAvailableSections(data.sections);
      }
    } catch (error) {
      console.error('Error fetching teacher sections:', error);
    }
  }, []);

  // Check if student is accessible to the teacher
  const isStudentAccessible = useCallback((student) => {
    if (userRole !== 'teacher') return true;
    
    // Check assigned sections first
    if (teacherAssignedSections && teacherAssignedSections.length > 0) {
      return student.sectionId && teacherAssignedSections.includes(student.sectionId);
    }
    
    // Fallback to grades
    if (teacherAssignedGrades && teacherAssignedGrades.length > 0) {
      return teacherAssignedGrades.includes(student.grade);
    }
    
    return false;
  }, [userRole, teacherAssignedSections, teacherAssignedGrades]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!isDataLoaded) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      console.log('📡 Students API Response:', data);
      
      if (data.success) {
        const formatted = data.students.map(s => {
          let sectionName = 'N/A';
          let gradeLevel = s.grade || 'N/A';
          let sectionId = null;
          
          if (s.section && typeof s.section === 'object') {
            sectionName = s.section.sectionName || 'N/A';
            gradeLevel = s.section.gradeLevel || s.grade || 'N/A';
            sectionId = s.section._id;
          } else if (s.sectionName) {
            sectionName = s.sectionName;
            sectionId = s.sectionId;
          } else if (s.section && typeof s.section === 'string') {
            sectionId = s.section;
          }
          
          return {
            id: s._id,
            name: s.fullName,
            grade: gradeLevel,
            section: sectionName,
            sectionId: sectionId,
            points: s.points || 0,
            studentId: s.studentId,
            email: s.email,
            lastActive: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : 'N/A'
          };
        });
        
        // Store all students
        setAllStudents(formatted);
        
        // Filter students based on teacher access
        const accessibleStudents = formatted.filter(student => isStudentAccessible(student));
        setFilteredStudentsList(accessibleStudents);
        
        // Calculate stats based on accessible students only
        const totalPoints = accessibleStudents.reduce((sum, s) => sum + s.points, 0);
        setStats({
          totalStudents: accessibleStudents.length,
          totalPoints: totalPoints,
          activeStudents: accessibleStudents.length // Assuming all are active for now
        });
        
        if (teacherId) {
          loadClassGoal();
        }
        
        await fetchTeacherSections();
        
        // Generate recent activities
        const activities = [
          { icon: '⭐', message: 'earned points', color: 'bg-yellow-100 text-yellow-700' },
          { icon: '♻️', message: 'recycled items', color: 'bg-green-100 text-green-700' },
          { icon: '🏆', message: 'reached a milestone!', color: 'bg-purple-100 text-purple-700' },
        ];
        const recent = [];
        for (let i = 0; i < 5; i++) {
          const randomStudent = accessibleStudents[Math.floor(Math.random() * accessibleStudents.length)];
          const randomActivity = activities[Math.floor(Math.random() * activities.length)];
          if (randomStudent) {
            recent.push({
              id: i,
              studentName: randomStudent.name,
              ...randomActivity,
              time: `${Math.floor(Math.random() * 60)} minutes ago`
            });
          }
        }
        setRecentActivities(recent);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [isDataLoaded, teacherId, fetchTeacherSections, isStudentAccessible]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setInitialLoading(false);
        setLoading(false);
        return;
      }
      try {
        const userStr = localStorage.getItem('rebot_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setTeacherInfo({
            fullName: user.fullName || 'Teacher',
            assignedGrades: user.assignedGrades || [],
            assignedSections: user.assignedSections || []
          });
          setTeacherId(user.id);
          setUserRole(user.role || '');
          setTeacherAssignedSections(user.assignedSections || []);
          setTeacherAssignedGrades(user.assignedGrades || []);
          
          if (user.assignedGrades?.length > 0) {
            setFormData(prev => ({ ...prev, grade: user.assignedGrades[0] }));
          }
          setIsDataLoaded(true);
        } else {
          setIsDataLoaded(true);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setIsDataLoaded(true);
      } finally {
        setInitialLoading(false);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      fetchStudents();
    }
  }, [isDataLoaded, fetchStudents]);

  // Listen for section updates
  useEffect(() => {
    const handleSectionsUpdate = (event) => {
      console.log('🔄 TeacherDashboard: sectionsUpdated event received!');
      if (event?.detail?.section) {
        console.log('Updated section:', event.detail.section);
      }
      console.log('🔄 Refreshing dashboard data...');
      fetchStudents();
      fetchTeacherSections();
    };
    
    window.addEventListener('sectionsUpdated', handleSectionsUpdate);
    return () => window.removeEventListener('sectionsUpdated', handleSectionsUpdate);
  }, [fetchStudents, fetchTeacherSections]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
    await fetchTeacherSections();
    setIsRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  const handleAddStudent = async () => {
    if (!formData.name || !formData.grade || !formData.section) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsAddingStudent(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email,
          grade: formData.grade,
          sectionId: formData.section,
          phone: formData.phone
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Student ${formData.name} added successfully!`);
        setShowAddStudentModal(false);
        setFormData({ name: '', grade: teacherInfo.assignedGrades[0] || '', section: '', email: '', phone: '' });
        await fetchStudents();
      } else {
        toast.error(data.message || 'Failed to add student');
      }
    } catch (error) {
      toast.error('Failed to add student');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleAddPoints = async () => {
    if (!pointsToAdd || pointsToAdd <= 0) {
      toast.error('Please enter valid points');
      return;
    }
    setIsAddingPoints(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/students/${selectedStudent.id}/points`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ points: parseInt(pointsToAdd) })
      });
      const data = await response.json();
      if (data.success) {
        const newPoints = selectedStudent.points + parseInt(pointsToAdd);
        const earnedBadges = getStudentBadges(newPoints);
        const previousBadges = getStudentBadges(selectedStudent.points);
        const newBadges = earnedBadges.filter(b => !previousBadges.find(pb => pb.id === b.id));
        
        toast.success(`Added ${pointsToAdd} points to ${selectedStudent.name}`);
        if (newBadges.length > 0) {
          toast.success(`🎉 ${selectedStudent.name} earned: ${newBadges.map(b => b.name).join(', ')}!`);
        }
        
        const newTotalPoints = stats.totalPoints + parseInt(pointsToAdd);
        if (stats.totalPoints < classGoal && newTotalPoints >= classGoal) {
          toast.success(`🎉🎉🎉 CONGRATULATIONS! Your class has reached the ${classGoal.toLocaleString()} points goal! 🎉🎉🎉`, { duration: 8000 });
        }
        
        setShowPointsModal(false);
        setSelectedStudent(null);
        setPointsToAdd('');
        await fetchStudents();
      } else {
        toast.error(data.message || 'Failed to add points');
      }
    } catch (error) {
      toast.error('Failed to add points');
    } finally {
      setIsAddingPoints(false);
    }
  };

  const handleSetGoal = () => {
    if (!goalInput || goalInput <= 0) {
      toast.error('Please enter a valid goal amount');
      return;
    }
    setClassGoal(goalInput);
    saveClassGoal(goalInput);
    setShowGoalModal(false);
    
    if (stats.totalPoints >= goalInput) {
      toast.success(`🎉 Amazing! Your class has already reached the ${goalInput.toLocaleString()} points goal! 🎉`);
    } else {
      toast.success(`Class goal set to ${goalInput.toLocaleString()} points! Keep up the great work!`);
    }
  };

  const handleViewBadges = (student) => {
    setSelectedBadgeStudent(student);
    setShowBadgesModal(true);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Class Competition Data (only from filtered students)
  const getClassCompetitionData = () => {
    const sectionsDataMap = {};
    filteredStudentsList.forEach(s => {
      if (!sectionsDataMap[s.section]) {
        sectionsDataMap[s.section] = { totalPoints: 0, studentCount: 0, students: [] };
      }
      sectionsDataMap[s.section].totalPoints += s.points;
      sectionsDataMap[s.section].studentCount++;
      sectionsDataMap[s.section].students.push(s);
    });
    return Object.entries(sectionsDataMap).map(([name, data]) => ({
      name,
      averagePoints: Math.round(data.totalPoints / data.studentCount),
      totalPoints: data.totalPoints,
      studentCount: data.studentCount,
      topStudent: [...data.students].sort((a, b) => b.points - a.points)[0]
    })).sort((a, b) => b.averagePoints - a.averagePoints);
  };

  const goalProgress = getGoalProgress();
  const classCompetition = getClassCompetitionData();

  // Chart Data (only from filtered students)
  const getPointsDistributionData = () => {
    const ranges = [
      { label: '0-50', min: 0, max: 50, color: '#ef4444' },
      { label: '51-100', min: 51, max: 100, color: '#f59e0b' },
      { label: '101-200', min: 101, max: 200, color: '#eab308' },
      { label: '201-500', min: 201, max: 500, color: '#22c55e' },
      { label: '500+', min: 501, max: Infinity, color: '#10b981' }
    ];
    return {
      labels: ranges.map(r => r.label),
      datasets: [{ data: ranges.map(r => filteredStudentsList.filter(s => s.points >= r.min && s.points <= r.max).length), backgroundColor: ranges.map(r => r.color), borderWidth: 0 }]
    };
  };

  const getGradeDistributionData = () => {
    const gradeMap = {};
    filteredStudentsList.forEach(s => { gradeMap[s.grade] = (gradeMap[s.grade] || 0) + 1; });
    const sortedGrades = Object.keys(gradeMap).sort();
    return { labels: sortedGrades, datasets: [{ label: 'Number of Students', data: sortedGrades.map(g => gradeMap[g]), backgroundColor: '#3b82f6', borderRadius: 8 }] };
  };

  const getWeeklyActivityData = () => {
    return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'Activities', data: [45, 52, 38, 61, 48, 25, 12], borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', tension: 0.4, fill: true }] };
  };

  const getPointsByGradeData = () => {
    const gradePoints = {};
    filteredStudentsList.forEach(s => {
      if (!gradePoints[s.grade]) gradePoints[s.grade] = { total: 0, count: 0 };
      gradePoints[s.grade].total += s.points;
      gradePoints[s.grade].count += 1;
    });
    const sortedGrades = Object.keys(gradePoints).sort();
    return { labels: sortedGrades, datasets: [{ label: 'Average Points', data: sortedGrades.map(g => Math.round(gradePoints[g].total / gradePoints[g].count)), backgroundColor: '#f59e0b', borderRadius: 8 }] };
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
  const barChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } };

  const filteredStudents = filteredStudentsList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading screen while initializing
  if (initialLoading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  // Show loading screen while fetching data
  if (loading && filteredStudentsList.length === 0 && allStudents.length === 0) {
    return <LoadingScreen message="Loading your students..." />;
  }

  // Show no grades assigned message
  if (isDataLoaded && userRole === 'teacher' && teacherAssignedGrades.length === 0 && teacherAssignedSections.length === 0) {
    return (
      <div className="bg-yellow-50 rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <School size={32} className="text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-yellow-800">No Grades or Sections Assigned</h2>
          <p className="text-yellow-700 max-w-md">
            You don't have any grades or sections assigned to your account yet.
          </p>
          <p className="text-sm text-yellow-600">
            Please contact the administrator to assign grade levels or sections to your account.
          </p>
        </div>
      </div>
    );
  }

  const assignedText = userRole === 'teacher' 
    ? (teacherAssignedSections.length > 0 
        ? `${teacherAssignedSections.length} assigned section(s)` 
        : teacherAssignedGrades.join(', '))
    : 'All Sections (Admin)';

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Teacher Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {teacherInfo.fullName}! Access: <span className="font-semibold text-green-600">{assignedText}</span>
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards - Using filtered stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border">
          <div className="flex justify-between"><div><p className="text-gray-500 text-sm">Total Students</p><p className="text-3xl font-bold">{stats.totalStudents}</p></div><div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center"><Users className="text-white" size={24} /></div></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border">
          <div className="flex justify-between"><div><p className="text-gray-500 text-sm">Total Points</p><p className="text-3xl font-bold text-orange-600">{stats.totalPoints}</p></div><div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center"><Star className="text-white" size={24} /></div></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border">
          <div className="flex justify-between"><div><p className="text-gray-500 text-sm">Active Students</p><p className="text-3xl font-bold text-green-600">{stats.activeStudents}</p></div><div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center"><Award className="text-white" size={24} /></div></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border">
          <div className="flex justify-between"><div><p className="text-gray-500 text-sm">Badges Awarded</p><p className="text-3xl font-bold text-purple-600">{filteredStudentsList.reduce((sum, s) => sum + getStudentBadges(s.points).length, 0)}</p></div><div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center"><BadgeCheck className="text-white" size={24} /></div></div>
        </div>
      </div>

      {/* Teacher's Assigned Sections */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <School size={20} className="text-green-600" />
            Your Assigned Sections
          </h3>
          <span className="text-sm text-gray-500">{teacherSections.length} sections</span>
        </div>
        
        {teacherSections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <School size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No sections assigned yet.</p>
            <p className="text-sm mt-1">Please contact the administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherSections.map(section => {
              const sectionStudents = filteredStudentsList.filter(s => s.sectionId === section._id);
              const totalPoints = sectionStudents.reduce((sum, s) => sum + (s.points || 0), 0);
              const averagePoints = sectionStudents.length > 0 ? Math.round(totalPoints / sectionStudents.length) : 0;
              
              return (
                <div key={section._id} className="border rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-green-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{section.gradeLevel === 'Kindergarten' ? '🎓' : '📚'}</span>
                        <h4 className="font-bold text-lg text-green-700">{section.sectionName}</h4>
                      </div>
                      <p className="text-sm text-gray-500">{section.gradeLevel}</p>
                    </div>
                    <div className="bg-green-100 rounded-full px-2.5 py-1">
                      <span className="text-xs font-semibold text-green-700">
                        <Users size={12} className="inline mr-1" />
                        {sectionStudents.length} students
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{totalPoints}</p>
                        <p className="text-xs text-gray-500">Total Points</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{averagePoints}</p>
                        <p className="text-xs text-gray-500">Average Points</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button onClick={() => setShowAddStudentModal(true)} className="flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition"><UserPlus size={18} /> Add Student</button>
        <button onClick={() => window.location.href = '/teacher/qr-codes'} className="flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition"><FileText size={18} /> QR Codes</button>
        <button onClick={generateProgressReport} className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"><Printer size={18} /> Print Report</button>
        <button onClick={() => { if (filteredStudentsList.length > 0) generateCertificate(filteredStudentsList[0]); else toast.error('No students'); }} className="flex items-center justify-center gap-2 p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition"><CertificateIcon size={18} /> Certificate</button>
        <button onClick={() => setShowGoalModal(true)} className="flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition"><Target size={18} /> Set Goal</button>
      </div>

      {/* Class Competition */}
      {classCompetition.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3"><Trophy size={28} /><div><h3 className="text-xl font-bold">Class Competition</h3><p className="text-sm">Compare sections by average points</p></div></div>
            <RefreshCw size={20} className="opacity-70 cursor-pointer hover:opacity-100" onClick={fetchStudents} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classCompetition.slice(0, 3).map((section, index) => (
              <div key={section.name} className="bg-white/15 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2"><span className="font-bold text-lg">{section.name}</span>{index === 0 && <Crown size={20} className="text-yellow-300" />}{index === 1 && <Medal size={20} className="text-gray-300" />}{index === 2 && <Medal size={20} className="text-amber-600" />}</div>
                <p className="text-2xl font-bold">{section.averagePoints}</p><p className="text-xs">avg points per student</p>
                <div className="mt-2 text-sm"><span>Top: {section.topStudent?.name?.split(' ')[0]}</span><span className="float-right">{section.topStudent?.points} pts</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Class Goal Tracker */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3"><Target size={28} /><div><h3 className="text-xl font-bold">Class Goal Tracker</h3><p className="text-sm opacity-90">Target: {classGoal.toLocaleString()} total points</p></div></div>
          <button onClick={() => setShowGoalModal(true)} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition flex items-center gap-2"><Settings size={16} /> Change Goal</button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2"><span>Progress: {goalProgress.percentage.toFixed(1)}%</span><span>{goalProgress.currentTotal.toLocaleString()} / {classGoal.toLocaleString()} points</span></div>
          <div className="w-full bg-white/30 rounded-full h-4 overflow-hidden"><div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-yellow-400 to-orange-500" style={{ width: `${goalProgress.percentage}%` }} /></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white/15 rounded-xl p-3 text-center"><p className="text-2xl font-bold">{goalProgress.remaining.toLocaleString()}</p><p className="text-xs opacity-80">points remaining</p></div>
          <div className="bg-white/15 rounded-xl p-3 text-center"><p className="text-2xl font-bold">{Math.min(10, Math.ceil(goalProgress.percentage / 10))}/10</p><p className="text-xs opacity-80">milestones completed</p></div>
        </div>
        
        {!goalProgress.isCompleted && goalProgress.percentage < 25 && (<div className="mt-3 text-sm text-center bg-white/10 rounded-lg p-2 animate-pulse">💪 Keep going! Every point brings us closer to our goal! {goalProgress.remaining.toLocaleString()} points to go!</div>)}
        {!goalProgress.isCompleted && goalProgress.percentage >= 25 && goalProgress.percentage < 50 && (<div className="mt-3 text-sm text-center bg-white/10 rounded-lg p-2">🎯 Great start! You're {goalProgress.percentage.toFixed(0)}% there! Only {goalProgress.remaining.toLocaleString()} points left!</div>)}
        {!goalProgress.isCompleted && goalProgress.percentage >= 50 && goalProgress.percentage < 75 && (<div className="mt-3 text-sm text-center bg-white/10 rounded-lg p-2">🚀 Over halfway there! You're doing amazing! {goalProgress.remaining.toLocaleString()} points to go!</div>)}
        {!goalProgress.isCompleted && goalProgress.percentage >= 75 && goalProgress.percentage < 100 && (<div className="mt-3 text-sm text-center bg-white/10 rounded-lg p-2 animate-bounce">🏆 Almost there! Just {goalProgress.remaining.toLocaleString()} points left! You can do this!</div>)}
        {goalProgress.isCompleted && (<div className="mt-3 text-sm text-center bg-yellow-400/30 rounded-lg p-2">🎉🎉🎉 CONGRATULATIONS! You've reached your class goal of {classGoal.toLocaleString()} points! 🎉🎉🎉</div>)}
      </div>

      {/* Activity Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity size={20} className="text-green-600" /> Recent Activity</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {recentActivities.map(activity => (
            <div key={activity.id} className={`flex items-center gap-3 p-3 rounded-xl ${activity.color} transition`}>
              <span className="text-xl">{activity.icon}</span><div className="flex-1"><p className="text-sm font-medium">{activity.studentName} {activity.message}</p><p className="text-xs opacity-70">{activity.time}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts - Using filtered students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-green-600" /> Weekly Activity</h3>
          <div className="h-64"><Line data={getWeeklyActivityData()} options={chartOptions} /></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><PieChart size={20} className="text-orange-600" /> Points Distribution</h3>
          <div className="h-64"><Doughnut data={getPointsDistributionData()} options={chartOptions} /></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-blue-600" /> Students by Grade</h3>
          <div className="h-64"><Bar data={getGradeDistributionData()} options={barChartOptions} /></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Award size={20} className="text-yellow-600" /> Avg Points by Grade</h3>
          <div className="h-64"><Bar data={getPointsByGradeData()} options={barChartOptions} /></div>
        </div>
      </div>

      {/* Top Students - From filtered list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b"><h3 className="font-semibold flex items-center gap-2"><Award size={20} className="text-yellow-500" /> Top Performing Students</h3></div>
        <div className="divide-y">
          {[...filteredStudentsList].sort((a, b) => b.points - a.points).slice(0, 5).map((student, index) => {
            const earnedBadges = getStudentBadges(student.points);
            return (
              <div key={student.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : '#22c55e' }}>{index + 1}</div>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-gray-500">
                      {student.grade} - 
                      <span className="font-semibold text-green-600 ml-1">{student.section}</span>
                    </p>
                    <div className="flex gap-1 mt-1">{earnedBadges.slice(0, 3).map(b => <span key={b.id} className="text-xs" title={b.name}>{b.icon}</span>)}{earnedBadges.length > 3 && <span className="text-xs text-gray-400">+{earnedBadges.length - 3}</span>}</div>
                  </div>
                </div>
                <div className="text-right"><p className="text-xl font-bold text-green-600">{student.points}</p><div className="flex gap-2 mt-1"><button onClick={() => generateCertificate(student)} className="text-xs text-blue-600 hover:underline">Certificate</button><button onClick={() => handleViewBadges(student)} className="text-xs text-purple-600 hover:underline">Badges ({earnedBadges.length})</button></div></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Students Table with Section Display - Using filtered students */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Your Students ({filteredStudentsList.length})
            </h3>
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-4 pr-4 py-2 border rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badges</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredStudents.map(student => {
                const earnedBadges = getStudentBadges(student.points);
                const nextBadge = getNextBadge(student.points);
                const pointsToNext = nextBadge ? nextBadge.points - student.points : 0;
                return (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.grade}</td>
                    <td className="px-6 py-4 text-sm">
                      {student.section !== 'N/A' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                          <BookOpen size={12} />
                          {student.section}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                          <AlertCircle size={12} />
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">{student.points} pts</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {earnedBadges.slice(0, 3).map(b => (
                          <span key={b.id} className="text-lg cursor-pointer" title={b.name}>{b.icon}</span>
                        ))}
                        {earnedBadges.length > 3 && (
                          <span className="text-xs text-gray-500">+{earnedBadges.length - 3}</span>
                        )}
                        {pointsToNext > 0 && pointsToNext < 100 && (
                          <p className="text-xs text-gray-400 w-full mt-1">{pointsToNext} pts to {nextBadge?.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => { setSelectedStudent(student); setShowPointsModal(true); }} 
                          className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium hover:bg-green-200 dark:hover:bg-green-800/50 transition"
                          disabled={isAddingPoints}
                        >
                          Add Points
                        </button>
                        <button 
                          onClick={() => generateCertificate(student)} 
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition"
                        >
                          Cert
                        </button>
                        <button 
                          onClick={() => handleViewBadges(student)} 
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-800/50 transition"
                        >
                          Badges
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No students found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificateModal && certificateData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award className="text-yellow-500" /> Certificate of Achievement
              </h3>
              <button onClick={() => setShowCertificateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-8" id="certificate-content">
              <div className="certificate border-2 border-yellow-500 rounded-2xl p-8 relative" style={{ background: 'white' }}>
                <div className="text-center">
                  <div className="mb-6">
                    <div className="text-2xl font-bold text-green-800">🏫 PATUBIG ELEMENTARY SCHOOL 🏫</div>
                    <div className="text-sm text-gray-500">ReBot Recycling Program</div>
                  </div>
                  
                  <div className="text-4xl font-bold text-green-700 mb-4">Certificate of Achievement</div>
                  
                  <div className="text-6xl mb-4">🏆</div>
                  
                  <div className="text-lg text-gray-600 mb-2">This certificate is proudly presented to</div>
                  
                  <div className="text-4xl font-bold text-green-800 mb-4 border-b-4 border-yellow-400 inline-block pb-2">
                    {certificateData.student.name}
                  </div>
                  
                  <div className="text-md text-gray-600 mt-4 mb-4">
                    for outstanding achievement in recycling and environmental stewardship
                  </div>
                  
                  <div className="inline-block bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full px-8 py-4 mb-4">
                    <div className="text-5xl mb-2">{certificateData.badge.icon}</div>
                    <div className="text-2xl font-bold text-yellow-800">{certificateData.badge.name}</div>
                  </div>
                  
                  <div className="text-4xl font-bold text-yellow-600 mb-4">
                    {certificateData.student.points} Points
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    for reaching the {certificateData.badge.name} milestone in the school's recycling rewards program!
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t">
                    <div className="text-center">
                      <div className="border-t-2 border-gray-400 pt-2 mt-6">_________________________</div>
                      <div className="text-sm text-gray-500">Program Coordinator</div>
                    </div>
                    <div className="text-center">
                      <div className="border-t-2 border-gray-400 pt-2 mt-6">_________________________</div>
                      <div className="text-sm text-gray-500">School Principal</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-6">
                    Date: {certificateData.today}
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-2">
                    Certificate ID: {certificateData.certId}
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end gap-3">
              <button
                onClick={handlePrintCertificate}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
              >
                <Printer size={18} /> Print Certificate
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="text-blue-600" /> Class Progress Report
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-8" id="report-content">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-green-800">📊 Class Progress Report</h1>
                <p className="text-gray-600">Patubig Elementary School - ReBot Recycling Program</p>
                <p className="text-gray-500 text-sm">Generated: {reportData.today}</p>
                <p className="text-gray-500 text-sm">Teacher: {reportData.teacherName}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{reportData.students.length}</div>
                  <div className="text-sm">Total Students</div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{reportData.totalPoints.toLocaleString()}</div>
                  <div className="text-sm">Total Points</div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{reportData.avgPoints}</div>
                  <div className="text-sm">Average Points</div>
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{reportData.totalBadges}</div>
                  <div className="text-sm">Badges Awarded</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white mb-8">
                <h3 className="text-xl font-bold mb-3">🎯 Class Goal Tracker</h3>
                <div className="text-2xl font-bold mb-2">{classGoal.toLocaleString()} points</div>
                <div className="w-full bg-white/30 rounded-full h-4 mb-2">
                  <div className="h-full rounded-full bg-yellow-400" style={{ width: `${reportData.goalProgress.percentage}%` }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Progress: {reportData.goalProgress.percentage.toFixed(1)}%</span>
                  <span>{reportData.goalProgress.currentTotal.toLocaleString()} / {classGoal.toLocaleString()}</span>
                </div>
                {reportData.goalProgress.isCompleted && (
                  <div className="mt-3 text-center bg-yellow-400/30 rounded-lg p-2">🎉 GOAL ACHIEVED! Congratulations! 🎉</div>
                )}
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">📋 Grade Level Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData.gradeDistribution).map(([grade, count]) => (
                    <div key={grade} className="bg-gray-100 rounded-xl p-4 text-center">
                      <div className="font-bold text-green-700">{grade}</div>
                      <div className="text-2xl font-bold">{count} students</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">🏆 Student Performance Ranking</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-green-600 text-white">
                      <tr>
                        <th className="px-4 py-2 text-left">Rank</th>
                        <th className="px-4 py-2 text-left">Student Name</th>
                        <th className="px-4 py-2 text-left">Grade & Section</th>
                        <th className="px-4 py-2 text-left">Points</th>
                        <th className="px-4 py-2 text-left">Badges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...reportData.students].sort((a, b) => b.points - a.points).map((student, index) => {
                        const earnedBadges = getStudentBadges(student.points);
                        return (
                          <tr key={student.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-bold">{index + 1}</td>
                            <td className="px-4 py-2">{student.name}</td>
                            <td className="px-4 py-2">{student.grade} - <span className="font-semibold text-green-600">{student.section}</span></td>
                            <td className="px-4 py-2 font-bold text-orange-600">{student.points} pts</td>
                            <td className="px-4 py-2">{earnedBadges.map(b => b.icon).join(' ')} ({earnedBadges.length})</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end gap-3">
              <button
                onClick={handlePrintReport}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Printer size={18} /> Print Report
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold flex items-center gap-2"><Target size={20} className="text-purple-600" /> Set Class Goal</h3><button onClick={() => setShowGoalModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
            <div className="space-y-4"><p className="text-sm text-gray-600">Set a total points goal for your class to work towards together!</p>
            <div><label className="block text-sm font-medium mb-1">Total Points Goal</label><input type="number" value={goalInput} onChange={(e) => setGoalInput(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter goal amount" min="1" /></div>
            <div className="bg-purple-50 rounded-xl p-3"><p className="text-sm text-purple-700">Current total: <strong>{stats.totalPoints.toLocaleString()}</strong> points</p><p className="text-sm text-purple-700 mt-1">Goal: <strong>{goalInput.toLocaleString()}</strong> points</p><p className="text-sm text-purple-700 mt-1">Remaining: <strong>{Math.max(goalInput - stats.totalPoints, 0).toLocaleString()}</strong> points to go</p>{stats.totalPoints >= goalInput && (<p className="text-sm text-green-600 mt-2">✅ Your class has already reached this goal!</p>)}</div>
            <div className="flex gap-3"><button onClick={() => setShowGoalModal(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancel</button><button onClick={handleSetGoal} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700">Set Goal</button></div></div>
          </div>
        </div>
      )}

      {/* Badges Modal */}
      {showBadgesModal && selectedBadgeStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Badge Collection</h3><button onClick={() => setShowBadgesModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
            <div className="text-center mb-4"><div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto text-3xl text-white font-bold">{selectedBadgeStudent.name.charAt(0)}</div><h4 className="font-bold text-lg mt-2">{selectedBadgeStudent.name}</h4><p className="text-sm text-gray-500">{selectedBadgeStudent.points} total points</p></div>
            <div className="space-y-3"><p className="text-sm font-semibold">Earned Badges:</p><div className="grid grid-cols-2 gap-3">{getStudentBadges(selectedBadgeStudent.points).map(badge => (<div key={badge.id} className={`${badge.color} bg-opacity-20 rounded-xl p-3 text-center`}><span className="text-3xl">{badge.icon}</span><p className="font-semibold text-sm mt-1">{badge.name}</p><p className="text-xs text-gray-500">{badge.description}</p></div>))}</div>
            {getNextBadge(selectedBadgeStudent.points).points > selectedBadgeStudent.points && (<><p className="text-sm font-semibold mt-4">Next Badge:</p><div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 text-center opacity-60"><span className="text-3xl">{getNextBadge(selectedBadgeStudent.points).icon}</span><p className="font-semibold text-sm mt-1">{getNextBadge(selectedBadgeStudent.points).name}</p><p className="text-xs text-gray-500">Need {getNextBadge(selectedBadgeStudent.points).points - selectedBadgeStudent.points} more points</p></div></>)}</div>
            <button onClick={() => generateCertificate(selectedBadgeStudent)} className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">🎓 Generate Certificate</button>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Add New Student</h3><button onClick={() => setShowAddStudentModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
            <div className="space-y-4">
              <input type="text" placeholder="Full Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="px-4 py-2 border rounded-xl">
                  {teacherInfo.assignedGrades.map(g => <option key={g}>{g}</option>)}
                </select>
                <select value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} className="px-4 py-2 border rounded-xl">
                  <option value="">Select Section</option>
                  {availableSections.map(section => (
                    <option key={section._id} value={section._id}>
                      {section.gradeLevel} - {section.sectionName}
                    </option>
                  ))}
                </select>
              </div>
              <input type="email" placeholder="Email (optional)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
              <input type="tel" placeholder="Phone (optional)" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
              <button onClick={handleAddStudent} disabled={isAddingStudent} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50">{isAddingStudent ? 'Adding...' : 'Add Student'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Points Modal */}
      {showPointsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Add Points</h3><button onClick={() => setShowPointsModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
            <div className="space-y-4">
              <p>Student: <span className="font-semibold">{selectedStudent.name}</span></p>
              <p>Current Points: <span className="font-semibold text-green-600">{selectedStudent.points}</span></p>
              <p className="text-sm text-gray-500">Next Badge: {getNextBadge(selectedStudent.points).name} ({getNextBadge(selectedStudent.points).points - selectedStudent.points} points needed)</p>
              <input type="number" placeholder="Points to add" value={pointsToAdd} onChange={(e) => setPointsToAdd(e.target.value)} className="w-full px-4 py-2 border rounded-xl" min="1" />
              <div className="flex gap-3">
                <button onClick={() => setShowPointsModal(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancel</button>
                <button onClick={handleAddPoints} disabled={isAddingPoints} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50">{isAddingPoints ? 'Adding...' : 'Add Points'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-content, #certificate-content * {
            visibility: visible;
          }
          #certificate-content {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
          #report-content, #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}