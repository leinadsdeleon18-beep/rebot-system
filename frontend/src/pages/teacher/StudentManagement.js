import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, Search, Upload, Download, QrCode, Star, FileUp, FileDown, Printer, X, AlertCircle, CheckCircle, XCircle, RefreshCw, School, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import LoadingScreen from '../../components/LoadingScreen';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [sectionsData, setSectionsData] = useState({});
  const [allSections, setAllSections] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showImportResults, setShowImportResults] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [isAddingPoints, setIsAddingPoints] = useState(false);
  const [teacherAssignedGrades, setTeacherAssignedGrades] = useState([]);
  const [teacherAssignedSections, setTeacherAssignedSections] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userLoaded, setUserLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    section: '',
    email: '',
    phone: ''
  });

  // Load user data first
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('rebot_user') || '{}');
    console.log('📋 User data loaded:', user);
    
    setTeacherAssignedGrades(user.assignedGrades || []);
    setTeacherAssignedSections(user.assignedSections || []);
    setUserRole(user.role || '');
    setUserLoaded(true);
    
    if (user.role === 'teacher') {
      if (user.assignedSections && user.assignedSections.length > 0) {
        console.log('📚 Teacher has assigned sections:', user.assignedSections);
      } else if (user.assignedGrades && user.assignedGrades.length > 0) {
        console.log('📚 Teacher has assigned grades:', user.assignedGrades);
      }
    }
  }, []);

  // After user is loaded, fetch sections
  useEffect(() => {
    if (userLoaded) {
      fetchSections();
      fetchStudents();
    }
  }, [userLoaded]);

  // Listen for section updates
  useEffect(() => {
    const handleSectionsUpdated = (event) => {
      console.log('🔄 StudentManagement: sectionsUpdated event received!', event?.detail);
      fetchSections();
      fetchStudents();
    };
    
    const handleSectionsLoaded = (event) => {
      console.log('📋 StudentManagement: sectionsLoaded event received', event?.detail);
      fetchSections();
    };
    
    window.addEventListener('sectionsUpdated', handleSectionsUpdated);
    window.addEventListener('sectionsLoaded', handleSectionsLoaded);
    
    return () => {
      window.removeEventListener('sectionsUpdated', handleSectionsUpdated);
      window.removeEventListener('sectionsLoaded', handleSectionsLoaded);
    };
  }, []);

  const fetchSections = async () => {
    setLoadingSections(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching sections from API...');
      console.log('👤 Current user role:', userRole);
      console.log('👤 Teacher assigned sections:', teacherAssignedSections);
      console.log('👤 Teacher assigned grades:', teacherAssignedGrades);
      
      const response = await fetch('http://localhost:5000/api/sections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      console.log('📡 Sections API Response:', data);
      
      if (data.success) {
        const sectionMap = {};
        const sectionArray = [];
        
        data.sections.forEach(s => {
          sectionMap[s._id] = { grade: s.gradeLevel, section: s.sectionName };
          sectionArray.push({
            id: s._id,
            gradeLevel: s.gradeLevel,
            sectionName: s.sectionName,
            adviser: s.adviser
          });
        });
        
        setSectionsData(sectionMap);
        setAllSections(sectionArray);
        
        // Filter sections based on teacher's assigned sections/grades
        let filteredSections = [...sectionArray];
        
        if (userRole === 'teacher') {
          if (teacherAssignedSections && teacherAssignedSections.length > 0) {
            // Filter by assigned section IDs
            filteredSections = sectionArray.filter(section => 
              teacherAssignedSections.includes(section.id)
            );
            console.log('🔍 Filtering by section IDs:', teacherAssignedSections);
            console.log('✅ Sections after ID filter:', filteredSections.map(s => `${s.gradeLevel} - ${s.sectionName}`));
          } else if (teacherAssignedGrades && teacherAssignedGrades.length > 0) {
            // Filter by assigned grades
            filteredSections = sectionArray.filter(section => 
              teacherAssignedGrades.includes(section.gradeLevel)
            );
            console.log('🔍 Filtering by grades:', teacherAssignedGrades);
            console.log('✅ Sections after grade filter:', filteredSections.map(s => `${s.gradeLevel} - ${s.sectionName}`));
          }
        }
        
        setSectionsList(filteredSections);
        console.log('✅ Total sections in DB:', sectionArray.length);
        console.log('✅ Sections available for user:', filteredSections.length);
        console.log('📋 Available sections list:', filteredSections.map(s => `${s.gradeLevel} - ${s.sectionName}`));
      } else {
        console.error('❌ Failed to load sections:', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching sections:', error);
    } finally {
      setLoadingSections(false);
    }
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        const formattedStudents = data.students.map(s => {
          let sectionName = 'N/A';
          let gradeLevel = s.grade || 'N/A';
          let sectionId = null;
          
          if (s.sectionName) {
            sectionName = s.sectionName;
            sectionId = s.sectionId;
          } else if (s.section && typeof s.section === 'object') {
            sectionName = s.section.sectionName || 'N/A';
            gradeLevel = s.section.gradeLevel || s.grade || 'N/A';
            sectionId = s.section._id;
          } else if (s.section && sectionsData[s.section]) {
            sectionName = sectionsData[s.section].section;
            gradeLevel = sectionsData[s.section].grade;
            sectionId = s.section;
          }
          
          return {
            id: s._id,
            studentId: s.studentId,
            name: s.fullName,
            grade: gradeLevel,
            section: sectionName,
            sectionId: sectionId,
            points: s.points || 0,
            email: s.email || '',
            status: s.isActive !== false ? 'active' : 'inactive',
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
  }, [sectionsData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSections();
    await fetchStudents();
    setIsRefreshing(false);
    toast.success('Data refreshed!');
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    setIsDeletingStudent(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/students/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Student deleted successfully!');
        fetchStudents();
      } else {
        toast.error(data.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete student');
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const handleAddStudent = async () => {
    if (!formData.name || !formData.section) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsAddingStudent(true);
    try {
      const token = localStorage.getItem('token');
      
      const selectedSectionObj = sectionsList.find(s => s.id === formData.section);
      
      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email || '',
          grade: selectedSectionObj?.gradeLevel || formData.grade,
          sectionId: formData.section,
          phone: formData.phone || ''
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Student ${formData.name} added successfully!`);
        setShowAddModal(false);
        setFormData({ name: '', grade: '', section: '', email: '', phone: '' });
        fetchStudents();
      } else {
        toast.error(data.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('Add student error:', error);
      toast.error('Failed to add student');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleAddPoints = async (student, points) => {
    setIsAddingPoints(true);
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
      console.error('Add points error:', error);
      toast.error('Failed to add points');
    } finally {
      setIsAddingPoints(false);
    }
  };

  const handleViewQR = async (student) => {
    setSelectedStudent(student);
    setShowQRModal(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/students/${student.id}/qrcode`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.qrCode) {
        setSelectedStudent(prev => ({ ...prev, qrCodeData: data.qrCode }));
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
    }
  };

  const downloadTemplate = () => {
    const headers = ['Full Name', 'Grade', 'Section', 'Email', 'Phone'];
    
    const sampleData = [
      ['Juan Dela Cruz', 'Grade 1', 'Section A', 'juan@example.com', '09123456789'],
      ['Maria Santos', 'Grade 1', 'Section A', 'maria@example.com', '09123456790'],
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
        
        const previewData = rows.map((row, index) => ({
          id: index,
          name: row['Full Name'] || row['name'] || row['Name'] || '',
          grade: row['Grade'] || row['grade'] || '',
          section: row['Section'] || row['section'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['phone'] || '',
          isValid: true,
          error: null
        })).filter(s => s.name);
        
        previewData.forEach(student => {
          const errors = [];
          if (!student.name) errors.push('Name required');
          if (!student.grade) errors.push('Grade required');
          if (!student.section) errors.push('Section required');
          
          const sectionExists = allSections.some(s => 
            s.sectionName === student.section && s.gradeLevel === student.grade
          );
          if (!sectionExists) {
            errors.push(`Section "${student.section}" not found in ${student.grade}.`);
          }
          
          student.isValid = errors.length === 0;
          student.error = errors.join(', ');
        });
        
        setImportPreview(previewData);
        
        const validCount = previewData.filter(s => s.isValid).length;
        const invalidCount = previewData.filter(s => !s.isValid).length;
        
        toast.success(`${previewData.length} records loaded. ${validCount} valid, ${invalidCount} invalid.`);
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

    const validStudents = importPreview.filter(s => s.isValid);
    
    if (validStudents.length === 0) {
      toast.error('No valid students to import. Please fix the errors.');
      return;
    }

    setIsImporting(true);
    
    try {
      const token = localStorage.getItem('token');
      const studentsToImport = validStudents.map(s => ({
        name: s.name,
        grade: s.grade,
        section: s.section,
        email: s.email,
        phone: s.phone
      }));
      
      const response = await fetch('http://localhost:5000/api/students/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ students: studentsToImport })
      });
      
      const data = await response.json();
      
      setImportResults({
        success: data.success,
        count: data.count,
        totalAttempted: studentsToImport.length,
        errors: data.errors || []
      });
      
      if (data.success) {
        if (data.errors && data.errors.length > 0) {
          toast.warning(`Imported ${data.count} students, ${data.errors.length} failed.`);
        } else {
          toast.success(`Successfully imported ${data.count} students!`);
        }
        
        setShowImportResults(true);
        setShowBulkImportModal(false);
        fetchStudents();
      } else {
        toast.error(data.message || 'Failed to import students');
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error('Failed to import students. Please try again.');
    } finally {
      setIsImporting(false);
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

  const availableSections = sectionsList;
  const availableGrades = ['all', ...new Set(availableSections.map(s => s.gradeLevel))];
  
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const totalPoints = filteredStudents.reduce((sum, s) => sum + s.points, 0);
  const activeStudents = filteredStudents.filter(s => s.status === 'active').length;

  if (loading && students.length === 0) {
    return <LoadingScreen message="Loading students..." />;
  }

  if (userRole === 'teacher' && teacherAssignedGrades.length === 0 && teacherAssignedSections.length === 0 && userLoaded) {
    return (
      <div className="bg-yellow-50 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Grades or Sections Assigned</h2>
        <p className="text-yellow-700">
          Please contact the administrator to assign grade levels or sections to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Student Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your students - 
            {userRole === 'teacher' ? (
              teacherAssignedSections.length > 0 
                ? ` You have access to ${teacherAssignedSections.length} assigned section(s)`
                : teacherAssignedGrades.length > 0
                ? ` You have access to grades: ${teacherAssignedGrades.join(', ')}`
                : ' Loading...'
            ) : (
              ` Administrator - All sections available`
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-full font-semibold flex items-center gap-2 hover:bg-blue-50 transition"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={() => setShowBulkImportModal(true)} className="px-4 py-2 border border-green-600 text-green-600 rounded-full font-semibold flex items-center gap-2 hover:bg-green-50">
            <Upload size={18} /> Bulk Import
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
          <p className="text-2xl font-bold text-gray-800">{filteredStudents.length}</p>
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
          <p className="text-2xl font-bold text-purple-600">{Math.round(totalPoints / (filteredStudents.length || 1))}</p>
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
            {availableGrades.map(grade => (
              <option key={grade} value={grade}>{grade === 'all' ? 'All Grades' : grade}</option>
            ))}
          </select>
          <button onClick={handlePrintQRCodes} className="px-4 py-2 border border-gray-300 rounded-xl flex items-center gap-2 hover:bg-gray-50">
            <Printer size={18} /> Print QR Codes
          </button>
        </div>
      </div>

      {/* Section Info Bar */}
      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <School size={16} />
          <span>
            {loadingSections ? 'Loading sections...' : 
              userRole === 'teacher' 
                ? `You have access to ${availableSections.length} section(s) based on your assigned grades/sections`
                : `Total ${allSections.length} section(s) in system.`
            }
          </span>
        </div>
        <button 
          onClick={async () => {
            await fetchSections();
            toast.success(`Found ${allSections.length} total sections in database. You have access to ${availableSections.length}.`);
          }}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Check sections ({allSections.length} total)
        </button>
      </div>

      {/* Students Table */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading students...</p>
            </div>
          </div>
        )}
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
                          if (points && !isNaN(points) && parseInt(points) > 0) {
                            handleAddPoints(student, parseInt(points));
                          }
                        }} className="p-1 text-green-600 hover:bg-green-50 rounded-lg" title="Add Points" disabled={isAddingPoints}>
                          {isAddingPoints ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div> : <Star size={18} />}
                        </button>
                        <button onClick={() => handleDeleteStudent(student.id)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg" title="Delete Student" disabled={isDeletingStudent}>
                          {isDeletingStudent ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No students found. Click "Add Student" to get started.
                    </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
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
              <input 
                type="text" 
                placeholder="Full Name *" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              />
              
              {/* Section Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                <div className="relative">
                  <select 
                    value={formData.section} 
                    onChange={(e) => {
                      const selectedSectionId = e.target.value;
                      const selectedSection = allSections.find(s => s.id === selectedSectionId);
                      setFormData({
                        ...formData, 
                        section: selectedSectionId,
                        grade: selectedSection?.gradeLevel || ''
                      });
                    }} 
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  >
                    <option value="">-- Select Section --</option>
                    {loadingSections ? (
                      <option disabled>Loading sections...</option>
                    ) : (
                      availableSections.map(section => (
                        <option key={section.id} value={section.id}>
                          {section.gradeLevel} - {section.sectionName}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetchSections();
                      toast.success(`Loaded ${allSections.length} total sections, ${availableSections.length} available for you`);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-green-500 transition"
                    title="Refresh sections"
                  >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
                {!loadingSections && availableSections.length === 0 ? (
                  <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-700 flex items-center gap-1">
                      <AlertCircle size={12} /> No sections available. 
                      {userRole === 'teacher' ? (
                        <span>You don't have any sections assigned. Contact admin to assign sections to your account.</span>
                      ) : (
                        <button 
                          onClick={() => window.location.href = '/admin/sections'} 
                          className="text-blue-600 hover:underline ml-1"
                        >
                          Create sections first →
                        </button>
                      )}
                    </p>
                  </div>
                ) : !loadingSections && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                    <School size={12} /> Showing {availableSections.length} section(s)
                    {userRole === 'teacher' && teacherAssignedSections.length > 0 && (
                      <span className="text-blue-500">(only your assigned sections)</span>
                    )}
                  </p>
                )}
              </div>
              
              {/* Grade Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <input 
                  type="text" 
                  value={formData.grade} 
                  disabled
                  className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" 
                />
                <p className="text-xs text-gray-400 mt-1">Auto-filled from selected section</p>
              </div>
              
              <input 
                type="email" 
                placeholder="Email (optional)" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              />
              <input 
                type="tel" 
                placeholder="Phone (optional)" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              />
              <button 
                onClick={handleAddStudent} 
                disabled={isAddingStudent || availableSections.length === 0 || loadingSections}
                className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {isAddingStudent ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal - Keep same as before */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Bulk Import Students</h3>
              <button onClick={() => setShowBulkImportModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FileUp size={18} /> How to import:
                </h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Download the Excel/CSV template below</li>
                  <li>Fill in student information (Name, Grade, Section are required)</li>
                  <li>Make sure the Grade and Section match existing sections in the system</li>
                  <li>Save the file as .xlsx or .csv</li>
                  <li>Upload the file using the button below</li>
                  <li>Review the preview and click Import</li>
                </ol>
                <div className="mt-3 p-2 bg-yellow-100 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertCircle size={16} /> Available sections in system: {allSections.length}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {allSections.map(s => `${s.gradeLevel}-${s.sectionName}`).join(', ')}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={downloadTemplate} 
                className="w-full py-3 border-2 border-dashed border-green-600 text-green-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-50 transition"
              >
                <FileDown size={20} /> Download Excel Template
              </button>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition">
                <Upload size={40} className="text-gray-400 mx-auto mb-3" />
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  id="bulkFileUpload" 
                />
                <label 
                  htmlFor="bulkFileUpload" 
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition"
                >
                  Choose File
                </label>
                <p className="text-xs text-gray-500 mt-2">Supported formats: .xlsx, .xls, .csv</p>
              </div>
              
              {importPreview.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">
                    Preview ({importPreview.length} students)
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({importPreview.filter(s => s.isValid).length} valid, {importPreview.filter(s => !s.isValid).length} invalid)
                    </span>
                  </h4>
                  <div className="overflow-x-auto max-h-80 border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr><th className="p-2 text-left">Status</th><th className="p-2 text-left">Name</th><th className="p-2 text-left">Grade</th><th className="p-2 text-left">Section</th><th className="p-2 text-left">Email</th></tr></thead>
                      <tbody>
                        {importPreview.map((student, idx) => (
                          <tr key={idx} className={`border-t ${student.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                            <td className="p-2">{student.isValid ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}</td>
                            <td className="p-2 font-medium">{student.name}</td>
                            <td className="p-2">{student.grade || 'Missing'}</td>
                            <td className="p-2">{student.section || 'Missing'}</td>
                            <td className="p-2 text-gray-500">{student.email || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowBulkImportModal(false); setImportPreview([]); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleImportStudents} disabled={importPreview.length === 0 || importPreview.filter(s => s.isValid).length === 0 || isImporting} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50">
                  {isImporting ? 'Importing...' : `Import ${importPreview.filter(s => s.isValid).length} Students`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Results Modal */}
      {showImportResults && importResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Import Results</h3>
              <button onClick={() => setShowImportResults(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${importResults.count > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {importResults.count > 0 ? <CheckCircle size={32} className="text-green-600" /> : <XCircle size={32} className="text-red-600" />}
              </div>
              <h4 className="text-lg font-semibold">{importResults.count} of {importResults.totalAttempted} students imported</h4>
              {importResults.errors?.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-red-600 font-semibold mb-2">Errors:</p>
                  <div className="max-h-48 overflow-y-auto">
                    {importResults.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-red-500">• {err.name}: {err.error}</p>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setShowImportResults(false)} className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Student QR Code</h3>
              <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="bg-gray-100 p-4 rounded-xl">
              {selectedStudent.qrCodeData ? (
                <img src={selectedStudent.qrCodeData} alt="QR Code" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 mx-auto flex items-center justify-center text-gray-400">No QR Code</div>
              )}
              <p className="mt-2 font-mono text-sm">{selectedStudent.studentId}</p>
            </div>
            <p className="mt-4 font-semibold">{selectedStudent.name}</p>
            <p className="text-sm text-gray-500">{selectedStudent.grade} - {selectedStudent.section}</p>
            <button onClick={() => { const link = document.createElement('a'); link.download = `${selectedStudent.studentId}_qrcode.png`; link.href = selectedStudent.qrCodeData; link.click(); }} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Download QR Code</button>
          </div>
        </div>
      )}
    </div>
  );
}