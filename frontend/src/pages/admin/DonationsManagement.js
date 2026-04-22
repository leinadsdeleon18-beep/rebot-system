import React, { useState } from 'react';
import { Plus, Trash2, Search, Download, Eye, CheckCircle, XCircle, DollarSign, Users, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const mockDonations = [
  { id: 1, date: '2026-03-28', donor: 'Anonymous', amount: 1000, purpose: 'General Support', reference: 'REBOT-20260328-3420', status: 'completed', paymentMethod: 'gcash' },
  { id: 2, date: '2026-03-27', donor: 'Juan Dela Cruz', amount: 500, purpose: 'Student Rewards', reference: 'REBOT-20260327-1289', status: 'completed', paymentMethod: 'paymaya' },
  { id: 3, date: '2026-03-26', donor: 'Maria Santos', amount: 2500, purpose: 'Machine Maintenance', reference: 'REBOT-20260326-5678', status: 'pending', paymentMethod: 'bank' },
  { id: 4, date: '2026-03-25', donor: 'ABC Corporation', amount: 10000, purpose: 'Program Expansion', reference: 'REBOT-20260325-9012', status: 'completed', paymentMethod: 'bank' },
  { id: 5, date: '2026-03-24', donor: 'Anonymous', amount: 200, purpose: 'Environmental Education', reference: 'REBOT-20260324-3456', status: 'completed', paymentMethod: 'gcash' },
];

export default function DonationsManagement() {
  const [donations, setDonations] = useState(mockDonations);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [formData, setFormData] = useState({ donor: '', amount: '', purpose: 'General Support', paymentMethod: 'gcash' });
  const [filterStatus, setFilterStatus] = useState('all');

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const completedAmount = donations.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0);
  const pendingAmount = donations.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);

  const handleAdd = () => {
    if (!formData.donor || !formData.amount || formData.amount < 50) {
      toast.error('Please fill all fields correctly (minimum ₱50)');
      return;
    }
    const newDonation = {
      id: donations.length + 1,
      date: new Date().toISOString().split('T')[0],
      donor: formData.donor,
      amount: parseInt(formData.amount),
      purpose: formData.purpose,
      paymentMethod: formData.paymentMethod,
      status: 'pending',
      reference: `REBOT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*10000)}`
    };
    setDonations([newDonation, ...donations]);
    setShowModal(false);
    setFormData({ donor: '', amount: '', purpose: 'General Support', paymentMethod: 'gcash' });
    toast.success('Donation added successfully!');
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this donation record?')) {
      setDonations(donations.filter(d => d.id !== id));
      toast.success('Donation deleted');
    }
  };

  const handleStatusUpdate = (id, newStatus) => {
    setDonations(donations.map(d => d.id === id ? { ...d, status: newStatus } : d));
    toast.success(`Donation marked as ${newStatus}`);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Donor', 'Amount', 'Purpose', 'Payment Method', 'Status', 'Reference'];
    const csvData = donations.map(d => [d.date, d.donor, d.amount, d.purpose, d.paymentMethod, d.status, d.reference]);
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Donations exported successfully!');
  };

  const filteredDonations = donations.filter(d => {
    const matchesSearch = d.donor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Completed</span>;
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12} /> Pending</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Donations Management</h1>
          <p className="text-gray-500 mt-1">Track and manage all financial contributions</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="px-4 py-2 border border-green-600 text-green-600 rounded-full font-semibold flex items-center gap-2 hover:bg-green-50 transition">
            <Download size={18} /> Export CSV
          </button>
          <button onClick={() => setShowModal(true)} className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition shadow-sm">
            <Plus size={18} /> Add Donation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div><p className="text-green-100 text-sm">Total Donations</p><p className="text-3xl font-bold">₱{totalAmount.toLocaleString()}</p></div>
            <DollarSign size={32} className="text-green-300" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div><p className="text-blue-100 text-sm">Completed</p><p className="text-3xl font-bold">₱{completedAmount.toLocaleString()}</p></div>
            <CheckCircle size={32} className="text-blue-300" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div><p className="text-yellow-100 text-sm">Pending</p><p className="text-3xl font-bold">₱{pendingAmount.toLocaleString()}</p></div>
            <Clock size={32} className="text-yellow-300" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search by donor, purpose, or reference..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filterStatus === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All</button>
          <button onClick={() => setFilterStatus('completed')} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filterStatus === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Completed</button>
          <button onClick={() => setFilterStatus('pending')} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filterStatus === 'pending' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Pending</button>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDonations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600">{donation.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{donation.donor}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">₱{donation.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{donation.purpose}</td>
                  <td className="px-6 py-4 text-sm capitalize text-gray-600">{donation.paymentMethod}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{donation.reference}</td>
                  <td className="px-6 py-4">{getStatusBadge(donation.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {donation.status === 'pending' && (
                        <button onClick={() => handleStatusUpdate(donation.id, 'completed')} className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition" title="Mark as completed">
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(donation.id)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Donation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add Donation</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Donor Name</label><input type="text" value={formData.donor} onChange={(e) => setFormData({ ...formData, donor: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" placeholder="Enter donor name" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label><input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" placeholder="Enter amount" min="50" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label><select value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl"><option>General Support</option><option>Student Rewards</option><option>Machine Maintenance</option><option>Program Expansion</option><option>Environmental Education</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label><select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl"><option value="gcash">GCash</option><option value="paymaya">PayMaya</option><option value="bank">Bank Transfer</option></select></div>
              <button onClick={handleAdd} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition">Add Donation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Clock icon if not imported
const Clock = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;