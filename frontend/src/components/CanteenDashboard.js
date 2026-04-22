import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

const CanteenDashboard = ({ user, logout }) => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockStudents = [
        { _id: '1', id: 'STU-2024-0001', name: 'Juan Dela Cruz', section: 'Grade 5', points: 25 },
        { _id: '2', id: 'STU-2024-0002', name: 'Maria Santos', section: 'Grade 5', points: 15 },
        { _id: '3', id: 'STU-2024-0003', name: 'Pedro Reyes', section: 'Grade 6', points: 35 },
      ];
      setStudents(mockStudents);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (studentId, amount) => {
    try {
      console.log(`Transaction: ${amount} pesos for ${studentId}`);
      // Simulate API call
      alert(`✅ Transaction successful!\n${amount} pesos = ${Math.floor(amount / 10)} points`);
      setSelectedStudent(null);
    } catch (error) {
      alert('❌ Transaction failed');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.includes(searchTerm)
  );

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon">♻️</div>
          <div>
            <div>ReBot Dashboard</div>
            <div className="school-badge">Patubig ES</div>
          </div>
        </div>
        <div className="nav-item active">
          <span> Canteen Sales</span>
        </div>
        <div className="nav-item" onClick={logout}>
          <span> Logout</span>
        </div>
      </div>
      
      <div className="main-content">
        <div className="header">
          <h1> Canteen Dashboard</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Search students by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div>Loading students...</div>
        ) : (
          <div className="student-grid">
            {filteredStudents.map(student => (
              <div key={student._id} className="student-card" onClick={() => setSelectedStudent(student)}>
                <div className="student-id">{student.id}</div>
                <div className="student-name">{student.name}</div>
                <div className="student-section">{student.section}</div>
                <div className="student-points">⭐ {student.points} Points</div>
                <div style={{ marginTop: '0.5rem' }}>
                  <QRCodeCanvas value={student.id} size={80} />
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedStudent && (
          <div className="transaction-modal">
            <h3> Transaction</h3>
            <p><strong>{selectedStudent.name}</strong></p>
            <p>ID: {selectedStudent.id}</p>
            
            <div className="amount-buttons">
              {[10, 20, 30, 50, 100].map(amount => (
                <button 
                  key={amount} 
                  onClick={() => handleTransaction(selectedStudent.id, amount)}
                  className="amount-btn"
                >
                  ₱{amount}
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedStudent(null)} className="btn-secondary">❌ Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanteenDashboard;