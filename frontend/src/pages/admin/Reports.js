import React, { useState } from 'react';
import { Download, Calendar, TrendingUp, FileText, PieChart, BarChart3, Printer } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
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

export default function Reports() {
  const [reportType, setReportType] = useState('recycling');
  const [dateRange, setDateRange] = useState({ from: '2026-01-01', to: new Date().toISOString().split('T')[0] });
  const [generated, setGenerated] = useState(false);

  // Mock data for reports
  const recyclingData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      { label: 'Bottles', data: [3200, 4100, 3800, 5200], backgroundColor: '#2e7d32', borderRadius: 8 },
      { label: 'Paper (kg)', data: [580, 720, 690, 850], backgroundColor: '#f57c00', borderRadius: 8 }
    ]
  };

  const rewardsData = {
    labels: ['Biscuit', 'Chocolate', 'Juice', 'Pencil', 'Notebook'],
    datasets: [{ label: 'Redemptions', data: [45, 38, 52, 28, 19], backgroundColor: '#2e7d32', borderRadius: 8 }]
  };

  const donationsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ label: 'Donations (₱)', data: [15000, 22000, 18000, 31000, 28000, 35000], borderColor: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.1)', fill: true, tension: 0.4 }]
  };

  const pieData = {
    labels: ['General Support', 'Student Rewards', 'Maintenance', 'Expansion', 'Education'],
    datasets: [{ data: [45, 25, 15, 10, 5], backgroundColor: ['#2e7d32', '#f57c00', '#2196f3', '#9c27b0', '#ff9800'] }]
  };

  const handleGenerate = () => {
    setGenerated(true);
    toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated!`);
  };

  const handleExport = () => {
    toast.success('Report exported successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const getChartData = () => {
    switch(reportType) {
      case 'recycling': return recyclingData;
      case 'rewards': return rewardsData;
      case 'donations': return donationsData;
      default: return recyclingData;
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">Generate and export detailed system reports</p>
      </div>

      {/* Report Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={20} /> Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500">
              <option value="recycling">Recycling Performance</option>
              <option value="rewards">Rewards Redemption</option>
              <option value="inventory">Inventory Status</option>
              <option value="users">User Activity</option>
              <option value="donations">Donations Summary</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-xl">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleGenerate} className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition flex items-center gap-2"><BarChart3 size={18} /> Generate Report</button>
          <button onClick={handleExport} className="px-6 py-2 border border-green-600 text-green-600 rounded-full font-semibold flex items-center gap-2 hover:bg-green-50 transition"><Download size={18} /> Export CSV</button>
          <button onClick={handlePrint} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-50 transition"><Printer size={18} /> Print</button>
        </div>
      </div>

      {/* Report Results */}
      {generated && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-600"><p className="text-gray-500 text-sm">Total Revenue</p><p className="text-2xl font-bold text-gray-800">₱145,000</p><span className="text-green-600 text-sm">↑ 12%</span></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-600"><p className="text-gray-500 text-sm">Total Items</p><p className="text-2xl font-bold text-gray-800">2,450</p><span className="text-green-600 text-sm">↑ 8%</span></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-600"><p className="text-gray-500 text-sm">Active Users</p><p className="text-2xl font-bold text-gray-800">1,280</p><span className="text-green-600 text-sm">↑ 15%</span></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-600"><p className="p-4 text-gray-500 text-sm">Redemption Rate</p><p className="text-2xl font-bold text-gray-800">78%</p><span className="text-green-600 text-sm">↑ 5%</span></div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Main Chart</h3>
              <div className="h-80">{reportType === 'donations' ? <Line data={getChartData()} options={chartOptions} /> : <Bar data={getChartData()} options={chartOptions} />}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Distribution</h3>
              <div className="h-80"><Pie data={pieData} options={pieOptions} /></div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Detailed Data</h3></div>
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th></tr></thead><tbody className="divide-y divide-gray-100"><tr><td className="px-6 py-4 text-sm">2026-03-28</td><td className="px-6 py-4 text-sm">Bottles</td><td className="px-6 py-4 text-sm font-semibold">1,250</td><td className="px-6 py-4 text-sm text-green-600">+120</td></tr><tr><td className="px-6 py-4 text-sm">2026-03-27</td><td className="px-6 py-4 text-sm">Paper</td><td className="px-6 py-4 text-sm font-semibold">280 kg</td><td className="px-6 py-4 text-sm text-green-600">+35</td></tr><tr><td className="px-6 py-4 text-sm">2026-03-26</td><td className="px-6 py-4 text-sm">Redemptions</td><td className="px-6 py-4 text-sm font-semibold">42</td><td className="px-6 py-4 text-sm text-green-600">+8</td></tr></tbody></table></div>
          </div>
        </div>
      )}

      {!generated && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <FileText size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No Report Generated</h3>
          <p className="text-gray-400 text-sm mt-1">Select filters and click Generate Report</p>
        </div>
      )}
    </div>
  );
}