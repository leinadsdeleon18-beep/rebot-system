import React, { useState, useEffect } from 'react';
import { Gift, Search, Star, TrendingUp, Award, Coffee, Apple, Book } from 'lucide-react';
import { rewardsAPI, studentsAPI } from '../../services/apiService';
import toast from 'react-hot-toast';

export default function TeacherRewards() {
  const [rewards, setRewards] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = ['all', 'snacks', 'drinks', 'school_supplies', 'other'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rewardsRes, studentsRes] = await Promise.all([
        rewardsAPI.getAll(),
        studentsAPI.getAll({ limit: 50 })
      ]);

      if (rewardsRes.data.success) {
        setRewards(rewardsRes.data.rewards);
      }
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.students.map(s => ({ id: s._id, name: s.fullName, points: s.points })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!selectedStudent || !selectedReward) {
      toast.error('Please select a student and reward');
      return;
    }
    if (selectedStudent.points < selectedReward.pointsRequired) {
      toast.error(`Insufficient points! ${selectedStudent.name} needs ${selectedReward.pointsRequired - selectedStudent.points} more points.`);
      return;
    }
    if (selectedReward.stock <= 0) {
      toast.error(`${selectedReward.name} is out of stock!`);
      return;
    }

    try {
      const response = await rewardsAPI.redeem(selectedStudent.id, selectedReward._id, 1);
      if (response.data.success) {
        toast.success(`Successfully redeemed ${selectedReward.name} for ${selectedStudent.name}!`);
        setShowRedeemModal(false);
        setSelectedStudent(null);
        setSelectedReward(null);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Redemption failed');
    }
  };

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'snacks': return <Coffee size={16} />;
      case 'drinks': return <Apple size={16} />;
      case 'school_supplies': return <Book size={16} />;
      default: return <Gift size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Rewards Redemption</h1><p className="text-gray-500 mt-1">Help students redeem their earned points for rewards</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><Gift size={20} className="text-green-600" /></div><div><p className="text-gray-500 text-sm">Total Rewards</p><p className="text-xl font-bold">{rewards.length}</p></div></div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"><Star size={20} className="text-orange-600" /></div><div><p className="text-gray-500 text-sm">Most Popular</p><p className="text-xl font-bold">{rewards.sort((a,b) => (b.stock || 0) - (a.stock || 0))[0]?.name || 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><TrendingUp size={20} className="text-blue-600" /></div><div><p className="text-gray-500 text-sm">Avg. Redemption</p><p className="text-xl font-bold">25 pts</p></div></div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><Award size={20} className="text-purple-600" /></div><div><p className="text-gray-500 text-sm">Top Student</p><p className="text-xl font-bold">{students.sort((a,b) => b.points - a.points)[0]?.name || 'N/A'}</p></div></div></div>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search rewards..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl" /></div>
        <div className="flex gap-2">{categories.map(category => (<button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategory === category ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{category === 'all' ? 'All' : category === 'snacks' ? 'Snacks' : category === 'drinks' ? 'Beverages' : category === 'school_supplies' ? 'School Supplies' : 'Other'}</button>))}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRewards.map((reward) => (
          <div key={reward._id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <div className="text-center">
              <span className="text-5xl">🎁</span>
              <h3 className="font-semibold text-gray-800 mt-3">{reward.name}</h3>
              <p className="text-sm text-gray-500">{reward.category}</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="text-center"><p className="text-2xl font-bold text-green-600">{reward.pointsRequired}</p><p className="text-xs text-gray-500">points</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-orange-600">{reward.stock || 0}</p><p className="text-xs text-gray-500">in stock</p></div>
              </div>
              <button onClick={() => { setSelectedReward(reward); setShowRedeemModal(true); }} className="mt-4 w-full py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition">Redeem for Student</button>
            </div>
          </div>
        ))}
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Redeem Reward</h3><button onClick={() => setShowRedeemModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Select Student</label><select value={selectedStudent?.id || ''} onChange={(e) => setSelectedStudent(students.find(s => s.id === e.target.value))} className="w-full px-4 py-2 border rounded-xl"><option value="">Choose a student...</option>{students.map(student => (<option key={student.id} value={student.id}>{student.name} ({student.points} pts)</option>))}</select></div>
              {selectedReward && (<div className="bg-gray-50 rounded-xl p-4 text-center"><p className="font-semibold">{selectedReward.name}</p><p className="text-sm text-gray-500">{selectedReward.pointsRequired} points required</p></div>)}
              {selectedStudent && selectedReward && (<div className={`p-3 rounded-xl text-center ${selectedStudent.points >= selectedReward.pointsRequired ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{selectedStudent.points >= selectedReward.pointsRequired ? `✅ ${selectedStudent.name} has enough points!` : `❌ ${selectedStudent.name} needs ${selectedReward.pointsRequired - selectedStudent.points} more points`}</div>)}
              <button onClick={handleRedeem} disabled={!selectedStudent || !selectedReward || selectedStudent?.points < selectedReward?.pointsRequired} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50">Confirm Redemption</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}