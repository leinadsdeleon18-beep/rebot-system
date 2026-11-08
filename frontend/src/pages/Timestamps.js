import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, PackagePlus, Gift, RefreshCw } from 'lucide-react';
import { apiUrl } from '../services/apiService';

export default function Timestamps() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/transactions'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      const list = Array.isArray(data.transactions) ? data.transactions : [];
      setTransactions(list.sort((a, b) =>
        new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)
      ));
    } catch (error) {
      console.error('Failed to load timestamps:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTransactions(); }, []);

  const visibleTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const redemption = transaction.type === 'redeem' || transaction.type === 'redemption';
      if (filter === 'stored' && redemption) return false;
      if (filter === 'claimed' && !redemption) return false;
      if (!query) return true;
      const student = transaction.student?.fullName || transaction.studentName || '';
      const reward = transaction.reward?.name || transaction.rewardName || '';
      return `${student} ${reward}`.toLowerCase().includes(query);
    });
  }, [transactions, filter, search]);

  const formatDate = (transaction) => {
    const date = new Date(transaction.createdAt || transaction.timestamp);
    if (Number.isNaN(date.getTime())) return { date: 'Time unavailable', time: '' };
    return {
      date: date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="w-full max-w-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Activity Timestamps</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Dates and times when students stored points or claimed rewards.</p>
        </div>
        <button type="button" onClick={loadTransactions} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student or reward" className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800" />
        <div className="grid grid-cols-3 gap-2">
          {[['all', 'All'], ['stored', 'Stored'], ['claimed', 'Claimed']].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-11 rounded-lg px-3 text-sm font-medium ${filter === value ? 'bg-green-700 text-white' : 'border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="flex h-48 items-center justify-center"><RefreshCw className="animate-spin text-green-700" /></div>
        ) : visibleTransactions.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">No recorded activity found.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {visibleTransactions.map((transaction) => {
              const redemption = transaction.type === 'redeem' || transaction.type === 'redemption';
              const displayedDate = formatDate(transaction);
              const student = transaction.student?.fullName || transaction.studentName || 'Unknown student';
              const reward = transaction.reward?.name || transaction.rewardName || 'Reward';
              return (
                <article key={transaction._id || transaction.transactionNumber} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                  <div className={`grid h-11 w-11 place-items-center rounded-lg ${redemption ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                    {redemption ? <Gift size={20} /> : <PackagePlus size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{student}</p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{redemption ? `Claimed ${reward}` : 'Stored recycling points'}</p>
                  </div>
                  <div className="col-start-2 flex items-end justify-between gap-3 sm:col-start-auto sm:block sm:text-right">
                    <p className={`font-bold ${redemption ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'}`}>{redemption ? '-' : '+'}{redemption ? (transaction.pointsSpent || transaction.points || 0) : (transaction.pointsEarned || transaction.points || 0)} pts</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 sm:justify-end"><Clock3 size={13} /> {displayedDate.date} • {displayedDate.time}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
