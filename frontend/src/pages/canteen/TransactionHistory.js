import React, { useState, useEffect } from 'react';
import { History, Search, Download, Calendar, ChevronLeft, ChevronRight, RefreshCw, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        const formatted = data.transactions.map(t => ({
          id: t._id,
          student: t.studentName || t.student?.fullName || 'Unknown',
          item: t.rewardName || (t.type === 'redeem' ? 'Reward Redemption' : 'Recycling'),
          points: t.type === 'redeem' ? (t.pointsSpent || 0) : (t.pointsEarned || 0),
          date: new Date(t.createdAt).toISOString().split('T')[0],
          time: new Date(t.createdAt).toLocaleTimeString(),
          staff: t.processedBy?.fullName || t.user?.fullName || 'System',
          status: t.status || 'completed',
          type: t.type,
          transactionNumber: t.transactionNumber || `TXN-${t._id?.slice(-8)}`
        }));
        formatted.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
        setTransactions(formatted);
      } else {
        toast.error(data.message || 'Failed to load transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Date', 'Time', 'Student', 'Item', 'Points', 'Type', 'Status', 'Transaction ID'];
    const rows = filteredTransactions.map(t => [
      t.date, t.time, t.student, t.item, 
      t.type === 'redeem' ? `-${t.points}` : `+${t.points}`, 
      t.type === 'redeem' ? 'Redemption' : 'Recycling', 
      t.status, 
      t.transactionNumber
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transactions exported successfully!');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
    setSelectedType('all');
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.item.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || t.date === selectedDate;
    const matchesType = selectedType === 'all' || t.type === selectedType;
    return matchesSearch && matchesDate && matchesType;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  
  const totalPointsUsed = filteredTransactions
    .filter(t => t.type === 'redeem')
    .reduce((sum, t) => sum + t.points, 0);
  const totalPointsEarned = filteredTransactions
    .filter(t => t.type === 'earn')
    .reduce((sum, t) => sum + t.points, 0);
  const totalRedemptions = filteredTransactions.filter(t => t.type === 'redeem').length;
  const totalEarnings = filteredTransactions.filter(t => t.type === 'earn').length;

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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Transaction History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and export all redemption and recycling transactions</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Filter size={18} /> Filters
          </button>
          <button 
            onClick={fetchTransactions}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-purple-700 transition shadow-sm"
          >
            <RefreshCw size={18} /> Refresh
          </button>
          <button 
            onClick={handleExport} 
            className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-green-700 transition shadow-sm"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-blue-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{filteredTransactions.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-red-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Redemptions</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalRedemptions}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-green-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Recycling Events</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalEarnings}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-orange-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Unique Students</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{new Set(filteredTransactions.map(t => t.student)).size}</p>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Filter size={20} /> Filter Transactions
            </h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Type</label>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              >
                <option value="all">All Types</option>
                <option value="redeem">Redemptions Only</option>
                <option value="earn">Recycling Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Student or item name..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(searchTerm || selectedDate !== '' || selectedType !== 'all') && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500">Active filters:</span>
          {searchTerm && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
              Search: {searchTerm}
              <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="hover:text-blue-900">
                <X size={12} />
              </button>
            </span>
          )}
          {selectedDate && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
              Date: {selectedDate}
              <button onClick={() => { setSelectedDate(''); setCurrentPage(1); }} className="hover:text-blue-900">
                <X size={12} />
              </button>
            </span>
          )}
          {selectedType !== 'all' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
              Type: {selectedType === 'redeem' ? 'Redemptions' : 'Recycling'}
              <button onClick={() => { setSelectedType('all'); setCurrentPage(1); }} className="hover:text-blue-900">
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Points Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Points Used</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{totalPointsUsed.toLocaleString()} pts</p>
            </div>
            <div className="w-12 h-12 bg-red-200 dark:bg-red-800/30 rounded-full flex items-center justify-center">
              <span className="text-xl">📉</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Points Earned</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{totalPointsEarned.toLocaleString()} pts</p>
            </div>
            <div className="w-12 h-12 bg-green-200 dark:bg-green-800/30 rounded-full flex items-center justify-center">
              <span className="text-xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{t.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{t.time}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{t.student}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{t.item}</td>
                  <td className={`px-6 py-4 text-sm font-semibold ${t.type === 'redeem' ? 'text-red-600' : 'text-green-600'}`}>
                    {t.type === 'redeem' ? '-' : '+'}{t.points} pts
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.type === 'redeem' 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {t.type === 'redeem' ? 'Redemption' : 'Recycling'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-500">{t.transactionNumber}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <History size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <span className="text-xs text-gray-400">
                ({filteredTransactions.length} total)
              </span>
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Export Info */}
      <div className="text-center text-xs text-gray-400">
        <p>Showing {filteredTransactions.length} transaction(s) | Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}