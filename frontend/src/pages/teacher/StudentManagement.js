import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, Search, Upload, Download, QrCode, Star, FileUp, FileDown, 
  Printer, X, AlertCircle, CheckCircle, XCircle, RefreshCw, School, Users, 
  Info, HelpCircle, UserX, BookOpen, Lock, ShieldAlert, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import LoadingScreen from '../../components/LoadingScreen';

// API Base URL
const API_BASE = 'http://localhost:5000/api';

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
  const [showPrintQRModal, setShowPrintQRModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [isAddingPoints, setIsAddingPoints] = useState(false);
  const [teacherAssignedGrades, setTeacherAssignedGrades] = useState([]);
  const [teacherAssignedSections, setTeacherAssignedSections] = useState([]);
  const [teacherName, setTeacherName] = useState('');
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
    setTeacherName(user.fullName || 'Teacher');
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
      
      const response = await fetch(`${API_BASE}/sections`, {
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
            filteredSections = sectionArray.filter(section => 
              teacherAssignedSections.includes(section.id)
            );
          } else if (teacherAssignedGrades && teacherAssignedGrades.length > 0) {
            filteredSections = sectionArray.filter(section => 
              teacherAssignedGrades.includes(section.gradeLevel)
            );
          }
        }
        
        setSectionsList(filteredSections);
        console.log('✅ Total sections in DB:', sectionArray.length);
        console.log('✅ Sections available for user:', filteredSections.length);
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
      const response = await fetch(`${API_BASE}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      console.log('📡 Students API Response:', data);
      
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

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    setIsDeletingStudent(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/students/${studentToDelete.id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Student deleted successfully!');
        setShowDeleteModal(false);
        setStudentToDelete(null);
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
      
      const response = await fetch(`${API_BASE}/students`, {
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

  const handleAddPoints = async () => {
    if (!pointsToAdd || pointsToAdd <= 0) {
      toast.error('Please enter valid points');
      return;
    }
    
    setIsAddingPoints(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/students/${selectedStudent.id}/points`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ points: parseInt(pointsToAdd) })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Added ${pointsToAdd} points to ${selectedStudent.name}`);
        setShowPointsModal(false);
        setSelectedStudent(null);
        setPointsToAdd('');
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
      const response = await fetch(`${API_BASE}/students/${student.id}/qrcode`, {
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
    const sampleSections = sectionsList.slice(0, 3);
    const headers = ['Full Name', 'Grade', 'Section', 'Email', 'Phone'];
    
    let sampleData = [];
    if (sampleSections.length > 0) {
      sampleData = sampleSections.map(section => [
        `Sample Student ${section.sectionName}`,
        section.gradeLevel,
        section.sectionName,
        `student@example.com`,
        '09123456789'
      ]);
    } else {
      sampleData = [
        ['Juan Dela Cruz', 'Grade 1', 'Section A', 'juan@example.com', '09123456789'],
        ['Maria Santos', 'Grade 1', 'Section A', 'maria@example.com', '09123456790'],
      ];
    }
    
    const wsData = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students Template');
    XLSX.writeFile(wb, `student_import_template_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Template downloaded!');
  };

  const checkTeacherAccess = (grade, sectionName) => {
    if (userRole !== 'teacher') return { hasAccess: true, reason: null };
    
    // Check if teacher has assigned sections
    if (teacherAssignedSections.length > 0) {
      const sectionObj = allSections.find(s => s.sectionName === sectionName && s.gradeLevel === grade);
      if (sectionObj && teacherAssignedSections.includes(sectionObj.id)) {
        return { hasAccess: true, reason: null };
      } else {
        const availableSections = allSections
          .filter(s => teacherAssignedSections.includes(s.id))
          .map(s => `${s.gradeLevel} - ${s.sectionName}`);
        
        return { 
          hasAccess: false, 
          reason: `❌ You are not assigned to "${sectionName}" in ${grade}. Your assigned sections are: ${availableSections.join(', ') || 'none'}.`
        };
      }
    }
    
    // Check if teacher has assigned grades
    if (teacherAssignedGrades.length > 0) {
      if (teacherAssignedGrades.includes(grade)) {
        return { hasAccess: true, reason: null };
      } else {
        return { 
          hasAccess: false, 
          reason: `❌ You are not assigned to ${grade}. Your assigned grades are: ${teacherAssignedGrades.join(', ')}.`
        };
      }
    }
    
    return { hasAccess: true, reason: null };
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
        
        console.log('📊 Parsed rows from Excel:', rows);
        
        const previewData = rows.map((row, index) => {
          const name = row['Full Name'] || row['fullName'] || row['name'] || row['Name'] || '';
          const grade = row['Grade'] || row['grade'] || '';
          const section = row['Section'] || row['section'] || '';
          const email = row['Email'] || row['email'] || '';
          const phone = row['Phone'] || row['phone'] || '';
          
          return {
            id: index,
            name: name.toString().trim(),
            grade: grade.toString().trim(),
            section: section.toString().trim(),
            email: email.toString().trim(),
            phone: phone.toString().trim(),
            isValid: true,
            error: null,
            errorType: null
          };
        }).filter(s => s.name);
        
        if (previewData.length === 0) {
          toast.error('No valid data found in file. Please check the template format.');
          return;
        }
        
        // Validate each student with user-friendly messages
        previewData.forEach(student => {
          const errors = [];
          let errorType = null;
          
          // Check required fields
          if (!student.name) {
            errors.push('❌ Student name is required');
            errorType = 'missing_name';
          }
          if (!student.grade) {
            errors.push('❌ Grade level is required');
            errorType = 'missing_grade';
          }
          if (!student.section) {
            errors.push('❌ Section name is required');
            errorType = 'missing_section';
          }
          
          // If name, grade, and section are provided, validate they exist
          if (student.name && student.grade && student.section) {
            // Check if section exists in the system
            const sectionExists = allSections.some(s => 
              s.sectionName.toLowerCase() === student.section.toLowerCase() && 
              s.gradeLevel === student.grade
            );
            
            if (!sectionExists) {
              const availableSectionsForGrade = allSections
                .filter(s => s.gradeLevel === student.grade)
                .map(s => s.sectionName);
              
              if (availableSectionsForGrade.length > 0) {
                errors.push(`❌ Section "${student.section}" does not exist in ${student.grade}. Available sections: ${availableSectionsForGrade.join(', ')}`);
                errorType = 'section_not_found';
              } else {
                errors.push(`❌ No sections found for ${student.grade}. Please create sections first in Section Management.`);
                errorType = 'no_sections';
              }
            } else {
              // Check if teacher has access to this grade/section
              const accessCheck = checkTeacherAccess(student.grade, student.section);
              if (!accessCheck.hasAccess) {
                errors.push(accessCheck.reason);
                errorType = 'access_denied';
              }
            }
          }
          
          student.isValid = errors.length === 0;
          student.error = errors.join(' | ');
          student.errorType = errorType;
        });
        
        setImportPreview(previewData);
        
        const validCount = previewData.filter(s => s.isValid).length;
        const invalidCount = previewData.filter(s => !s.isValid).length;
        
        if (invalidCount > 0) {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5`}>
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      File Analysis Complete
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Found {previewData.length} records: {validCount} valid, {invalidCount} invalid
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Invalid rows are highlighted in red with error messages below.
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ), { duration: 5000 });
        } else {
          toast.success(`✅ All ${previewData.length} records are valid and ready to import!`);
        }
        
        console.log('Invalid students:', previewData.filter(s => !s.isValid));
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Failed to parse file. Please use the template format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case 'missing_name': return <UserX size={14} className="text-red-500" />;
      case 'missing_grade': return <School size={14} className="text-red-500" />;
      case 'missing_section': return <BookOpen size={14} className="text-red-500" />;
      case 'section_not_found': return <AlertCircle size={14} className="text-red-500" />;
      case 'no_sections': return <Info size={14} className="text-red-500" />;
      case 'access_denied': return <ShieldAlert size={14} className="text-red-500" />;
      default: return <AlertCircle size={14} className="text-red-500" />;
    }
  };

  const handleImportStudents = async () => {
    if (importPreview.length === 0) {
      toast.error('No data to import');
      return;
    }

    const validStudents = importPreview.filter(s => s.isValid);
    
    if (validStudents.length === 0) {
      toast.error('No valid students to import. Please fix the errors in your file.', {
        duration: 5000,
        icon: '⚠️'
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const studentsToImport = validStudents.map(s => ({
        name: s.name,
        grade: s.grade,
        section: s.section,
        email: s.email || '',
        phone: s.phone || ''
      }));
      
      console.log('📤 Importing students:', studentsToImport);
      
      const response = await fetch(`${API_BASE}/students/bulk/advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ students: studentsToImport })
      });
      
      const data = await response.json();
      console.log('📥 Import response:', data);
      
      const failedCount = (data.errors || []).length;
      const successCount = data.count || 0;
      
      setImportResults({
        success: data.success,
        count: successCount,
        totalAttempted: studentsToImport.length,
        errors: data.errors || []
      });
      
      if (data.success) {
        if (failedCount > 0) {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5`}>
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Import Completed with Warnings
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      ✅ {successCount} students imported successfully
                    </p>
                    <p className="text-sm text-red-500">
                      ❌ {failedCount} students failed
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Check the results modal for details on failed imports.
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ), { duration: 5000 });
        } else {
          toast.success(`🎉 Successfully imported all ${successCount} students!`);
        }
        
        setShowImportResults(true);
        setShowBulkImportModal(false);
        setImportPreview([]);
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
    setShowPrintQRModal(true);
  };

  const availableSections = sectionsList;
  const availableGrades = ['all', ...new Set(availableSections.map(s => s.gradeLevel))];
  
  // Apply teacher filtering on the client side
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    
    // Teacher filtering based on assigned sections or grades
    let matchesTeacherAccess = true;
    
    if (userRole === 'teacher') {
      // Check if teacher has assigned sections
      if (teacherAssignedSections && teacherAssignedSections.length > 0) {
        // Only show students whose section ID is in the teacher's assigned sections
        matchesTeacherAccess = student.sectionId && teacherAssignedSections.includes(student.sectionId);
      } 
      // Fallback to grade-based filtering if no sections assigned
      else if (teacherAssignedGrades && teacherAssignedGrades.length > 0) {
        matchesTeacherAccess = teacherAssignedGrades.includes(student.grade);
      }
    }
    
    return matchesSearch && matchesGrade && matchesTeacherAccess;
  });

  const totalPoints = filteredStudents.reduce((sum, s) => sum + s.points, 0);
  const activeStudents = filteredStudents.filter(s => s.status === 'active').length;

  if (loading && students.length === 0) {
    return <LoadingScreen message="Loading students..." />;
  }

  if (userRole === 'teacher' && teacherAssignedGrades.length === 0 && teacherAssignedSections.length === 0 && userLoaded) {
    return (
      <div className="bg-yellow-50 rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <School size={32} className="text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-yellow-800">No Grades or Sections Assigned</h2>
          <p className="text-yellow-700 max-w-md">
            You don't have any grades or sections assigned to your account yet.
          </p>
          <p className="text-sm text-yellow-600">
            Please contact the administrator to assign grade levels or sections to your account.
          </p>
        </div>
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
                ? `You have access to ${availableSections.length} section(s)`
                : `Total ${allSections.length} section(s) in system`
            }
          </span>
        </div>
        <button 
          onClick={async () => {
            await fetchSections();
            toast.success(`Found ${allSections.length} total sections`);
          }}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Refresh ({allSections.length})
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
                    <td className="px-6 py-4 text-sm">
                      {student.section !== 'N/A' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <BookOpen size={12} />
                          {student.section}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <AlertCircle size={12} />
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">{student.points} pts</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleViewQR(student)} className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg" title="View QR Code">
                          <QrCode size={18} />
                        </button>
                        <button onClick={() => {
                          setSelectedStudent(student);
                          setPointsToAdd('');
                          setShowPointsModal(true);
                        }} className="p-1 text-green-600 hover:bg-green-50 rounded-lg" title="Add Points">
                          <Star size={18} />
                        </button>
                        <button onClick={() => {
                          setStudentToDelete(student);
                          setShowDeleteModal(true);
                        }} className="p-1 text-red-600 hover:bg-red-50 rounded-lg" title="Delete Student">
                          <Trash2 size={18} />
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
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Full Name *" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
              />
              
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
                      toast.success(`Loaded ${allSections.length} sections`);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-green-500 transition"
                    title="Refresh sections"
                  >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
                {userRole === 'teacher' && availableSections.length === 0 && !loadingSections && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2">
                      <ShieldAlert size={16} className="text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">No Sections Available</p>
                        <p className="text-xs text-red-700 mt-1">
                          You don't have any sections assigned to your account. 
                          Please contact the administrator to assign sections to you.
                        </p>
                        {teacherAssignedGrades.length > 0 && (
                          <p className="text-xs text-red-600 mt-2">
                            You are assigned to grades: {teacherAssignedGrades.join(', ')}. 
                            However, no sections exist in these grades yet. Create sections first.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {userRole === 'teacher' && availableSections.length > 0 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={12} /> You have access to {availableSections.length} section(s)
                  </p>
                )}
              </div>
              
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
                disabled={isAddingStudent || availableSections.length === 0}
                className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {isAddingStudent ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Points Modal */}
      {showPointsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Star size={20} className="text-yellow-500" /> Add Points
              </h3>
              <button onClick={() => {
                setShowPointsModal(false);
                setSelectedStudent(null);
                setPointsToAdd('');
              }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600">Student: <span className="font-semibold text-gray-800">{selectedStudent.name}</span></p>
                <p className="text-sm text-gray-600 mt-1">Current Points: <span className="font-semibold text-green-600">{selectedStudent.points} pts</span></p>
                <p className="text-sm text-gray-600 mt-1">Student ID: <span className="font-mono text-gray-500">{selectedStudent.studentId}</span></p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Points to Add</label>
                <input 
                  type="number" 
                  placeholder="Enter points amount" 
                  value={pointsToAdd} 
                  onChange={(e) => setPointsToAdd(e.target.value)} 
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
                  min="1"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setPointsToAdd('10')} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">+10</button>
                <button onClick={() => setPointsToAdd('25')} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">+25</button>
                <button onClick={() => setPointsToAdd('50')} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">+50</button>
                <button onClick={() => setPointsToAdd('100')} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">+100</button>
                <button onClick={() => setPointsToAdd('500')} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">+500</button>
                <button onClick={() => setPointsToAdd('1000')} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">+1000</button>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowPointsModal(false);
                    setSelectedStudent(null);
                    setPointsToAdd('');
                  }} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddPoints} 
                  disabled={isAddingPoints || !pointsToAdd || pointsToAdd <= 0} 
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAddingPoints ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Star size={16} />
                      Add {pointsToAdd} Points
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" /> Confirm Delete
              </h3>
              <button onClick={() => {
                setShowDeleteModal(false);
                setStudentToDelete(null);
              }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Delete Student?</h4>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <span className="font-semibold">{studentToDelete.name}</span>?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-700 flex items-center gap-2">
                  <AlertCircle size={14} />
                  This action cannot be undone. All data for this student will be permanently removed.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setStudentToDelete(null);
                  }} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteStudent} 
                  disabled={isDeletingStudent} 
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeletingStudent ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Student
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal - Keep existing code */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Bulk Import Students</h3>
              <button onClick={() => setShowBulkImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <HelpCircle size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">How to Import Students</h4>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Click "Download Excel Template" to get the correct format</li>
                      <li>Fill in student information (Name, Grade, Section are required)</li>
                      <li><strong>Grade and Section must match existing sections</strong> in the system</li>
                      <li>Save the file as .xlsx</li>
                      <li>Upload the file below</li>
                      <li>Review the preview - <span className="text-green-600">Green rows</span> are valid, <span className="text-red-600">red rows</span> have errors</li>
                      <li>Click "Import Valid Students"</li>
                    </ol>
                  </div>
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
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">Preview</h4>
                    <div className="flex gap-3 text-xs">
                      <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-600" /> Valid: {importPreview.filter(s => s.isValid).length}</span>
                      <span className="flex items-center gap-1"><XCircle size={12} className="text-red-600" /> Invalid: {importPreview.filter(s => !s.isValid).length}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-96 border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left w-10">Status</th>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Grade</th>
                          <th className="p-2 text-left">Section</th>
                          <th className="p-2 text-left">Email</th>
                          <th className="p-2 text-left">Error Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((student, idx) => (
                          <tr key={idx} className={`border-t ${student.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                            <td className="p-2">
                              {student.isValid ? (
                                <CheckCircle size={16} className="text-green-600" />
                              ) : (
                                getErrorIcon(student.errorType)
                              )}
                            </td>
                            <td className="p-2 font-medium">{student.name || <span className="text-red-500">Missing</span>}</td>
                            <td className="p-2">{student.grade || <span className="text-red-500">Missing</span>}</td>
                            <td className="p-2">{student.section || <span className="text-red-500">Missing</span>}</td>
                            <td className="p-2 text-gray-500">{student.email || '-'}</td>
                            <td className="p-2">
                              {!student.isValid && (
                                <div className="text-red-600 text-xs max-w-xs">
                                  {student.error}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setImportPreview([]);
                  }} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImportStudents} 
                  disabled={importPreview.length === 0 || importPreview.filter(s => s.isValid).length === 0 || isImporting} 
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Import {importPreview.filter(s => s.isValid).length} Valid Students
                    </>
                  )}
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
              <button onClick={() => setShowImportResults(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${importResults.count > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {importResults.count > 0 ? <CheckCircle size={32} className="text-green-600" /> : <XCircle size={32} className="text-red-600" />}
              </div>
              <h4 className="text-lg font-semibold">
                {importResults.count === importResults.totalAttempted 
                  ? 'All Students Imported Successfully!' 
                  : `${importResults.count} of ${importResults.totalAttempted} students imported`}
              </h4>
              {importResults.errors?.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-red-600 font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle size={16} /> Failed Imports ({importResults.errors.length})
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {importResults.errors.map((err, idx) => (
                      <div key={idx} className="bg-red-50 p-2 rounded-lg border border-red-200">
                        <p className="text-sm font-medium text-red-800">Student: {err.name}</p>
                        <p className="text-xs text-red-600 mt-1">{err.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setShowImportResults(false)} className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print QR Codes Modal */}
      {showPrintQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Printer size={20} className="text-purple-600" /> Student QR Codes
              </h3>
              <button onClick={() => setShowPrintQRModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6" id="qr-print-content">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-green-800">Student QR Codes</h2>
                <p className="text-gray-600">Patubig Elementary School - ReBot Program</p>
                <p className="text-gray-500 text-sm">Generated: {new Date().toLocaleDateString()}</p>
                <p className="text-gray-500 text-sm">Teacher: {teacherName}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filteredStudents.map((student, index) => (
                  <div key={student.id} className="border rounded-xl p-4 text-center hover:shadow-lg transition">
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      {student.qrCodeData ? (
                        <img src={student.qrCodeData} alt="QR Code" className="w-28 h-28" />
                      ) : (
                        <QrCode size={48} className="text-gray-400" />
                      )}
                    </div>
                    <h4 className="font-semibold text-sm">{student.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{student.studentId}</p>
                    <p className="text-xs text-gray-500">{student.grade} - {student.section}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Printer size={18} /> Print QR Codes
              </button>
              <button
                onClick={() => setShowPrintQRModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Close
              </button>
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
              <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
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
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `${selectedStudent.studentId}_qrcode.png`;
                  link.href = selectedStudent.qrCodeData;
                  link.click();
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Download
              </button>
              <button 
                onClick={() => setShowQRModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
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
          #qr-print-content, #qr-print-content * {
            visibility: visible;
          }
          #qr-print-content {
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