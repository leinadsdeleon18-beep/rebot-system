import React, { useCallback, useEffect, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiUrl } from '../../services/apiService';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [adjustment, setAdjustment] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem('token');
    const [statsResponse, transactionResponse] = await Promise.all([
      fetch(apiUrl('/get-stats')),
      fetch(apiUrl('/transactions'), { headers: { Authorization: `Bearer ${token}` } })
    ]);
    if (!statsResponse.ok || !transactionResponse.ok) throw new Error('Unable to load dashboard data');
    const stats = await statsResponse.json();
    const transactions = await transactionResponse.json();
    setData(stats);
    setRecentTransactions((transactions.transactions || []).slice(0, 8));
  }, []);

  useEffect(() => {
    loadDashboard().catch(error => console.error(error)).finally(() => setLoading(false));
  }, [loadDashboard]);

  const adjustPoints = async (amountOverride) => {
    const amount = Number(amountOverride ?? adjustment);
    if (!selectedStudent || !Number.isInteger(amount) || amount === 0) {
      toast.error('Enter a non-zero whole-number adjustment');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/students/${selectedStudent._id}/points`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ points: amount })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to adjust points');
      toast.success(result.message);
      setSelectedStudent(null);
      setAdjustment('');
      await loadDashboard();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-green-600" /></div>;
  if (!data) return <div className="m-4 rounded bg-red-100 p-4 text-red-700">No dashboard data received. Please refresh.</div>;

  const transactionName = transaction => transaction.student?.fullName || transaction.studentName || 'Unknown student';
  const transactionPoints = transaction => transaction.type === 'redeem'
    ? transaction.pointsSpent || 0
    : transaction.pointsEarned || 0;

  return (
    <div className="w-full max-w-full p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value={data.totalStudents} className="from-blue-500 to-blue-600" />
        <StatCard title="Total Points" value={data.totalPoints} className="from-green-500 to-green-600" />
        <StatCard title="Total Bottles" value={data.totalBottles} className="from-orange-500 to-orange-600" />
        <StatCard title="Redemptions" value={data.totalRedemptions} className="from-purple-500 to-purple-600" />
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-300 bg-green-100 p-4 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
        <span className="mt-1 h-3 w-3 flex-none animate-pulse rounded-full bg-green-500" />
        <span className="min-w-0 break-words font-medium">Connected to Database - {data.totalStudents} students found</span>
      </div>

      <section className="mb-6 overflow-hidden rounded-xl bg-white shadow-md dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Student Activity</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentTransactions.map(transaction => {
            const date = new Date(transaction.createdAt || transaction.timestamp);
            const redeemed = transaction.type === 'redeem';
            return (
              <div key={transaction._id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800 dark:text-gray-100">{transactionName(transaction)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {redeemed ? `Claimed ${transaction.reward?.name || transaction.rewardName || 'a reward'}` : 'Stored recycling points'}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className={`font-semibold ${redeemed ? 'text-orange-600' : 'text-green-600'}`}>{redeemed ? '-' : '+'}{transactionPoints(transaction)} pts</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {Number.isNaN(date.getTime()) ? 'Time unavailable' : `${date.toLocaleDateString()} ? ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                  </p>
                </div>
              </div>
            );
          })}
          {!recentTransactions.length && <p className="px-6 py-8 text-center text-sm text-gray-500">No student activity recorded yet.</p>}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-md dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Students List ({data.students?.length || 0})</h2>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="min-w-[720px] w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                {['Student ID', 'Full Name', 'Email', 'Points', 'Adjust Points'].map(label => (
                  <th key={label} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300 sm:px-6">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {(data.students || []).map(student => (
                <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-4 font-mono text-sm text-gray-600 dark:text-gray-300 sm:px-6">{student.studentId}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-gray-100 sm:px-6">{student.fullName}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 sm:px-6">{student.email}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-green-600 dark:text-green-400 sm:px-6">{student.points} pts</td>
                  <td className="px-4 py-4 sm:px-6">
                    <button onClick={() => { setSelectedStudent(student); setAdjustment(''); }} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Adjust</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Adjust Student Points</h3>
              <button aria-label="Close" onClick={() => setSelectedStudent(null)}><X size={22} /></button>
            </div>
            <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <p className="font-medium text-gray-800 dark:text-gray-100">{selectedStudent.fullName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">Current balance: {selectedStudent.points} pts</p>
            </div>
            <input type="number" min="1" value={adjustment} onChange={event => setAdjustment(event.target.value)} placeholder="Points to add or remove" className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button disabled={saving || !adjustment} onClick={() => adjustPoints(Math.abs(Number(adjustment)))} className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"><Plus size={18} /> Add</button>
              <button disabled={saving || !adjustment} onClick={() => adjustPoints(-Math.abs(Number(adjustment)))} className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"><Minus size={18} /> Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, className }) {
  return (
    <div className={`rounded-xl bg-gradient-to-r p-5 text-white shadow-lg sm:p-6 ${className}`}>
      <p className="text-sm text-white/80">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value ?? 0}</p>
    </div>
  );
}
