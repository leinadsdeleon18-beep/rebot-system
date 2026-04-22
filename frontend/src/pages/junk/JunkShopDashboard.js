import React, { useState } from 'react';
import { 
  Package, 
  Truck, 
  TrendingUp,
  TrendingDown,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Recycle,
  BarChart3,
  Weight,
  Boxes
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock data
const mockStats = {
  totalBottles: 15234,
  totalPaper: 2845,
  monthlyPickups: 24,
  bottleTrend: 12,
  paperTrend: 8,
  pickupTrend: 5
};

const mockCollections = [
  { id: 1, type: 'PET Bottles', current: 1250, capacity: 1500, percent: 83, status: 'Needs Pickup', color: '#f59e0b', icon: '🥤' },
  { id: 2, type: '1.5L Bottles', current: 890, capacity: 1000, percent: 89, status: 'Critical', color: '#ef4444', icon: '🧴' },
  { id: 3, type: 'Paper Modules', current: 210, capacity: 300, percent: 70, status: 'Normal', color: '#10b981', icon: '📄' }
];

const mockRecentPickups = [
  { id: 1, date: '2026-04-04', material: 'PET Bottles', quantity: '1,200 pcs', weight: '48 kg', by: 'Juan Reyes' },
  { id: 2, date: '2026-04-03', material: 'Paper', quantity: '180 kg', weight: '180 kg', by: 'Juan Reyes' },
  { id: 3, date: '2026-04-02', material: '1.5L Bottles', quantity: '750 pcs', weight: '30 kg', by: 'Juan Reyes' }
];

const mockWeeklyData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  datasets: [
    {
      label: 'Bottles Collected',
      data: [320, 450, 380, 520, 480, 290],
      borderColor: '#2e7d32',
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      tension: 0.4,
      fill: true,
    }
  ]
};

const mockMaterialData = {
  labels: ['PET Bottles', '1.5L Bottles', 'Paper'],
  datasets: [
    {
      data: [65, 25, 10],
      backgroundColor: ['#2e7d32', '#f59e0b', '#3b82f6'],
      borderWidth: 0,
    }
  ]
};

export default function JunkShopDashboard() {
  const [stats] = useState(mockStats);
  const [collections] = useState(mockCollections);
  const [recentPickups] = useState(mockRecentPickups);
  const [searchTerm, setSearchTerm] = useState('');

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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
              <span>{trend}% from last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );

  const CollectionCard = ({ collection }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{collection.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{collection.type}</h3>
            <p className="text-sm text-gray-500">{collection.current.toLocaleString()} / {collection.capacity.toLocaleString()} units</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          collection.status === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          collection.status === 'Needs Pickup' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {collection.status}
        </span>
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Fill Level</span>
          <span className="font-medium">{collection.percent}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${collection.percent}%`, backgroundColor: collection.color }}
          />
        </div>
      </div>
    </div>
  );

  const filteredPickups = recentPickups.filter(pickup =>
    pickup.material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Junk Shop Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Monitor and manage recyclable material collections
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Bottles" 
          value={stats.totalBottles} 
          icon={Package}
          trend={stats.bottleTrend}
          trendUp={true}
          color="bg-green-600"
        />
        <StatCard 
          title="Paper Collected" 
          value={`${stats.totalPaper} kg`} 
          icon={Weight}
          trend={stats.paperTrend}
          trendUp={true}
          color="bg-blue-600"
        />
        <StatCard 
          title="Pickups This Month" 
          value={stats.monthlyPickups} 
          icon={Truck}
          trend={stats.pickupTrend}
          trendUp={true}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Weekly Collection Trends</h3>
          <div className="h-64">
            <Line data={mockWeeklyData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Material Distribution</h3>
          <div className="h-64">
            <Doughnut data={mockMaterialData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Collection Status Cards */}
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Collection Bin Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map(collection => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </div>

      {/* Recent Pickups Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Recent Pickups</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by material..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Collected By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredPickups.map((pickup) => (
                <tr key={pickup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pickup.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{pickup.material}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pickup.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pickup.weight}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pickup.by}</td>
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