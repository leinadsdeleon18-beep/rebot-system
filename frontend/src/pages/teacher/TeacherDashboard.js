import WorkspaceDialog from '../../components/WorkspaceDialog';
import { getAuthToken, getSessionUser } from '../../services/authSession';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Award, BadgeCheck, BarChart3, ClipboardList, Crown, GraduationCap, Leaf, Medal, Printer, Recycle, School, Search, Star, Target, Trophy, UserPlus, Users, X
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';
import LoadingScreen from '../../components/LoadingScreen';
import { DashboardEmpty, DashboardHeader, DashboardMetrics, DashboardPanel, DashboardRefresh } from '../../components/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { API_BASE_URL } from '../../services/apiService';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// API Base URL
const API_BASE = API_BASE_URL;

export default function TeacherDashboard() {
  const { darkMode } = useTheme();
  const [stats, setStats] = useState({ totalStudents: 0, totalPoints: 0, activeStudents: 0 });
  const [allStudents, setAllStudents] = useState([]); // Raw data from API
  const [filteredStudentsList, setFilteredStudentsList] = useState([]); // Filtered by teacher access
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [teacherInfo, setTeacherInfo] = useState({ fullName: '', assignedGrades: [], assignedSections: [] });
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', grade: '', section: '', email: '', phone: '' });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [classGoal, setClassGoal] = useState(1000);
  const [goalInput, setGoalInput] = useState(1000);
  const [activityDates, setActivityDates] = useState([]);
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
    { id: 'first_points', name: 'First Steps', icon: Star, points: 10, description: 'Earned first 10 points', color: 'bg-blue-500' },
    { id: 'eco_warrior', name: 'Eco Warrior', icon: Leaf, points: 50, description: 'Reached 50 points', color: 'bg-green-500' },
    { id: 'recycling_champ', name: 'Recycling Champ', icon: Recycle, points: 100, description: 'Reached 100 points', color: 'bg-yellow-500' },
    { id: 'point_master', name: 'Point Master', icon: Medal, points: 200, description: 'Reached 200 points', color: 'bg-purple-500' },
    { id: 'super_recycler', name: 'Super Recycler', icon: Trophy, points: 500, description: 'Reached 500 points', color: 'bg-red-500' },
    { id: 'legend', name: 'Recycling Legend', icon: Crown, points: 1000, description: 'Reached 1000 points', color: 'bg-indigo-500' }
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
  const loadClassGoal = useCallback((totalPoints) => {
    const savedGoal = Number(localStorage.getItem(`class_goal_${teacherId}`));
    const goal = savedGoal > 0 ? savedGoal : Math.max(1000, Math.ceil(totalPoints * 1.2));
    setClassGoal(goal);
    setGoalInput(goal);
  }, [teacherId]);

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
      const token = getAuthToken();
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
      const token = getAuthToken();
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
            points: Number(s.points || 0),
            isActive: s.isActive !== false,
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
          activeStudents: accessibleStudents.filter(student => student.isActive).length
        });
        
        if (teacherId) {
          loadClassGoal(totalPoints);
        }
        
        await fetchTeacherSections();
        
        const transactionResponse = await fetch(`${API_BASE}/transactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const transactionData = await transactionResponse.json();
        if (transactionData.success) {
          const accessibleIds = new Set(accessibleStudents.map(student => String(student.id)));
          const activity = transactionData.transactions.filter(transaction =>
            accessibleIds.has(String(transaction.student?._id || transaction.student || transaction.studentId))
          );
          setActivityDates(activity.map(transaction => transaction.createdAt || transaction.timestamp).filter(Boolean));
          const recent = activity
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 8)
            .map(transaction => {
              const isRedemption = transaction.type === 'redeem';
              const timestamp = new Date(transaction.createdAt || transaction.timestamp);
              return {
                id: transaction._id,
                studentName: transaction.student?.fullName || transaction.studentName || 'Unknown student',
                message: isRedemption
                  ? `claimed ${transaction.reward?.name || transaction.rewardName || 'a reward'} (${transaction.pointsSpent || transaction.points || 0} pts)`
                  : `stored ${transaction.pointsEarned || 0} points`,
                time: Number.isNaN(timestamp.getTime()) ? 'Time unavailable' : timestamp.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
              };
            });
          setRecentActivities(recent);
        } else {
          setActivityDates([]);
          setRecentActivities([]);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [isDataLoaded, teacherId, fetchTeacherSections, isStudentAccessible, loadClassGoal]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      const token = getAuthToken();
      if (!token) {
        setInitialLoading(false);
        setLoading(false);
        return;
      }
      try {
        const user = getSessionUser();
        if (user) {
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
      const token = getAuthToken();
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


  const handleSetGoal = () => {
    if (!goalInput || goalInput <= 0) {
      toast.error('Please enter a valid goal amount');
      return;
    }
    setClassGoal(goalInput);
    saveClassGoal(goalInput);
    setShowGoalModal(false);
    
    if (stats.totalPoints >= goalInput) {
      toast.success(`Your class has already reached the ${goalInput.toLocaleString()} points goal.`);
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
    return { labels: sortedGrades, datasets: [{ label: 'Number of Students', data: sortedGrades.map(g => gradeMap[g]), backgroundColor: darkMode ? '#83b99a' : '#2f7856', borderRadius: 4 }] };
  };

  const getWeeklyActivityData = () => {
    const now = new Date();
    const week = Array.from({ length: 7 }, (_, index) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index));
    const counts = new Map(week.map(date => [date.toDateString(), 0]));
    for (const value of activityDates) {
      const day = new Date(value).toDateString();
      if (counts.has(day)) counts.set(day, counts.get(day) + 1);
    }
    return {
      labels: week.map(date => date.toLocaleDateString(undefined, { weekday: 'short' })),
      datasets: [{
        label: 'Activities',
        data: [...counts.values()],
        borderColor: darkMode ? '#a9d7ba' : '#236b4c',
        backgroundColor: darkMode ? '#a9d7ba24' : '#236b4c1a',
        fill: true,
        tension: 0.25
      }]
    };
  };

  const getPointsByGradeData = () => {
    const gradePoints = {};
    filteredStudentsList.forEach(s => {
      if (!gradePoints[s.grade]) gradePoints[s.grade] = { total: 0, count: 0 };
      gradePoints[s.grade].total += s.points;
      gradePoints[s.grade].count += 1;
    });
    const sortedGrades = Object.keys(gradePoints).sort();
    return { labels: sortedGrades, datasets: [{ label: 'Average Points', data: sortedGrades.map(g => Math.round(gradePoints[g].total / gradePoints[g].count)), backgroundColor: darkMode ? '#83b99a' : '#2f7856', borderRadius: 4 }] };
  };

  const tickColor = darkMode ? '#aebdb1' : '#526258';
  const chartOptions = {
    responsive: true,
    animation: false,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: tickColor } } }
  };
  const barChartOptions = {
    ...chartOptions,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: tickColor } },
      y: { beginAtZero: true, ticks: { color: tickColor, precision: 0 }, grid: { color: darkMode ? '#39463c' : '#e5ebe4' } }
    }
  };

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

  if (isDataLoaded && userRole === 'teacher' && !teacherAssignedGrades.length && !teacherAssignedSections.length) {
    return (
      <div className="rb-dashboard">
        <DashboardHeader title="Class overview" description={teacherInfo.fullName} />
        <DashboardPanel title="Your classes">
          <DashboardEmpty icon={School} title="No classes assigned">
            Ask your school administrator to assign a grade or section to your account.
          </DashboardEmpty>
        </DashboardPanel>
      </div>
    );
  }

  const access = teacherAssignedSections.length
    ? teacherAssignedSections.length + (teacherAssignedSections.length === 1 ? ' assigned section' : ' assigned sections')
    : teacherAssignedGrades.join(', ');
  const topStudents = [...filteredStudentsList].sort((a, b) => b.points - a.points).slice(0, 5);
  const charts = [
    { title: 'Weekly activity', Chart: Line, data: getWeeklyActivityData(), options: barChartOptions },
    { title: 'Points distribution', Chart: Doughnut, data: getPointsDistributionData(), options: chartOptions },
    { title: 'Students by grade', Chart: Bar, data: getGradeDistributionData(), options: barChartOptions },
    { title: 'Average points by grade', Chart: Bar, data: getPointsByGradeData(), options: barChartOptions }
  ];

  return (
    <div className="rb-dashboard">
      <DashboardHeader title="Class overview" description={[teacherInfo.fullName, access].filter(Boolean).join(' · ')}>
        <button type="button" className="rb-dash-button-primary" onClick={() => setShowAddStudentModal(true)}><UserPlus size={17} aria-hidden="true" /> Add student</button>
        <button type="button" className="rb-dash-button" onClick={generateProgressReport}><Printer size={17} aria-hidden="true" /> Print report</button>
        <DashboardRefresh busy={isRefreshing} onClick={handleRefresh} />
      </DashboardHeader>

      <DashboardMetrics items={[
        { label: 'Class points', value: stats.totalPoints, icon: Star, primary: true },
        { label: 'Students', value: stats.totalStudents, icon: Users },
        { label: 'Active students', value: stats.activeStudents, icon: Activity },
        { label: 'Badges earned', value: filteredStudentsList.reduce((sum, student) => sum + getStudentBadges(student.points).length, 0), icon: BadgeCheck }
      ]} />

      <div className="rb-dash-split">
        <DashboardPanel title="Your sections" description={teacherSections.length + (teacherSections.length === 1 ? ' section' : ' sections')}>
          {teacherSections.length ? (
            <ul className="rb-dash-list">
              {teacherSections.map(section => {
                const students = filteredStudentsList.filter(student => student.sectionId === section._id);
                const total = students.reduce((sum, student) => sum + student.points, 0);
                return (
                  <li className="rb-dash-row" key={section._id}>
                    <div><strong>{section.sectionName}</strong><small>{section.gradeLevel} · {students.length} students</small></div>
                    <div><strong className="rb-dash-positive">{total.toLocaleString()} pts</strong><small>{students.length ? Math.round(total / students.length) : 0} per student</small></div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <DashboardEmpty icon={School} title="No sections are listed">Your assigned students may still appear below.</DashboardEmpty>
          )}
        </DashboardPanel>
        <DashboardPanel title="Recycling goal" action={<button type="button" className="rb-dash-button" onClick={() => setShowGoalModal(true)}><Target size={16} aria-hidden="true" /> Edit goal</button>}>
          <div className="rb-dash-panel-body">
            <p className="rb-dash-goal-value"><strong>{goalProgress.currentTotal.toLocaleString()}</strong><span> / {classGoal.toLocaleString()} pts</span></p>
            <div className="rb-dash-track" role="progressbar" aria-label="Class goal progress" aria-valuenow={Math.round(goalProgress.percentage)} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: goalProgress.percentage + '%' }} />
            </div>
            <p className="rb-dash-goal-note">{goalProgress.isCompleted ? 'Goal reached' : goalProgress.remaining.toLocaleString() + ' points to go'}</p>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Your students" description={filteredStudentsList.length.toLocaleString() + ' students'} action={
        <label className="rb-dash-search">
          <Search size={16} aria-hidden="true" />
          <input type="search" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} aria-label="Search students by name or ID" placeholder="Name or student ID" />
        </label>
      }>
        {filteredStudents.length ? (
          <div className="rb-dash-scroll" tabIndex={0} role="region" aria-label="Student results table">
            <table className="rb-dash-table">
              <thead><tr>{['Student', 'Grade', 'Section', 'Points', 'Badges', 'Actions'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
              <tbody>
                {filteredStudents.map(student => {
                  const earnedBadges = getStudentBadges(student.points);
                  const nextBadge = getNextBadge(student.points);
                  const pointsToNext = nextBadge ? nextBadge.points - student.points : 0;
                  return (
                    <tr key={student.id}>
                      <td><strong>{student.name}</strong><small>{student.studentId}</small></td>
                      <td>{student.grade}</td>
                      <td>{student.section}</td>
                      <td className="rb-dash-positive font-semibold">{student.points.toLocaleString()}</td>
                      <td>{earnedBadges.length}{pointsToNext > 0 && pointsToNext < 100 && <small>{pointsToNext} pts to {nextBadge.name}</small>}</td>
                      <td>
                        <div className="rb-dash-actions">
                          <button type="button" className="rb-dash-button" onClick={() => generateCertificate(student)}>Certificate</button>
                          <button type="button" className="rb-dash-button" onClick={() => handleViewBadges(student)}>Badges</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <DashboardEmpty icon={Users} title={searchTerm ? 'No matching students' : 'No students yet'} />
        )}
      </DashboardPanel>

      <div className="rb-dash-split rb-dash-even">
        <DashboardPanel title="Recent activity">
          {recentActivities.length ? (
            <ul className="rb-dash-list">
              {recentActivities.map(activity => (
                <li key={activity.id} className="rb-dash-row">
                  <div><strong>{activity.studentName}</strong><small>{activity.message}</small></div>
                  <div><small>{activity.time}</small></div>
                </li>
              ))}
            </ul>
          ) : (
            <DashboardEmpty icon={Activity} title="No activity to show" />
          )}
        </DashboardPanel>
        <DashboardPanel title="Class rankings" description="Top sections by average points">
          {classCompetition.length ? (
            <ol className="rb-dash-list">
              {classCompetition.slice(0, 3).map(section => (
                <li key={section.name} className="rb-dash-row">
                  <div><strong>{section.name}</strong><small>Top student: {section.topStudent?.name}</small></div>
                  <div><strong className="rb-dash-positive">{section.averagePoints.toLocaleString()} pts</strong><small>average</small></div>
                </li>
              ))}
            </ol>
          ) : (
            <DashboardEmpty icon={Award} title="No rankings yet" />
          )}
        </DashboardPanel>
      </div>

      <div className="rb-dash-split rb-dash-even">
        {charts.map(({ title, Chart, data, options }) => (
          <DashboardPanel key={title} title={title} description={title === 'Weekly activity' ? 'Last 7 days' : undefined}>
            <div className="rb-dash-panel-body rb-dash-chart">
              <Chart data={data} options={options} role="img" aria-label={title + ". " + data.labels.map((label, index) => label + ": " + data.datasets[0].data[index]).join(", ")} />
            </div>
          </DashboardPanel>
        ))}
      </div>

      <DashboardPanel title="Top students" description="Ranked by current points">
        {topStudents.length ? (
          <ol className="rb-dash-list">
            {topStudents.map(student => (
              <li key={student.id} className="rb-dash-row">
                <div><strong>{student.name}</strong><small>{student.grade} · {student.section}</small></div>
                <div className="rb-dash-actions">
                  <strong className="rb-dash-positive">{student.points.toLocaleString()} pts</strong>
                  <button type="button" className="rb-dash-button" onClick={() => generateCertificate(student)}>Certificate</button>
                  <button type="button" className="rb-dash-button" onClick={() => handleViewBadges(student)}>Badges</button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <DashboardEmpty icon={Award} title="No student standings yet" />
        )}
      </DashboardPanel>
      {showCertificateModal && certificateData && (
        <WorkspaceDialog
          title="Certificate preview"
          className="rb-certificate-dialog"
          onClose={() => setShowCertificateModal(false)}
          actions={
            <>
              <button type="button" className="rb-dash-button" onClick={() => setShowCertificateModal(false)}>Close</button>
              <button type="button" className="rb-dash-button-primary" onClick={handlePrintCertificate}>
                <Printer size={16} aria-hidden="true" /> Print certificate
              </button>
            </>
          }
        >
          <article id="certificate-content" className="rb-certificate" aria-labelledby="certificate-title">
            <p className="rb-certificate-school">Patubig Elementary School</p>
            <p className="rb-certificate-program">ReBot Recycling Program</p>
            <h3 id="certificate-title">Certificate of Achievement</h3>
            <p>Presented to</p>
            <p className="rb-certificate-recipient">{certificateData.student.name}</p>
            <p>For reaching the <strong>{certificateData.badge.name}</strong> milestone with <strong>{Number(certificateData.student.points).toLocaleString()} points</strong>.</p>
            <div className="rb-certificate-signatures">
              <span>Program Coordinator</span>
              <span>School Principal</span>
            </div>
            <div className="rb-certificate-meta">
              <span>{certificateData.today}</span>
              <span>Certificate ID {certificateData.certId}</span>
            </div>
          </article>
        </WorkspaceDialog>
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
                <h1 className="text-3xl font-bold text-green-800"><BarChart3 className="inline-block align-text-bottom" size={25} strokeWidth={1.65} aria-hidden="true" /> Class Progress Report</h1>
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
                <h3 className="text-xl font-bold mb-3"><Target className="inline-block align-text-bottom" size={19} strokeWidth={1.65} aria-hidden="true" /> Class Goal Tracker</h3>
                <div className="text-2xl font-bold mb-2">{classGoal.toLocaleString()} points</div>
                <div className="w-full bg-white/30 rounded-full h-4 mb-2">
                  <div className="h-full rounded-full bg-yellow-400" style={{ width: `${reportData.goalProgress.percentage}%` }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Progress: {reportData.goalProgress.percentage.toFixed(1)}%</span>
                  <span>{reportData.goalProgress.currentTotal.toLocaleString()} / {classGoal.toLocaleString()}</span>
                </div>
                {reportData.goalProgress.isCompleted && (
                  <div className="mt-3 text-center bg-yellow-400/30 rounded-lg p-2">Class goal achieved</div>
                )}
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4"><ClipboardList className="inline-block align-text-bottom" size={19} strokeWidth={1.65} aria-hidden="true" /> Grade Level Distribution</h3>
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
                <h3 className="text-xl font-bold mb-4"><Trophy className="inline-block align-text-bottom" size={19} strokeWidth={1.65} aria-hidden="true" /> Student Performance Ranking</h3>
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
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center gap-1">
                                {earnedBadges.map(({ id, icon: Icon }) => <Icon key={id} size={16} strokeWidth={1.65} aria-hidden="true" />)}
                                <span>{earnedBadges.length}</span>
                              </span>
                            </td>
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
            <div className="space-y-3"><p className="text-sm font-semibold">Earned Badges:</p><div className="grid grid-cols-2 gap-3">{getStudentBadges(selectedBadgeStudent.points).map(badge => (<div key={badge.id} className={`${badge.color} bg-opacity-20 rounded-xl p-3 text-center`}><badge.icon className="mx-auto" size={26} strokeWidth={1.65} aria-hidden="true" /><p className="font-semibold text-sm mt-1">{badge.name}</p><p className="text-xs text-gray-500">{badge.description}</p></div>))}</div>
            {getNextBadge(selectedBadgeStudent.points).points > selectedBadgeStudent.points && (<><p className="text-sm font-semibold mt-4">Next Badge:</p><div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 text-center opacity-60"><span className="text-3xl">{getNextBadge(selectedBadgeStudent.points).icon}</span><p className="font-semibold text-sm mt-1">{getNextBadge(selectedBadgeStudent.points).name}</p><p className="text-xs text-gray-500">Need {getNextBadge(selectedBadgeStudent.points).points - selectedBadgeStudent.points} more points</p></div></>)}</div>
            <button onClick={() => generateCertificate(selectedBadgeStudent)} className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"><GraduationCap className="inline-block align-text-bottom" size={19} strokeWidth={1.65} aria-hidden="true" /> Generate Certificate</button>
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

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-content, #certificate-content * {
            visibility: visible;
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
