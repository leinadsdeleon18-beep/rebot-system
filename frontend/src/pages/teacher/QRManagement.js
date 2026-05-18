import React, { useState, useEffect } from 'react';
import { QrCode, Download, Search, Printer, Grid, List, Copy, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRManagement() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [loading, setLoading] = useState(true);
  const [teacherAssignedGrades, setTeacherAssignedGrades] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState({ fullName: '', assignedGrades: [] });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('rebot_user') || '{}');
    setTeacherInfo({
      fullName: user.fullName || 'Teacher',
      assignedGrades: user.assignedGrades || []
    });
    setTeacherAssignedGrades(user.assignedGrades || []);
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Students for QR:', data);
      
      if (data.success) {
        const formattedStudents = data.students.map(s => {
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
            studentId: s.studentId,
            name: s.fullName,
            grade: gradeLevel,
            section: sectionName,
            points: s.points || 0,
            qrCodeData: s.qrCodeData
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

  const handleDownloadSingle = async (student) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/students/${student.id}/qrcode`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.qrCode) {
        const link = document.createElement('a');
        link.download = `${student.studentId}_qrcode.png`;
        link.href = data.qrCode;
        link.click();
        toast.success(`Downloading QR code for ${student.name}`);
      } else {
        toast.error('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const handleDownloadAll = async () => {
    if (filteredStudents.length === 0) {
      toast.error('No students to download');
      return;
    }
    
    toast.loading(`Downloading ${filteredStudents.length} QR codes...`, { duration: 2000 });
    
    for (const student of filteredStudents) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/students/${student.id}/qrcode`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success && data.qrCode) {
          const link = document.createElement('a');
          link.download = `${student.studentId}_qrcode.png`;
          link.href = data.qrCode;
          link.click();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Error downloading QR for:', student.name, error);
      }
    }
    
    toast.success(`Downloaded ${filteredStudents.length} QR codes`);
  };

  const handlePrintAll = () => {
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

  const handleCopyID = (studentId) => {
    navigator.clipboard.writeText(studentId);
    toast.success('Student ID copied to clipboard!');
  };

  // Filter students based on teacher's assigned grades
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    
    // Teacher filtering based on assigned grades
    let matchesTeacherGrade = true;
    if (teacherAssignedGrades.length > 0) {
      matchesTeacherGrade = teacherAssignedGrades.includes(student.grade);
    }
    
    return matchesSearch && matchesGrade && matchesTeacherGrade;
  });

  // Get unique grades for filter (only from visible students)
  const uniqueGrades = ['all', ...new Set(filteredStudents.map(s => s.grade).filter(g => g !== 'N/A'))];

  // Display assigned grades info
  const assignedGradesText = teacherAssignedGrades.length > 0 
    ? teacherAssignedGrades.join(', ') 
    : 'All Grades';

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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">QR Code Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Generate and manage student QR codes - You have access to: <span className="font-semibold text-green-600">{assignedGradesText}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadAll} className="px-4 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700">
            <Download size={18} /> Download All ({filteredStudents.length})
          </button>
          <button onClick={handlePrintAll} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-50">
            <Printer size={18} /> Print Class Set
          </button>
        </div>
      </div>

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
          <div className="flex border border-gray-300 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-2 transition ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>
              <Grid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 transition ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 && teacherAssignedGrades.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-700">
            No students found in your assigned grades: {assignedGradesText}
          </p>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-2xl shadow-sm p-6 text-center hover:shadow-md transition">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <div className="w-28 h-28 bg-white rounded-xl flex flex-col items-center justify-center">
                  {student.qrCodeData ? (
                    <img src={student.qrCodeData} alt="QR Code" className="w-24 h-24" />
                  ) : (
                    <QrCode size={60} className="text-green-600" />
                  )}
                  <p className="text-xs text-gray-500 mt-1">{student.studentId}</p>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 mt-3">{student.name}</h3>
              <p className="text-sm text-gray-500">{student.grade} - {student.section}</p>
              <p className="text-sm text-green-600 font-semibold mt-1">{student.points} points</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleDownloadSingle(student)} className="flex-1 px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
                  Download
                </button>
                <button onClick={() => handleCopyID(student.studentId)} className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                  <Copy size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium">{student.name}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{student.studentId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.grade}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.section}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">{student.points} pts</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleDownloadSingle(student)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition">
                          Download
                        </button>
                        <button onClick={() => handleCopyID(student.studentId)} className="px-3 py-1 border border-gray-300 rounded-lg text-xs hover:bg-gray-50 transition">
                          Copy ID
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <FileText size={20} className="text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800">About QR Codes</h4>
            <p className="text-sm text-blue-700 mt-1">
              Student QR codes are used for quick identification. Each code is unique to the student and contains their student ID.
              {teacherAssignedGrades.length > 0 && ` You only have access to students in: ${assignedGradesText}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}