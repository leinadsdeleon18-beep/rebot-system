import React, { useState, useEffect } from 'react';
import { Gift, History, TrendingUp, TrendingDown, Search, Scan, ShoppingBag, Star, Clock, CheckCircle } from 'lucide-react';
import { statsAPI, rewardsAPI } from '../../services/apiService';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function CanteenDashboard() {
  const [stats, setStats] = useState({ todayRedemptions: 0, todayPoints: 0, totalStock: 0 });
  const [recentRedemptions, setRecentRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redemptionTrends, setRedemptionTrends] = useState([18, 22, 25, 30, 28, 15]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get system stats
      const statsRes = await statsAPI.getSystemStats();
      
      // Get inventory
      const inventoryRes = await rewardsAPI.getInventory();
      
      if (statsRes.data.success) {
        setStats({
          todayRedemptions: statsRes.data.stats.totalRedemptions || 0,
          todayPoints: statsRes.data.stats.totalPoints || 0,
          totalStock: inventoryRes.data.inventory?.reduce((sum, i) => sum + (i.stockQuantity || 0), 0) || 0
        });
      }

      // Get recent redemptions
      const transactionsRes = await statsAPI.getRecentTransactions(10);
      if (transactionsRes.data.success) {
        const formatted = transactionsRes.data.transactions
          .filter(t => t.type === 'redemption')
          .slice(0, 5)
          .map(t => ({
            id: t._id,
            student: t.student?.fullName || 'Unknown',
            points: t.totalPoints,
            time: new Date(t.createdAt).toLocaleTimeString(),
            status: t.status
          }));
        setRecentRedemptions(formatted);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const redemptionData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      label: 'Redemptions',
      data: redemptionTrends,
      borderColor: '#2e7d32',
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      tension: 0.4,
      fill: true,
    }]
  };

  const chartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { legend: { position: 'top' } } 
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Canteen Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage reward redemptions and track inventory</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Redemptions</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats.todayRedemptions}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <ShoppingBag className="text-white" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Points Used</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.todayPoints}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <Star className="text-white" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Items in Stock</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalStock}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
              <Gift className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => window.location.href = '/canteen/scan'} 
          className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition shadow-md"
        >
          <Scan size={24} />
          <div className="text-left">
            <p className="font-semibold">Scan Student QR</p>
            <p className="text-sm opacity-90">Quickly verify and process redemption</p>
          </div>
        </button>
        <button 
          onClick={() => window.location.href = '/canteen/rewards'} 
          className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition shadow-md"
        >
          <Gift size={24} />
          <div className="text-left">
            <p className="font-semibold">Manage Rewards</p>
            <p className="text-sm opacity-90">View and restock reward items</p>
          </div>
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Redemption Trends</h3>
          <div className="h-64">
            <Line data={redemptionData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Recent Redemptions</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentRedemptions.length > 0 ? (
              recentRedemptions.map(r => (
                <div key={r.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{r.student}</p>
                    <p className="text-xs text-gray-500">{r.time}</p>
                  </div>
                  <div>
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">-{r.points} pts</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No recent redemptions</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}