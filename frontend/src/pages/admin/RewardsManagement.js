import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Package, Coffee, Apple, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

const mockRewards = [
  { id: 1, name: 'Biscuit', points: 10, stock: 45, category: 'food' },
  { id: 2, name: 'Chocolate Bar', points: 25, stock: 30, category: 'food' },
  { id: 3, name: 'Juice Box', points: 15, stock: 28, category: 'food' },
  { id: 4, name: 'Pencil Set', points: 50, stock: 20, category: 'supplies' },
  { id: 5, name: 'Notebook', points: 75, stock: 15, category: 'supplies' }
];

export default function RewardsManagement() {
  const [rewards, setRewards] = useState(mockRewards);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [formData, setFormData] = useState({ name: '', points: '', stock: '', icon: '🎁', category: 'food' });

  const handleSubmit = () => {
    if (!formData.name || !formData.points) {
      toast.error('Please fill required fields');
      return;
    }
    
    if (editingReward) {
      setRewards(rewards.map(r => r.id === editingReward.id ? { ...r, ...formData, points: parseInt(formData.points), stock: parseInt(formData.stock) } : r));
      toast.success('Reward updated!');
    } else {
      setRewards([...rewards, { id: rewards.length + 1, ...formData, points: parseInt(formData.points), stock: parseInt(formData.stock) }]);
      toast.success('Reward added!');
    }
    setShowModal(false);
    setEditingReward(null);
    setFormData({ name: '', points: '', stock: '', category: 'food' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this reward?')) {
      setRewards(rewards.filter(r => r.id !== id));
      toast.success('Reward deleted');
    }
  };

  const filteredRewards = rewards.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Rewards Management</h1><p className="text-gray-500 mt-1">Manage student rewards and points</p></div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700"><Plus size={18} /> Add Reward</button>
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search rewards..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl" /></div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{filteredRewards.map(r => (<tr key={r.id}><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="text-2xl">{r.icon}</span><span className="font-medium">{r.name}</span></div></td><td className="px-6 py-4"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{r.points} pts</span></td><td className="px-6 py-4">{r.stock}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${r.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{r.stock < 10 ? 'Low Stock' : 'In Stock'}</span></td><td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => { setEditingReward(r); setFormData(r); setShowModal(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18} /></button><button onClick={() => handleDelete(r.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button></div></td></tr>))}</tbody>
        </table>
      </div>
      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl max-w-md w-full p-6"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">{editingReward ? 'Edit Reward' : 'Add Reward'}</h3><button onClick={() => { setShowModal(false); setEditingReward(null); }} className="text-gray-400 hover:text-gray-600">✕</button></div><div className="space-y-4"><div><label className="block text-sm font-medium mb-1">Reward Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-xl" /></div><div><label className="block text-sm font-medium mb-1">Points Required</label><input type="number" value={formData.points} onChange={(e) => setFormData({ ...formData, points: e.target.value })} className="w-full px-4 py-2 border rounded-xl" /></div><div><label className="block text-sm font-medium mb-1">Initial Stock</label><input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-4 py-2 border rounded-xl" /></div><div><label className="block text-sm font-medium mb-1">Icon (Emoji)</label><input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full px-4 py-2 border rounded-xl" /></div><button onClick={handleSubmit} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700">{editingReward ? 'Save Changes' : 'Add Reward'}</button></div></div></div>)}
    </div>
  );
}