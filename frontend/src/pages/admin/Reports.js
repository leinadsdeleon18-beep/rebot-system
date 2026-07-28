import React, { useState, useEffect } from 'react';
import { 
  Download, Calendar, TrendingUp, FileText, PieChart, BarChart3, 
  Printer, Filter, X, ChevronLeft, ChevronRight, Award, Users, 
  Gift, Star, DollarSign, Package, Clock, CheckCircle, AlertCircle,
  RefreshCw, School, Building2, LineChart, BarChart
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
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
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [reportData, setReportData] = useState({
    summaryStats: { totalStudents: 0, totalPoints: 0, totalRedemptions: 0, averagePoints: 0 },
    yearlyTrend: { labels: [], data: [] },
    monthlyTrend: { labels: [], data: [] },
    gradePerformance: [],
    sectionPerformance: [],
    topStudents: [],
    students: [],
    recyclingData: [],
    redemptionData: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Available years for filter - starting from 2026
  const availableYears = [2026, 2027, 2028, 2029, 2030];
  
  // Available months
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Available grades for filter
  const gradeOptions = [
    { value: 'all', label: 'All Grades' },
    { value: 'Kindergarten', label: 'Kindergarten' },
    { value: 'Grade 1', label: 'Grade 1' },
    { value: 'Grade 2', label: 'Grade 2' },
    { value: 'Grade 3', label: 'Grade 3' },
    { value: 'Grade 4', label: 'Grade 4' },
    { value: 'Grade 5', label: 'Grade 5' },
    { value: 'Grade 6', label: 'Grade 6' }
  ];

  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetchSections();
    fetchReportData();
  }, []);

  const fetchSections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/sections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSections(data.sections);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        year: selectedYear,
        month: selectedMonth,
        grade: selectedGrade,
        section: selectedSection,
        reportType: reportType
      });
      
      const response = await fetch(`http://localhost:5000/api/reports/data?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setReportData(result.data);
      } else {
        toast.error(result.message || 'Failed to load report data');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecyclingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        year: selectedYear,
        month: selectedMonth,
        grade: selectedGrade,
        section: selectedSection
      });
      
      const response = await fetch(`http://localhost:5000/api/reports/recycling?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setReportData(prev => ({ ...prev, recyclingData: result.data }));
      }
    } catch (error) {
      console.error('Error fetching recycling data:', error);
    }
  };

  const fetchRedemptionData = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        year: selectedYear,
        month: selectedMonth,
        grade: selectedGrade,
        section: selectedSection
      });
      
      const response = await fetch(`http://localhost:5000/api/reports/redemption?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setReportData(prev => ({ ...prev, redemptionData: result.data }));
      }
    } catch (error) {
      console.error('Error fetching redemption data:', error);
    }
  };

  const handleGenerate = async () => {
    await fetchReportData();
    if (reportType === 'recycling') {
      await fetchRecyclingData();
    } else if (reportType === 'rewards') {
      await fetchRedemptionData();
    }
    toast.success('Report generated with real-time data!');
  };

  const handleFilterChange = () => {
    handleGenerate();
  };

  const handleExport = () => {
    let exportData = [];
    let headers = [];
    
    if (reportType === 'recycling') {
      headers = ['Student Name', 'Grade', 'Section', 'Points', 'Date'];
      exportData = reportData.recyclingData.map(item => [
        item.studentName, item.grade, item.section, item.points, item.date
      ]);
    } else if (reportType === 'rewards') {
      headers = ['Student Name', 'Reward', 'Points Used', 'Date'];
      exportData = reportData.redemptionData.map(item => [
        item.studentName, item.rewardName, item.points, item.date
      ]);
    } else if (reportType === 'students') {
      headers = ['Student Name', 'Grade', 'Section', 'Points Earned', 'Status'];
      exportData = reportData.students.map(s => [
        s.fullName, s.grade || 'N/A', s.sectionName || 'N/A', s.pointsEarned || 0, s.isActive !== false ? 'Active' : 'Inactive'
      ]);
    } else if (reportType === 'grade-performance') {
      headers = ['Grade Level', 'Total Students', 'Total Points', 'Average Points'];
      exportData = reportData.gradePerformance.map(item => [
        item.grade, item.studentCount, item.totalPoints, item.averagePoints
      ]);
    } else if (reportType === 'section-performance') {
      headers = ['Grade', 'Section', 'Total Students', 'Total Points', 'Average Points'];
      exportData = reportData.sectionPerformance.map(item => [
        item.grade, item.section, item.studentCount, item.totalPoints, item.averagePoints
      ]);
    } else if (reportType === 'yearly-trend') {
      headers = ['Year', 'Total Points'];
      exportData = reportData.yearlyTrend.labels.map((year, index) => [
        year, reportData.yearlyTrend.data[index]
      ]);
    } else if (reportType === 'monthly-trend') {
      headers = ['Month', 'Points Earned'];
      exportData = reportData.monthlyTrend.labels.map((month, index) => [
        month, reportData.monthlyTrend.data[index]
      ]);
    }
    
    const csvContent = [headers, ...exportData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const getChartData = () => {
    if (reportType === 'recycling') {
      return {
        labels: reportData.gradePerformance.map(g => g.grade),
        datasets: [{ 
          label: 'Total Points by Grade', 
          data: reportData.gradePerformance.map(g => g.totalPoints), 
          backgroundColor: '#2e7d32', 
          borderRadius: 8,
          borderWidth: 0
        }]
      };
    } else if (reportType === 'rewards') {
      const rewardCount = {};
      reportData.redemptionData.forEach(item => {
        rewardCount[item.rewardName] = (rewardCount[item.rewardName] || 0) + 1;
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
    } else if (reportType === 'students') {
      const gradeCount = {};
      reportData.students.forEach(s => {
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
    } else if (reportType === 'grade-performance') {
      return {
        labels: reportData.gradePerformance.map(g => g.grade),
        datasets: [{ 
          label: 'Total Points', 
          data: reportData.gradePerformance.map(g => g.totalPoints), 
          backgroundColor: '#2e7d32', 
          borderRadius: 8,
          borderWidth: 0
        }]
      };
    } else if (reportType === 'section-performance') {
      return {
        labels: reportData.sectionPerformance.slice(0, 15).map(s => `${s.grade} - ${s.section}`),
        datasets: [{ 
          label: 'Total Points', 
          data: reportData.sectionPerformance.slice(0, 15).map(s => s.totalPoints), 
          backgroundColor: '#8b5cf6', 
          borderRadius: 8,
          borderWidth: 0
        }]
      };
    } else if (reportType === 'yearly-trend') {
      return {
        labels: reportData.yearlyTrend.labels,
        datasets: [{
          label: 'Points Earned',
          data: reportData.yearlyTrend.data,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#16a34a',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      };
    } else {
      return {
        labels: reportData.monthlyTrend.labels,
        datasets: [{
          label: `Points Earned in ${selectedYear}`,
          data: reportData.monthlyTrend.data,
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          borderWidth: 0
        }]
      };
    }
  };

  const chartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { position: 'top', labels: { font: { size: 12 } } },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 10 }
    } 
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 10 }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Points Earned' } },
      x: { title: { display: true, text: 'Year / Month' } }
    }
  };

  const getTableData = () => {
    if (reportType === 'recycling') {
      return reportData.recyclingData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    } else if (reportType === 'rewards') {
      return reportData.redemptionData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    } else if (reportType === 'students') {
      return reportData.students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    } else if (reportType === 'grade-performance') {
      return reportData.gradePerformance.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    } else if (reportType === 'section-performance') {
      return reportData.sectionPerformance.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    } else if (reportType === 'yearly-trend') {
      return reportData.yearlyTrend.labels.map((year, index) => ({
        year: year,
        points: reportData.yearlyTrend.data[index]
      })).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    } else {
      return reportData.monthlyTrend.labels.map((month, index) => ({
        month: month,
        points: reportData.monthlyTrend.data[index]
      })).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }
  };

  const getTotalPages = () => {
    let totalItems = 0;
    if (reportType === 'recycling') totalItems = reportData.recyclingData.length;
    else if (reportType === 'rewards') totalItems = reportData.redemptionData.length;
    else if (reportType === 'students') totalItems = reportData.students.length;
    else if (reportType === 'grade-performance') totalItems = reportData.gradePerformance.length;
    else if (reportType === 'section-performance') totalItems = reportData.sectionPerformance.length;
    else if (reportType === 'yearly-trend') totalItems = reportData.yearlyTrend.labels.length;
    else totalItems = reportData.monthlyTrend.labels.length;
    return Math.ceil(totalItems / itemsPerPage);
  };

  const renderTableHeaders = () => {
    if (reportType === 'recycling') {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
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
    } else if (reportType === 'students') {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points Earned</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
        </tr>
      );
    } else if (reportType === 'grade-performance') {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade Level</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Students</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Points</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average Points</th>
        </tr>
      );
    } else if (reportType === 'section-performance') {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Students</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Points</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average Points</th>
        </tr>
      );
    } else {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points Earned</th>
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
    } else if (reportType === 'students') {
      return data.map((student) => (
        <tr key={student._id} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 text-sm font-medium text-gray-800">{student.fullName}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{student.grade || 'N/A'}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{student.sectionName || 'N/A'}</td>
          <td className="px-6 py-4 text-sm font-semibold text-green-600">{student.pointsEarned || 0}</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {student.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </td>
        </tr>
      ));
    } else if (reportType === 'grade-performance') {
      return data.map((item, index) => (
        <tr key={index} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 text-sm font-medium text-gray-800">{item.grade}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{item.studentCount}</td>
          <td className="px-6 py-4 text-sm font-semibold text-green-600">{item.totalPoints.toLocaleString()}</td>
          <td className="px-6 py-4 text-sm font-semibold text-orange-600">{item.averagePoints.toLocaleString()}</td>
        </tr>
      ));
    } else if (reportType === 'section-performance') {
      return data.map((item, index) => (
        <tr key={index} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 text-sm font-medium text-gray-800">{item.grade}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{item.section}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{item.studentCount}</td>
          <td className="px-6 py-4 text-sm font-semibold text-green-600">{item.totalPoints.toLocaleString()}</td>
          <td className="px-6 py-4 text-sm font-semibold text-orange-600">{item.averagePoints.toLocaleString()}</td>
        </tr>
      ));
    } else if (reportType === 'yearly-trend') {
      return data.map((item, index) => (
        <tr key={index} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 text-sm font-medium text-gray-800">{item.year}</td>
          <td className="px-6 py-4 text-sm font-semibold text-green-600">{item.points.toLocaleString()} pts</td>
        </tr>
      ));
    } else {
      return data.map((item, index) => (
        <tr key={index} className="hover:bg-gray-50 transition">
          <td className="px-6 py-4 text-sm font-medium text-gray-800">{item.month}</td>
          <td className="px-6 py-4 text-sm font-semibold text-green-600">{item.points.toLocaleString()} pts</td>
        </tr>
      ));
    }
  };

  const reportOptions = [
    { value: 'recycling', label: '♻️ Recycling Performance', icon: Package },
    { value: 'rewards', label: '🎁 Rewards Redemption', icon: Gift },
    { value: 'students', label: '👨‍🎓 Student Analytics', icon: Users },
    { value: 'grade-performance', label: '📊 Grade Level Performance', icon: School },
    { value: 'section-performance', label: '🏫 Section Performance', icon: Building2 },
    { value: 'yearly-trend', label: '📈 Yearly Points Trend', icon: LineChart },
    { value: 'monthly-trend', label: '📅 Monthly Points Trend', icon: BarChart }
  ];

  if (loading && reportData.students.length === 0) {
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
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time data from your recycling program</p>
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
              <Calendar size={20} /> Advanced Filters
            </h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              >
                {reportOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
              <select 
                value={selectedYear} 
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value));
                  handleFilterChange();
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade Level</label>
              <select 
                value={selectedGrade} 
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              >
                {gradeOptions.map(grade => (
                  <option key={grade.value} value={grade.value}>{grade.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
              <select 
                value={selectedSection} 
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              >
                <option value="all">All Sections</option>
                {sections.map(section => (
                  <option key={section._id} value={section.sectionName}>
                    {section.sectionName} ({section.gradeLevel})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleGenerate} className="px-6 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition flex items-center gap-2">
              <BarChart3 size={18} /> Apply Filters & Generate
            </button>
            <button 
              onClick={() => {
                setSelectedYear(2026);
                setSelectedMonth('all');
                setSelectedGrade('all');
                setSelectedSection('all');
                handleGenerate();
              }} 
              className="px-6 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition flex items-center gap-2"
            >
              <RefreshCw size={18} /> Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Report Results */}
      <div id="report-content" className="space-y-6 animate-fadeIn">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{reportData.summaryStats.totalStudents}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600">
              {selectedGrade !== 'all' && `Grade: ${selectedGrade} | `}
              {selectedSection !== 'all' && `Section: ${selectedSection}`}
              {selectedGrade === 'all' && selectedSection === 'all' && 'All Students'}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Points</p>
                <p className="text-2xl font-bold text-orange-600">{reportData.summaryStats.totalPoints.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <Star size={20} className="text-orange-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-orange-600">Avg: {reportData.summaryStats.averagePoints} per student</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Redemptions</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{reportData.summaryStats.totalRedemptions}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Gift size={20} className="text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-purple-600">Rewards redeemed</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Date Range</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {selectedYear}
                  {selectedMonth !== 'all' && ` / ${months.find(m => m.value === selectedMonth)?.label}`}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              {reportType === 'yearly-trend' ? <LineChart size={20} className="text-green-600" /> :
               reportType === 'monthly-trend' ? <BarChart size={20} className="text-blue-600" /> :
               <BarChart3 size={20} className="text-green-600" />}
              {reportType === 'recycling' ? 'Points by Grade' : 
               reportType === 'rewards' ? 'Most Redeemed Rewards' : 
               reportType === 'students' ? 'Students by Grade' :
               reportType === 'grade-performance' ? 'Grade Level Performance' : 
               reportType === 'section-performance' ? 'Section Performance' :
               reportType === 'yearly-trend' ? 'Yearly Points Trend (2026-2030)' :
               `Monthly Points Trend (${selectedYear})`}
            </h3>
            <div className="h-96">
              {(reportType === 'yearly-trend' || reportType === 'monthly-trend') ? (
                <Line data={getChartData()} options={lineChartOptions} />
              ) : (
                <Bar data={getChartData()} options={chartOptions} />
              )}
            </div>
            {(selectedGrade !== 'all' || selectedSection !== 'all') && reportType !== 'yearly-trend' && reportType !== 'monthly-trend' && (
              <p className="text-xs text-blue-400 text-center mt-4">
                Showing data filtered by: {selectedGrade !== 'all' ? `Grade: ${selectedGrade}` : ''} 
                {selectedGrade !== 'all' && selectedSection !== 'all' ? ' | ' : ''}
                {selectedSection !== 'all' ? `Section: ${selectedSection}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Top Performing Students Section */}
        {reportType !== 'yearly-trend' && reportType !== 'monthly-trend' && reportData.topStudents.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Award size={20} className="text-yellow-500" /> Top Performing Students
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {reportData.topStudents.map((student, index) => (
                <div key={student._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-green-500'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{student.fullName}</p>
                      <p className="text-xs text-gray-500">{student.grade || 'N/A'} - {student.sectionName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">{student.earnedPoints || student.points || 0} pts earned</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No data available for the selected filters
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @media print {
          .no-print { display: none; }
          body { background: white; }
          .bg-white { background: white !important; }
        }
      `}</style>
    </div>
  );
}