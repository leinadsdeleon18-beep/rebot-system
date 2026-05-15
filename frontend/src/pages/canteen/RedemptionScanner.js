import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Scan, Camera, StopCircle, Search, User, Star, Gift, CheckCircle, AlertCircle, X, AlertTriangle } from 'lucide-react';
import { studentsAPI, rewardsAPI } from '../../services/apiService';
import toast from 'react-hot-toast';

export default function RedemptionScanner() {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [student, setStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rewards, setRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    fetchRewards();
    checkCameraPermission();
    
    return () => {
      if (scannerInstance) {
        scannerInstance.clear();
      }
    };
  }, []);

  const fetchRewards = async () => {
    try {
      const response = await rewardsAPI.getAll();
      if (response.data.success) {
        setRewards(response.data.rewards);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    }
  };

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

  const startScanner = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera is not supported on this device');
      setCameraError(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      if (scannerInstance) {
        scannerInstance.clear();
      }
      
      setScanning(true);
      setCameraError(false);
      
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      const scanner = new Html5QrcodeScanner(
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
      
      setScannerInstance(scanner);
      scanner.render(onScanSuccess, onScanError);
      toast.success('Camera started. Point at QR code.');
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(true);
      setScanning(false);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopScanner = () => {
    if (scannerInstance) {
      scannerInstance.clear();
      setScannerInstance(null);
      setScanning(false);
      toast.info('Scanner stopped');
    }
  };

  const onScanSuccess = async (decodedText) => {
    stopScanner();
    setLoading(true);
    try {
      const response = await studentsAPI.getByQR(decodedText);
      if (response.data.success) {
        const studentData = response.data.student;
        setStudent({
          id: studentData._id,
          studentId: studentData.studentId,
          name: studentData.fullName,
          grade: studentData.section?.gradeLevel || 'N/A',
          section: studentData.section?.sectionName || 'N/A',
          points: studentData.points,
          avatar: '👨‍🎓'
        });
        toast.success(`Student found: ${studentData.fullName}`);
      } else {
        toast.error('Student not found');
      }
    } catch (error) {
      console.error('Error finding student:', error);
      toast.error('Student not found. Please check the QR code.');
    } finally {
      setLoading(false);
    }
  };

  const onScanError = (error) => {
    console.warn('Scan error:', error);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter student name or ID');
      return;
    }
    
    setLoading(true);
    try {
      const response = await studentsAPI.getAll({ search: searchQuery });
      if (response.data.success && response.data.students.length > 0) {
        const foundStudent = response.data.students[0];
        setStudent({
          id: foundStudent._id,
          studentId: foundStudent.studentId,
          name: foundStudent.fullName,
          grade: foundStudent.section?.gradeLevel || 'N/A',
          section: foundStudent.section?.sectionName || 'N/A',
          points: foundStudent.points,
          avatar: '👨‍🎓'
        });
        toast.success(`Student found: ${foundStudent.fullName}`);
        setSearchQuery('');
      } else {
        toast.error('Student not found');
      }
    } catch (error) {
      console.error('Error searching for student:', error);
      toast.error('Error searching for student');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReward = (reward) => {
    if (reward.stock <= 0) {
      toast.error(`${reward.name} is out of stock!`);
      return;
    }
    if (student.points < reward.pointsRequired) {
      toast.error(`Insufficient points! ${student.name} needs ${reward.pointsRequired - student.points} more points.`);
      return;
    }
    setSelectedReward(reward);
    setShowConfirmation(true);
  };

  const handleConfirmRedemption = async () => {
    if (!student || !selectedReward) return;
    
    setLoading(true);
    try {
      const response = await rewardsAPI.redeem(student.id, selectedReward._id, 1);
      if (response.data.success) {
        setStudent({ ...student, points: response.data.remainingPoints });
        setRedemptionSuccess(true);
        toast.success(`${selectedReward.name} redeemed for ${student.name}!`);
        
        // Refresh rewards to update stock
        await fetchRewards();
        
        setTimeout(() => {
          setRedemptionSuccess(false);
          setShowConfirmation(false);
          setSelectedReward(null);
          // Don't clear student automatically - let staff clear manually
        }, 3000);
      }
    } catch (error) {
      console.error('Redemption error:', error);
      toast.error(error.response?.data?.message || 'Redemption failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRedemption = () => {
    setShowConfirmation(false);
    setSelectedReward(null);
  };

  const handleClearStudent = () => {
    setStudent(null);
    setSelectedReward(null);
    setShowConfirmation(false);
    setRedemptionSuccess(false);
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' };
    if (stock < 10) return { text: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Redemption Scanner</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Scan student QR code or search manually to process reward redemption</p>
      </div>

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
                    Please allow camera access or search manually below.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {!scanning ? (
            <button 
              onClick={startScanner} 
              disabled={cameraError}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={20} /> Start Camera
            </button>
          ) : (
            <div>
              <div id="qr-reader" className="w-full" ref={scannerRef}></div>
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
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Student Info & Redemption */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : student ? (
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
                  title="Clear Student"
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
              {redemptionSuccess && selectedReward && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-sm animate-modalUp">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Redemption Successful!</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {student.name} redeemed {selectedReward.name}!
                    </p>
                    <p className="text-sm text-green-600 mt-2">Remaining points: {student.points}</p>
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
                      const isDisabled = reward.stock <= 0 || student.points < reward.pointsRequired;
                      return (
                        <button
                          key={reward._id}
                          onClick={() => handleSelectReward(reward)}
                          disabled={isDisabled}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            isDisabled 
                              ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-green-500 hover:shadow-md cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{reward.name}</span>
                            <span className="text-2xl">🎁</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-orange-600 dark:text-orange-400 font-semibold">{reward.pointsRequired} pts</span>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                        <span className="text-gray-600 dark:text-gray-400">Points Required:</span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">{selectedReward.pointsRequired} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Current Points:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{student.points} pts</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleCancelRedemption} 
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
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

      <style>{`
        @keyframes modalUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-modalUp {
          animation: modalUp 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}