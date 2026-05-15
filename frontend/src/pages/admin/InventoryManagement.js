import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Star, 
  ShoppingBag, 
  TrendingUp,
  TrendingDown,
  Search,
  AlertCircle
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { statsAPI, rewardsAPI, studentsAPI } from '../../services/apiService';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBottles: 0,
    totalPoints: 0,
    totalStudents: 0,
    totalRedemptions: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [gradePerformance, setGradePerformance] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get system stats
      const statsRes = await statsAPI.getSystemStats();
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // Get recent transactions
      const transactionsRes = await statsAPI.getRecentTransactions(10);
      if (transactionsRes.data.success) {
        const formattedTransactions = transactionsRes.data.transactions.map(t => ({
          id: t._id,
          date: new Date(t.createdAt).toLocaleString(),
          user: t.student?.fullName || 'Unknown',
          type: t.type === 'recycling' ? 'Recycle' : 'Redemption',
          amount: t.type === 'recycling' ? `${t.totalPoints} pts earned` : `${t.totalPoints} pts used`,
          points: t.type === 'recycling' ? `+${t.totalPoints}` : `-${t.totalPoints}`,
          status: t.status
        }));
        setTransactions(formattedTransactions);
      }

      // Get grade level performance
      const gradeRes = await statsAPI.getGradeLevelPerformance();
      if (gradeRes.data.success) {
        setGradePerformance(gradeRes.data.performance);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Points Distribution Chart Data from real API
  const pointsData = {
    labels: gradePerformance.map(g => g._id || 'Unknown'),
    datasets: [
      {
        label: 'Points Earned',
        data: gradePerformance.map(g => g.totalPoints || 0),
        backgroundColor: '#2e7d32',
        borderRadius: 8,
      }
    ]
  };

  // Recycling Trends Chart (mock data - replace with real data when available)
  const recyclingData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Bottles (x1000)',
        data: [8.2, 9.5, 11.3, 12.8, 14.2, 15.2],
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b'
        }
      },
    },
  };

  const filteredTransactions = transactions.filter(t => 
    t.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value.toLocaleString()}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );

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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back, Administrator • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.totalStudents || 0} icon={Package} color="bg-blue-600" />
        <StatCard title="Total Bottles" value={stats.totalBottles || 0} icon={Package} color="bg-green-600" />
        <StatCard title="Total Points" value={stats.totalPoints || 0} icon={Star} color="bg-orange-500" />
        <StatCard title="Rewards Redeemed" value={stats.totalRedemptions || 0} icon={ShoppingBag} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Points Distribution by Grade Level</h3>
          <div className="h-80">
            {gradePerformance.length > 0 ? (
              <Bar data={pointsData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Recycling Trends</h3>
          <div className="h-80">
            <Line data={recyclingData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Recent Transactions</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm w-64 focus:outline-none focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{transaction.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{transaction.user}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{transaction.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{transaction.amount}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${transaction.points.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {transaction.points}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}