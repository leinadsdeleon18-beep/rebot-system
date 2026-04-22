import React, { useState } from 'react';
import { 
  QrCode, 
  Gift, 
  History, 
  TrendingUp,
  TrendingDown,
  Search,
  Scan,
  ShoppingBag,
  Star,
  Clock,
  CheckCircle,
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

// Mock data
const mockStats = {
  todayRedemptions: 24,
  todayPoints: 380,
  totalStock: 328,
  redemptionGrowth: 12,
  pointsGrowth: 8,
  stockTrend: -5
};

const mockRecentRedemptions = [
  { id: 1, student: 'Juan Dela Cruz', item: 'Biscuit', points: 10, time: '09:30 AM', status: 'completed' },
  { id: 2, student: 'Maria Santos', item: 'Chocolate Bar', points: 25, time: '10:15 AM', status: 'completed' },
  { id: 3, student: 'Jose Rizal', item: 'Juice Box', points: 15, time: '11:00 AM', status: 'completed' },
  { id: 4, student: 'Andres Bonifacio', item: 'Pencil Set', points: 50, time: '01:30 PM', status: 'completed' }
];

const mockPopularItems = [
  { name: 'Biscuit', redemptions: 45, trend: 'up' },
  { name: 'Chocolate Bar', redemptions: 38, trend: 'up' },
  { name: 'Juice Box', redemptions: 32, trend: 'down' },
  { name: 'Eraser', redemptions: 28, trend: 'up' }
];

export default function CanteenDashboard() {
  const [stats] = useState(mockStats);
  const [recentRedemptions] = useState(mockRecentRedemptions);
  const [popularItems] = useState(mockPopularItems);
  const [searchTerm, setSearchTerm] = useState('');

  // Redemption Trends Chart
  const redemptionData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        label: 'Redemptions',
        data: [18, 22, 25, 30, 28, 15],
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  // Points Used Chart
  const pointsData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        label: 'Points Used',
        data: [250, 320, 380, 450, 420, 200],
        backgroundColor: '#f57c00',
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

  const StatCard = ({ title, value, icon: Icon, trend, trendUp, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value.toLocaleString()}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trendUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{Math.abs(trend)}% from yesterday</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );

  const filteredRedemptions = recentRedemptions.filter(r =>
    r.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Canteen Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage reward redemptions and track inventory
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Today's Redemptions" 
          value={stats.todayRedemptions} 
          icon={ShoppingBag}
          trend={stats.redemptionGrowth}
          trendUp={true}
          color="bg-blue-600"
        />
        <StatCard 
          title="Points Used Today" 
          value={stats.todayPoints} 
          icon={Star}
          trend={stats.pointsGrowth}
          trendUp={true}
          color="bg-orange-500"
        />
        <StatCard 
          title="Items in Stock" 
          value={stats.totalStock} 
          icon={Gift}
          trend={stats.stockTrend}
          trendUp={false}
          color="bg-green-600"
        />
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
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Points Used This Week</h3>
          <div className="h-64">
            <Bar data={pointsData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Popular Items */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Most Popular Items</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {popularItems.map((item, index) => (
            <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Gift size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.redemptions} redemptions today</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {item.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="text-sm font-medium">
                  {item.trend === 'up' ? '+' : '-'}{Math.floor(Math.random() * 15) + 5}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Redemptions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Recent Redemptions</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by student or item..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredRedemptions.map((redemption) => (
                <tr key={redemption.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{redemption.student}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{redemption.item}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-600 dark:text-orange-400">{redemption.points} pts</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock size={14} /> {redemption.time}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                      <CheckCircle size={12} /> Completed
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