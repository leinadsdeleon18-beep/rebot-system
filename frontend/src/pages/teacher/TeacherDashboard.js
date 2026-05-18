import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, UserPlus, FileText, Star, Calendar, 
  TrendingUp, Award, BarChart3, PieChart, Trophy, Target, 
  Activity, Crown, Medal, AlertCircle, CheckCircle,
  RefreshCw, Printer, Download, Eye, BadgeCheck, Sparkles, X, Settings, Save
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';
import LoadingScreen from '../../components/LoadingScreen';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

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
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingPoints, setIsAddingPoints] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [teacherInfo, setTeacherInfo] = useState({ fullName: '', assignedGrades: [] });
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [formData, setFormData] = useState({ name: '', grade: '', section: 'Section A', email: '', phone: '' });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [classGoal, setClassGoal] = useState(1000);
  const [goalInput, setGoalInput] = useState(1000);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [selectedBadgeStudent, setSelectedBadgeStudent] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  const sections = ['Section A', 'Section B', 'Section C'];

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

  // Generate Certificate HTML
  const generateCertificateHTML = (student, achievement) => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const certId = `CERT-${student.studentId}-${Date.now()}`;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Achievement - ${student.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px;
      font-family: 'Georgia', 'Times New Roman', serif;
    }
    .certificate-container {
      background: white;
      padding: 20px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .certificate {
      width: 800px;
      background: white;
      position: relative;
      border: 1px solid #e5e7eb;
    }
    .certificate-border {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 2px solid #fbbf24;
      border-radius: 12px;
      pointer-events: none;
    }
    .certificate-content {
      padding: 50px;
      text-align: center;
    }
    .school-header { margin-bottom: 30px; }
    .school-name { font-size: 24px; font-weight: bold; color: #1e3c2c; letter-spacing: 2px; }
    .school-tagline { font-size: 12px; color: #666; margin-top: 5px; }
    .certificate-title { font-size: 42px; font-weight: bold; color: #2d5a3f; margin: 20px 0; text-transform: uppercase; letter-spacing: 3px; }
    .award-icon { font-size: 70px; margin: 20px 0; }
    .presented-to { font-size: 18px; color: #555; margin: 20px 0 10px; }
    .student-name { font-size: 42px; font-weight: bold; color: #1e3c2c; margin: 10px 0; font-family: 'Georgia', serif; border-bottom: 2px solid #fbbf24; display: inline-block; padding: 0 20px 10px; }
    .achievement-text { font-size: 18px; color: #555; margin: 20px 0; }
    .badge-display { background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 50px; padding: 15px 30px; display: inline-block; margin: 20px 0; }
    .badge-name { font-size: 28px; font-weight: bold; color: #92400e; }
    .badge-icon { font-size: 40px; display: block; margin-bottom: 10px; }
    .points-achieved { font-size: 36px; font-weight: bold; color: #fbbf24; margin: 20px 0; }
    .signature-section { margin-top: 40px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .signature-line { text-align: center; width: 200px; }
    .signature { font-size: 14px; color: #666; margin-top: 30px; }
    .date { font-size: 14px; color: #666; margin-top: 20px; }
    .certificate-id { font-size: 10px; color: #999; margin-top: 20px; }
    @media print { body { background: white; padding: 0; } .certificate-container { box-shadow: none; padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="certificate">
      <div class="certificate-border"></div>
      <div class="certificate-content">
        <div class="school-header">
          <div class="school-name">🏫 PATUBIG ELEMENTARY SCHOOL 🏫</div>
          <div class="school-tagline">ReBot Recycling Program</div>
        </div>
        <div class="certificate-title">Certificate of Achievement</div>
        <div class="award-icon">🏆</div>
        <div class="presented-to">This certificate is proudly presented to</div>
        <div class="student-name">${student.name}</div>
        <div class="achievement-text">for outstanding achievement in recycling and environmental stewardship</div>
        <div class="badge-display">
          <div class="badge-icon">${achievement.icon}</div>
          <div class="badge-name">${achievement.name}</div>
        </div>
        <div class="points-achieved">✨ ${student.points} Points ✨</div>
        <div class="achievement-text">for reaching the ${achievement.name} milestone in the<br>school's recycling rewards program!</div>
        <div class="signature-section">
          <div class="signature-line"><div>_________________________</div><div class="signature">Program Coordinator</div></div>
          <div class="signature-line"><div>_________________________</div><div class="signature">School Principal</div></div>
        </div>
        <div class="date">Date: ${today}</div>
        <div class="certificate-id">Certificate ID: ${certId}</div>
      </div>
    </div>
    <div class="no-print" style="text-align: center; margin-top: 20px;">
      <button onclick="window.print()" style="padding: 12px 24px; margin: 5px; background: linear-gradient(135deg, #2d5a3f, #1e3c2c); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">🖨️ Print Certificate</button>
      <button onclick="window.close()" style="padding: 12px 24px; margin: 5px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">Close</button>
    </div>
  </div>
</body>
</html>`;
  };

  // Generate Progress Report HTML
  const generateProgressReport = (classData) => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalPoints = classData.reduce((sum, s) => sum + s.points, 0);
    const avgPoints = classData.length > 0 ? Math.round(totalPoints / classData.length) : 0;
    const goalProgress = getGoalProgress();
    
    const gradeDistribution = {};
    classData.forEach(s => { gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1; });
    
    let totalBadges = 0;
    classData.forEach(s => { totalBadges += getStudentBadges(s.points).length; });
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Class Progress Report - ${teacherInfo.fullName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; padding: 40px; }
    .report-container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden; }
    .report-header { background: linear-gradient(135deg, #1e3c2c 0%, #2d5a3f 100%); color: white; padding: 40px; text-align: center; }
    .report-header h1 { font-size: 32px; margin-bottom: 10px; }
    .report-header .subtitle { font-size: 16px; opacity: 0.9; }
    .report-content { padding: 40px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 15px; text-align: center; }
    .stat-card.green { background: linear-gradient(135deg, #2d5a3f 0%, #1e3c2c 100%); }
    .stat-card.orange { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .stat-card.purple { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
    .stat-value { font-size: 36px; font-weight: bold; margin: 10px 0; }
    .stat-label { font-size: 14px; opacity: 0.9; }
    .goal-section { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border-radius: 15px; padding: 25px; margin-bottom: 40px; color: white; }
    .progress-bar-container { background: rgba(255,255,255,0.3); border-radius: 10px; height: 20px; margin: 15px 0; overflow: hidden; }
    .progress-fill { background: #fbbf24; height: 100%; transition: width 0.5s; border-radius: 10px; }
    .grade-distribution { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 40px; }
    .grade-item { background: #f3f4f6; border-radius: 10px; padding: 15px; text-align: center; flex: 1; min-width: 100px; }
    .grade-name { font-weight: bold; color: #2d5a3f; margin-bottom: 5px; }
    .grade-count { font-size: 24px; font-weight: bold; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #2d5a3f; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    tr:hover { background: #f9fafb; }
    .rank-cell { font-weight: bold; width: 60px; }
    .rank-1 { background: #fbbf24; color: #333; }
    .rank-2 { background: #9ca3af; color: #333; }
    .rank-3 { background: #cd7f32; color: #333; }
    .points-cell { font-weight: bold; color: #f59e0b; }
    .badge-icons { font-size: 16px; letter-spacing: 2px; }
    .report-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6c757d; }
    @media print { body { background: white; padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <h1>📊 Class Progress Report</h1>
      <div class="subtitle">Patubig Elementary School - ReBot Recycling Program</div>
      <div class="subtitle">Generated: ${today}</div>
      <div class="subtitle">Teacher: ${teacherInfo.fullName}</div>
    </div>
    <div class="report-content">
      <div class="stats-grid">
        <div class="stat-card green"><div class="stat-label">Total Students</div><div class="stat-value">${classData.length}</div></div>
        <div class="stat-card orange"><div class="stat-label">Total Points</div><div class="stat-value">${totalPoints.toLocaleString()}</div></div>
        <div class="stat-card purple"><div class="stat-label">Average Points</div><div class="stat-value">${avgPoints}</div></div>
        <div class="stat-card"><div class="stat-label">Badges Awarded</div><div class="stat-value">${totalBadges}</div></div>
      </div>
      <div class="goal-section">
        <h3>🎯 Class Goal Tracker</h3>
        <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">${classGoal.toLocaleString()} points</div>
        <div class="progress-bar-container"><div class="progress-fill" style="width: ${goalProgress.percentage}%"></div></div>
        <div style="display: flex; justify-content: space-between; margin-top: 10px;"><span>Progress: ${goalProgress.percentage.toFixed(1)}%</span><span>${goalProgress.currentTotal.toLocaleString()} / ${classGoal.toLocaleString()}</span></div>
        <div style="margin-top: 15px;">${goalProgress.isCompleted ? '🎉 GOAL ACHIEVED! Congratulations! 🎉' : `${goalProgress.remaining.toLocaleString()} points remaining to reach goal`}</div>
      </div>
      <h3>📋 Grade Level Distribution</h3>
      <div class="grade-distribution">
        ${Object.entries(gradeDistribution).map(([grade, count]) => `<div class="grade-item"><div class="grade-name">${grade}</div><div class="grade-count">${count} students</div></div>`).join('')}
      </div>
      <h3>🏆 Student Performance Ranking</h3>
      </table>
        <thead><tr><th>Rank</th><th>Student Name</th><th>Grade & Section</th><th>Points</th><th>Badges Earned</th></tr></thead>
        <tbody>
          ${classData.sort((a,b) => b.points - a.points).map((student, index) => {
            const earnedBadges = getStudentBadges(student.points);
            return `<tr><td class="rank-cell"><span class="${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}" style="display: inline-block; width: 30px; text-align: center; padding: 4px 8px; border-radius: 20px;">${index + 1}</span></td><td><strong>${student.name}</strong></td><td>${student.grade} - ${student.section}</td><td class="points-cell">${student.points} pts</td><td class="badge-icons">${earnedBadges.map(b => b.icon).join(' ')} (${earnedBadges.length})</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="report-footer">
      <p>This report is auto-generated by the ReBot Recycling Management System</p>
      <p>© ${new Date().getFullYear()} Patubig Elementary School</p>
    </div>
  </div>
  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 12px 24px; margin: 5px; background: linear-gradient(135deg, #2d5a3f, #1e3c2c); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">🖨️ Print Report</button>
    <button onclick="window.close()" style="padding: 12px 24px; margin: 5px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">Close</button>
  </div>
</body>
</html>`;
  };

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
            assignedGrades: user.assignedGrades || []
          });
          setTeacherId(user.id);
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

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!isDataLoaded) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        const formatted = data.students.map(s => ({
          id: s._id,
          name: s.fullName,
          grade: s.grade || 'N/A',
          section: s.sectionName || s.section || 'N/A',
          points: s.points || 0,
          studentId: s.studentId,
          email: s.email,
          lastActive: new Date(s.createdAt).toISOString().split('T')[0]
        }));
        setStudents(formatted);
        
        const totalPoints = formatted.reduce((sum, s) => sum + s.points, 0);
        setStats({
          totalStudents: formatted.length,
          totalPoints: totalPoints,
          activeStudents: formatted.length
        });
        
        if (teacherId) {
          loadClassGoal();
        }
        
        const activities = [
          { icon: '⭐', message: 'earned points', color: 'bg-yellow-100 text-yellow-700' },
          { icon: '♻️', message: 'recycled items', color: 'bg-green-100 text-green-700' },
          { icon: '🏆', message: 'reached a milestone!', color: 'bg-purple-100 text-purple-700' },
        ];
        const recent = [];
        for (let i = 0; i < 5; i++) {
          const randomStudent = formatted[Math.floor(Math.random() * formatted.length)];
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
  }, [isDataLoaded, teacherId]);

  useEffect(() => {
    if (isDataLoaded) {
      fetchStudents();
    }
  }, [isDataLoaded, fetchStudents]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
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
      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
        setFormData({ name: '', grade: teacherInfo.assignedGrades[0] || '', section: 'Section A', email: '', phone: '' });
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
      const response = await fetch(`http://localhost:5000/api/students/${selectedStudent.id}/points`, {
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

  const handlePrintProgressReport = () => {
    if (students.length === 0) {
      toast.error('No students to generate report');
      return;
    }
    
    toast.loading('Generating report...', { duration: 1500 });
    const reportHTML = generateProgressReport(students);
    const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (!printWindow) {
      toast.error('Please allow pop-ups to print reports');
      return;
    }
    
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.onload = () => setTimeout(() => printWindow.print(), 500);
    toast.success('Report generated successfully!');
  };

  const handleGenerateCertificate = (student) => {
    const earnedBadges = getStudentBadges(student.points);
    if (earnedBadges.length === 0) {
      toast.error(`${student.name} hasn't earned any badges yet. Encourage them to earn at least 10 points!`);
      return;
    }
    
    toast.loading('Generating certificate...', { duration: 1500 });
    const latestBadge = earnedBadges[earnedBadges.length - 1];
    const certificateHTML = generateCertificateHTML(student, latestBadge);
    const certWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
    
    if (!certWindow) {
      toast.error('Please allow pop-ups to generate certificates');
      return;
    }
    
    certWindow.document.write(certificateHTML);
    certWindow.document.close();
    certWindow.onload = () => setTimeout(() => certWindow.print(), 500);
    toast.success(`Certificate generated for ${student.name}`);
  };

  const handleViewBadges = (student) => {
    setSelectedBadgeStudent(student);
    setShowBadgesModal(true);
  };

  // Class Competition Data
  const getClassCompetitionData = () => {
    const sectionsData = {};
    students.forEach(s => {
      if (!sectionsData[s.section]) {
        sectionsData[s.section] = { totalPoints: 0, studentCount: 0, students: [] };
      }
      sectionsData[s.section].totalPoints += s.points;
      sectionsData[s.section].studentCount++;
      sectionsData[s.section].students.push(s);
    });
    return Object.entries(sectionsData).map(([name, data]) => ({
      name,
      averagePoints: Math.round(data.totalPoints / data.studentCount),
      totalPoints: data.totalPoints,
      studentCount: data.studentCount,
      topStudent: [...data.students].sort((a, b) => b.points - a.points)[0]
    })).sort((a, b) => b.averagePoints - a.averagePoints);
  };

  const goalProgress = getGoalProgress();
  const classCompetition = getClassCompetitionData();

  // Chart Data
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
      datasets: [{ data: ranges.map(r => students.filter(s => s.points >= r.min && s.points <= r.max).length), backgroundColor: ranges.map(r => r.color), borderWidth: 0 }]
    };
  };

  const getGradeDistributionData = () => {
    const gradeMap = {};
    students.forEach(s => { gradeMap[s.grade] = (gradeMap[s.grade] || 0) + 1; });
    const sortedGrades = Object.keys(gradeMap).sort();
    return { labels: sortedGrades, datasets: [{ label: 'Number of Students', data: sortedGrades.map(g => gradeMap[g]), backgroundColor: '#3b82f6', borderRadius: 8 }] };
  };

  const getWeeklyActivityData = () => {
    return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'Activities', data: [45, 52, 38, 61, 48, 25, 12], borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', tension: 0.4, fill: true }] };
  };

  const getPointsByGradeData = () => {
    const gradePoints = {};
    students.forEach(s => {
      if (!gradePoints[s.grade]) gradePoints[s.grade] = { total: 0, count: 0 };
      gradePoints[s.grade].total += s.points;
      gradePoints[s.grade].count += 1;
    });
    const sortedGrades = Object.keys(gradePoints).sort();
    return { labels: sortedGrades, datasets: [{ label: 'Average Points', data: sortedGrades.map(g => Math.round(gradePoints[g].total / gradePoints[g].count)), backgroundColor: '#f59e0b', borderRadius: 8 }] };
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
  const barChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Show loading screen while initializing
  if (initialLoading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  // Show loading screen while fetching data
  if (loading && students.length === 0) {
    return <LoadingScreen message="Loading your students..." />;
  }

  // Show no grades assigned message
  if (isDataLoaded && teacherInfo.assignedGrades.length === 0) {
    return (
      <div className="bg-yellow-50 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Grades Assigned</h2>
        <p className="text-yellow-700">Please contact the administrator to assign grade levels to your account.</p>
      </div>
    );
  }

  const assignedGradesText = teacherInfo.assignedGrades.join(', ');

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Teacher Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {teacherInfo.fullName}! Access: <span className="font-semibold text-green-600">{assignedGradesText}</span>
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

      {/* Stats Cards */}
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
          <div className="flex justify-between"><div><p className="text-gray-500 text-sm">Badges Awarded</p><p className="text-3xl font-bold text-purple-600">{students.reduce((sum, s) => sum + getStudentBadges(s.points).length, 0)}</p></div><div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center"><BadgeCheck className="text-white" size={24} /></div></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button onClick={() => setShowAddStudentModal(true)} className="flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition"><UserPlus size={18} /> Add Student</button>
        <button onClick={() => window.location.href = '/teacher/qr-codes'} className="flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition"><FileText size={18} /> QR Codes</button>
        <button onClick={handlePrintProgressReport} className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"><Printer size={18} /> Print Report</button>
        <button onClick={() => { if (students.length > 0) handleGenerateCertificate(students[0]); else toast.error('No students'); }} className="flex items-center justify-center gap-2 p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition"><CertificateIcon size={18} /> Certificate</button>
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

      {/* Charts */}
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

      {/* Top Students */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b"><h3 className="font-semibold flex items-center gap-2"><Award size={20} className="text-yellow-500" /> Top Performing Students</h3></div>
        <div className="divide-y">
          {[...students].sort((a, b) => b.points - a.points).slice(0, 5).map((student, index) => {
            const earnedBadges = getStudentBadges(student.points);
            return (
              <div key={student.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : '#22c55e' }}>{index + 1}</div>
                  <div><p className="font-medium">{student.name}</p><p className="text-xs text-gray-500">{student.grade} - {student.section}</p><div className="flex gap-1 mt-1">{earnedBadges.slice(0, 3).map(b => <span key={b.id} className="text-xs" title={b.name}>{b.icon}</span>)}{earnedBadges.length > 3 && <span className="text-xs text-gray-400">+{earnedBadges.length - 3}</span>}</div></div>
                </div>
                <div className="text-right"><p className="text-xl font-bold text-green-600">{student.points}</p><div className="flex gap-2 mt-1"><button onClick={() => handleGenerateCertificate(student)} className="text-xs text-blue-600 hover:underline">Certificate</button><button onClick={() => handleViewBadges(student)} className="text-xs text-purple-600 hover:underline">Badges ({earnedBadges.length})</button></div></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b"><div className="flex justify-between items-center"><h3 className="font-semibold">Your Students ({students.length})</h3><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4 pr-4 py-2 border rounded-xl text-sm w-64" /></div></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium">Student Name</th><th className="px-6 py-3 text-left text-xs font-medium">Grade & Section</th><th className="px-6 py-3 text-left text-xs font-medium">Points</th><th className="px-6 py-3 text-left text-xs font-medium">Badges</th><th className="px-6 py-3 text-left text-xs font-medium">Actions</th></tr></thead>
            <tbody className="divide-y">
              {filteredStudents.map(student => {
                const earnedBadges = getStudentBadges(student.points);
                const nextBadge = getNextBadge(student.points);
                const pointsToNext = nextBadge ? nextBadge.points - student.points : 0;
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{student.name}</td>
                    <td className="px-6 py-4 text-sm">{student.grade} - {student.section}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">{student.points} pts</td>
                    <td className="px-6 py-4"><div className="flex gap-1">{earnedBadges.slice(0, 2).map(b => <span key={b.id} className="text-lg cursor-pointer" title={b.name}>{b.icon}</span>)}{earnedBadges.length > 2 && <span className="text-xs text-gray-500">+{earnedBadges.length - 2}</span>}{pointsToNext > 0 && pointsToNext < 100 && <p className="text-xs text-gray-400 mt-1">{pointsToNext} pts to {nextBadge?.name}</p>}</div></td>
                    <td className="px-6 py-4"><div className="flex gap-2">
                      <button onClick={() => { setSelectedStudent(student); setShowPointsModal(true); }} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200" disabled={isAddingPoints}>Add Points</button>
                      <button onClick={() => handleGenerateCertificate(student)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">Cert</button>
                      <button onClick={() => handleViewBadges(student)} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200">Badges</button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold flex items-center gap-2"><Target size={20} className="text-purple-600" /> Set Class Goal</h3><button onClick={() => setShowGoalModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
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
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Badge Collection</h3><button onClick={() => setShowBadgesModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
            <div className="text-center mb-4"><div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">{selectedBadgeStudent.name.charAt(0)}</div><h4 className="font-bold text-lg mt-2">{selectedBadgeStudent.name}</h4><p className="text-sm text-gray-500">{selectedBadgeStudent.points} total points</p></div>
            <div className="space-y-3"><p className="text-sm font-semibold">Earned Badges:</p><div className="grid grid-cols-2 gap-3">{getStudentBadges(selectedBadgeStudent.points).map(badge => (<div key={badge.id} className={`${badge.color} bg-opacity-20 rounded-xl p-3 text-center`}><span className="text-3xl">{badge.icon}</span><p className="font-semibold text-sm mt-1">{badge.name}</p><p className="text-xs text-gray-500">{badge.description}</p></div>))}</div>
            {getNextBadge(selectedBadgeStudent.points).points > selectedBadgeStudent.points && (<><p className="text-sm font-semibold mt-4">Next Badge:</p><div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 text-center opacity-60"><span className="text-3xl">{getNextBadge(selectedBadgeStudent.points).icon}</span><p className="font-semibold text-sm mt-1">{getNextBadge(selectedBadgeStudent.points).name}</p><p className="text-xs text-gray-500">Need {getNextBadge(selectedBadgeStudent.points).points - selectedBadgeStudent.points} more points</p></div></>)}</div>
            <button onClick={() => handleGenerateCertificate(selectedBadgeStudent)} className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">🎓 Generate Certificate</button>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6"><div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Add New Student</h3><button onClick={() => setShowAddStudentModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <div className="space-y-4"><input type="text" placeholder="Full Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /><div className="grid grid-cols-2 gap-4"><select value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="px-4 py-2 border rounded-xl">{teacherInfo.assignedGrades.map(g => <option key={g}>{g}</option>)}</select><select value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} className="px-4 py-2 border rounded-xl">{sections.map(s => <option key={s}>{s}</option>)}</select></div><input type="email" placeholder="Email (optional)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /><button onClick={handleAddStudent} disabled={isAddingStudent} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50">{isAddingStudent ? 'Adding...' : 'Add Student'}</button></div></div>
        </div>
      )}

      {/* Add Points Modal */}
      {showPointsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6"><div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Add Points</h3><button onClick={() => setShowPointsModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button></div>
          <div className="space-y-4"><p>Student: <span className="font-semibold">{selectedStudent.name}</span></p><p>Current Points: <span className="font-semibold text-green-600">{selectedStudent.points}</span></p><p className="text-sm text-gray-500">Next Badge: {getNextBadge(selectedStudent.points).name} ({getNextBadge(selectedStudent.points).points - selectedStudent.points} points needed)</p><input type="number" placeholder="Points to add" value={pointsToAdd} onChange={(e) => setPointsToAdd(e.target.value)} className="w-full px-4 py-2 border rounded-xl" min="1" /><div className="flex gap-3"><button onClick={() => setShowPointsModal(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancel</button><button onClick={handleAddPoints} disabled={isAddingPoints} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50">{isAddingPoints ? 'Adding...' : 'Add Points'}</button></div></div></div>
        </div>
      )}
    </div>
  );
}