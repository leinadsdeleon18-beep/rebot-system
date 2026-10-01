import React, { useState, useEffect } from 'react';
import { Gift, Package, AlertTriangle, ShoppingBag, Edit2, Plus, RefreshCw, X, Coffee, Utensils, Book, Gamepad, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiUrl } from '../../services/apiService';

const categories = [
  { value: 'snacks', label: 'Snacks', icon: Coffee, color: 'bg-orange-100 text-orange-700' },
  { value: 'drinks', label: 'Beverages', icon: Utensils, color: 'bg-blue-100 text-blue-700' },
  { value: 'school_supplies', label: 'School Supplies', icon: Book, color: 'bg-purple-100 text-purple-700' },
  { value: 'toys', label: 'Toys', icon: Gamepad, color: 'bg-pink-100 text-pink-700' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' }
];

export default function AvailableRewards() {
  const [rewards, setRewards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedReward, setSelectedReward] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditPointsModal, setShowEditPointsModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [editingPoints, setEditingPoints] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'snacks',
    pointsRequired: '',
    stock: '',
    image: ''
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/rewards'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setRewards(data.rewards);
      } else {
        toast.error(data.message || 'Failed to load rewards');
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReward = async () => {
    if (!formData.name || !formData.pointsRequired) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/rewards'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          pointsRequired: parseInt(formData.pointsRequired),
          stock: parseInt(formData.stock) || 0
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${formData.name} added successfully!`);
        setShowAddModal(false);
        setFormData({
          name: '',
          description: '',
          category: 'snacks',
          pointsRequired: '',
          stock: '',
          image: ''
        });
        fetchRewards();
      } else {
        toast.error(data.message || 'Failed to add reward');
      }
    } catch (error) {
      console.error('Add reward error:', error);
      toast.error('Failed to add reward');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPoints = async () => {
    if (!editingReward || !editingPoints) {
      toast.error('Please enter valid points');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/rewards/${editingReward._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pointsRequired: parseInt(editingPoints)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Points updated to ${editingPoints} for ${editingReward.name}`);
        setShowEditPointsModal(false);
        setEditingReward(null);
        setEditingPoints('');
        fetchRewards();
      } else {
        toast.error(data.message || 'Failed to update points');
      }
    } catch (error) {
      console.error('Edit points error:', error);
      toast.error('Failed to update points');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestock = async () => {
    if (!restockAmount || restockAmount <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const newStock = (selectedReward.stock || 0) + parseInt(restockAmount);
      
      const response = await fetch(apiUrl(`/rewards/${selectedReward._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock: newStock })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Added ${restockAmount} ${selectedReward.name}(s) to stock`);
        fetchRewards();
        setShowRestockModal(false);
        setSelectedReward(null);
        setRestockAmount('');
      } else {
        toast.error(data.message || 'Failed to restock');
      }
    } catch (error) {
      console.error('Restock error:', error);
      toast.error('Failed to restock');
    }
  };

  const openEditPointsModal = (reward) => {
    setEditingReward(reward);
    setEditingPoints(reward.pointsRequired.toString());
    setShowEditPointsModal(true);
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      category: 'snacks',
      pointsRequired: '',
      stock: '',
      image: ''
    });
    setShowAddModal(true);
  };

  const getCategoryStyle = (category) => {
    const found = categories.find(c => c.value === category);
    return found || categories[0];
  };

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalStock = rewards.reduce((sum, r) => sum + (r.stock || 0), 0);
  const lowStockItems = rewards.filter(r => (r.stock || 0) < 10 && (r.stock || 0) > 0).length;
  const outOfStockItems = rewards.filter(r => (r.stock || 0) === 0).length;

  const getStockStatus = (stock) => {
    if (stock <= 0) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100', borderColor: 'border-red-200' };
    if (stock < 10) return { text: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100', borderColor: 'border-yellow-200' };
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100', borderColor: 'border-green-200' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Available Rewards</h1>
            <p className="text-gray-500 mt-1">Manage and monitor your reward inventory</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchRewards}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-sm flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
            <button 
              onClick={openAddModal}
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition shadow-md font-medium flex items-center gap-2"
            >
              <Plus size={18} /> Add New Reward
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Items</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{rewards.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Gift size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Stock</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{totalStock}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Package size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Low Stock</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{lowStockItems}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Out of Stock</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{outOfStockItems}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <ShoppingBag size={24} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search rewards by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === 'All'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Items
              </button>
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === category.value
                      ? `${category.color} shadow-md`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rewards Grid - NO ICONS ON CARDS */}
        {filteredRewards.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <p className="text-gray-500 text-lg">No rewards found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            <button
              onClick={openAddModal}
              className="mt-6 px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition font-medium flex items-center gap-2 mx-auto"
            >
              <Plus size={18} /> Add Your First Reward
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRewards.map((reward) => {
              const stockStatus = getStockStatus(reward.stock || 0);
              const categoryStyle = getCategoryStyle(reward.category);
              const isOutOfStock = reward.stock <= 0;
              
              return (
                <div 
                  key={reward._id} 
                  className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border ${
                    isOutOfStock ? 'border-red-200 opacity-60' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="relative p-6">
                    {/* Category Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${categoryStyle.color}`}>
                        {categoryStyle.label}
                      </span>
                    </div>
                    
                    {/* Edit Points Button */}
                    <div className="absolute top-4 left-4">
                      <button
                        onClick={() => openEditPointsModal(reward)}
                        className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition"
                        title="Edit Points"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                    
                    {/* Reward Content - NO ICON HERE */}
                    <div className="text-center mt-12">
                      <h3 className="font-bold text-xl text-gray-800 mb-1">{reward.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                        {reward.description || 'No description available'}
                      </p>
                      
                      {/* Stats */}
                      <div className="mt-4 flex items-center justify-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{reward.pointsRequired}</p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${reward.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {reward.stock || 0}
                          </p>
                          <p className="text-xs text-gray-500">stock</p>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="mt-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </div>
                      
                      {/* Restock Button */}
                      <button
                        onClick={() => {
                          if (!isOutOfStock) {
                            setSelectedReward(reward);
                            setShowRestockModal(true);
                          }
                        }}
                        disabled={isOutOfStock}
                        className={`mt-5 w-full py-2.5 rounded-xl font-medium transition ${
                          isOutOfStock
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : 'Restock Item'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Reward Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-2xl font-bold text-gray-800">Add New Reward</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reward Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Chocolate Bar"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="3"
                  placeholder="Describe the reward..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Points Required *</label>
                <input
                  type="number"
                  value={formData.pointsRequired}
                  onChange={(e) => setFormData({...formData, pointsRequired: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 50"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Initial Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 10"
                  min="0"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleAddReward} disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? 'Adding...' : 'Add Reward'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Points Modal */}
      {showEditPointsModal && editingReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-2xl font-bold text-gray-800">Edit Points</h3>
              <button onClick={() => setShowEditPointsModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-gray-600">Reward</p>
                <p className="text-xl font-bold text-gray-800">{editingReward.name}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Current Points</label>
                <p className="text-2xl font-bold text-orange-600 mb-3">{editingReward.pointsRequired}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">New Points Required *</label>
                <input
                  type="number"
                  value={editingPoints}
                  onChange={(e) => setEditingPoints(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter new points"
                  min="1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowEditPointsModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleEditPoints} disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50">
                  {isSubmitting ? 'Updating...' : 'Update Points'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-2xl font-bold text-gray-800">Restock {selectedReward.name}</h3>
              <button onClick={() => setShowRestockModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-gray-600">Current Stock</p>
                <p className="text-3xl font-bold text-green-600">{selectedReward.stock || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity to Add</label>
                <input
                  type="number"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter quantity"
                  min="1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowRestockModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleRestock} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition">
                  Add Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}