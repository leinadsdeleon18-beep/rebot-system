import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Scan, 
  Camera, 
  StopCircle,
  Search,
  User,
  Star,
  Gift,
  CheckCircle,
  AlertCircle,
  X,
  AlertTriangle
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';

// Mock student data
const mockStudents = [
  { id: 1, studentId: 'STU-2026-001', name: 'Juan Dela Cruz', grade: 'Grade 5', section: 'Section A', points: 245, avatar: '👨‍🎓' },
  { id: 2, studentId: 'STU-2026-002', name: 'Maria Santos', grade: 'Grade 5', section: 'Section A', points: 310, avatar: '👩‍🎓' },
  { id: 3, studentId: 'STU-2026-003', name: 'Jose Rizal', grade: 'Grade 6', section: 'Section B', points: 178, avatar: '👨‍🎓' },
  { id: 4, studentId: 'STU-2026-004', name: 'Andres Bonifacio', grade: 'Grade 6', section: 'Section A', points: 420, avatar: '👨‍🎓' },
  { id: 5, studentId: 'STU-2026-005', name: 'Emilio Aguinaldo', grade: 'Grade 5', section: 'Section B', points: 95, avatar: '👨‍🎓' }
];

// Mock rewards data
const mockRewards = [
  { id: 1, name: 'Biscuit', points: 10, stock: 45, category: 'Snacks' },
  { id: 2, name: 'Chocolate Bar', points: 25, stock: 30, category: 'Snacks' },
  { id: 3, name: 'Juice Box', points: 15, stock: 28, category: 'Beverages' },
  { id: 4, name: 'Pencil Set', points: 50, stock: 20, category: 'School Supplies' },
  { id: 5, name: 'Notebook', points: 75, stock: 15, category: 'School Supplies' },
  { id: 6, name: 'Eraser', points: 5, stock: 100, category: 'School Supplies' },
  { id: 7, name: 'Sticker Pack', points: 15, stock: 80, category: 'Toys' },
  { id: 8, name: 'Ballpen', points: 20, stock: 60, category: 'School Supplies' }
];

