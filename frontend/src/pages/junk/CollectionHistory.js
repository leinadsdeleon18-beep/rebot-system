import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Calendar,
  Filter,
  TrendingUp,
  Package,
  Weight,
  Truck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock collection history
const mockHistory = [
  { id: 1, date: '2026-04-04', material: 'PET Bottles', quantity: '1,200 pcs', weight: '48 kg', value: '₱1,200', collectedBy: 'Juan Reyes', time: '02:30 PM' },
  { id: 2, date: '2026-04-03', material: 'Paper', quantity: '180 kg', weight: '180 kg', value: '₱900', collectedBy: 'Juan Reyes', time: '10:15 AM' },
  { id: 3, date: '2026-04-02', material: '1.5L Bottles', quantity: '750 pcs', weight: '30 kg', value: '₱750', collectedBy: 'Juan Reyes', time: '11:00 AM' },
  { id: 4, date: '2026-04-01', material: 'PET Bottles', quantity: '980 pcs', weight: '39 kg', value: '₱980', collectedBy: 'Juan Reyes', time: '09:30 AM' },
  { id: 5, date: '2026-03-31', material: 'Paper', quantity: '150 kg', weight: '150 kg', value: '₱750', collectedBy: 'Juan Reyes', time: '01:45 PM' },
  { id: 6, date: '2026-03-30', material: 'PET Bottles', quantity: '1,100 pcs', weight: '44 kg', value: '₱1,100', collectedBy: 'Juan Reyes', time: '03:00 PM' }
];

export default function CollectionHistory() {
  const [history] = useState(mockHistory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate totals
  const totalBottles = history
    .filter(h => h.material.includes('Bottles'))
    .reduce((sum, h) => sum + parseInt(h.quantity.replace(/[^0-9]/g, '')), 0);
  
  const totalPaper = history
    .filter(h => h.material === 'Paper')
    .reduce((sum, h) => sum + parseInt(h.weight.replace(/[^0-9]/g, '')), 0);
  
  const totalValue = history.reduce((sum, h) => sum + parseInt(h.value.replace(/[^0-9]/g, '')), 0);

  // Filter history
  const filteredHistory = history.filter(item => {
    const matchesSearch = item.material.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMaterial = selectedMaterial === 'all' || item.material === selectedMaterial;
    const matchesDateFrom = !dateFrom || item.date >= dateFrom;
    const matchesDateTo = !dateTo || item.date <= dateTo;
    return matchesSearch && matchesMaterial && matchesDateFrom && matchesDateTo;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  // Export to CSV
  const handleExport = () => {
    const headers = ['Date', 'Time', 'Material', 'Quantity', 'Weight', 'Value', 'Collected By'];
    const rows = filteredHistory.map(h => [h.date, h.time, h.material, h.quantity, h.weight, h.value, h.collectedBy]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('History exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Collection History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and export all collection records</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition shadow-sm"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-green-600">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-green-600" />
            <p className="text-gray-500 text-sm">Total Bottles</p>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalBottles.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-blue-600">
          <div className="flex items-center gap-2">
            <Weight size={18} className="text-blue-600" />
            <p className="text-gray-500 text-sm">Total Paper</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalPaper} kg</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-orange-600">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-orange-600" />
            <p className="text-gray-500 text-sm">Total Pickups</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{history.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-purple-600">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-600" />
            <p className="text-gray-500 text-sm">Total Value</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">₱{totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by material..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMaterial}
            onChange={(e) => {
              setSelectedMaterial(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="all">All Materials</option>
            <option value="PET Bottles">PET Bottles</option>
            <option value="1.5L Bottles">1.5L Bottles</option>
            <option value="Paper">Paper</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
            placeholder="To"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Collected By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.time}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{item.material}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.weight}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">{item.value}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.collectedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}