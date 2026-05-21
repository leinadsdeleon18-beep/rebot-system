import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, X, BookOpen, User, RefreshCw, Users, GraduationCap, School, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SectionManagement() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [viewingSection, setViewingSection] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [studentsInSection, setStudentsInSection] = useState([]);
  const [formData, setFormData] = useState({
    gradeLevel: 'Kindergarten',
    sectionName: '',
    adviser: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gradeLevels = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

  // Example custom section name suggestions
  const customSectionSuggestions = [
    'Sampaguita', 'Rose', 'Gumamela', 'Sunflower', 'Orchid', 'Daisy',
    'Pearl', 'Emerald', 'Ruby', 'Sapphire', 'Diamond', 'Gold',
    'Section A', 'Section B', 'Section C', 'Section D', 'Section E',
    'Mangga', 'Saging', 'Santol', 'Rambutan', 'Durian', 'Langka',
    'Integrity', 'Excellence', 'Leadership', 'Honesty', 'Respect', 'Discipline'
  ];

  useEffect(() => {
    fetchSections();
    fetchTeachers();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/sections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setSections(data.sections);
        // Dispatch event to notify other components that sections were loaded
        window.dispatchEvent(new CustomEvent('sectionsLoaded'));
      } else {
        toast.error(data.message || 'Failed to load sections');
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        const teacherList = data.users.filter(user => user.role?.name === 'teacher');
        setTeachers(teacherList);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchStudentsInSection = async (sectionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/students?sectionId=${sectionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setStudentsInSection(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleAddSection = async () => {
    if (!formData.gradeLevel || !formData.sectionName) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gradeLevel: formData.gradeLevel,
          sectionName: formData.sectionName.trim(),
          adviser: formData.adviser || null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Section "${formData.sectionName}" added to ${formData.gradeLevel}!`);
        setShowAddModal(false);
        setFormData({ gradeLevel: 'Kindergarten', sectionName: '', adviser: '' });
        await fetchSections();
        // Dispatch event to notify other components that sections were updated
        console.log('Dispatching sectionsUpdated event with new section:', data.section);
        window.dispatchEvent(new CustomEvent('sectionsUpdated', { detail: { section: data.section } }));
      } else {
        toast.error(data.message || 'Failed to add section');
      }
    } catch (error) {
      console.error('Add section error:', error);
      toast.error('Failed to add section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSection = async () => {
    if (!formData.gradeLevel || !formData.sectionName) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/sections/${editingSection._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gradeLevel: formData.gradeLevel,
          sectionName: formData.sectionName.trim(),
          adviser: formData.adviser || null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Section updated from "${editingSection.sectionName}" to "${formData.sectionName}"!`);
        setShowEditModal(false);
        setEditingSection(null);
        setFormData({ gradeLevel: 'Kindergarten', sectionName: '', adviser: '' });
        await fetchSections();
        // Dispatch event to notify other components that sections were updated
        console.log('Dispatching sectionsUpdated event with updated section:', data.section);
        window.dispatchEvent(new CustomEvent('sectionsUpdated', { detail: { section: data.section } }));
      } else {
        toast.error(data.message || 'Failed to update section');
      }
    } catch (error) {
      console.error('Update section error:', error);
      toast.error('Failed to update section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSection = async (section) => {
    if (!window.confirm(`Delete section "${section.sectionName}"? This will also remove teacher assignment and student associations.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/sections/${section._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Section deleted successfully!');
        await fetchSections();
        // Dispatch event to notify other components that sections were updated
        console.log('Dispatching sectionsUpdated event for deletion');
        window.dispatchEvent(new CustomEvent('sectionsUpdated'));
      } else {
        toast.error(data.message || 'Failed to delete section');
      }
    } catch (error) {
      console.error('Delete section error:', error);
      toast.error('Failed to delete section');
    }
  };

  const handleViewSection = async (section) => {
    setViewingSection(section);
    await fetchStudentsInSection(section._id);
    setShowViewModal(true);
  };

  const openEditModal = (section) => {
    setEditingSection(section);
    setFormData({
      gradeLevel: section.gradeLevel,
      sectionName: section.sectionName,
      adviser: section.adviser?._id || section.adviser || ''
    });
    setShowEditModal(true);
  };

  const getGradeIcon = (gradeLevel) => {
    if (gradeLevel === 'Kindergarten') return '🎓';
    return '📚';
  };

  const filteredSections = sections.filter(section => 
    section.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.sectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.adviser?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedSections = {};
  filteredSections.forEach(section => {
    if (!groupedSections[section.gradeLevel]) {
      groupedSections[section.gradeLevel] = [];
    }
    groupedSections[section.gradeLevel].push(section);
  });

  const sortedGrades = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']
    .filter(grade => groupedSections[grade]);

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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Section Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage sections from Kindergarten to Grade 6 with custom section names</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchSections} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-full font-semibold flex items-center gap-2 hover:bg-blue-50 transition">
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition shadow-sm">
            <Plus size={18} /> Add Section
          </button>
        </div>
      </div>

      {/* Info Alert about custom section names */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800">Custom Section Names</h4>
            <p className="text-sm text-blue-700 mt-1">
              You can use any custom name for sections (e.g., Sampaguita, Rose, Section A, Mangga, etc.). 
              When you update a section name, it will automatically update across all teacher dashboards and student records.
            </p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by grade, section name, or teacher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedGrades.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <School size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No sections found</h3>
            <p className="text-gray-400 dark:text-gray-500 mt-1">Click "Add Section" to create a new section with a custom name</p>
          </div>
        ) : (
          sortedGrades.map(grade => (
            <div key={grade} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getGradeIcon(grade)}</span>
                  <h2 className="text-lg font-semibold">{grade}</h2>
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {groupedSections[grade].length} section{groupedSections[grade].length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Section Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assigned Teacher</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">School Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {groupedSections[grade].map((section) => (
                      <tr key={section._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <BookOpen size={14} className="text-green-600" />
                            <span className="text-gray-800 dark:text-gray-200 font-semibold">{section.sectionName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {section.adviser ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <User size={14} className="text-blue-600" />
                              </div>
                              <span>{section.adviser.fullName}</span>
                            </div>
                          ) : (
                            <span className="text-yellow-600">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button 
                            onClick={() => handleViewSection(section)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <Users size={14} />
                            <span>{section.students?.length || 0} students</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {section.schoolYear}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => openEditModal(section)} 
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                              title="Edit Section Name or Teacher"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSection(section)} 
                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition" 
                              title="Delete Section"
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
          ))
        )}
      </div>

      {/* View Section Modal */}
      {showViewModal && viewingSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {viewingSection.sectionName}
                </h3>
                <p className="text-sm text-gray-500">{viewingSection.gradeLevel}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Teacher:</strong> {viewingSection.adviser?.fullName || 'Not Assigned'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <strong>School Year:</strong> {viewingSection.schoolYear}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <strong>Total Students:</strong> {studentsInSection.length}
              </p>
            </div>
            
            <h4 className="font-semibold mb-3">Student List</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {studentsInSection.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No students in this section yet.</p>
              ) : (
                studentsInSection.map(student => (
                  <div key={student._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-xs text-gray-500">{student.studentId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{student.points} points</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Add New Section</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Grade Level *</label>
                <select 
                  value={formData.gradeLevel} 
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} 
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {gradeLevels.map(grade => (
                    <option key={grade} value={grade}>
                      {grade === 'Kindergarten' ? '🎓 Kindergarten' : `📚 ${grade}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Custom Section Name *</label>
                <input 
                  type="text" 
                  value={formData.sectionName} 
                  onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })} 
                  placeholder="Enter custom section name (e.g., Sampaguita, Rose, Section A, Mangga)" 
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
                />
                <p className="text-xs text-gray-500 mt-1">You can use any custom name you like!</p>
              </div>
              
              {/* Suggestions */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Suggestions:</label>
                <div className="flex flex-wrap gap-2">
                  {customSectionSuggestions.slice(0, 6).map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setFormData({ ...formData, sectionName: suggestion })}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Assign Teacher (Optional)</label>
                <select 
                  value={formData.adviser} 
                  onChange={(e) => setFormData({ ...formData, adviser: e.target.value })} 
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullName} ({teacher.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-blue-500 mt-1">Assigned teacher will only see and manage this section</p>
              </div>
              
              <button 
                onClick={handleAddSection} 
                disabled={isSubmitting} 
                className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {showEditModal && editingSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Edit Section</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Grade Level *</label>
                <select 
                  value={formData.gradeLevel} 
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} 
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {gradeLevels.map(grade => (
                    <option key={grade} value={grade}>
                      {grade === 'Kindergarten' ? '🎓 Kindergarten' : `📚 ${grade}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Custom Section Name *</label>
                <input 
                  type="text" 
                  value={formData.sectionName} 
                  onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })} 
                  placeholder="Enter custom section name" 
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" 
                />
                <p className="text-xs text-blue-500 mt-1">
                  Current: "{editingSection?.sectionName}" → New: "{formData.sectionName || '...'}"
                </p>
                <p className="text-xs text-orange-500 mt-1">
                  ⚠️ Changing the section name will update it everywhere (teacher dashboards, student records, etc.)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Assign Teacher</label>
                <select 
                  value={formData.adviser} 
                  onChange={(e) => setFormData({ ...formData, adviser: e.target.value })} 
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullName} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={handleUpdateSection} 
                disabled={isSubmitting} 
                className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}