import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../services/apiService';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch(apiUrl('/get-stats')),
      fetch(apiUrl('/transactions'), { headers: { Authorization: 'Bearer ' + token } })
    ])
      .then(async ([statsResponse, transactionResponse]) => {
        const result = await statsResponse.json();
        const transactionResult = await transactionResponse.json();
        setData(result);
        setRecentTransactions(
          (transactionResult.transactions || []).slice(0, 8).map(transaction => ({
            id: transaction._id,
            student: transaction.student?.fullName || transaction.studentName || 'Unknown student',
            type: transaction.type,
            points: transaction.type === 'redeem'
              ? transaction.pointsSpent || 0
              : transaction.pointsEarned || 0,
            reward: transaction.reward?.name || transaction.rewardName || '',
            createdAt: transaction.createdAt
          }))
        );
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-red-100 p-4 m-4 rounded">
        <p>No data received. Check console for errors.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-6">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-blue-100 text-sm">Total Students</p>
          <p className="text-3xl font-bold">{data.totalStudents}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-green-100 text-sm">Total Points</p>
          <p className="text-3xl font-bold">{data.totalPoints}</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-orange-100 text-sm">Total Bottles</p>
          <p className="text-3xl font-bold">{data.totalBottles}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-purple-100 text-sm">Redemptions</p>
          <p className="text-3xl font-bold">{data.totalRedemptions}</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-green-700 font-medium">✅ Connected to Database - {data.totalStudents} students found</p>
        </div>
      </div>

      {/* Recent point and redemption activity */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Student Activity</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentTransactions.map(transaction => {
            const date = new Date(transaction.createdAt);
            return (
              <div key={transaction.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{transaction.student}</p>
                  <p className="text-sm text-gray-500">
                    {transaction.type === 'redeem'
                      ? `Claimed ${transaction.reward || 'a reward'}`
                      : 'Stored recycling points'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-semibold ${transaction.type === 'redeem' ? 'text-orange-600' : 'text-green-600'}`}>
                    {transaction.type === 'redeem' ? '-' : '+'}{transaction.points} pts
                  </p>
                  <p className="text-xs text-gray-500">
                    {Number.isNaN(date.getTime()) ? 'Time unavailable' : `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>
            );
          })}
          {recentTransactions.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-gray-500">No student activity recorded yet.</p>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Students List ({data.students?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.students?.map((student, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{student.studentId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{student.fullName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">{student.points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
