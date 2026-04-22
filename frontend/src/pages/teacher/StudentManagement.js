import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Upload, 
  Download,
  QrCode,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  X,
  Check,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock students data
const mockStudents = [
  { id: 1, studentId: 'STU-2026-001', name: 'Juan Dela Cruz', grade: 'Grade 5', section: 'Section A', points: 245, email: 'juan@rebot.ph', phone: '09123456789', status: 'active', joinDate: '2026-01-15' },
  { id: 2, studentId: 'STU-2026-002', name: 'Maria Santos', grade: 'Grade 5', section: 'Section A', points: 310, email: 'maria@rebot.ph', phone: '09123456790', status: 'active', joinDate: '2026-01-15' },
  { id: 3, studentId: 'STU-2026-003', name: 'Jose Rizal', grade: 'Grade 6', section: 'Section B', points: 178, email: 'jose@rebot.ph', phone: '09123456791', status: 'active', joinDate: '2026-01-16' },
  { id: 4, studentId: 'STU-2026-004', name: 'Andres Bonifacio', grade: 'Grade 6', section: 'Section A', points: 420, email: 'andres@rebot.ph', phone: '09123456792', status: 'active', joinDate: '2026-01-14' },
  { id: 5, studentId: 'STU-2026-005', name: 'Emilio Aguinaldo', grade: 'Grade 5', section: 'Section B', points: 95, email: 'emilio@rebot.ph', phone: '09123456793', status: 'inactive', joinDate: '2026-01-17' }
];

const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
const sections = ['Section A', 'Section B', 'Section C'];

export default function StudentManagement() {
  const [students, setStudents] = useState(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Grade 5',
    section: 'Section A',
    email: '',
    phone: ''
  });

  const handleAddStudent = () => {
    if (!formData.name || !formData.grade || !formData.section) {
      toast.error('Please fill all required fields');
      return;
    }

    const newStudent = {
      id: students.length + 1,
      studentId: `STU-2026-${String(students.length + 1).padStart(3, '0')}`,
      name: formData.name,
      grade: formData.grade,
      section: formData.section,
      points: 0,
      email: formData.email,
      phone: formData.phone,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    };

    setStudents([...students, newStudent]);
    setShowAddModal(false);
    setFormData({ name: '', grade: 'Grade 5', section: 'Section A', email: '', phone: '' });
    toast.success('Student added successfully!');
  };

  const handleEditStudent = () => {
    if (!formData.name) {
      toast.error('Please fill required fields');
      return;
    }

    setStudents(students.map(s => 
      s.id === selectedStudent.id 
        ? { ...s, ...formData }
        : s
    ));
    setShowEditModal(false);
    setSelectedStudent(null);
    setFormData({ name: '', grade: 'Grade 5', section: 'Section A', email: '', phone: '' });
    toast.success('Student updated successfully!');
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(s => s.id !== id));
      toast.success('Student deleted successfully!');
    }
  };

  const handleAddPoints = (student, points) => {
    const newPoints = student.points + points;
    setStudents(students.map(s => 
      s.id === student.id ? { ...s, points: newPoints } : s
    ));
    toast.success(`Added ${points} points to ${student.name}`);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
  const activeStudents = students.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Student Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your students and track their progress</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-green-600 text-green-600 dark:text-green-400 rounded-full font-semibold flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition">
            <Upload size={18} /> Import CSV
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition shadow-sm">
            <Plus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-blue-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Students</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{students.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-green-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Active Students</p>
          <p className="text-2xl font-bold text-green-600">{activeStudents}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-orange-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Points</p>
          <p className="text-2xl font-bold text-orange-600">{totalPoints}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-purple-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Average Points</p>
          <p className="text-2xl font-bold text-purple-600">{Math.round(totalPoints / students.length)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="all">All Grades</option>
            {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Grade & Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">{student.studentId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.grade} - {student.section}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">{student.points} pts</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                    }`}>
                      {student.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{student.joinDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedStudent(student);
                          setFormData(student);
                          setShowQRModal(true);
                        }}
                        className="p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition"
                        title="View QR Code"
                      >
                        <QrCode size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedStudent(student);
                          const points = prompt(`Enter points to add for ${student.name}:`, '10');
                          if (points && !isNaN(points)) {
                            handleAddPoints(student, parseInt(points));
                          }
                        }}
                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                        title="Add Points"
                      >
                        <Star size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedStudent(student);
                          setFormData(student);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        title="Edit Student"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Delete Student"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Add New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" placeholder="Enter full name" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade *</label><select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"><option>Grade 1</option><option>Grade 2</option><option>Grade 3</option><option>Grade 4</option><option>Grade 5</option><option>Grade 6</option></select></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section *</label><select value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"><option>Section A</option><option>Section B</option><option>Section C</option></select></div></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl" placeholder="student@email.com" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl" placeholder="Contact number" /></div>
              <button onClick={handleAddStudent} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition">Add Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Edit Student</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Grade</label><select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"><option>Grade 1</option><option>Grade 2</option><option>Grade 3</option><option>Grade 4</option><option>Grade 5</option><option>Grade 6</option></select></div><div><label className="block text-sm font-medium mb-1">Section</label><select value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"><option>Section A</option><option>Section B</option><option>Section C</option></select></div></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl" /></div>
              <button onClick={handleEditStudent} className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700 transition">Save Changes</button>
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
            <div className="bg-white p-4 rounded-xl inline-block mx-auto">
              <div className="w-48 h-48 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto">
                <div className="w-40 h-40 bg-white rounded-xl flex flex-col items-center justify-center">
                  <QrCode size={80} className="text-green-600" />
                  <p className="text-xs text-gray-500 mt-2">{selectedStudent.studentId}</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-gray-800 dark:text-gray-200 font-medium">{selectedStudent.name}</p>
            <p className="text-sm text-gray-500">{selectedStudent.grade} - {selectedStudent.section}</p>
            <p className="text-sm text-green-600 font-semibold mt-1">{selectedStudent.points} Points</p>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition">Download QR</button>
              <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition">Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}