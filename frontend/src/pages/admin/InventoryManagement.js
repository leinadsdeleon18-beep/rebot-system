import React, { useState, useEffect } from 'react';
import { Package, Star, ShoppingBag, Search, RefreshCw } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { statsAPI, rewardsAPI } from '../../services/apiService';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function InventoryManagement() {
  const [stats, setStats] = useState({
    totalBottles: 0,
    totalPoints: 0,
    totalStudents: 0,
    totalRedemptions: 0,
    lowStockItems: 0,
    pendingOrders: 0
  });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      // Get system stats
      const statsRes = await statsAPI.getSystemStats();
      console.log('Inventory stats response:', statsRes?.data);

      if (statsRes?.data?.success) {
        const s = statsRes.data.stats ?? statsRes.data;
        setStats({
          totalStudents:    s.totalStudents    || 0,
          totalBottles:     s.totalBottles     || 0,
          totalPoints:      s.totalPoints      || 0,
          totalRedemptions: s.totalRedemptions || 0,
          lowStockItems:    s.lowStockItems    || 0,
          pendingOrders:    s.pendingOrders    || 0
        });
      } else {
        console.warn('Stats API returned success: false', statsRes?.data);
      }

      // Fetch inventory items from rewards
      const rewardsRes = await rewardsAPI.getRewards();
      if (rewardsRes?.data?.success) {
        const items = rewardsRes.data.rewards.map(reward => ({
          id: reward._id,
          name: reward.name,
          category: reward.category || 'General',
          stock: reward.stock || 0,
          pointsRequired: reward.pointsRequired,
          image: reward.image || null,
          status: (reward.stock || 0) > 0 ? 'In Stock' : 'Out of Stock',
          statusColor: (reward.stock || 0) > 10 ? 'green' : (reward.stock || 0) > 0 ? 'yellow' : 'red'
        }));
        setInventoryItems(items);
      }

    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInventoryData();
    toast.success('Inventory refreshed!');
  };

  // Filter inventory items
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ['all', ...new Set(inventoryItems.map(item => item.category))];

  // Inventory stock data for chart
  const stockData = {
    labels: inventoryItems.slice(0, 10).map(item => item.name.length > 15 ? item.name.slice(0, 12) + '...' : item.name),
    datasets: [
      {
        label: 'Current Stock',
        data: inventoryItems.slice(0, 10).map(item => item.stock),
        backgroundColor: (context) => {
          const value = context.raw;
          if (value === 0) return '#ef4444';
          if (value < 10) return '#f59e0b';
          return '#22c55e';
        },
        borderRadius: 8,
        borderWidth: 0
      },
      {
        label: 'Points Required',
        data: inventoryItems.slice(0, 10).map(item => item.pointsRequired),
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      tooltip: { 
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            label += context.raw.toLocaleString();
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity / Points',
          font: { size: 12 }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Items',
          font: { size: 12 }
        }
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{(value || 0).toLocaleString()}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue} from last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );

  const getStatusBadge = (status, statusColor) => {
    const colors = {
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[statusColor] || colors.green;
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
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Inventory Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage reward items, track stock levels, and monitor inventory
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 hover:bg-purple-700 transition shadow-sm"
        >
          <RefreshCw size={18} /> Refresh Inventory
        </button>
      </div>

      {/* Stats Cards - Only inventory related stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Items" 
          value={inventoryItems.length} 
          icon={Package} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="Total Stock" 
          value={inventoryItems.reduce((sum, item) => sum + (item.stock || 0), 0)} 
          icon={Package} 
          color="bg-green-600" 
        />
        <StatCard 
          title="Low Stock Items" 
          value={inventoryItems.filter(item => item.stock > 0 && item.stock < 10).length} 
          icon={ShoppingBag} 
          color="bg-orange-500" 
          trend="down"
          trendValue="2"
        />
        <StatCard 
          title="Out of Stock" 
          value={inventoryItems.filter(item => item.stock === 0).length} 
          icon={ShoppingBag} 
          color="bg-red-600" 
          trend="up"
          trendValue="1"
        />
      </div>

      {/* Inventory Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Inventory Stock Levels</h3>
        <div className="h-96">
          {inventoryItems.length > 0 ? (
            <Bar data={stockData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No inventory items available
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          Green: Healthy stock (&gt;10) | Yellow: Low stock (1-10) | Red: Out of stock (0)
        </p>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Inventory Items</h3>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm w-64 focus:outline-none focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No inventory items found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points Required</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-semibold ${
                        item.stock === 0 ? 'text-red-600' : 
                        item.stock < 10 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {item.pointsRequired} pts
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status, item.statusColor)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition"
                        onClick={() => toast.success(`Restocking ${item.name}...`)}
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {inventoryItems.filter(item => item.stock > 0 && item.stock < 10).length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
              <Package size={20} className="text-yellow-600 dark:text-yellow-500" />
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Low Stock Alert</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {inventoryItems.filter(item => item.stock > 0 && item.stock < 10).length} item(s) are running low on stock. 
                Please restock soon to avoid shortages.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}