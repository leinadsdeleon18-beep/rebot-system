import React, { useState } from 'react';
import { 
  Users, 
  QrCode, 
  Gift, 
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Download,
  Upload,
  UserPlus,
  FileText,
  Star,
  Award,
  Calendar,
  Clock,
  X,
  Check
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock data
const mockStats = {
  totalStudents: 156,
  totalPoints: 45280,
  activeStudents: 142,
  totalRedemptions: 234,
  studentGrowth: 8,
  pointsGrowth: 15,
  activeGrowth: 5,
  redemptionGrowth: 12
};

const mockRecentStudents = [
  { id: 1, name: 'Juan Dela Cruz', grade: 'Grade 5', section: 'Section A', points: 245, lastActive: '2026-04-04' },
  { id: 2, name: 'Maria Santos', grade: 'Grade 5', section: 'Section A', points: 310, lastActive: '2026-04-04' },
  { id: 3, name: 'Jose Rizal', grade: 'Grade 6', section: 'Section B', points: 178, lastActive: '2026-04-03' },
  { id: 4, name: 'Andres Bonifacio', grade: 'Grade 6', section: 'Section A', points: 420, lastActive: '2026-04-04' },
  { id: 5, name: 'Emilio Aguinaldo', grade: 'Grade 5', section: 'Section B', points: 95, lastActive: '2026-04-02' }
];

const mockRecentRedemptions = [
  { id: 1, student: 'Juan Dela Cruz', item: 'Biscuit', points: 10, date: '2026-04-04 09:30 AM' },
  { id: 2, student: 'Maria Santos', item: 'Chocolate Bar', points: 25, date: '2026-04-04 10:15 AM' },
  { id: 3, student: 'Jose Rizal', item: 'Juice Box', points: 15, date: '2026-04-03 02:30 PM' },
  { id: 4, student: 'Andres Bonifacio', item: 'Pencil Set', points: 50, date: '2026-04-03 11:00 AM' }
];

export default function TeacherDashboard() {
  const [stats] = useState(mockStats);
  const [recentStudents] = useState(mockRecentStudents);
  const [recentRedemptions] = useState(mockRecentRedemptions);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [csvData, setCsvData] = useState('');
  const [students, setStudents] = useState(mockRecentStudents);
  
  // Add Student Form Data
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Grade 5',
    section: 'Section A',
    email: '',
    phone: ''
  });

  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
  const sections = ['Section A', 'Section B', 'Section C'];

  // Points Distribution Chart
  const pointsData = {
    labels: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
    datasets: [
      {
        label: 'Points Earned',
        data: [5200, 6800, 8900, 10200, 11800, 8900],
        backgroundColor: '#2e7d32',
        borderRadius: 8,
      }
    ]
  };

  // Activity Chart
  const activityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Recycling Activities',
        data: [45, 52, 38, 61, 48, 25, 12],
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b'
        }
      },
    },
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendUp, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value.toLocaleString()}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trendUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{trend}% from last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );

  // Add Student Handler
  const handleAddStudent = () => {
    if (!formData.name || !formData.grade || !formData.section) {
      toast.error('Please fill all required fields');
      return;
    }

    const newStudent = {
      id: students.length + 1,
      name: formData.name,
      grade: formData.grade,
      section: formData.section,
      points: 0,
      lastActive: new Date().toISOString().split('T')[0]
    };

    setStudents([newStudent, ...students]);
    setShowAddStudentModal(false);
    setFormData({ name: '', grade: 'Grade 5', section: 'Section A', email: '', phone: '' });
    toast.success(`Student ${formData.name} added successfully!`);
  };

  // Bulk Import Handlers
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvData(text);
      const lines = text.split('\n');
      toast.success(`${lines.length - 1} records found. Click Import to add students.`);
    };
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const headers = ['Name', 'Grade', 'Section', 'Email', 'Phone'];
    const sampleRows = [
      ['Juan Dela Cruz', 'Grade 5', 'Section A', 'juan@example.com', '09123456789'],
      ['Maria Santos', 'Grade 5', 'Section A', 'maria@example.com', '09123456790']
    ];
    
    const csvContent = [headers, ...sampleRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  const importStudentsFromCSV = () => {
    if (!csvData) {
      toast.error('Please upload a CSV file first');
      return;
    }

    const lines = csvData.split('\n');
    const newStudents = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const student = {
          id: students.length + newStudents.length + 1,
          name: values[0]?.trim() || '',
          grade: values[1]?.trim() || 'Grade 1',
          section: values[2]?.trim() || 'Section A',
          points: 0,
          lastActive: new Date().toISOString().split('T')[0]
        };
        if (student.name) {
          newStudents.push(student);
        }
      }
    }

    if (newStudents.length > 0) {
      setStudents([...students, ...newStudents]);
      toast.success(`Successfully imported ${newStudents.length} students!`);
      setCsvData('');
      setShowBulkImportModal(false);
    } else {
      toast.error('No valid data found in CSV');
    }
  };

  // Generate QR Code Handler
  const handleGenerateQR = (student) => {
    setSelectedStudent(student);
    setShowQRModal(true);
  };

  const handleGenerateAllQR = () => {
    toast.success(`Generating QR codes for all ${students.length} students...`);
    // In real app, this would generate actual QR codes
    setShowQRModal(false);
  };

  // Add Points Handler
  const handleAddPoints = (student) => {
    setSelectedStudent(student);
    setShowPointsModal(true);
  };

  const handleSavePoints = () => {
    if (!pointsToAdd || pointsToAdd <= 0) {
      toast.error('Please enter valid points');
      return;
    }
    
    setStudents(students.map(s => 
      s.id === selectedStudent.id 
        ? { ...s, points: s.points + parseInt(pointsToAdd) }
        : s
    ));
    toast.success(`Added ${pointsToAdd} points to ${selectedStudent.name}`);
    setShowPointsModal(false);
    setSelectedStudent(null);
    setPointsToAdd('');
  };

  // Export Report Handler
  const handleExportReport = () => {
    const headers = ['Name', 'Grade', 'Section', 'Points', 'Last Active'];
    const rows = students.map(s => [s.name, s.grade, s.section, s.points, s.lastActive]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  const filteredStudents = recentStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Teacher Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back! Here's your class overview for today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={Users}
          trend={stats.studentGrowth}
          trendUp={true}
          color="bg-blue-600"
        />
        <StatCard 
          title="Total Eco-Points" 
          value={stats.totalPoints} 
          icon={Star}
          trend={stats.pointsGrowth}
          trendUp={true}
          color="bg-orange-500"
        />
        <StatCard 
          title="Active Students" 
          value={stats.activeStudents} 
          icon={Users}
          trend={stats.activeGrowth}
          trendUp={true}
          color="bg-green-600"
        />
        <StatCard 
          title="Rewards Redeemed" 
          value={stats.totalRedemptions} 
          icon={Gift}
          trend={stats.redemptionGrowth}
          trendUp={true}
          color="bg-purple-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => setShowAddStudentModal(true)}
          className="flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition shadow-md"
        >
          <UserPlus size={18} /> Add Student
        </button>
        <button 
          onClick={() => setShowBulkImportModal(true)}
          className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-md"
        >
          <Upload size={18} /> Bulk Import
        </button>
        <button 
          onClick={handleGenerateAllQR}
          className="flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow-md"
        >
          <Download size={18} /> Generate QR Codes
        </button>
        <button 
          onClick={handleExportReport}
          className="flex items-center justify-center gap-2 p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition shadow-md"
        >
          <FileText size={18} /> Export Report
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Points by Grade Level</h3>
          <div className="h-80">
            <Bar data={pointsData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Weekly Activity</h3>
          <div className="h-80">
            <Line data={activityData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Recent Students</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm w-64 focus:outline-none focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
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
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.grade} - {student.section}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">{student.points} pts</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar size={14} /> {student.lastActive}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleGenerateQR(student)}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-200 transition"
                      >
                        View QR
                      </button>
                      <button 
                        onClick={() => handleAddPoints(student)}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium hover:bg-green-200 transition"
                      >
                        Add Points
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Redemptions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Recent Redemptions</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentRedemptions.map((redemption) => (
            <div key={redemption.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Gift size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{redemption.student}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Redeemed {redemption.item}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-orange-600 dark:text-orange-400">-{redemption.points} pts</p>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {redemption.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Add New Student</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl" placeholder="Enter full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Grade *</label>
                  <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl">
                    {grades.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Section *</label>
                  <select value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl">
                    {sections.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl" placeholder="student@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl" placeholder="Contact number" />
              </div>
              <button onClick={handleAddStudent} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition">Add Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Import Class List</h3>
              <button onClick={() => setShowBulkImportModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  CSV format: <strong>Name, Grade, Section, Email, Phone</strong>
                </p>
                <button onClick={downloadCSVTemplate} className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <Download size={14} /> Download Sample Template
                </button>
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
                <Upload size={40} className="text-gray-400 mx-auto mb-3" />
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" id="csvUpload" />
                <label htmlFor="csvUpload" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                  Choose CSV File
                </label>
                {csvData && <p className="text-sm text-green-600 mt-2">File loaded successfully!</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowBulkImportModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={importStudentsFromCSV} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition">Import Students</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Student QR Code</h3>
              <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-4">
                <QrCode size={120} className="text-green-600 mx-auto" />
                <p className="text-xs text-gray-500 mt-2 font-mono">ID: {selectedStudent.id}</p>
              </div>
            </div>
            <p className="mt-4 font-semibold text-gray-800 dark:text-gray-200">{selectedStudent.name}</p>
            <p className="text-sm text-gray-500">{selectedStudent.grade} - {selectedStudent.section}</p>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition">Download</button>
              <button className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Print</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Points Modal */}
      {showPointsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Add Points</h3>
              <button onClick={() => setShowPointsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Student: <span className="font-semibold">{selectedStudent.name}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Current Points: <span className="font-semibold text-green-600">{selectedStudent.points}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points to Add</label>
                <input type="number" value={pointsToAdd} onChange={(e) => setPointsToAdd(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl" placeholder="Enter points" min="1" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPointsModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleSavePoints} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition">Add Points</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}