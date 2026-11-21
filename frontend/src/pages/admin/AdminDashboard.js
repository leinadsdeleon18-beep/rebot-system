import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Coins, Minus, Plus, Recycle, Search, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DashboardEmpty, DashboardHeader, DashboardMetrics, DashboardPanel, DashboardRefresh } from '../../components/Dashboard';
import { apiUrl } from '../../services/apiService';

const formatDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      const [statsResponse, transactionResponse] = await Promise.all([
        fetch(apiUrl('/get-stats')),
        fetch(apiUrl('/transactions'), { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (!statsResponse.ok || !transactionResponse.ok) throw new Error('Unable to load dashboard data.');
      const [stats, transactions] = await Promise.all([statsResponse.json(), transactionResponse.json()]);
      setData(stats);
      setRecentTransactions((transactions.transactions || []).slice(0, 8));
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const adjustPoints = async (amount) => {
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
      await loadDashboard();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const students = data?.students || [];
  const query = search.trim().toLowerCase();
  const matchingStudents = students.filter(student =>
    [student.fullName, student.studentId, student.email].some(value => String(value ?? '').toLowerCase().includes(query))
  );

  return (
    <div className="rb-dashboard">
      <DashboardHeader title="School overview" description="Track recycling activity and manage student points.">
        {data && <a className="rb-dash-button rb-dash-button-primary" href="#student-balances">Find a student <ArrowDown size={16} aria-hidden="true" /></a>}
        <DashboardRefresh busy={loading} onClick={loadDashboard} />
      </DashboardHeader>

      {loadError && <p className="rb-dash-notice" role="alert">{loadError} Select Refresh to try again.</p>}
      {loading && !data && <p className="rb-dash-notice" role="status">Loading school activity…</p>}

      {data && (
        <>
          <DashboardMetrics items={[
            { label: 'Bottles recycled', value: students.reduce((sum, student) => sum + Number(student.totalBottlesRecycled ?? 0), 0), icon: Recycle, primary: true },
            { label: 'Total students', value: data.totalStudents, icon: Users },
            { label: 'Total points', value: data.totalPoints, icon: Coins },
            { label: 'Students with points', value: students.filter(student => Number(student.points) > 0).length, icon: Users }
          ]} />
          <div className="rb-dash-split">
            <div id="student-balances">
              <DashboardPanel title="Student balances" description={`${students.length.toLocaleString()} students`} action={
                <label className="rb-dash-search">
                  <Search size={16} aria-hidden="true" />
                  <input type="search" placeholder="Name, ID or email" aria-label="Search students by name, ID or email" value={search} onChange={event => setSearch(event.target.value)} />
                </label>
              }>
                {matchingStudents.length ? (
                  <div className="rb-dash-scroll" tabIndex={0} role="region" aria-label="Student balances table">
                    <table className="rb-dash-table">
                      <thead><tr><th scope="col">Student</th><th scope="col">ID</th><th scope="col">Points</th><th scope="col">Actions</th></tr></thead>
                      <tbody>
                        {matchingStudents.map(student => (
                          <tr key={student._id}>
                            <td><strong>{student.fullName}</strong><small>{student.email}</small></td>
                            <td>{student.studentId}</td>
                            <td className="rb-dash-positive">{Number(student.points ?? 0).toLocaleString()}</td>
                            <td><button type="button" className="rb-dash-button" aria-label={`Adjust points for ${student.fullName}`} onClick={() => setSelectedStudent(student)}>Adjust</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <DashboardEmpty icon={Users} title={query ? 'No matching students' : 'No students yet'} />
                )}
              </DashboardPanel>
            </div>

            <DashboardPanel title="Recent student activity" action={<Link className="rb-dash-button" to="/admin/timestamps">Timestamps <ArrowUpRight size={15} aria-hidden="true" /></Link>}>
              {recentTransactions.length ? (
                <ul className="rb-dash-list">
                  {recentTransactions.map(transaction => {
                    const date = new Date(transaction.createdAt || transaction.timestamp);
                    const redeemed = transaction.type === 'redeem';
                    const points = redeemed ? transaction.pointsSpent : transaction.pointsEarned;
                    return (
                      <li className="rb-dash-row" key={transaction._id}>
                        <div>
                          <strong>{transaction.student?.fullName || transaction.studentName || 'Unknown student'}</strong>
                          <small>{redeemed ? `Claimed ${transaction.reward?.name || transaction.rewardName || 'a reward'}` : 'Recycling points recorded'}</small>
                        </div>
                        <div>
                          <strong className={redeemed ? 'rb-dash-negative' : 'rb-dash-positive'}>{redeemed ? '−' : '+'}{Number(points || 0).toLocaleString()} pts</strong>
                          <small>{Number.isNaN(date.getTime()) ? 'Time unavailable' : formatDate.format(date)}</small>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <DashboardEmpty icon={Recycle} title="No activity yet">Recycling and reward transactions will appear here.</DashboardEmpty>
              )}
            </DashboardPanel>
          </div>
        </>
      )}

      {selectedStudent && <AdjustPoints student={selectedStudent} saving={saving} onClose={() => setSelectedStudent(null)} onAdjust={adjustPoints} />}
    </div>
  );
}

function AdjustPoints({ student, saving, onClose, onAdjust }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const [points, setPoints] = useState('');
  const amount = Number(points);
  const disabled = saving || !Number.isInteger(amount) || amount <= 0;

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    input.current?.focus();
    return () => element.close();
  }, []);

  return (
    <dialog ref={dialog} className="rb-dash-dialog" aria-labelledby="adjust-points-title" onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}>
      <div className="rb-dash-panel-header">
        <div><h3 id="adjust-points-title">Adjust student points</h3><p>{student.fullName} · {Number(student.points ?? 0).toLocaleString()} pts</p></div>
        <button className="rb-dash-button" type="button" aria-label="Close" onClick={onClose} disabled={saving}><X size={18} aria-hidden="true" /></button>
      </div>
      <div className="rb-dash-panel-body">
        <label className="block text-sm font-semibold" htmlFor="student-adjustment">Points to add or remove</label>
        <input id="student-adjustment" ref={input} type="number" min="1" step="1" value={points} onChange={event => setPoints(event.target.value)} disabled={saving} />
        <div className="rb-dash-actions">
          <button type="button" className="rb-dash-button-primary" disabled={disabled} onClick={() => onAdjust(amount)}><Plus size={16} aria-hidden="true" /> Add points</button>
          <button type="button" className="rb-dash-button-danger" disabled={disabled} onClick={() => onAdjust(-amount)}><Minus size={16} aria-hidden="true" /> Remove points</button>
        </div>
      </div>
    </dialog>
  );
}
