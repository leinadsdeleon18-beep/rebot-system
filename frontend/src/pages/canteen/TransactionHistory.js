import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter,
  Download,
  Calendar,
  Gift,
  User,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock transaction data
const mockTransactions = [
  { id: 1, student: 'Juan Dela Cruz', item: 'Biscuit', points: 10, date: '2026-04-04', time: '09:30 AM', staff: 'Rosa Mercado', status: 'completed' },
  { id: 2, student: 'Maria Santos', item: 'Chocolate Bar', points: 25, date: '2026-04-04', time: '10:15 AM', staff: 'Rosa Mercado', status: 'completed' },
  { id: 3, student: 'Jose Rizal', item: 'Juice Box', points: 15, date: '2026-04-04', time: '11:00 AM', staff: 'Rosa Mercado', status: 'completed' },
  { id: 4, student: 'Andres Bonifacio', item: 'Pencil Set', points: 50, date: '2026-04-04', time: '01:30 PM', staff: 'Rosa Mercado', status: 'completed' },
  { id: 5, student: 'Emilio Aguinaldo', item: 'Eraser', points: 5, date: '2026-04-03', time: '02:00 PM', staff: 'Rosa Mercado', status: 'completed' },
  { id: 6, student: 'Juan Dela Cruz', item: 'Notebook', points: 75, date: '2026-04-03', time: '10:30 AM', staff: 'Rosa Mercado', status: 'completed' },
  { id: 7, student: 'Maria Santos', item: 'Sticker Pack', points: 15, date: '2026-04-02', time: '11:45 AM', staff: 'Rosa Mercado', status: 'completed' },
  { id: 8, student: 'Jose Rizal', item: 'Ballpen', points: 20, date: '2026-04-02', time: '09:15 AM', staff: 'Rosa Mercado', status: 'completed' }
];

export default function TransactionHistory() {
  const [transactions] = useState(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.item.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || t.date === selectedDate;
    return matchesSearch && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Export to CSV
  const handleExport = () => {
    const headers = ['Date', 'Time', 'Student', 'Item', 'Points', 'Staff', 'Status'];
    const rows = filteredTransactions.map(t => [t.date, t.time, t.student, t.item, t.points, t.staff, t.status]);
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

  // Get today's date for default filter
  const today = new Date().toISOString().split('T')[0];
  const totalPoints = filteredTransactions.reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Transaction History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and export all redemption transactions</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition shadow-sm"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-blue-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{filteredTransactions.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-orange-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total Points Used</p>
          <p className="text-2xl font-bold text-orange-600">{totalPoints}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-green-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Unique Students</p>
          <p className="text-2xl font-bold text-green-600">{new Set(filteredTransactions.map(t => t.student)).size}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by student or item..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
          </div>
          {selectedDate && (
            <button
              onClick={() => {
                setSelectedDate('');
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition"
            >
              Clear
            </button>
          )}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Processed By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{transaction.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{transaction.time}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{transaction.student}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{transaction.item}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-600 dark:text-orange-400">{transaction.points} pts</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{transaction.staff}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                      Completed
                    </span>
                  </td>
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