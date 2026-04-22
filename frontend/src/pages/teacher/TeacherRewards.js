import React, { useState } from 'react';
import { 
  Gift, 
  Search, 
  Star, 
  TrendingUp,
  Award,
  Coffee,
  Apple,
  Book,
  PenTool
} from 'lucide-react';
import toast from 'react-hot-toast';

const mockRewards = [
  { id: 1, name: 'Biscuit', points: 10, stock: 45, icon: '🍪', category: 'Snacks', popularity: 92 },
  { id: 2, name: 'Chocolate Bar', points: 25, stock: 30, icon: '🍫', category: 'Snacks', popularity: 88 },
  { id: 3, name: 'Juice Box', points: 15, stock: 28, icon: '🧃', category: 'Beverages', popularity: 85 },
  { id: 4, name: 'Pencil Set', points: 50, stock: 20, icon: '✏️', category: 'School Supplies', popularity: 76 },
  { id: 5, name: 'Notebook', points: 75, stock: 15, icon: '📓', category: 'School Supplies', popularity: 82 },
  { id: 6, name: 'Eraser', points: 5, stock: 100, icon: '🧽', category: 'School Supplies', popularity: 95 },
  { id: 7, name: 'Sticker Pack', points: 15, stock: 80, icon: '🌟', category: 'Toys', popularity: 91 },
  { id: 8, name: 'Ballpen', points: 20, stock: 60, icon: '✒️', category: 'School Supplies', popularity: 88 }
];

const mockStudents = [
  { id: 1, name: 'Juan Dela Cruz', points: 245 },
  { id: 2, name: 'Maria Santos', points: 310 },
  { id: 3, name: 'Jose Rizal', points: 178 },
  { id: 4, name: 'Andres Bonifacio', points: 420 },
  { id: 5, name: 'Emilio Aguinaldo', points: 95 }
];

export default function TeacherRewards() {
  const [rewards] = useState(mockRewards);
  const [students] = useState(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  const categories = ['all', 'Snacks', 'Beverages', 'School Supplies', 'Toys'];

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRedeem = () => {
    if (!selectedStudent || !selectedReward) {
      toast.error('Please select a student and reward');
      return;
    }
    if (selectedStudent.points < selectedReward.points) {
      toast.error(`Insufficient points! ${selectedStudent.name} needs ${selectedReward.points - selectedStudent.points} more points.`);
      return;
    }
    if (selectedReward.stock <= 0) {
      toast.error(`${selectedReward.name} is out of stock!`);
      return;
    }
    toast.success(`Successfully redeemed ${selectedReward.name} for ${selectedStudent.name}!`);
    setShowRedeemModal(false);
    setSelectedStudent(null);
    setSelectedReward(null);
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Snacks': return <Coffee size={16} />;
      case 'Beverages': return <Apple size={16} />;
      case 'School Supplies': return <Book size={16} />;
      default: return <Gift size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Rewards Redemption</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Help students redeem their earned points for rewards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Gift size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Rewards</p>
              <p className="text-xl font-bold">{rewards.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <Star size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Most Popular</p>
              <p className="text-xl font-bold">Eraser</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Avg. Redemption</p>
              <p className="text-xl font-bold">28 pts</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Award size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Top Student</p>
              <p className="text-xl font-bold">Andres B.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search rewards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === category
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRewards.map((reward) => (
          <div key={reward.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <div className="text-center">
              <span className="text-5xl">{reward.icon}</span>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-3">{reward.name}</h3>
              <p className="text-sm text-gray-500">{reward.category}</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{reward.points}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{reward.stock}</p>
                  <p className="text-xs text-gray-500">in stock</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm text-gray-600">{reward.popularity}% popularity</span>
              </div>
              <button
                onClick={() => {
                  setSelectedReward(reward);
                  setShowRedeemModal(true);
                }}
                className="mt-4 w-full py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Redeem for Student
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Redeem Reward</h3>
              <button onClick={() => setShowRedeemModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Student</label>
                <select
                  value={selectedStudent?.id || ''}
                  onChange={(e) => setSelectedStudent(students.find(s => s.id === parseInt(e.target.value)))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                >
                  <option value="">Choose a student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.name} ({student.points} pts)</option>
                  ))}
                </select>
              </div>
              {selectedReward && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                  <span className="text-3xl">{selectedReward.icon}</span>
                  <p className="font-semibold mt-1">{selectedReward.name}</p>
                  <p className="text-sm text-gray-500">{selectedReward.points} points required</p>
                </div>
              )}
              {selectedStudent && selectedReward && (
                <div className={`p-3 rounded-xl text-center ${
                  selectedStudent.points >= selectedReward.points
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700'
                }`}>
                  {selectedStudent.points >= selectedReward.points
                    ? `✅ ${selectedStudent.name} has enough points!`
                    : `❌ ${selectedStudent.name} needs ${selectedReward.points - selectedStudent.points} more points`}
                </div>
              )}
              <button
                onClick={handleRedeem}
                disabled={!selectedStudent || !selectedReward || selectedStudent?.points < selectedReward?.points}
                className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Redemption
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}