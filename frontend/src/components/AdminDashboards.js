console.log('✅✅✅ ADMIN DASHBOARD COMPONENT IS LOADING ✅✅✅');

import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  console.log('🟢 AdminDashboard component RENDERED');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔵 useEffect RUNNING - fetching data...');
    
    fetch('http://localhost:5000/api/get-stats')
      .then(res => {
        console.log('📡 Response status:', res.status);
        return res.json();
      })
      .then(result => {
        console.log('📊 API Result:', result);
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded">
        <p className="font-bold">Error loading data</p>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 bg-red-600 text-white px-3 py-1 rounded">Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-100 p-4 m-4 rounded">
        <p>No data received from API</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-6">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-blue-100 text-sm">Total Students</p>
          <p className="text-3xl font-bold">{data.totalStudents || 0}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-green-100 text-sm">Total Points</p>
          <p className="text-3xl font-bold">{data.totalPoints || 0}</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-orange-100 text-sm">Total Bottles</p>
          <p className="text-3xl font-bold">{data.totalBottles || 0}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-purple-100 text-sm">Redemptions</p>
          <p className="text-3xl font-bold">{data.totalRedemptions || 0}</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-700 font-medium">✅ Connected to Database - {data.totalStudents} students found</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">Student List ({data.students?.length || 0})</h2>
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
              {data.students && data.students.length > 0 ? (
                data.students.map((student, index) => (
                  <tr key={student._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{student.studentId}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{student.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{student.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">{student.points} pts</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}