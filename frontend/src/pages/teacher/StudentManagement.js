import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Search, Upload, Download, QrCode, Star, FileUp, FileDown, Printer, X 
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
const sections = ['Section A', 'Section B', 'Section C'];

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [sectionsData, setSectionsData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [teacherAssignedGrades, setTeacherAssignedGrades] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Grade 5',
    section: 'Section A',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchSections();
    fetchStudents();
    const user = JSON.parse(localStorage.getItem('rebot_user'));
    setTeacherAssignedGrades(user?.assignedGrades || []);
  }, []);

  // Fetch sections to map ObjectId to actual grade/section names
  const fetchSections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/sections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Sections data:', data);
      
      if (data.success) {
        const sectionMap = {};
        data.sections.forEach(s => {
          sectionMap[s._id] = { grade: s.gradeLevel, section: s.sectionName };
        });
        setSectionsData(sectionMap);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/get-students');
      const data = await response.json();
      console.log('Students fetched:', data);
      
      if (data.success) {
        const formattedStudents = data.students.map(s => {
          const sectionInfo = sectionsData[s.section] || { grade: 'N/A', section: 'N/A' };
          return {
            id: s._id,
            studentId: s.studentId,
            name: s.fullName,
            grade: s.grade || sectionInfo.grade || 'N/A',
            section: s.sectionName || sectionInfo.section || s.section || 'N/A',
            points: s.points || 0,
            email: s.email,
            sectionId: s.section,
            status: 'active',
            joinDate: new Date(s.createdAt).toISOString().split('T')[0]
          };
        });
        setStudents(formattedStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/students/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          toast.success('Student deleted successfully!');
          fetchStudents();
        } else {
          toast.error(data.message || 'Failed to delete student');
        }
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

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
        toast.success('Student added successfully!');
        setShowAddModal(false);
        setFormData({ name: '', grade: 'Grade 5', section: 'Section A', email: '', phone: '' });
        fetchStudents();
      } else {
        toast.error(data.message || 'Failed to add student');
      }
    } catch (error) {
      toast.error('Failed to add student');
    }
  };

  const handleAddPoints = async (student, points) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/students/${student.id}/points`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ points: points })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Added ${points} points to ${student.name}`);
        fetchStudents();
      } else {
        toast.error(data.message || 'Failed to add points');
      }
    } catch (error) {
      toast.error('Failed to add points');
    }
  };

  const handleViewQR = (student) => {
    setSelectedStudent(student);
    setShowQRModal(true);
  };

  const downloadTemplate = () => {
    const headers = ['Full Name', 'Grade', 'Section', 'Email', 'Phone'];
    const sampleData = [
      ['Juan Dela Cruz', 'Grade 5', 'Section A', 'juan@example.com', '09123456789'],
      ['Maria Santos', 'Grade 5', 'Section A', 'maria@example.com', '09123456790'],
      ['Jose Rizal', 'Grade 6', 'Section B', 'jose@example.com', '09123456791']
    ];
    
    const wsData = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students Template');
    XLSX.writeFile(wb, `student_import_template_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Template downloaded!');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        
        const previewData = rows.map(row => ({
          name: row['Full Name'] || row['name'] || row['Name'] || '',
          grade: row['Grade'] || row['grade'] || 'Grade 5',
          section: row['Section'] || row['section'] || 'Section A',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['phone'] || ''
        })).filter(s => s.name);
        
        setImportPreview(previewData);
        toast.success(`${previewData.length} records loaded. Review and click Import.`);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Failed to parse file. Please use the template format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportStudents = async () => {
    if (importPreview.length === 0) {
      toast.error('No data to import');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const student of importPreview) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fullName: student.name,
            email: student.email,
            grade: student.grade,
            section: student.section,
            phone: student.phone
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
        console.error('Error importing student:', student.name, error);
      }
    }

    toast.success(`Import completed! ${successCount} students added, ${failCount} failed.`);
    setShowBulkImportModal(false);
    setImportPreview([]);
    fetchStudents();
    setIsImporting(false);
  };

  const handleDownloadAllQRCodes = async () => {
    if (students.length === 0) {
      toast.error('No students to generate QR codes');
      return;
    }

    toast.loading('Generating QR codes...', { duration: 2000 });
    
    try {
      for (const student of students) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/students/${student.id}/qrcode`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          const link = document.createElement('a');
          link.download = `${student.studentId}_qrcode.png`;
          link.href = data.qrCode;
          link.click();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      toast.success(`Downloaded ${students.length} QR codes`);
    } catch (error) {
      toast.error('Failed to download QR codes');
    }
  };

  const handlePrintQRCodes = () => {
    const filtered = filteredStudents;
    if (filtered.length === 0) {
      toast.error('No students to print');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Student QR Codes - ReBot System</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .qr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
            .qr-card { text-align: center; border: 1px solid #ccc; padding: 15px; border-radius: 10px; }
            .qr-card h4 { margin: 10px 0 5px; }
            .qr-card p { margin: 0; color: #666; font-size: 12px; }
            @media print {
              .qr-grid { grid-template-columns: repeat(4, 1fr); }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
          <div class="qr-grid">
            ${filtered.map(student => `
              <div class="qr-card">
                <div style="width: 100px; height: 100px; margin: 0 auto; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                  QR Code
                </div>
                <h4>${student.name}</h4>
                <p>${student.studentId}</p>
                <p>${student.grade} - ${student.section}</p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('Print window opened');
  };

  // Filter students by grade
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
  const activeStudents = students.filter(s => s.status === 'active').length;

  // Get unique grades for filter
  const uniqueGrades = ['all', ...new Set(students.map(s => s.grade).filter(g => g !== 'N/A'))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Student Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your students and track their progress</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowBulkImportModal(true)} className="px-4 py-2 border border-green-600 text-green-600 rounded-full font-semibold flex items-center gap-2 hover:bg-green-50">
            <Upload size={18} /> Bulk Import
          </button>
          <button onClick={handleDownloadAllQRCodes} className="px-4 py-2 border border-purple-600 text-purple-600 rounded-full font-semibold flex items-center gap-2 hover:bg-purple-50">
            <Download size={18} /> Download All QR
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 shadow-sm">
            <Plus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-600">
          <p className="text-gray-500 text-sm">Total Students</p>
          <p className="text-2xl font-bold text-gray-800">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-600">
          <p className="text-gray-500 text-sm">Active Students</p>
          <p className="text-2xl font-bold text-green-600">{activeStudents}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-600">
          <p className="text-gray-500 text-sm">Total Points</p>
          <p className="text-2xl font-bold text-orange-600">{totalPoints}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-600">
          <p className="text-gray-500 text-sm">Average Points</p>
          <p className="text-2xl font-bold text-purple-600">{Math.round(totalPoints / (students.length || 1))}</p>
        </div>
      </div>

      {/* Search and Grade Filter */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl bg-white"
          >
            {uniqueGrades.map(grade => (
              <option key={grade} value={grade}>{grade === 'all' ? 'All Grades' : grade}</option>
            ))}
          </select>
          <button onClick={handlePrintQRCodes} className="px-4 py-2 border border-gray-300 rounded-xl flex items-center gap-2 hover:bg-gray-50">
            <Printer size={18} /> Print QR Codes
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{student.studentId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.grade}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.section}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">{student.points} pts</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleViewQR(student)} className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg" title="View QR Code">
                        <QrCode size={18} />
                      </button>
                      <button onClick={() => {
                        const points = prompt(`Enter points to add for ${student.name}:`, '10');
                        if (points && !isNaN(points)) {
                          handleAddPoints(student, parseInt(points));
                        }
                      }} className="p-1 text-green-600 hover:bg-green-50 rounded-lg" title="Add Points">
                        <Star size={18} />
                      </button>
                      <button onClick={() => handleDeleteStudent(student.id)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg" title="Delete Student">
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
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

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Bulk Import Students</h3>
              <button onClick={() => setShowBulkImportModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl">
                <h4 className="font-semibold text-blue-800 mb-2">How to import:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Download the Excel/CSV template below</li>
                  <li>Fill in student information</li>
                  <li>Upload the file</li>
                  <li>Review and click Import</li>
                </ol>
              </div>
              <button onClick={downloadTemplate} className="w-full py-3 border-2 border-dashed border-green-600 text-green-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-50">
                <FileDown size={20} /> Download Excel Template
              </button>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <FileUp size={40} className="text-gray-400 mx-auto mb-3" />
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" id="fileUpload" />
                <label htmlFor="fileUpload" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer">Choose File</label>
              </div>
              {importPreview.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Preview ({importPreview.length} students)</h4>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr><th className="p-2">Name</th><th className="p-2">Grade</th><th className="p-2">Section</th><th className="p-2">Email</th></tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((student, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{student.name}</td>
                            <td className="p-2">{student.grade}</td>
                            <td className="p-2">{student.section}</td>
                            <td className="p-2">{student.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowBulkImportModal(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancel</button>
                <button onClick={handleImportStudents} disabled={importPreview.length === 0 || isImporting} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50">Import</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Student QR Code</h3>
              <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-4">
                <div className="w-32 h-32 mx-auto flex items-center justify-center">
                  <QrCode size={120} className="text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2 font-mono">{selectedStudent.studentId}</p>
              </div>
            </div>
            <p className="mt-4 font-semibold">{selectedStudent.name}</p>
            <p className="text-sm text-gray-500">{selectedStudent.grade} - {selectedStudent.section}</p>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold">Download QR</button>
              <button className="flex-1 px-4 py-2 border rounded-xl">Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}