export default function RedemptionScanner() {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [student, setStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rewards] = useState(mockRewards);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Check for camera permissions on component mount
  useEffect(() => {
    checkCameraPermission();
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear();
      }
    };
  }, []);

  // Check camera permission
  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraError(false);
    } catch (err) {
      console.error('Camera permission error:', err);
      setCameraError(true);
    }
  };

  // Start QR Scanner
  const startScanner = async () => {
    // Check if camera is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera is not supported on this device');
      setCameraError(true);
      return;
    }

    try {
      // Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear();
      }
      
      setScanning(true);
      setCameraError(false);
      
      html5QrCodeRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButton: true,
          rememberLastUsedCamera: true
        },
        false
      );
      
      html5QrCodeRef.current.render(onScanSuccess, onScanError);
      toast.success('Camera started. Point at QR code.');
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(true);
      setScanning(false);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  // Stop QR Scanner
  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.clear();
      setScanning(false);
      toast.info('Scanner stopped');
    }
  };

  // Handle successful QR scan
  const onScanSuccess = (decodedText) => {
    stopScanner();
    const foundStudent = mockStudents.find(s => 
      s.studentId === decodedText || 
      s.studentId.toLowerCase() === decodedText.toLowerCase()
    );
    
    if (foundStudent) {
      setStudent(foundStudent);
      toast.success(`Student found: ${foundStudent.name}`);
    } else {
      toast.error('Student not found. Please check the QR code.');
    }
  };

  const onScanError = (error) => {
    console.warn('Scan error:', error);
  };

  // Manual search for student
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter student name or ID');
      return;
    }
    
    const foundStudent = mockStudents.find(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (foundStudent) {
      setStudent(foundStudent);
      toast.success(`Student found: ${foundStudent.name}`);
      setSearchQuery('');
    } else {
      toast.error('Student not found');
    }
  };

  // Select reward for redemption
  const handleSelectReward = (reward) => {
    if (reward.stock <= 0) {
      toast.error(`${reward.name} is out of stock!`);
      return;
    }
    
    if (student.points < reward.points) {
      toast.error(`Insufficient points! ${student.name} needs ${reward.points - student.points} more points.`);
      return;
    }
    
    setSelectedReward(reward);
    setShowConfirmation(true);
  };

  // Confirm redemption
  const handleConfirmRedemption = () => {
    if (!student || !selectedReward) return;
    
    // Update points and stock (mock update)
    const updatedStudent = { ...student, points: student.points - selectedReward.points };
    const updatedReward = { ...selectedReward, stock: selectedReward.stock - 1 };
    
    setStudent(updatedStudent);
    setRedemptionSuccess(true);
    
    toast.success(`${selectedReward.name} redeemed for ${student.name}!`);
    
    setTimeout(() => {
      setRedemptionSuccess(false);
      setShowConfirmation(false);
      setSelectedReward(null);
      setStudent(null);
    }, 3000);
  };

  // Cancel redemption
  const handleCancelRedemption = () => {
    setShowConfirmation(false);
    setSelectedReward(null);
  };

  // Clear student
  const handleClearStudent = () => {
    setStudent(null);
    setSelectedReward(null);
    setShowConfirmation(false);
    setRedemptionSuccess(false);
  };

  // Get stock status color
  const getStockStatus = (stock) => {
    if (stock <= 0) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
    if (stock < 10) return { text: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Redemption Scanner</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Scan student QR code or search manually to process reward redemption
        </p>
      </div>

      {/* Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Scanner */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <QrCode size={20} /> Scan QR Code
          </h3>
          
          {cameraError && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-l-4 border-yellow-500">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Camera Access Required</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    Please allow camera access to use the QR scanner. You can also search for students manually below.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {!scanning ? (
            <button
              onClick={startScanner}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-md"
            >
              <Camera size={20} /> Start Camera
            </button>
          ) : (
            <div>
              <div id="qr-reader" className="w-full"></div>
              <button
                onClick={stopScanner}
                className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
              >
                <StopCircle size={20} /> Stop Camera
              </button>
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Search size={18} /> Or Search Manually
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter student name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Student Info & Redemption */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          {student ? (
            <div>
              {/* Student Info */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-3xl">
                    {student.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{student.name}</h3>
                    <p className="text-sm text-gray-500">{student.grade} - {student.section}</p>
                    <p className="text-sm font-mono text-gray-400">{student.studentId}</p>
                  </div>
                </div>
                <button
                  onClick={handleClearStudent}
                  className="p-1 text-gray-400 hover:text-red-500 transition"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Points Display */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 mb-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-90">Available Points</p>
                    <p className="text-3xl font-bold">{student.points}</p>
                  </div>
                  <Star size={32} className="opacity-80" />
                </div>
              </div>
              
              {/* Redemption Success Animation */}
              {redemptionSuccess && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-sm">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Redemption Successful!</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {student.name} redeemed {selectedReward?.name} for {selectedReward?.points} points.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Remaining points: {student.points - (selectedReward?.points || 0)}</p>
                  </div>
                </div>
              )}
              
              {/* Rewards Grid */}
              {!showConfirmation && !redemptionSuccess && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Gift size={18} /> Select Reward
                  </h4>
                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {rewards.map((reward) => {
                      const stockStatus = getStockStatus(reward.stock);
                      const isDisabled = reward.stock <= 0 || student.points < reward.points;
                      return (
                        <button
                          key={reward.id}
                          onClick={() => handleSelectReward(reward)}
                          disabled={isDisabled}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            isDisabled
                              ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 dark:border-gray-700 hover:border-green-500 hover:shadow-md cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{reward.icon}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{reward.name}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-orange-600 dark:text-orange-400 font-semibold">{reward.points} pts</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Confirmation Modal */}
              {showConfirmation && selectedReward && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertCircle size={32} className="text-yellow-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Confirm Redemption</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Redeem {selectedReward.name} for {student.name}?
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Item:</span>
                        <span className="font-semibold">{selectedReward.name}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Points Required:</span>
                        <span className="font-semibold text-orange-600">{selectedReward.points} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Current Points:</span>
                        <span className="font-semibold text-green-600">{student.points} pts</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelRedemption}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmRedemption}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Scan a QR code or search for a student</p>
              <p className="text-sm text-gray-400 mt-2">Student information will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}