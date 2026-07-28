const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const User = require('../models/User');

// Get filtered students based on user role and filters
const getFilteredStudents = async (req) => {
  let query = {};
  
  // If user is teacher, only show students from their assigned grades/sections
  if (req.user.role === 'teacher') {
    const teacher = await User.findById(req.user.id);
    const assignedGrades = teacher.assignedGrades || [];
    const assignedSections = teacher.assignedSections || [];
    
    if (assignedSections.length > 0) {
      query.section = { $in: assignedSections };
    } else if (assignedGrades.length > 0) {
      query.grade = { $in: assignedGrades };
    } else {
      return { students: [], studentIds: [] };
    }
  }
  
  const students = await Student.find(query);
  return { students, studentIds: students.map(s => s._id) };
};

// Get report data with filters
const getReportData = async (req, res) => {
  try {
    const { year, month, grade, section, reportType } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
      dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
      
      if (month && month !== 'all') {
        const startMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        dateFilter = { createdAt: { $gte: startMonth, $lte: endMonth } };
      }
    }
    
    // Build student filter
    let studentFilter = {};
    if (grade && grade !== 'all') {
      studentFilter.grade = grade;
    }
    if (section && section !== 'all') {
      studentFilter.sectionName = section;
    }
    
    // Apply role-based filtering
    let students = await Student.find(studentFilter);
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      const assignedSections = teacher.assignedSections || [];
      
      if (assignedSections.length > 0) {
        students = students.filter(s => assignedSections.includes(s.section?.toString()));
      } else if (assignedGrades.length > 0) {
        students = students.filter(s => assignedGrades.includes(s.grade));
      }
    }
    
    const studentIds = students.map(s => s._id);
    
    // Get transactions for these students
    let transactionFilter = { student: { $in: studentIds } };
    if (dateFilter.createdAt) {
      transactionFilter.createdAt = dateFilter.createdAt;
    }
    
    const transactions = await Transaction.find(transactionFilter)
      .populate('student', 'fullName grade sectionName points')
      .populate('reward', 'name pointsRequired');
    
    // Calculate points earned by year
    const yearlyPoints = {};
    const monthlyPoints = {};
    const gradePoints = {};
    const sectionPoints = {};
    const studentPoints = {};
    
    transactions.forEach(transaction => {
      const transactionYear = transaction.createdAt.getFullYear();
      const transactionMonth = transaction.createdAt.getMonth();
      const grade = transaction.student?.grade || 'Unassigned';
      const section = transaction.student?.sectionName || 'Unassigned';
      const points = transaction.pointsEarned || 0;
      const studentId = transaction.student?._id.toString();
      
      // Yearly aggregation
      if (!yearlyPoints[transactionYear]) yearlyPoints[transactionYear] = 0;
      yearlyPoints[transactionYear] += points;
      
      // Monthly aggregation
      const monthKey = `${transactionYear}-${transactionMonth}`;
      if (!monthlyPoints[monthKey]) monthlyPoints[monthKey] = 0;
      monthlyPoints[monthKey] += points;
      
      // Grade aggregation
      if (!gradePoints[grade]) gradePoints[grade] = 0;
      gradePoints[grade] += points;
      
      // Section aggregation
      const sectionKey = `${grade} - ${section}`;
      if (!sectionPoints[sectionKey]) {
        sectionPoints[sectionKey] = { grade, section, points: 0, studentCount: 0 };
      }
      sectionPoints[sectionKey].points += points;
      
      // Student aggregation for top performers
      if (!studentPoints[studentId]) {
        studentPoints[studentId] = {
          student: transaction.student,
          points: 0
        };
      }
      studentPoints[studentId].points += points;
    });
    
    // Update student counts for sections
    students.forEach(student => {
      const grade = student.grade || 'Unassigned';
      const section = student.sectionName || 'Unassigned';
      const sectionKey = `${grade} - ${section}`;
      if (sectionPoints[sectionKey]) {
        sectionPoints[sectionKey].studentCount++;
      } else {
        sectionPoints[sectionKey] = {
          grade,
          section,
          points: 0,
          studentCount: 1
        };
      }
    });
    
    // Prepare yearly trend data from 2026 to 2030
    const years = [2026, 2027, 2028, 2029, 2030];
    const yearlyData = years.map(y => ({
      year: y,
      points: yearlyPoints[y] || 0
    }));
    
    // Monthly data for selected year
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => ({
      month,
      points: monthlyPoints[`${selectedYear || 2026}-${index}`] || 0
    }));
    
    // Grade performance
    const gradeOrder = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
    const gradeData = gradeOrder.map(grade => ({
      grade,
      totalPoints: gradePoints[grade] || 0,
      studentCount: students.filter(s => s.grade === grade).length,
      averagePoints: gradePoints[grade] && students.filter(s => s.grade === grade).length > 0 
        ? Math.round(gradePoints[grade] / students.filter(s => s.grade === grade).length) 
        : 0
    }));
    
    // Section performance
    const sectionData = Object.values(sectionPoints).map(item => ({
      grade: item.grade,
      section: item.section,
      totalPoints: item.points,
      studentCount: item.studentCount,
      averagePoints: item.studentCount > 0 ? Math.round(item.points / item.studentCount) : 0
    })).sort((a, b) => {
      const gradeCompare = gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
      if (gradeCompare !== 0) return gradeCompare;
      return a.section.localeCompare(b.section);
    });
    
    // Top students
    const topStudents = Object.values(studentPoints)
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map(item => ({
        ...item.student.toObject(),
        earnedPoints: item.points
      }));
    
    // Summary stats
    const totalStudents = students.length;
    const totalPoints = transactions.reduce((sum, t) => sum + (t.pointsEarned || 0), 0);
    const totalRedemptions = transactions.filter(t => t.type === 'redeem').length;
    const averagePoints = totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0;
    
    res.json({
      success: true,
      data: {
        summaryStats: {
          totalStudents,
          totalPoints,
          totalRedemptions,
          averagePoints
        },
        yearlyTrend: {
          labels: yearlyData.map(d => d.year.toString()),
          data: yearlyData.map(d => d.points)
        },
        monthlyTrend: {
          labels: monthlyData.map(d => d.month),
          data: monthlyData.map(d => d.points)
        },
        gradePerformance: gradeData,
        sectionPerformance: sectionData,
        topStudents,
        students: students.map(s => ({
          ...s.toObject(),
          pointsEarned: studentPoints[s._id.toString()]?.points || 0
        }))
      }
    });
    
  } catch (error) {
    console.error('Error getting report data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get filtered recycling data
const getRecyclingData = async (req, res) => {
  try {
    const { year, month, grade, section } = req.query;
    
    let dateFilter = {};
    if (year) {
      if (month && month !== 'all') {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
      } else {
        const startDate = new Date(parseInt(year), 0, 1);
        const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
        dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
      }
    }
    
    let studentFilter = {};
    if (grade && grade !== 'all') studentFilter.grade = grade;
    if (section && section !== 'all') studentFilter.sectionName = section;
    
    let students = await Student.find(studentFilter);
    const studentIds = students.map(s => s._id);
    
    const transactions = await Transaction.find({
      student: { $in: studentIds },
      type: 'earn',
      ...dateFilter
    }).populate('student', 'fullName grade sectionName');
    
    const recyclingData = transactions.map(t => ({
      id: t._id,
      studentName: t.student?.fullName,
      grade: t.student?.grade || 'N/A',
      section: t.student?.sectionName || 'N/A',
      points: t.pointsEarned,
      date: t.createdAt.toISOString().split('T')[0]
    }));
    
    res.json({ success: true, data: recyclingData });
  } catch (error) {
    console.error('Error getting recycling data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get redemption data
const getRedemptionData = async (req, res) => {
  try {
    const { year, month, grade, section } = req.query;
    
    let dateFilter = {};
    if (year) {
      if (month && month !== 'all') {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
      } else {
        const startDate = new Date(parseInt(year), 0, 1);
        const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
        dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
      }
    }
    
    let studentFilter = {};
    if (grade && grade !== 'all') studentFilter.grade = grade;
    if (section && section !== 'all') studentFilter.sectionName = section;
    
    let students = await Student.find(studentFilter);
    const studentIds = students.map(s => s._id);
    
    const transactions = await Transaction.find({
      student: { $in: studentIds },
      type: 'redeem',
      ...dateFilter
    }).populate('student', 'fullName')
      .populate('reward', 'name pointsRequired');
    
    const redemptionData = transactions.map(t => ({
      id: t._id,
      studentName: t.student?.fullName,
      rewardName: t.reward?.name,
      points: t.pointsSpent,
      date: t.createdAt.toISOString().split('T')[0]
    }));
    
    res.json({ success: true, data: redemptionData });
  } catch (error) {
    console.error('Error getting redemption data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getReportData, getRecyclingData, getRedemptionData };