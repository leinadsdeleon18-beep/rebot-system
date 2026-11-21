import { DashboardEmpty, DashboardHeader, DashboardPanel, DashboardRefresh } from '../components/Dashboard';
import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, PackagePlus, Gift, Search } from 'lucide-react';
import { apiUrl } from '../services/apiService';

export default function Timestamps() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/transactions'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not load activity.');
      const data = await response.json();
      const list = Array.isArray(data.transactions) ? data.transactions : [];
      setTransactions(list.sort((a, b) =>
        new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)
      ));
    } catch (error) {
      console.error('Failed to load timestamps:', error);
      setError('Could not load activity. Select Refresh to retry.');
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
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  return (
    <div className="w-full max-w-full space-y-5">
      <DashboardHeader title="Activity timestamps" description="See exactly when recycling points were recorded and rewards were claimed.">
        <DashboardRefresh busy={loading} onClick={loadTransactions} />
      </DashboardHeader>

      <div className="rb-feature-toolbar">
        <label className="rb-dash-search">
          <Search size={17} aria-hidden="true" />
          <input type="search" aria-label="Search student or reward" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search student or reward" />
        </label>
        <div className="rb-dash-actions" role="group" aria-label="Filter by activity type">
          {[['all', 'All activity'], ['stored', 'Stored'], ['claimed', 'Claimed']].map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={filter === value ? 'rb-dash-button-primary' : 'rb-dash-button'}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="rb-dash-notice">{error}</p>}
      <DashboardPanel title="Activity log" description={visibleTransactions.length + ' records shown'}>
        {loading ? (
          <p className="rb-dash-panel-body rb-dash-muted" role="status">Loading activity…</p>
        ) : visibleTransactions.length === 0 ? (
          <DashboardEmpty icon={Clock3} title="No activity found">Try a different search or filter.</DashboardEmpty>
        ) : (
          <ol className="rb-dash-list">
            {visibleTransactions.map(transaction => {
              const redeemed = ['redeem', 'redemption'].includes(transaction.type);
              const { date, time } = formatDate(transaction);
              const student = transaction.student?.fullName || transaction.studentName || 'Unknown student';
              const reward = transaction.reward?.name || transaction.rewardName || 'Reward';
              const points = redeemed ? transaction.pointsSpent : transaction.pointsEarned;
              return (
                <li key={transaction._id || transaction.transactionNumber} className="rb-dash-row rb-feature-timeline-row">
                  <div>
                    <span className="rb-feature-timeline-icon">
                      {redeemed ? <Gift size={18} aria-hidden="true" /> : <PackagePlus size={18} aria-hidden="true" />}
                    </span>
                    <span><strong>{student}</strong><small>{redeemed ? 'Claimed ' + reward : 'Stored recycling points'}</small></span>
                  </div>
                  <div>
                    <strong className={redeemed ? 'rb-dash-negative' : 'rb-dash-positive'}>{redeemed ? '−' : '+'}{Number(points || transaction.points || 0).toLocaleString()} pts</strong>
                    <small>{date}{time && ' · ' + time}</small>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </DashboardPanel>
    </div>
  );
}
