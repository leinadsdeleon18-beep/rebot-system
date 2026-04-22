import React, { useState } from 'react';
import { 
  QrCode, 
  Download, 
  Search, 
  Printer,
  FileText,
  Grid,
  List,
  Share2,
  Check,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';

const mockStudents = [
  { id: 1, studentId: 'STU-2026-001', name: 'Juan Dela Cruz', grade: 'Grade 5', section: 'Section A', points: 245 },
  { id: 2, studentId: 'STU-2026-002', name: 'Maria Santos', grade: 'Grade 5', section: 'Section A', points: 310 },
  { id: 3, studentId: 'STU-2026-003', name: 'Jose Rizal', grade: 'Grade 6', section: 'Section B', points: 178 },
  { id: 4, studentId: 'STU-2026-004', name: 'Andres Bonifacio', grade: 'Grade 6', section: 'Section A', points: 420 },
  { id: 5, studentId: 'STU-2026-005', name: 'Emilio Aguinaldo', grade: 'Grade 5', section: 'Section B', points: 95 },
];

export default function QRManagement() {
  const [students] = useState(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedGrade, setSelectedGrade] = useState('all');

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const handleDownloadAll = () => {
    toast.success('Preparing QR codes for download...');
  };

  const handleDownloadSingle = (student) => {
    toast.success(`Downloading QR code for ${student.name}`);
  };

  const handlePrintAll = () => {
    toast.success('Preparing print layout...');
  };

  const handleCopyID = (studentId) => {
    navigator.clipboard.writeText(studentId);
    toast.success('Student ID copied to clipboard!');
  };

  const grades = ['all', 'Grade 5', 'Grade 6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">QR Code Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Generate and manage student QR codes</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadAll} className="px-4 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition shadow-sm">
            <Download size={18} /> Download All QR Codes
          </button>
          <button onClick={handlePrintAll} className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <Printer size={18} /> Print Class Set
          </button>
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
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
          </select>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 transition ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 transition ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* QR Codes Grid/List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 text-center hover:shadow-md transition">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <div className="w-28 h-28 bg-white rounded-xl flex flex-col items-center justify-center">
                  <QrCode size={60} className="text-green-600" />
                  <p className="text-xs text-gray-500 mt-1">{student.studentId}</p>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-3">{student.name}</h3>
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Grade & Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">QR Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{student.name}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">{student.studentId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.grade} - {student.section}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">{student.points} pts</td>
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <QrCode size={20} className="text-green-600" />
                      </div>
                    </td>
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

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <FileText size={20} className="text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-300">About QR Codes</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Student QR codes are used for quick identification at recycling machines and canteen redemption points. 
              Each code is unique to the student and contains their student ID. Download individual codes or print a complete class set.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}