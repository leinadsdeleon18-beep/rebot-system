import React, { useState, useEffect } from 'react';
import { 
  Download, Calendar, TrendingUp, FileText, PieChart, BarChart3, 
  Printer, Filter, X, ChevronLeft, ChevronRight, Award, Users, 
  Gift, Star, DollarSign, Package, Clock, CheckCircle, AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
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
} from 'chart.js';
import toast from 'react-hot-toast';

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

export default function Reports() {
  const [reportType, setReportType] = useState('recycling');
  const [dateRange, setDateRange] = useState({ 
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });
  const [generated, setGenerated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recyclingData, setRecyclingData] = useState([]);
  const [redemptionData, setRedemptionData] = useState([]);
  const [students, setStudents] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalStudents: 0,
    totalPoints: 0,
    totalRedemptions: 0,
    totalRewards: 0,
    averagePoints: 0,
    topStudent: null,
    topReward: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch students
      const studentsRes = await fetch('http://localhost:5000/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const studentsData = await studentsRes.json();
      
      // Fetch rewards
      const rewardsRes = await fetch('http://localhost:5000/api/rewards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rewardsData = await rewardsRes.json();
      
      if (studentsData.success) {
        setStudents(studentsData.students);
        
        // Generate mock recycling data based on students
        const mockRecycling = studentsData.students.map((s, index) => ({
          id: s._id,
          studentName: s.fullName,
          grade: s.grade || 'N/A',
          section: s.sectionName || s.section || 'N/A',
          points: s.points || 0,
          bottles: Math.floor(Math.random() * 100) + 10,
          paper: Math.floor(Math.random() * 50) + 5,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }));
        setRecyclingData(mockRecycling);
        
        // Calculate summary stats
        const totalPoints = studentsData.students.reduce((sum, s) => sum + (s.points || 0), 0);
        const topStudent = [...studentsData.students].sort((a, b) => (b.points || 0) - (a.points || 0))[0];
        
        setSummaryStats({
          totalStudents: studentsData.students.length,
          totalPoints: totalPoints,
          totalRedemptions: Math.floor(Math.random() * 100) + 20,
          totalRewards: rewardsData.success ? rewardsData.rewards.length : 0,
          averagePoints: studentsData.students.length > 0 ? Math.round(totalPoints / studentsData.students.length) : 0,
          topStudent: topStudent,
          topReward: rewardsData.success && rewardsData.rewards.length > 0 ? rewardsData.rewards[0] : null
        });
      }
      
      if (rewardsData.success) {
        setRewards(rewardsData.rewards);
        
        // Generate mock redemption data
        const mockRedemptions = [];
        for (let i = 0; i < 20; i++) {
          const randomStudent = studentsData.students?.[Math.floor(Math.random() * (studentsData.students?.length || 1))];
          const randomReward = rewardsData.rewards?.[Math.floor(Math.random() * (rewardsData.rewards?.length || 1))];
          if (randomStudent && randomReward) {
            mockRedemptions.push({
              id: i,
              studentName: randomStudent.fullName,
              rewardName: randomReward.name,
              points: randomReward.pointsRequired,
              date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
          }
        }
        setRedemptionData(mockRedemptions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    setGenerated(true);
    fetchData();
    toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated!`);
  };

  const handleExport = () => {
    let exportData = [];
    let headers = [];
    
    if (reportType === 'recycling') {
      headers = ['Student Name', 'Grade', 'Section', 'Points', 'Bottles', 'Paper (kg)', 'Date'];
      exportData = recyclingData.map(item => [
        item.studentName, item.grade, item.section, item.points, item.bottles, item.paper, item.date
      ]);
    } else if (reportType === 'rewards') {
      headers = ['Student Name', 'Reward', 'Points Used', 'Date'];
      exportData = redemptionData.map(item => [
        item.studentName, item.rewardName, item.points, item.date
      ]);
    } else if (reportType === 'students') {
      headers = ['Student Name', 'Grade', 'Section', 'Points', 'Status'];
      exportData = students.map(s => [
        s.fullName, s.grade || 'N/A', s.sectionName || s.section || 'N/A', s.points || 0, s.isActive !== false ? 'Active' : 'Inactive'
      ]);
    }
    
    const csvContent = [headers, ...exportData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  const handlePrint = () => {
    const printContent = document.getElementById('report-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ReBot Report - ${new Date().toLocaleDateString()}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 40px; background: white; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #2d5a3f; }
          .header h1 { color: #2d5a3f; font-size: 28px; margin-bottom: 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: linear-gradient(135deg, #2d5a3f, #1e3c2c); color: white; padding: 20px; border-radius: 12px; text-align: center; }
          .stat-value { font-size: 28px; font-weight: bold; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #2d5a3f; color: white; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { margin: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>♻️ ReBot Recycling Program Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Report Type: ${reportType.toUpperCase()}</p>
        </div>
        ${printContent ? printContent.cloneNode(true).innerHTML : ''}
        <div class="footer">
          <p>This report is auto-generated by the ReBot Recycling Management System</p>
          <p>© ${new Date().getFullYear()} Patubig Elementary School</p>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2d5a3f; color: white; border: none; border-radius: 8px; cursor: pointer;">🖨️ Print</button>
          <button onclick="window.close()" style="padding: 10px 20px; margin-left: 10px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer;">Close</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
    toast.success('Print window opened');
  };

  const getChartData = () => {
    if (reportType === 'recycling') {
      const gradePoints = {};
      recyclingData.forEach(item => {
        if (!gradePoints[item.grade]) gradePoints[item.grade] = 0;
        gradePoints[item.grade] += item.points;
      });
      return {
        labels: Object.keys(gradePoints),
        datasets: [{ 
          label: 'Points by Grade', 
          data: Object.values(gradePoints), 
          backgroundColor: '#2e7d32', 
          borderRadius: 8,
          borderWidth: 0
        }]
      };
    } else if (reportType === 'rewards') {
      const rewardCount = {};
      redemptionData.forEach(item => {
        if (!rewardCount[item.rewardName]) rewardCount[item.rewardName] = 0;
        rewardCount[item.rewardName]++;
      });
      return {
        labels: Object.keys(rewardCount).slice(0, 5),
        datasets: [{ 
          label: 'Redemptions', 
          data: Object.values(rewardCount).slice(0, 5), 
          backgroundColor: '#f59e0b', 
          borderRadius: 8,
          borderWidth: 0
        }]
      };
    } else {
      const gradeCount = {};
      students.forEach(s => {
        const grade = s.grade || 'N/A';
        gradeCount[grade] = (gradeCount[grade] || 0) + 1;
      });
      return {
        labels: Object.keys(gradeCount),
        datasets: [{ 
          label: 'Students per Grade', 
          data: Object.values(gradeCount), 
          backgroundColor: '#3b82f6', 
          borderRadius: 8,
          borderWidth: 0
        }]
      };
    }
  };

  const getLineChartData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    
    return {
      labels: last7Days,
      datasets: [{
        label: 'Activity Trend',
        data: [65, 72, 58, 85, 78, 92, 88],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    };
  };

  const getPieData = () => {
    const gradePoints = {};
    students.forEach(s => {
      const grade = s.grade || 'N/A';
      gradePoints[grade] = (gradePoints[grade] || 0) + (s.points || 0);
    });
    const colors = ['#2e7d32', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
    return {
      labels: Object.keys(gradePoints),
      datasets: [{ 
        data: Object.values(gradePoints), 
        backgroundColor: colors.slice(0, Object.keys(gradePoints).length),
        borderWidth: 0
      }]
    };
  };

  const chartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { position: 'top', labels: { font: { size: 12 } } },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 10 }
    } 
  };
  
  const pieOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { position: 'bottom', labels: { font: { size: 11 } } }
    } 
  };

  const getTableData = () => {
    if (reportType === 'recycling') {
      return recyclingData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    } else if (reportType === 'rewards') {
      return redemptionData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    } else {
      return students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }
  };

  const getTotalPages = () => {
    if (reportType === 'recycling') return Math.ceil(recyclingData.length / itemsPerPage);
    if (reportType === 'rewards') return Math.ceil(redemptionData.length / itemsPerPage);
    return Math.ceil(students.length / itemsPerPage);
  };

  const renderTableHeaders = () => {
    if (reportType === 'recycling') {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bottles</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paper (kg)</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
        </tr>
      );
    } else if (reportType === 'rewards') {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points Used</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
        </tr>
      );
    } else {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
        </tr>
      );
    }
  };

  const renderTableRows = () => {
    const data = getTableData();
    
    if (reportType === 'recycling') {
      return data.map((item) => (
        <tr key={item.id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 text-sm font-medium text-gray-800">{item.studentName}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{item.grade}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{item.section}</td>
          <td className="px-6 py-4 text-sm font-semibold text-green-600">{item.points}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{item.bottles}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{item.paper}</td>
          <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
        </tr>
      ));
    } else if (reportType === 'rewards') {
      return data.map((item) => (
        <tr key={item.id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 text-sm font-medium text-gray-800">{item.studentName}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{item.rewardName}</td>
          <td className="px-6 py-4 text-sm font-semibold text-orange-600">{item.points}</td>
          <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
        </tr>
      ));
    } else {
      return data.map((student) => (
        <tr key={student._id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 text-sm font-medium text-gray-800">{student.fullName}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{student.grade || 'N/A'}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{student.sectionName || student.section || 'N/A'}</td>
          <td className="px-6 py-4 text-sm font-semibold text-green-600">{student.points || 0}</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {student.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </td>
        </tr>
      ));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Generate and export detailed system reports</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Filter size={18} /> Filters
          </button>
          <button 
            onClick={handleExport} 
            className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2 hover:bg-green-700 transition shadow-sm"
          >
            <Download size={18} /> Export CSV
          </button>
          <button 
            onClick={handlePrint} 
            className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
          >
            <Printer size={18} /> Print
          </button>
          <button 
            onClick={handleGenerate} 
            className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 hover:bg-purple-700 transition shadow-sm"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {/* Report Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Calendar size={20} /> Report Filters
            </h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              >
                <option value="recycling">♻️ Recycling Performance</option>
                <option value="rewards">🎁 Rewards Redemption</option>
                <option value="students">👨‍🎓 Student Analytics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
              <input 
                type="date" 
                value={dateRange.from} 
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
              <input 
                type="date" 
                value={dateRange.to} 
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group By</label>
              <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleGenerate} className="px-6 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition flex items-center gap-2">
              <BarChart3 size={18} /> Generate Report
            </button>
          </div>
        </div>
      )}

      {/* Report Results */}
      {generated && (
        <div id="report-content" className="space-y-6 animate-fadeIn">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total Students</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{summaryStats.totalStudents}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-green-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600">{summaryStats.totalPoints.toLocaleString()} total points</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-orange-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total Points</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{summaryStats.totalPoints.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Star size={20} className="text-orange-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-orange-600">Avg: {summaryStats.averagePoints} per student</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-purple-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total Redemptions</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{summaryStats.totalRedemptions}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Gift size={20} className="text-purple-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-purple-600">{summaryStats.totalRewards} rewards available</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Recycling Items</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{recyclingData.reduce((sum, i) => sum + (i.bottles || 0) + (i.paper || 0), 0).toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Package size={20} className="text-blue-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-600">Bottles + Paper combined</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-green-600" /> {reportType === 'recycling' ? 'Points by Grade' : reportType === 'rewards' ? 'Most Redeemed Rewards' : 'Students by Grade'}
              </h3>
              <div className="h-80">
                <Bar data={getChartData()} options={chartOptions} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" /> Weekly Activity Trend
              </h3>
              <div className="h-80">
                <Line data={getLineChartData()} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-orange-600" /> Points Distribution by Grade
              </h3>
              <div className="h-80">
                <Doughnut data={getPieData()} options={pieOptions} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Award size={20} className="text-yellow-500" /> Top Performing Students
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {[...students].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5).map((student, index) => (
                  <div key={student._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-green-500'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{student.fullName}</p>
                        <p className="text-xs text-gray-500">{student.grade || 'N/A'} - {student.sectionName || student.section || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">{student.points || 0} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <FileText size={20} className="text-gray-500" /> Detailed Data
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  {renderTableHeaders()}
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {renderTableRows()}
                  {getTableData().length === 0 && (
                    <tr>
                      <td colSpan={reportType === 'recycling' ? 7 : reportType === 'rewards' ? 4 : 5} className="px-6 py-8 text-center text-gray-500">
                        No data available for the selected report type
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {getTotalPages() > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {getTotalPages()}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(getTotalPages(), p + 1))}
                  disabled={currentPage === getTotalPages()}
                  className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Report Generated State */}
      {!generated && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
          <FileText size={64} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No Report Generated</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Select filters and click Generate Report</p>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}