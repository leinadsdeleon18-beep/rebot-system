import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, Scan, Camera, StopCircle, Search, Star, Gift, 
  CheckCircle, AlertCircle, X, AlertTriangle, RefreshCw, 
  ShoppingBag, UserCheck, Award, Sparkles, TrendingUp,
  ChevronRight, Clock, Zap
} from 'lucide-react';
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
  const [successReward, setSuccessReward] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [recentRedemptions, setRecentRedemptions] = useState([]);
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  const categories = [
    { value: 'All', label: 'All' },
    { value: 'snack', label: 'Snacks' },
    { value: 'drinks', label: 'Drinks' },
    { value: 'school_supplies', label: 'School Supplies' },
    { value: 'toy', label: 'Toys' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchRewards();
    fetchRecentRedemptions();

    return () => {
      const scanner = scannerInstanceRef.current;
      scannerInstanceRef.current = null;
      if (scanner) {
        scanner.clear().catch((error) => console.warn('Unable to stop QR scanner:', error));
      }
    };
  }, []);

  const fetchRewards = async () => {
    setLoadingRewards(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/rewards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setRewards(data.rewards);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoadingRewards(false);
    }
  };

  const fetchRecentRedemptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/transactions?type=redeem&limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRecentRedemptions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching recent redemptions:', error);
    }
  };

  const fetchStudentById = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.student) {
        return {
          id: data.student._id,
          studentId: data.student.studentId,
          name: data.student.fullName,
          grade: data.student.grade || 'N/A',
          section: data.student.sectionName || 'N/A',
          points: data.student.points || 0,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching student:', error);
      return null;
    }
  };

  const fetchStudentByQR = async (qrCode) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/students/qr/${qrCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.student) {
        return {
          id: data.student._id,
          studentId: data.student.studentId,
          name: data.student.fullName,
          grade: data.student.grade || 'N/A',
          section: data.student.sectionName || 'N/A',
          points: data.student.points || 0,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching student by QR:', error);
      return null;
    }
  };

  const startScanner = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera is not supported on this device');
      setCameraError(true);
      return;
    }

    try {
      if (scannerInstanceRef.current) {
        await scannerInstanceRef.current.clear();
        scannerInstanceRef.current = null;
      }

      setScanning(true);
      setCameraError(false);

      const { Html5QrcodeScanner } = await import('html5-qrcode');
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          showTorchButton: true,
          rememberLastUsedCamera: true
        },
        false
      );

      scannerInstanceRef.current = scanner;
      scanner.render(onScanSuccess, onScanError);
      toast.success('Camera started. Scan student QR code.');
    } catch (err) {
      scannerInstanceRef.current = null;
      setCameraError(true);
      setScanning(false);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopScanner = async () => {
    const scanner = scannerInstanceRef.current;
    scannerInstanceRef.current = null;
    if (scanner) {
      try {
        await scanner.clear();
      } catch (error) {
        console.warn('Unable to stop QR scanner:', error);
      }
    }
    setScanning(false);
    toast('Scanner stopped');
  };

  const onScanSuccess = async (decodedText) => {
    await stopScanner();
    setLoading(true);
    try {
      const studentData = await fetchStudentByQR(decodedText);
      if (studentData) {
        setStudent(studentData);
        toast.success(`Welcome, ${studentData.name}!`);
      } else {
        toast.error('Student not found. Please check the QR code.');
      }
    } catch (error) {
      toast.error('Student not found. Please check the QR code.');
    } finally {
      setLoading(false);
    }
  };

  const onScanError = (error) => {
    if (!error?.includes('NotFoundException')) {
      console.warn('Scan error:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter student name or ID');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/students?search=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success && data.students && data.students.length > 0) {
        const match = data.students[0];
        const studentData = {
          id: match._id,
          studentId: match.studentId,
          name: match.fullName,
          grade: match.grade || 'N/A',
          section: match.sectionName || 'N/A',
          points: match.points || 0,
        };
        setStudent(studentData);
        toast.success(`Found: ${studentData.name}`);
        setSearchQuery('');
      } else {
        toast.error('Student not found');
      }
    } catch (error) {
      toast.error('Error searching for student');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReward = (reward) => {
    if (!student) {
      toast.error('Please scan or search for a student first');
      return;
    }
    if (reward.stock <= 0) {
      toast.error(`${reward.name} is out of stock!`);
      return;
    }
    if (student.points < reward.pointsRequired) {
      toast.error(`Insufficient points! Need ${reward.pointsRequired - student.points} more points.`);
      return;
    }
    setSelectedReward(reward);
    setShowConfirmation(true);
  };

  const handleConfirmRedemption = async () => {
    if (!student || !selectedReward) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/transactions/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: student.id,
          rewardId: selectedReward._id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newPoints = data.remainingPoints;
        setStudent({ ...student, points: newPoints });
        
        setRewards(rewards.map(r => 
          r._id === selectedReward._id ? { ...r, stock: r.stock - 1 } : r
        ));
        
        setSuccessReward(selectedReward);
        setRedemptionSuccess(true);
        toast.success(`${selectedReward.name} redeemed successfully!`);
        
        fetchRecentRedemptions();

        setTimeout(() => {
          setRedemptionSuccess(false);
          setShowConfirmation(false);
          setSelectedReward(null);
          setSuccessReward(null);
        }, 3000);
      } else {
        toast.error(data.message || 'Redemption failed');
      }
    } catch (error) {
      toast.error('Redemption failed');
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
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' };
    if (stock < 10) return { text: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const filteredRewards = rewards.filter(reward => {
    const matchesCategory = selectedCategory === 'All' || reward.category === selectedCategory;
    return matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Redemption Scanner
            </h1>
            <p className="text-gray-500 mt-1">
              Scan student QR code and redeem rewards
            </p>
          </div>
          <button
            onClick={fetchRewards}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 hover:bg-purple-700 transition shadow-md"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Rewards</p>
                <p className="text-2xl font-bold text-gray-800">{rewards.length}</p>
              </div>
              <Gift size={28} className="text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">In Stock Items</p>
                <p className="text-2xl font-bold text-gray-800">{rewards.filter(r => r.stock > 0).length}</p>
              </div>
              <ShoppingBag size={28} className="text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Today's Redemptions</p>
                <p className="text-2xl font-bold text-gray-800">{recentRedemptions.length}</p>
              </div>
              <TrendingUp size={28} className="text-orange-500" />
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN - Scanner & Student Info */}
          <div className="space-y-6">
            {/* Scanner Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <QrCode size={20} className="text-green-600" /> Scan QR Code
              </h3>

              {cameraError && (
                <div className="mb-4 p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Camera Access Required</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Please allow camera access or search manually below.
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
                  <button
                    onClick={stopScanner}
                    className="mt-4 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <StopCircle size={20} /> Stop Camera
                  </button>
                </div>
              )}
              <div id="qr-reader" className={`w-full rounded-lg overflow-hidden ${scanning ? 'mt-4' : 'hidden'}`} ref={scannerRef}></div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Search size={18} className="text-gray-400" /> Search Manually
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter student name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Student Info Card */}
            {student && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-green-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{student.name}</h3>
                    <p className="text-gray-500">{student.grade} - {student.section}</p>
                    <p className="text-xs text-gray-400 mt-1">ID: {student.studentId}</p>
                  </div>
                  <button
                    onClick={handleClearStudent}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Points Display */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-5 mb-4 text-white">
                  <p className="text-sm opacity-90">Available Points</p>
                  <p className="text-5xl font-bold">{student.points}</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Can Redeem</p>
                    <p className="text-xl font-bold text-green-600">
                      {rewards.filter(r => r.stock > 0 && r.pointsRequired <= student.points).length}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Need More Points</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {rewards.filter(r => r.stock > 0 && r.pointsRequired > student.points).length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && !student && (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading student information...</p>
              </div>
            )}

            {/* No Student Selected */}
            {!student && !loading && (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border-2 border-dashed border-gray-300">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No student selected</p>
                <p className="text-sm text-gray-400 mt-1">Scan a QR code or search for a student</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Available Rewards */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Gift size={20} className="text-purple-600" /> Available Rewards
              </h3>
              {student && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {student.name}
                </span>
              )}
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                    selectedCategory === cat.value
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Rewards Grid */}
            {loadingRewards ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3"></div>
                <p className="text-gray-500">Loading rewards...</p>
              </div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-12">
                <Gift size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No rewards available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
                {filteredRewards.map((reward) => {
                  const stockStatus = getStockStatus(reward.stock);
                  const canRedeem = student && reward.stock > 0 && student.points >= reward.pointsRequired;
                  const insufficientPoints = student && reward.stock > 0 && student.points < reward.pointsRequired;
                  const isOutOfStock = reward.stock <= 0;
                  
                  return (
                    <div
                      key={reward._id}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        canRedeem 
                          ? 'border-green-200 bg-white hover:shadow-md cursor-pointer' 
                          : insufficientPoints
                          ? 'border-yellow-200 bg-yellow-50/30 opacity-70 blur-[0.5px]'
                          : isOutOfStock
                          ? 'border-gray-200 bg-gray-50 opacity-60'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-800">{reward.name}</h4>
                            {canRedeem && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Available</span>
                            )}
                            {insufficientPoints && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Need More Points</span>
                            )}
                            {isOutOfStock && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Out of Stock</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{reward.description || 'No description'}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm font-bold text-orange-600">{reward.pointsRequired} points</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                              Stock: {reward.stock || 0}
                            </span>
                          </div>
                          
                          {/* Insufficient Points Message */}
                          {insufficientPoints && (
                            <div className="mt-2 text-sm text-yellow-700 bg-yellow-100 p-2 rounded-lg">
                              <AlertCircle size={14} className="inline mr-1" />
                              Needs {reward.pointsRequired - student.points} more points to redeem this reward
                            </div>
                          )}
                        </div>
                        
                        {canRedeem && (
                          <button
                            onClick={() => handleSelectReward(reward)}
                            className="ml-4 px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-md whitespace-nowrap"
                          >
                            Redeem <ChevronRight size={16} className="inline ml-1" />
                          </button>
                        )}
                        
                        {insufficientPoints && !canRedeem && (
                          <div className="ml-4 text-center">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Zap size={20} className="text-yellow-600" />
                            </div>
                            <p className="text-xs text-yellow-600 mt-1 font-medium">Locked</p>
                          </div>
                        )}
                        
                        {isOutOfStock && !canRedeem && (
                          <div className="ml-4 text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <AlertCircle size={20} className="text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Unavailable</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredRewards.length === 0 && !loadingRewards && (
              <div className="text-center py-12">
                <p className="text-gray-500">No rewards in this category</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Redemptions Section */}
        {recentRedemptions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" /> Recent Redemptions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentRedemptions.map((redemption, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{redemption.studentName}</p>
                    <p className="text-xs text-gray-500">{redemption.rewardName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-600">-{redemption.pointsSpent} pts</p>
                    <p className="text-xs text-gray-400">{new Date(redemption.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && selectedReward && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={28} className="text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Confirm Redemption</h3>
                <p className="text-gray-600 mt-2">
                  Redeem <strong className="text-green-600">{selectedReward.name}</strong> for <strong>{student?.name}</strong>?
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Points Required:</span>
                  <span className="font-semibold text-orange-600">{selectedReward.pointsRequired} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Points:</span>
                  <span className="font-semibold text-green-600">{student?.points} pts</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Points After:</span>
                  <span className="font-semibold text-blue-600">
                    {student?.points - selectedReward.pointsRequired} pts
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelRedemption}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRedemption}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 shadow-md"
                >
                  {loading ? 'Processing...' : 'Confirm Redemption'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {redemptionSuccess && successReward && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Success!</h3>
              <p className="text-gray-600">
                {student?.name} redeemed <strong className="text-green-600">{successReward.name}</strong>!
              </p>
              <p className="text-sm text-green-600 mt-3">Remaining points: {student?.points}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}