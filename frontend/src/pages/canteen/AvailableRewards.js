import React, { useState } from 'react';
import { 
  Gift, 
  Search, 
  Plus, 
  Minus,
  ShoppingCart,
  Star,
  AlertCircle,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock rewards data
const mockRewards = [
  { id: 1, name: 'Biscuit', points: 10, stock: 45, category: 'Snacks', description: 'Delicious biscuit snack' },
  { id: 2, name: 'Chocolate Bar', points: 25, stock: 30, category: 'Snacks', description: 'Milk chocolate bar' },
  { id: 3, name: 'Juice Box', points: 15, stock: 28, category: 'Beverages', description: 'Fruit juice drink' },
  { id: 4, name: 'Pencil Set', points: 50, stock: 20, category: 'School Supplies', description: 'Set of 3 pencils' },
  { id: 5, name: 'Notebook', points: 75, stock: 15, category: 'School Supplies', description: 'Writing notebook' },
  { id: 6, name: 'Eraser', points: 5, stock: 100, category: 'School Supplies', description: 'White eraser' },
  { id: 7, name: 'Sticker Pack', points: 15, stock: 80, category: 'Toys', description: 'Assorted stickers' },
  { id: 8, name: 'Ballpen', points: 20, stock: 60, category: 'School Supplies', description: 'Blue ballpen' }
];

const categories = ['All', 'Snacks', 'Beverages', 'School Supplies', 'Toys'];

export default function AvailableRewards() {
  const [rewards, setRewards] = useState(mockRewards);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedReward, setSelectedReward] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [showRestockModal, setShowRestockModal] = useState(false);

  // Filter rewards
  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get stock status
  const getStockStatus = (stock) => {
    if (stock <= 0) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: '🔴' };
    if (stock < 10) return { text: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: '⚠️' };
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: '✅' };
  };

  // Handle restock
  const handleRestock = () => {
    if (!restockAmount || restockAmount <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    setRewards(rewards.map(r => 
      r.id === selectedReward.id 
        ? { ...r, stock: r.stock + parseInt(restockAmount) }
        : r
    ));
    
    toast.success(`Added ${restockAmount} ${selectedReward.name}(s) to stock`);
    setShowRestockModal(false);
    setSelectedReward(null);
    setRestockAmount('');
  };

  // Total stock count
  const totalStock = rewards.reduce((sum, r) => sum + r.stock, 0);
  const lowStockItems = rewards.filter(r => r.stock < 10).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Available Rewards</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View all available rewards and manage stock</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-green-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Items</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{rewards.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-blue-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Stock</p>
          <p className="text-2xl font-bold text-blue-600">{totalStock}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-yellow-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Low Stock Items</p>
          <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
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
        <div className="flex gap-2 flex-wrap">
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
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRewards.map((reward) => {
          const stockStatus = getStockStatus(reward.stock);
          return (
            <div key={reward.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="p-6 text-center">
                <span className="text-5xl">{reward.icon}</span>
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mt-3">{reward.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{reward.description}</p>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{reward.points}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{reward.stock}</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Restock {selectedReward.name}</h3>
              <button onClick={() => setShowRestockModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-4xl">{selectedReward.icon}</span>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Current Stock: <span className="font-bold text-green-600">{selectedReward.stock}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity to Add</label>
                <input
                  type="number"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="Enter quantity"
                  min="1"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRestockModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestock}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
                >
                  Add Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}