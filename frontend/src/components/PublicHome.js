import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PublicHome = () => {
  const [studentId, setStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);

  const generateQR = () => {
    if (!studentId) return;
    
    // Simulate student lookup
    setStudentData({
      id: studentId,
      name: 'Juan Dela Cruz',
      points: Math.floor(Math.random() * 50),
      section: 'Grade 5 - Diamond'
    });
  };

  const downloadQR = async () => {
    const canvas = await html2canvas(document.getElementById('qr-card'));
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10, 180, 120);
    pdf.save(`${studentData.name}_ReBot_Card.pdf`);
  };

  return (
    <div className="public-home">
      <div className="hero">
        <div className="logo">♻️ ReBot</div>
        <h1>Patubig Elementary School</h1>
        <p>Redeem your plastic bottles for points!</p>
      </div>

      <div className="qr-generator">
        <h2>Generate Student QR Card</h2>
        <input
          type="text"
          placeholder="Enter Student ID (STU-2024-XXXX)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value.toUpperCase())}
          maxLength={20}
        />
        <button onClick={generateQR} className="btn-primary">Generate QR</button>

        {studentData && (
          <div id="qr-card" className="qr-card">
            <div className="student-info">
              <h3>{studentData.name}</h3>
              <p>{studentData.section}</p>
              <div className="points-badge">
                ⭐ {studentData.points} Points
              </div>
            </div>
            <div style={{ margin: '1rem 0' }}>
              <QRCodeCanvas value={studentData.id} size={150} />
            </div>
            <button onClick={downloadQR} className="btn-primary">📄 Download PDF</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicHome;