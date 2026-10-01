import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Scan, RefreshCw, TrendingUp, Clock, Package, AlertTriangle, Gift } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';
import { apiUrl } from '../../services/apiService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function CanteenDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    todayRedemptions: 0, 
    totalPoints: 0, 
    totalStock: 0,
    totalRewards: 0,
    lowStockItems: 0
  });
  const [recentRedemptions, setRecentRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redemptionTrends, setRedemptionTrends] = useState([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch rewards for stock data
      const rewardsRes = await fetch(apiUrl('/rewards'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rewardsData = await rewardsRes.json();
      
      // Fetch transactions for redemption data
      const transactionsRes = await fetch(apiUrl('/transactions'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const transactionsData = await transactionsRes.json();
      
      // Fetch students for points data
      const studentsRes = await fetch(apiUrl('/students'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const studentsData = await studentsRes.json();
      
      let totalPoints = 0;
      if (studentsData.success) {
        totalPoints = studentsData.students.reduce((sum, s) => sum + (s.points || 0), 0);
      }
      
      let totalStock = 0;
      let totalRewards = 0;
      let lowStockItems = 0;
      
      if (rewardsData.success) {
        totalRewards = rewardsData.rewards.length;
        totalStock = rewardsData.rewards.reduce((sum, r) => sum + (r.stock || 0), 0);
        lowStockItems = rewardsData.rewards.filter(r => (r.stock || 0) > 0 && (r.stock || 0) < 10).length;
      }
      
      let redemptions = [];
      let redemptionCount = 0;
      
      if (transactionsData.success) {
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = transactionsData.transactions.filter(t => {
          const transactionDate = new Date(t.createdAt).toISOString().split('T')[0];
          return (t.type === 'redeem') && transactionDate === today;
        });
        redemptionCount = todayTransactions.length;
        
        redemptions = transactionsData.transactions
          .filter(t => t.type === 'redeem')
          .slice(0, 5)
          .map(t => ({
            id: t._id,
            student: t.studentName || t.student?.fullName || 'Unknown',
            points: t.pointsSpent || t.points || 0,
            time: new Date(t.createdAt).toLocaleTimeString(),
            item: t.rewardName || 'Reward',
            status: t.status || 'completed'
          }));
      }
      
      setStats({
        todayRedemptions: redemptionCount,
        totalPoints: totalPoints,
        totalStock: totalStock,
        totalRewards: totalRewards,
        lowStockItems: lowStockItems
      });
      
      setRecentRedemptions(redemptions);
      
      // Generate weekly trend data from actual transactions
      const weeklyData = [0, 0, 0, 0, 0, 0, 0];
      if (transactionsData.success) {
        transactionsData.transactions
          .filter(t => t.type === 'redeem')
          .forEach(t => {
            const date = new Date(t.createdAt);
            const dayIndex = date.getDay();
            weeklyData[dayIndex] += 1;
          });
      }
      setRedemptionTrends(weeklyData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const redemptionData = {
    labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    datasets: [{
      label: 'Redemptions',
      data: redemptionTrends,
      borderColor: '#2e7d32',
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#16a34a',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'top',
        labels: { font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#ddd',
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        title: { display: true, text: 'Number of Redemptions', font: { size: 12 } }
      },
      x: {
        grid: { display: false },
        title: { display: true, text: 'Day of Week', font: { size: 12 } }
      }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Canteen Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage reward redemptions and track inventory</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 hover:bg-purple-700 transition shadow-sm"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Today's Redemptions</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats.todayRedemptions}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <ShoppingBag className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-orange-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Points Available</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalPoints.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <Star className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-green-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Items in Stock</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalStock}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
              <Package className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 border-purple-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Rewards</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalRewards}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
              <Gift className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockItems > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-300">Low Stock Alert</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {stats.lowStockItems} item(s) are running low on stock. Please restock soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <button
          onClick={() => navigate('/canteen/scan')}
          className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition shadow-md"
        >
          <Scan size={24} />
          <div className="text-left">
            <p className="font-semibold">Scan Student QR</p>
            <p className="text-sm opacity-90">Quickly verify and process redemption</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/canteen/rewards')}
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
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" /> Redemption Trends (Last 7 Days)
          </h3>
          <div className="h-64">
            <Line data={redemptionData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-600" /> Recent Redemptions
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentRedemptions.length > 0 ? (
              recentRedemptions.map((r) => (
                <div key={r.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{r.student}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">{r.time}</p>
                      <span className="text-xs text-gray-400">{r.item}</span>
                    </div>
                  </div>
                  <span className="text-orange-600 dark:text-orange-400 font-semibold">-{r.points} pts</span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ShoppingBag size={40} className="mx-auto mb-3 text-gray-300" />
                <p>No recent redemptions</p>
                <p className="text-xs mt-1">Redemptions will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}