import { getAuthToken } from '../../services/authSession';
﻿import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Coins, Gift, Package, QrCode, ShoppingBag } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { DashboardEmpty, DashboardHeader, DashboardMetrics, DashboardPanel, DashboardRefresh } from '../../components/Dashboard';
import { useTheme } from '../../contexts/ThemeContext';
import { apiUrl } from '../../services/apiService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

function dayKey(date) {
  return date.toDateString();
}

export default function CanteenDashboard() {
  const { darkMode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${getAuthToken()}` };
      const results = await Promise.all(['/rewards', '/transactions?type=redeem&limit=500', '/students'].map(async endpoint => {
        const response = await fetch(apiUrl(endpoint), { headers });
        if (!response.ok) throw new Error('Could not load canteen data.');
        const result = await response.json();
        if (!result.success) throw new Error('Could not load canteen data.');
        return result;
      }));
      const [{ rewards = [] }, { transactions = [] }, { students = [] }] = results;
      setData({ rewards, students, redemptions: transactions.filter(transaction => transaction.type === 'redeem') });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const today = new Date();
  const week = Array.from({ length: 7 }, (_, index) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index));
  const redemptions = data?.redemptions || [];
  const counts = new Map();
  for (const item of redemptions) {
    const date = new Date(item.createdAt || item.timestamp);
    if (Number.isNaN(date.getTime())) continue;
    const key = dayKey(date);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const trend = {
    labels: week.map(date => date.toLocaleDateString(undefined, { weekday: 'short' })),
    datasets: [{
      label: 'Redemptions',
      data: week.map(date => counts.get(dayKey(date)) || 0),
      borderColor: darkMode ? '#a9d7ba' : '#236b4c',
      backgroundColor: darkMode ? '#a9d7ba24' : '#236b4c1a',
      fill: true,
      pointRadius: 3,
      tension: 0.25
    }]
  };
  const tickColor = darkMode ? '#aebdb1' : '#526258';
  const chartOptions = {
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: tickColor } },
      y: { beginAtZero: true, grid: { color: darkMode ? '#39463c' : '#e5ebe4' }, ticks: { color: tickColor, precision: 0 } }
    }
  };

  const rewards = data?.rewards || [];
  const lowStock = rewards.filter(reward => reward.stock > 0 && reward.stock < 10).length;

  return (
    <div className="rb-dashboard">
      <DashboardHeader title="Canteen overview" description="Redeem student rewards and monitor stock.">
        <Link className="rb-dash-button rb-dash-button-primary" to="/canteen/scan"><QrCode size={17} aria-hidden="true" /> Scan &amp; redeem</Link>
        <Link className="rb-dash-button" to="/canteen/rewards"><Package size={17} aria-hidden="true" /> Manage rewards</Link>
        <DashboardRefresh busy={loading} onClick={refresh} />
      </DashboardHeader>

      {error && <p className="rb-dash-notice" role="alert">{error} Select Refresh to try again.</p>}
      {loading && !data && <p className="rb-dash-notice" role="status">Loading canteen activity…</p>}
      {data && (
        <>
          <DashboardMetrics items={[
            { label: 'Redemptions today', value: counts.get(dayKey(today)) || 0, icon: ShoppingBag, primary: true },
            { label: 'Items in stock', value: rewards.reduce((sum, reward) => sum + Number(reward.stock || 0), 0), icon: Package },
            { label: 'Reward types', value: rewards.length, icon: Gift },
            { label: 'Student points available', value: data.students.reduce((sum, student) => sum + Number(student.points || 0), 0), icon: Coins }
          ]} />
          {lowStock > 0 && (
            <div className="rb-dash-notice">
              <AlertTriangle size={17} aria-hidden="true" />
              <span>{lowStock} {lowStock === 1 ? 'reward has' : 'rewards have'} fewer than 10 items in stock.</span>
              <Link className="rb-dash-positive font-semibold underline" to="/canteen/rewards">View inventory</Link>
            </div>
          )}

          <div className="rb-dash-split">
            <DashboardPanel title="Reward redemptions" description={`Last 7 days · ${week[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} to ${today.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}>
              <div className="rb-dash-panel-body rb-dash-chart">
                <Line data={trend} options={chartOptions} aria-label={trend.labels.map((day, index) => `${day}: ${trend.datasets[0].data[index]} redemptions`).join(', ')} role="img" />
              </div>
            </DashboardPanel>
            <DashboardPanel title="Recent redemptions" action={<Link className="rb-dash-button" to="/canteen/history">History <ArrowUpRight size={15} aria-hidden="true" /></Link>}>
              {redemptions.length ? (
                <ul className="rb-dash-list">
                  {redemptions.slice(0, 5).map(item => {
                    const date = new Date(item.createdAt || item.timestamp);
                    return (
                      <li className="rb-dash-row" key={item._id}>
                        <div>
                          <strong>{item.studentName || item.student?.fullName || 'Unknown student'}</strong>
                          <small>{item.reward?.name || item.rewardName || 'Reward'}</small>
                        </div>
                        <div>
                          <strong className="rb-dash-negative">−{Number(item.pointsSpent || item.points || 0).toLocaleString()} pts</strong>
                          <small>{Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</small>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <DashboardEmpty icon={ShoppingBag} title="No redeemed rewards yet">Completed redemptions will appear here.</DashboardEmpty>
              )}
            </DashboardPanel>
          </div>
        </>
      )}
    </div>
  );
}
