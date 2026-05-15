import React, { useState, useEffect } from 'react';
import { Gift, Search, Plus, Star, AlertCircle } from 'lucide-react';
import { rewardsAPI } from '../../services/apiService';
import toast from 'react-hot-toast';

const categories = ['All', 'snacks', 'drinks', 'school_supplies', 'other'];

export default function AvailableRewards() {
  const [rewards, setRewards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedReward, setSelectedReward] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const response = await rewardsAPI.getAll();
      if (response.data.success) {
        setRewards(response.data.rewards);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async () => {
    if (!restockAmount || restockAmount <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    try {
      const newStock = selectedReward.stock + parseInt(restockAmount);
      const response = await rewardsAPI.updateInventory(selectedReward._id, newStock);
      if (response.data.success) {
        toast.success(`Added ${restockAmount} ${selectedReward.name}(s) to stock`);
        fetchRewards();
        setShowRestockModal(false);
        setSelectedReward(null);
        setRestockAmount('');
      }
    } catch (error) {
      toast.error('Failed to restock');
    }
  };

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryLabel = selectedCategory === 'All' ? 'All' : 
      selectedCategory === 'snacks' ? 'Snacks' :
      selectedCategory === 'drinks' ? 'Beverages' :
      selectedCategory === 'school_supplies' ? 'School Supplies' : 'Other';
    const matchesCategory = selectedCategory === 'All' || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalStock = rewards.reduce((sum, r) => sum + (r.stock || 0), 0);
  const lowStockItems = rewards.filter(r => (r.stock || 0) < 10).length;

  const getStockStatus = (stock) => {
    if (stock <= 0) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100', icon: '🔴' };
    if (stock < 10) return { text: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⚠️' };
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100', icon: '✅' };
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Available Rewards</h1>
        <p className="text-gray-500 mt-1">View all available rewards and manage stock</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-600">
          <p className="text-gray-500 text-sm">Total Items</p>
          <p className="text-2xl font-bold">{rewards.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-600">
          <p className="text-gray-500 text-sm">Total Stock</p>
          <p className="text-2xl font-bold text-blue-600">{totalStock}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-600">
          <p className="text-gray-500 text-sm">Low Stock Items</p>
          <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search rewards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === category
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'All' ? 'All' : 
               category === 'snacks' ? 'Snacks' :
               category === 'drinks' ? 'Beverages' :
               category === 'school_supplies' ? 'School Supplies' : 'Other'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRewards.map((reward) => {
          const stockStatus = getStockStatus(reward.stock || 0);
          return (
            <div key={reward._id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition border border-gray-100">
              <div className="text-center">
                <span className="text-5xl">🎁</span>
                <h3 className="font-bold text-gray-800 mt-3">{reward.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{reward.description || 'No description'}</p>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{reward.pointsRequired}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{reward.stock || 0}</p>
                    <p className="text-xs text-gray-500">in stock</p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                    <span>{stockStatus.icon}</span> {stockStatus.text}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedReward(reward);
                    setShowRestockModal(true);
                  }}
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Restock
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Restock Modal */}
      {showRestockModal && selectedReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Restock {selectedReward.name}</h3>
              <button onClick={() => setShowRestockModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600">Current Stock: <span className="font-bold text-green-600">{selectedReward.stock || 0}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add</label>
                <input
                  type="number"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="Enter quantity"
                  min="1"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRestockModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleRestock} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition">Add Stock</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}