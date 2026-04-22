import React, { useState } from 'react';
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

// Mock Data
const mockStats = {
  totalBottles: 15234,
  totalPaper: 2845,
  totalPoints: 48921,
  totalRewards: 8942,
  bottleTrend: 12,
  paperTrend: 8,
  pointsTrend: 15,
  rewardsTrend: 5
};

const mockTransactions = [
  { id: 1, date: '2026-03-28 09:30 AM', user: 'Juan Dela Cruz', type: 'Recycle', amount: '5 bottles', points: '+5', status: 'Completed' },
  { id: 2, date: '2026-03-28 09:15 AM', user: 'Maria Santos', type: 'Recycle', amount: '200g', points: '+4', status: 'Completed' },
  { id: 3, date: '2026-03-27 02:30 PM', user: 'Class 5-A', type: 'Bulk Entry', amount: '25 pcs', points: '+25', status: 'Completed' },
  { id: 4, date: '2026-03-27 10:00 AM', user: 'Jose Rizal', type: 'Redemption', amount: 'Biscuit', points: '-10', status: 'Completed' },
  { id: 5, date: '2026-03-26 03:45 PM', user: 'Andres Bonifacio', type: 'Recycle', amount: '12 bottles', points: '+12', status: 'Completed' }
];

const mockAlerts = [
  { id: 1, type: 'warning', title: 'Low Inventory Alert', message: 'Biscuit stock is down to 15 pieces. Please restock soon.', action: 'Restock Now' },
  { id: 2, type: 'info', title: 'Bin Status', message: 'Paper bin is at 78% capacity. Schedule pickup within 2 days.', action: 'Schedule Pickup' }
];

export default function AdminDashboard() {
  const [stats] = useState(mockStats);
  const [transactions] = useState(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts] = useState(mockAlerts);

  // Recycling Trends Chart Data
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
      },
      {
        label: 'Paper (kg x100)',
        data: [18, 21, 24, 26, 27, 28],
        borderColor: '#f57c00',
        backgroundColor: 'rgba(245, 124, 0, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  // Points Distribution Chart
  const pointsData = {
    labels: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
    datasets: [
      {
        label: 'Points Earned',
        data: [5200, 6800, 8900, 10200, 11800, 8900],
        backgroundColor: '#2e7d32',
        borderRadius: 8,
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

  const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value.toLocaleString()}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trendUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{trend}% from last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          title === 'Total Bottles' ? 'bg-green-600' :
          title === 'Paper Collected' ? 'bg-blue-600' :
          title === 'Total Points' ? 'bg-orange-500' : 'bg-purple-600'
        }`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );

  const AlertCard = ({ alert }) => (
    <div className={`rounded-xl p-4 border-l-4 ${
      alert.type === 'warning' 
        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
        : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
    }`}>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className={alert.type === 'warning' ? 'text-orange-500' : 'text-blue-500'} size={20} />
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{alert.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-medium transition">
          {alert.action}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back, Administrator • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Bottles" value={stats.totalBottles} icon={Package} trend={stats.bottleTrend} trendUp={true} />
        <StatCard title="Paper Collected" value={`${stats.totalPaper} kg`} icon={Package} trend={stats.paperTrend} trendUp={true} />
        <StatCard title="Total Points" value={stats.totalPoints} icon={Star} trend={stats.pointsTrend} trendUp={true} />
        <StatCard title="Rewards Redeemed" value={stats.totalRewards} icon={ShoppingBag} trend={stats.rewardsTrend} trendUp={true} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Recycling Trends (Last 6 Months)</h3>
            <select className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              <option>Both</option>
              <option>Bottles</option>
              <option>Paper</option>
            </select>
          </div>
          <div className="h-80">
            <Line data={recyclingData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Points Distribution by Grade Level</h3>
            <select className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              <option>Points Earned</option>
              <option>Points Redeemed</option>
            </select>
          </div>
          <div className="h-80">
            <Bar data={pointsData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
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